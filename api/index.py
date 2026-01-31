"""Vercel Serverless FastAPI 入口。"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, Response

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("FONT_DIR", str(PROJECT_ROOT / "backend" / "assets" / "fonts"))

from app.services.image_processor import process_image_to_data_url  # noqa: E402
from app.services.report_service import ReportServiceError, generate_pdf_bytes  # noqa: E402
from app.web_ui import render_index_html  # noqa: E402

app = FastAPI(title="外卖四件套 PDF 生成")


@app.get("/")
def index() -> HTMLResponse:
    return HTMLResponse(render_index_html())


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
        pdf_bytes = await generate_pdf_bytes(module=module, payload=payload, screenshot_data_url=screenshot_data_url)
    except ReportServiceError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    filename = f"{module}-report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
