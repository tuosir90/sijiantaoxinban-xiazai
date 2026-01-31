"""ReportLab PDF 构建器（骨架）。"""

from __future__ import annotations

from io import BytesIO

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.domain.report_schema import ReportData


def build_pdf_bytes(report: ReportData, module: str) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(report.cover.store_name, styles["Title"]),
        Spacer(1, 12),
        Paragraph(report.cover.report_title, styles["Heading2"]),
    ]
    doc.build(story)
    return buffer.getvalue()
