"""Markdown 渲染服务（禁用原生 HTML）。"""

from __future__ import annotations

from markdown_it import MarkdownIt


_MD = (
    MarkdownIt("commonmark", {"html": False, "linkify": True, "typographer": True})
    .enable("table")
    .enable("strikethrough")
)


def render_markdown_to_html(markdown_text: str) -> str:
    return _MD.render(markdown_text or "")

