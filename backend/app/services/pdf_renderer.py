"""PDF 渲染服务（简化版）。"""

from __future__ import annotations

import re
from io import BytesIO

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


class PdfRenderError(RuntimeError):
    pass


async def render_long_pdf(html: str) -> bytes:
    if not html:
        raise PdfRenderError("HTML内容为空")

    cleaned = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.S | re.I)
    cleaned = re.sub(r"<script[^>]*>.*?</script>", "", cleaned, flags=re.S | re.I)
    cleaned = re.sub(r"data:[^\\s)'\"]+", "", cleaned, flags=re.I)
    text = re.sub(r"<[^>]+>", "", cleaned).strip()
    if not text:
        raise PdfRenderError("HTML内容解析为空")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(text.replace("\n", "<br/>"), styles["BodyText"]),
        Spacer(1, 12),
    ]
    doc.build(story)
    return buffer.getvalue()
