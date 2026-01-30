"""固定模板渲染（Markdown HTML → 完整 HTML 文档）。"""

from __future__ import annotations

import base64
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape


MODULE_THEMES: dict[str, dict[str, str]] = {
    "brand": {"name": "品牌定位分析", "color": "#3b82f6", "dark": "#1e3a8a", "tint": "#eff6ff"},
    "market": {"name": "商圈调研分析", "color": "#8b5cf6", "dark": "#6d28d9", "tint": "#f5f3ff"},
    "store-activity": {"name": "店铺活动方案", "color": "#f97316", "dark": "#9a3412", "tint": "#fff7ed"},
    "data-statistics": {"name": "数据统计分析", "color": "#667eea", "dark": "#3730a3", "tint": "#eef2ff"},
}


def _read_base64(path: Path) -> str | None:
    if not path.exists():
        return None
    return base64.b64encode(path.read_bytes()).decode("ascii")


class ReportTemplateRenderer:
    def __init__(self, templates_dir: Path, fonts_dir: Path):
        self._env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )
        self._template = self._env.get_template("report.html.j2")

        self._font_regular = _read_base64(fonts_dir / "NotoSansSC-Regular.otf")
        self._font_bold = _read_base64(fonts_dir / "NotoSansSC-Bold.otf")

    def render(
        self,
        *,
        module: str,
        title: str,
        subtitle: str,
        date_text: str,
        screenshot_data_url: str | None,
        content_html: str,
        raw_markdown: str,
    ) -> str:
        theme = MODULE_THEMES.get(module) or {"name": module, "color": "#3b82f6", "dark": "#1e3a8a", "tint": "#eff6ff"}
        ctx: dict[str, Any] = {
            "module": module,
            "module_name": theme["name"],
            "theme_color": theme["color"],
            "theme_dark": theme["dark"],
            "theme_tint": theme["tint"],
            "title": title or theme["name"],
            "subtitle": subtitle,
            "date_text": date_text,
            "screenshot_data_url": screenshot_data_url,
            "content_html": content_html,
            "raw_markdown": raw_markdown,
            "font_regular": self._font_regular,
            "font_bold": self._font_bold or self._font_regular,
        }
        return self._template.render(**ctx)
