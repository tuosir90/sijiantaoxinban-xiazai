"""PDF 渲染服务（已弃用）。"""

from __future__ import annotations


class PdfRenderError(RuntimeError):
    pass


async def render_long_pdf(html: str) -> bytes:
    raise PdfRenderError("当前版本已切换为ReportLab渲染，请使用reportlab模块生成PDF")
