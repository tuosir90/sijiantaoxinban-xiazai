"""统一 Web UI 渲染入口。"""

from pathlib import Path


def render_index_html() -> str:
    template = Path(__file__).resolve().parent / "templates" / "unified-ui.html"
    return template.read_text(encoding="utf-8")
