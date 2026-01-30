"""报告路由通用工具与依赖获取。"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from urllib.parse import quote

from fastapi import HTTPException, Request

from app.services.report_store import InMemoryReportStore
from app.services.template_renderer import MODULE_THEMES, ReportTemplateRenderer


def safe_module(module: str) -> str:
    module = (module or "").strip()
    if module not in MODULE_THEMES:
        raise HTTPException(status_code=400, detail=f"不支持的module: {module}")
    return module


def build_meta(module: str, payload: dict[str, Any]) -> dict[str, str]:
    theme = MODULE_THEMES.get(module) or {"name": module}

    store_name = (payload.get("storeName") or payload.get("store-name") or "").strip()
    area_name = (payload.get("areaName") or "").strip()
    category = (payload.get("category") or payload.get("businessCategory") or "").strip()

    if module == "market":
        base = area_name or store_name or theme["name"]
        title = f"{base} 商圈调研分析报告"
    elif module == "store-activity":
        base = store_name or theme["name"]
        title = f"{base} 店铺活动方案"
    elif module == "data-statistics":
        base = store_name or theme["name"]
        title = f"{base} 数据统计分析报告"
    else:
        base = store_name or theme["name"]
        title = f"{base} 品牌定位分析报告"

    subtitle = category or "呈尚策划 · 专业分析"
    return {"title": title, "subtitle": subtitle}


def filename_from_title(title: str) -> str:
    safe = "".join([c if c not in '\\/:*?"<>|' else "_" for c in (title or "report")]).strip()
    return safe or "report"


def content_disposition_attachment(filename: str) -> str:
    return f"attachment; filename*=UTF-8''{quote(filename)}.pdf"


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def get_store(request: Request) -> InMemoryReportStore:
    store = getattr(request.app.state, "report_store", None)
    if not store:
        raise HTTPException(status_code=500, detail="后端未初始化report_store")
    return store


def get_renderer(request: Request) -> ReportTemplateRenderer:
    renderer = getattr(request.app.state, "template_renderer", None)
    if not renderer:
        raise HTTPException(status_code=500, detail="后端未初始化template_renderer")
    return renderer


def get_settings(request: Request):
    s = getattr(request.app.state, "settings", None)
    if not s:
        raise HTTPException(status_code=500, detail="后端未初始化settings")
    return s

