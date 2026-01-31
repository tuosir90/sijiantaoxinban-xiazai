"""ReportLab 样式与字体注册。"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont


def _safe_register_font(name: str, path: Path) -> bool:
    if name in pdfmetrics.getRegisteredFontNames():
        return True
    if not path.exists():
        return False
    try:
        pdfmetrics.registerFont(TTFont(name, str(path)))
        return True
    except Exception:
        return False


def _pick_font_path(fonts_dir: Path, stem: str) -> Path:
    ttf = fonts_dir / f"{stem}.ttf"
    otf = fonts_dir / f"{stem}.otf"
    if ttf.exists():
        return ttf
    return otf


def register_fonts(fonts_dir: Path) -> tuple[str, str]:
    regular_name = "NotoSansSC"
    bold_name = "NotoSansSC-Bold"
    regular_path = _pick_font_path(fonts_dir, "NotoSansSC-Regular")
    bold_path = _pick_font_path(fonts_dir, "NotoSansSC-Bold")

    ok_regular = _safe_register_font(regular_name, regular_path)
    ok_bold = _safe_register_font(bold_name, bold_path) if bold_path.exists() else False

    if ok_regular:
        if not ok_bold:
            bold_name = regular_name
        pdfmetrics.registerFontFamily(regular_name, normal=regular_name, bold=bold_name)
        return regular_name, bold_name

    simhei_name = "SimHei"
    simhei_path = fonts_dir / "SimHei.ttf"
    ok_simhei = _safe_register_font(simhei_name, simhei_path)
    if ok_simhei:
        return simhei_name, simhei_name

    fallback = "STSong-Light"
    if fallback not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(UnicodeCIDFont(fallback))
    return fallback, fallback


def build_styles(font_name: str, bold_name: str) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles: dict[str, ParagraphStyle] = {}

    styles["body"] = ParagraphStyle(
        "body",
        parent=base["BodyText"],
        fontName=font_name,
        fontSize=11,
        leading=18,
        textColor=colors.HexColor("#333333"),
    )
    styles["small"] = ParagraphStyle(
        "small",
        parent=styles["body"],
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#666666"),
    )
    styles["title"] = ParagraphStyle(
        "title",
        parent=styles["body"],
        fontName=bold_name,
        fontSize=30,
        leading=36,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#9B5B2A"),
    )
    styles["subtitle"] = ParagraphStyle(
        "subtitle",
        parent=styles["body"],
        fontName=font_name,
        fontSize=16,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#666666"),
    )
    styles["section_title"] = ParagraphStyle(
        "section_title",
        parent=styles["body"],
        fontName=bold_name,
        fontSize=18,
        leading=24,
        alignment=TA_LEFT,
    )
    styles["toc_title"] = ParagraphStyle(
        "toc_title",
        parent=styles["body"],
        fontName=bold_name,
        fontSize=18,
        leading=24,
        alignment=TA_LEFT,
    )
    styles["toc_item"] = ParagraphStyle(
        "toc_item",
        parent=styles["body"],
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
    )
    styles["highlight_title"] = ParagraphStyle(
        "highlight_title",
        parent=styles["body"],
        fontName=bold_name,
        fontSize=11,
        leading=16,
    )
    styles["highlight_body"] = ParagraphStyle(
        "highlight_body",
        parent=styles["body"],
        fontSize=10,
        leading=16,
    )
    return styles
