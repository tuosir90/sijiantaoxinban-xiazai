"""Vercel Serverless FastAPI 入口。"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, Response

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("FONT_DIR", str(PROJECT_ROOT / "backend" / "assets" / "fonts"))

from app.services.image_processor import process_image_to_data_url  # noqa: E402
from app.services.report_service import ReportServiceError, generate_pdf_bytes  # noqa: E402
from app.web_ui import render_image_merger_html, render_index_html  # noqa: E402

app = FastAPI(title="外卖四件套 PDF 生成")


def _build_error_payload(exc: BaseException) -> dict[str, Any]:
    if os.getenv("DIAGNOSTIC_LOGS") == "1":
        return {"detail": f"内部错误: {exc}", "type": exc.__class__.__name__}
    return {"detail": "服务器内部错误"}


@app.middleware("http")
async def add_debug_headers(request: Request, call_next):
    try:
        response = await call_next(request)
    except BaseException as exc:
        response = JSONResponse(status_code=500, content=_build_error_payload(exc))
    response.headers.update(build_debug_headers())
    return response


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=_build_error_payload(exc),
        headers=build_debug_headers(),
    )


@app.get("/")
def index() -> HTMLResponse:
    return HTMLResponse(render_index_html())


@app.get("/ui/image-merger.html")
def image_merger() -> HTMLResponse:
    return HTMLResponse(render_image_merger_html())


@app.get("/image-merger.html")
def image_merger_alias() -> HTMLResponse:
    return HTMLResponse(render_image_merger_html())


def _parse_payload(payload_json: str | None) -> dict[str, Any]:
    if not payload_json:
        return {}
    try:
        data = json.loads(payload_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"payload_json解析失败: {e}") from e
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="payload_json必须是对象")
    return data


def _get_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def build_pdf_filename(module: str, payload: dict[str, Any]) -> str:
    module_name_map = {
        "brand": "品牌定位分析",
        "market": "商圈调研分析",
        "store-activity": "店铺活动方案",
        "data-statistics": "数据统计分析",
    }
    store_name = _get_text(payload, "store_name", "storeName", "area_name", "areaName")
    report_name = module_name_map.get(module, module)
    safe_store = store_name or "未命名店铺"
    raw_name = f"{safe_store}_{report_name}.pdf"
    return (
        raw_name.replace("\\", "_")
        .replace("/", "_")
        .replace(":", "_")
        .replace("*", "_")
        .replace("?", "_")
        .replace('"', "_")
        .replace("<", "_")
        .replace(">", "_")
        .replace("|", "_")
        .replace("\n", "")
        .replace("\r", "")
        .strip()
    )


def build_content_disposition(filename: str) -> str:
    ascii_fallback = (
        "".join(ch if ord(ch) < 128 else "_" for ch in filename).strip() or "report.pdf"
    )
    quoted = quote(filename)
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{quoted}"


def build_debug_headers() -> dict[str, str]:
    version = os.getenv("DEBUG_VERSION", "api-index-20260131-1")
    diag_flag = "1" if os.getenv("DIAGNOSTIC_LOGS") == "1" else "0"
    return {
        "X-Debug-Version": version,
        "X-Debug-Logs": diag_flag,
    }


@app.post("/api/generate")
async def generate(
    request: Request,
    module: str | None = Form(None),
    payload_json: str | None = Form(None),
    screenshot: UploadFile | None = File(None),
):
    if request.headers.get("content-type", "").startswith("application/json"):
        body = await request.json()
        module = body.get("module")
        payload = body.get("payload") or {}
    else:
        payload = _parse_payload(payload_json)

    if not module:
        raise HTTPException(status_code=400, detail="缺少module参数")
    if module not in {"brand", "market", "store-activity", "data-statistics"}:
        raise HTTPException(status_code=400, detail="module不合法")

    screenshot_data_url = None
    if screenshot is not None:
        raw = await screenshot.read()
        screenshot_data_url = process_image_to_data_url(raw)
        payload["enableScreenshotAnalysis"] = True

    try:
        pdf_bytes = await generate_pdf_bytes(
            module=module, payload=payload, screenshot_data_url=screenshot_data_url
        )
    except ReportServiceError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    filename = build_pdf_filename(module, payload)
    headers = {"Content-Disposition": build_content_disposition(filename)}
    headers.update(build_debug_headers())
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
