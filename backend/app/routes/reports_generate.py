"""报告生成与查询（有状态）。"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.prompts.registry import build_prompt
from app.routes.reports_common import build_meta, get_settings, get_store, safe_module
from app.services.image_processor import process_image_to_data_url
from app.services.upstream_llm import UpstreamConfig, UpstreamError, chat_completions

router = APIRouter()

def _looks_like_html(text: str) -> bool:
    s = (text or "").lower()
    markers = ["<div", "</div", "<p", "</p", "<h1", "<h2", "<h3", "<ul", "<ol", "<li", "</li"]
    hits = sum(1 for m in markers if m in s)
    return hits >= 3


def _build_upstream_cfg(settings: Any, module: str, line_id: str) -> UpstreamConfig:
    line = settings.get_upstream_line(line_id)
    line.ensure_configured()
    model = line.resolve_model(module)
    if not model:
        raise ValueError(f"{line.label}未配置默认模型")
    return UpstreamConfig(base_url=line.base_url, api_key=line.api_key, model=model)


@router.post("/api/reports/generate")
async def generate_report(
    request: Request,
    module: str = Form(...),
    payload_json: str = Form(...),
    line_id: str = Form("line1"),
    screenshot: UploadFile | None = File(None),
):
    module = safe_module(module)
    settings = get_settings(request)

    try:
        payload = json.loads(payload_json or "{}")
        if not isinstance(payload, dict):
            raise ValueError("payload_json必须是对象")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"payload_json解析失败: {e}") from e

    screenshot_data_url: str | None = None
    if screenshot is not None:
        raw = await screenshot.read()
        if len(raw) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"截图过大，最大{settings.max_upload_mb}MB")
        screenshot_data_url = process_image_to_data_url(raw)
        payload["enableScreenshotAnalysis"] = True

    prompt = build_prompt(module, payload)
    system = (
        "你是一位资深的餐饮外卖运营与市场分析专家。"
        "你的目标是输出清晰、可执行、可落地的建议。"
        "严格输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。"
    )

    try:
        cfg = _build_upstream_cfg(settings, module, line_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    async with httpx.AsyncClient() as client:
        try:
            markdown = await chat_completions(
                client,
                cfg=cfg,
                system=system,
                user_prompt=prompt,
                image_data_url=screenshot_data_url if module == "market" else None,
            )
        except UpstreamError as e:
            raise HTTPException(status_code=502, detail=str(e)) from e

        # 兜底：如果模型仍输出HTML，尝试二次“转Markdown”修复（仅一次）
        if _looks_like_html(markdown):
            repair_text = markdown[:12000]
            repair_prompt = (
                "请将下面内容转换为Markdown正文（只输出Markdown，不要HTML，不要```包裹全文），保持信息完整，不要添加额外内容：\n\n"
                f"{repair_text}"
            )
            try:
                markdown = await chat_completions(
                    client,
                    cfg=cfg,
                    system="你是一位专业内容编辑，擅长将文本整理为结构清晰的Markdown。",
                    user_prompt=repair_prompt,
                    temperature=0.2,
                    max_tokens=16384,
                    image_data_url=None,
                )
            except UpstreamError:
                pass

    meta = build_meta(module, payload)
    now = datetime.now()
    expires_at = now + timedelta(seconds=int(settings.report_ttl_seconds))

    report_data: dict[str, Any] = {
        "module": module,
        "markdown": markdown,
        "meta": meta,
        "screenshot_data_url": screenshot_data_url,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
    }

    store = get_store(request)
    report_id = store.save(report_data)

    return JSONResponse(
        {
            "report_id": report_id,
            "markdown": markdown,
            "preview_url": f"/api/reports/{report_id}/preview",
            "pdf_url": f"/api/reports/{report_id}/pdf",
            "expires_at": expires_at.isoformat(),
        }
    )


@router.get("/api/reports/{report_id}")
def get_report(request: Request, report_id: str):
    store = get_store(request)
    data = store.get(report_id)
    if not data:
        raise HTTPException(status_code=404, detail="报告不存在或已过期")
    return JSONResponse(data)
