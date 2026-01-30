"""
上游大模型调用（OpenAI 兼容 /v1/chat/completions）。

说明：
- 仅负责“请求构造 + 响应解析 + 基础清洗”，不做业务提示词拼装。
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class UpstreamConfig:
    base_url: str
    api_key: str
    model: str
    timeout_seconds: int = 120


class UpstreamError(RuntimeError):
    pass


def build_messages(*, system: str, user_prompt: str, image_data_url: str | None) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = [{"role": "system", "content": system}]

    if image_data_url:
        messages.append(
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            }
        )
        return messages

    messages.append({"role": "user", "content": user_prompt})
    return messages


def normalize_markdown(text: str) -> str:
    if not text:
        return ""

    s = text.strip()

    if s.startswith("```"):
        parts = s.split("```")
        if len(parts) >= 3:
            s = "```".join(parts[1:-1]).strip()
            if s.startswith(("markdown\n", "md\n")):
                s = s.split("\n", 1)[1].strip()

    return s.strip()


async def chat_completions(
    client: httpx.AsyncClient,
    *,
    cfg: UpstreamConfig,
    system: str,
    user_prompt: str,
    temperature: float = 0.8,
    max_tokens: int = 16384,
    image_data_url: str | None = None,
) -> str:
    if not cfg.api_key:
        raise UpstreamError("未配置UPSTREAM_API_KEY，无法调用上游接口")

    messages = build_messages(system=system, user_prompt=user_prompt, image_data_url=image_data_url)
    body = {
        "model": cfg.model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    try:
        res = await client.post(
            cfg.base_url,
            headers={"Authorization": f"Bearer {cfg.api_key}", "Content-Type": "application/json"},
            content=json.dumps(body, ensure_ascii=False).encode("utf-8"),
            timeout=cfg.timeout_seconds,
        )
    except httpx.TimeoutException as e:
        raise UpstreamError("上游接口请求超时") from e
    except httpx.HTTPError as e:
        raise UpstreamError(f"上游接口网络错误: {e}") from e

    if res.status_code >= 400:
        detail = res.text[:500]
        raise UpstreamError(f"上游接口返回错误: {res.status_code} {detail}")

    try:
        data = res.json()
    except ValueError as e:
        raise UpstreamError("上游接口返回非JSON") from e

    try:
        content = data["choices"][0]["message"]["content"]
    except Exception as e:  # noqa: BLE001 - 需要兼容上游差异
        raise UpstreamError("上游接口返回格式异常（缺少choices/message/content）") from e

    return normalize_markdown(content)

