"""报告预览与 PDF 导出（有状态 + 无状态）。"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, Response

from app.routes.reports_common import (
    content_disposition_attachment,
    filename_from_title,
    get_renderer,
    get_store,
    now_text,
    safe_module,
)
from app.services.markdown_renderer import render_markdown_to_html
from app.services.pdf_renderer import PdfRenderError, render_long_pdf
from app.services.template_renderer import MODULE_THEMES

router = APIRouter()


@router.get("/api/reports/{report_id}/preview")
def preview_report(request: Request, report_id: str):
    store = get_store(request)
    data = store.get(report_id)
    if not data:
        raise HTTPException(status_code=404, detail="报告不存在或已过期")

    module = safe_module(data.get("module"))
    markdown = data.get("markdown") or ""
    meta = data.get("meta") or {}
    screenshot_data_url = data.get("screenshot_data_url")
    created_at = data.get("created_at") or ""

    content_html = render_markdown_to_html(markdown)
    renderer = get_renderer(request)
    html = renderer.render(
        module=module,
        title=meta.get("title") or "",
        subtitle=meta.get("subtitle") or "",
        date_text=created_at[:19].replace("T", " "),
        screenshot_data_url=screenshot_data_url,
        content_html=content_html,
        raw_markdown=markdown,
    )
    return HTMLResponse(html)


@router.post("/api/reports/preview")
def preview_stateless(request: Request, payload: dict[str, Any]):
    module = safe_module(payload.get("module"))
    markdown = str(payload.get("markdown") or "")
    meta = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
    screenshot_data_url = payload.get("screenshot_data_url")

    content_html = render_markdown_to_html(markdown)
    renderer = get_renderer(request)
    html = renderer.render(
        module=module,
        title=(meta.get("title") or "").strip() or MODULE_THEMES[module]["name"],
        subtitle=(meta.get("subtitle") or "").strip(),
        date_text=now_text(),
        screenshot_data_url=screenshot_data_url,
        content_html=content_html,
        raw_markdown=markdown,
    )
    return HTMLResponse(html)


@router.get("/api/reports/{report_id}/pdf")
async def pdf_report(request: Request, report_id: str):
    store = get_store(request)
    data = store.get(report_id)
    if not data:
        raise HTTPException(status_code=404, detail="报告不存在或已过期")

    module = safe_module(data.get("module"))
    markdown = data.get("markdown") or ""
    meta = data.get("meta") or {}
    screenshot_data_url = data.get("screenshot_data_url")
    created_at = data.get("created_at") or ""

    content_html = render_markdown_to_html(markdown)
    renderer = get_renderer(request)
    html = renderer.render(
        module=module,
        title=meta.get("title") or "",
        subtitle=meta.get("subtitle") or "",
        date_text=created_at[:19].replace("T", " "),
        screenshot_data_url=screenshot_data_url,
        content_html=content_html,
        raw_markdown=markdown,
    )

    try:
        pdf_bytes = await render_long_pdf(html)
    except PdfRenderError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    filename = filename_from_title(meta.get("title") or MODULE_THEMES[module]["name"])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": content_disposition_attachment(filename)},
    )


@router.post("/api/reports/pdf")
async def pdf_stateless(request: Request, payload: dict[str, Any]):
    module = safe_module(payload.get("module"))
    markdown = str(payload.get("markdown") or "")
    meta = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
    screenshot_data_url = payload.get("screenshot_data_url")

    content_html = render_markdown_to_html(markdown)
    renderer = get_renderer(request)
    html = renderer.render(
        module=module,
        title=(meta.get("title") or "").strip() or MODULE_THEMES[module]["name"],
        subtitle=(meta.get("subtitle") or "").strip(),
        date_text=now_text(),
        screenshot_data_url=screenshot_data_url,
        content_html=content_html,
        raw_markdown=markdown,
    )

    try:
        pdf_bytes = await render_long_pdf(html)
    except PdfRenderError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    filename = filename_from_title(meta.get("title") or MODULE_THEMES[module]["name"])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": content_disposition_attachment(filename)},
    )

