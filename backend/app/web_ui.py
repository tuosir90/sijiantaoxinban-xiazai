"""统一 Web UI 渲染入口。"""

from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def _read_template(name: str) -> str:
    template = TEMPLATES_DIR / name
    return template.read_text(encoding="utf-8")


def render_index_html() -> str:
    return _read_template("unified-ui.html")


def render_image_merger_html() -> str:
    return _read_template("image-merger.html")


def read_ui_asset(name: str) -> str:
    return _read_template(name)
