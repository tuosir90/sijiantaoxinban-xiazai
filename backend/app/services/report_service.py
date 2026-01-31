"""报告生成服务。"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

from app.domain.report_schema import ReportData
from app.prompts.registry import build_prompt
from app.services.json_parser import parse_json_text
from app.services.reportlab.pdf_builder import build_pdf_bytes
from app.services.upstream_llm import UpstreamConfig, UpstreamError, chat_completions
from app.settings import get_settings


class ReportServiceError(RuntimeError):
    pass


def _trim_text(text: str, *, limit: int = 2000) -> str:
    if text is None:
        return ""
    s = str(text)
    return s[:limit]


def _log_diag(event: str, payload: dict[str, Any]) -> None:
    if os.getenv("DIAGNOSTIC_LOGS") != "1":
        return
    parts = [f"诊断事件={event}"]
    for key, value in payload.items():
        text = _trim_text(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False))
        parts.append(f"{key}={text}")
    print("[诊断日志] " + " | ".join(parts))


def _select_model(settings: Any, module: str) -> str:
    default = (getattr(settings, "upstream_model_default", "") or "").strip()
    if module == "brand":
        return (getattr(settings, "upstream_model_brand", "") or "").strip() or default
    if module == "market":
        return (getattr(settings, "upstream_model_market", "") or "").strip() or default
    if module == "store-activity":
        return (getattr(settings, "upstream_model_store_activity", "") or "").strip() or default
    if module == "data-statistics":
        return (getattr(settings, "upstream_model_data_statistics", "") or "").strip() or default
    return default


async def _repair_json(client: httpx.AsyncClient, cfg: UpstreamConfig, raw: str) -> str:
    repair_text = raw[:12000]
    prompt = (
        "请将以下内容修复为严格 JSON 对象，仅输出 JSON，不要 Markdown/HTML：\n\n"
        f"{repair_text}"
    )
    return await chat_completions(
        client,
        cfg=cfg,
        system="你是一位严格的JSON修复助手。",
        user_prompt=prompt,
        temperature=0.2,
        max_tokens=12000,
    )


async def generate_pdf_bytes(
    *,
    module: str,
    payload: dict[str, Any],
    screenshot_data_url: str | None = None,
) -> bytes:
    settings = get_settings()
    try:
        prompt = build_prompt(module, payload)
    except ValueError as e:
        raise ReportServiceError(str(e)) from e
    model = _select_model(settings, module)
    cfg = UpstreamConfig(base_url=settings.upstream_base_url, api_key=settings.upstream_api_key, model=model)

    system = (
        "你是一位资深的餐饮外卖运营与市场分析专家。"
        "请严格按照JSON规则输出，不要附加多余文字。"
    )

    async with httpx.AsyncClient() as client:
        try:
            raw = await chat_completions(
                client,
                cfg=cfg,
                system=system,
                user_prompt=prompt,
                image_data_url=screenshot_data_url if module == "market" else None,
            )
        except UpstreamError as e:
            raise ReportServiceError(str(e)) from e

        try:
            data = parse_json_text(raw)
        except json.JSONDecodeError as e:
            _log_diag(
                "json_parse_failed",
                {"module": module, "model": model, "raw": raw},
            )
            try:
                repaired = await _repair_json(client, cfg, raw)
                _log_diag(
                    "json_repair_attempt",
                    {"module": module, "model": model, "repaired": repaired},
                )
                data = parse_json_text(repaired)
            except Exception as err:
                _log_diag(
                    "json_repair_failed",
                    {"module": module, "model": model, "error": str(err)},
                )
                raise ReportServiceError("JSON解析失败，且修复无效") from err

    report = ReportData.model_validate(data)
    return build_pdf_bytes(report, module=module)
