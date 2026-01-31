"""ReportLab 版式块构建器。"""

from __future__ import annotations

from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.domain.report_schema import HighlightCard, Section
from app.services.reportlab.theme import Theme


def build_cover(cover, styles: dict) -> list:
    return [
        Spacer(1, 40 * mm),
        Paragraph(cover.store_name, styles["title"]),
        Spacer(1, 6 * mm),
        Paragraph(cover.report_title, styles["subtitle"]),
        Spacer(1, 70 * mm),
        Paragraph(cover.report_subtitle, styles["small"]),
        Spacer(1, 4 * mm),
        Paragraph(cover.business_line, styles["small"]),
        Spacer(1, 3 * mm),
        Paragraph(cover.period_text, styles["small"]),
        Spacer(1, 3 * mm),
        Paragraph(cover.plan_date, styles["small"]),
    ]


def build_toc(sections: list[Section], styles: dict, theme: Theme) -> list:
    lines = []
    for idx, section in enumerate(sections, 1):
        dots = "." * 24
        text = f"{idx}. {section.title} {dots} {section.summary}"
        lines.append([Paragraph(text, styles["toc_item"])])
    if not lines:
        lines.append([Paragraph("暂无目录", styles["toc_item"])])
    table = Table(lines, colWidths=[160 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), theme.light),
                ("LINEBEFORE", (0, 0), (0, -1), 2, theme.primary),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return [
        Paragraph("目录", styles["toc_title"]),
        Spacer(1, 2 * mm),
        HRFlowable(color=theme.primary, thickness=1),
        Spacer(1, 6 * mm),
        table,
    ]


def build_section_title(index: int, title: str, styles: dict, theme: Theme) -> list:
    return [
        Paragraph(f"{index}. {title}", styles["section_title"]),
        Spacer(1, 2 * mm),
        HRFlowable(color=theme.primary, thickness=1),
        Spacer(1, 4 * mm),
    ]


def build_paragraph(text: str, styles: dict) -> Paragraph:
    return Paragraph(text, styles["body"])


def build_bullets(items: Iterable[str], styles: dict) -> ListFlowable:
    bullets = [ListItem(Paragraph(item, styles["body"])) for item in items]
    return ListFlowable(bullets, bulletType="bullet", leftIndent=14)


def build_table(headers: list[str], rows: list[list[str]], styles: dict, theme: Theme) -> Table:
    safe_headers = headers or ["项", "内容"]
    col_count = max(len(safe_headers), 1)
    normalized_rows = []
    for row in rows:
        trimmed = list(row)[:col_count]
        if len(trimmed) < col_count:
            trimmed.extend([""] * (col_count - len(trimmed)))
        normalized_rows.append(trimmed)
    body_rows = [[Paragraph(str(cell), styles["body"]) for cell in row] for row in normalized_rows]
    data = [safe_headers] + body_rows
    col_width = 160 * mm / col_count
    table = Table(data, colWidths=[col_width] * col_count)
    style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), theme.primary),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ("FONTNAME", (0, 0), (-1, 0), styles["section_title"].fontName),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, theme.light]),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
    )
    table.setStyle(style)
    return table


def build_highlight_cards(items: list[HighlightCard], styles: dict, theme: Theme) -> list:
    flowables: list = []
    for item in items:
        content = Paragraph(
            f"<b>{item.title}</b>：{item.text}",
            styles["highlight_body"],
        )
        card = Table([[content]], colWidths=[160 * mm])
        card.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), theme.light),
                    ("LINEBEFORE", (0, 0), (0, -1), 2, theme.primary),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        flowables.append(KeepTogether([card, Spacer(1, 4 * mm)]))
    return flowables
