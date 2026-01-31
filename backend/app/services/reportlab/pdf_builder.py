"""ReportLab PDF 构建器。"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import SimpleDocTemplate, Spacer

from app.domain.report_schema import ReportData
from app.services.reportlab.blocks import (
    build_bullets,
    build_cover,
    build_highlight_cards,
    build_paragraph,
    build_section_title,
    build_subtitle,
    build_table,
    build_toc,
)
from app.services.reportlab.styles import build_styles, register_fonts
from app.services.reportlab.theme import get_theme


LEFT_MARGIN_MM = 22
RIGHT_MARGIN_MM = 22
TOP_MARGIN_MM = 18
BOTTOM_MARGIN_MM = 18
EXTRA_PADDING_MM = 6


def _parse_height_mm() -> float | None:
    raw = (os.getenv("PDF_LONG_PAGE_HEIGHT_MM") or "").strip()
    if not raw:
        return None
    try:
        value = float(raw)
    except ValueError:
        return None
    if value <= 0:
        return None
    return value


def _estimate_story_height(story: list, frame_width: float) -> float:
    canvas = Canvas(BytesIO(), pagesize=A4)
    total = 0.0
    available_height = 1_000_000
    for flowable in story:
        _, height = flowable.wrapOn(canvas, frame_width, available_height)
        total += height
    return total


def get_pagesize(story: list | None = None) -> tuple[float, float]:
    height_mm = _parse_height_mm()
    if height_mm is not None:
        return (A4[0], height_mm * mm)
    if story:
        frame_width = A4[0] - (LEFT_MARGIN_MM + RIGHT_MARGIN_MM) * mm
        content_height = _estimate_story_height(story, frame_width)
        total_height = content_height + (TOP_MARGIN_MM + BOTTOM_MARGIN_MM + EXTRA_PADDING_MM) * mm
        return (A4[0], max(total_height, A4[1]))
    return A4


def build_pdf_bytes(report: ReportData, module: str) -> bytes:
    buffer = BytesIO()
    fonts_dir = Path(__file__).resolve().parents[3] / "assets" / "fonts"
    font_name, bold_name = register_fonts(fonts_dir)
    styles = build_styles(font_name, bold_name)
    theme = get_theme(module)
    styles["title"].textColor = theme.primary
    styles["section_title"].textColor = theme.primary
    styles["toc_title"].textColor = theme.primary
    styles["cover_brand"].textColor = theme.primary

    story: list = []
    story.extend(build_cover(report.cover, styles, theme))
    story.extend(build_toc(report.sections, styles, theme))

    for idx, section in enumerate(report.sections, 1):
        story.extend(build_section_title(idx, section.title, styles, theme))
        for block in section.blocks:
            if block.type == "paragraph":
                story.append(build_paragraph(block.text, styles))
            elif block.type == "subtitle":
                story.extend(build_subtitle(block.text, styles))
            elif block.type == "bullets":
                story.append(build_bullets(block.items, styles))
            elif block.type == "table":
                story.append(build_table(block.headers, block.rows, styles, theme))
            elif block.type == "highlight_cards":
                story.extend(build_highlight_cards(block.items, styles, theme))
            story.append(Spacer(1, 4 * mm))
        story.append(Spacer(1, 4 * mm))

    doc = SimpleDocTemplate(
        buffer,
        pagesize=get_pagesize(story),
        leftMargin=LEFT_MARGIN_MM * mm,
        rightMargin=RIGHT_MARGIN_MM * mm,
        topMargin=TOP_MARGIN_MM * mm,
        bottomMargin=BOTTOM_MARGIN_MM * mm,
    )

    def _draw_footer(canvas, doc_obj):
        canvas.saveState()
        canvas.setFont(font_name, 9)
        canvas.setFillColor(theme.dark)
        canvas.drawCentredString(A4[0] / 2, 10 * mm, f"第 {doc_obj.page} 页")
        canvas.restoreState()

    doc.build(story, onFirstPage=_draw_footer, onLaterPages=_draw_footer)
    return buffer.getvalue()
