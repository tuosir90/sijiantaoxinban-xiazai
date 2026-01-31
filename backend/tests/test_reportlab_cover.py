from pathlib import Path

from app.domain.report_schema import CoverInfo
from app.services.reportlab.blocks import build_cover
from app.services.reportlab.styles import build_styles, register_fonts
from app.services.reportlab.theme import get_theme


def test_cover_contains_brand_mark():
    cover = CoverInfo(
        store_name="示例店",
        report_title="品牌定位分析",
        report_subtitle="示例副标题",
        business_line="美食",
        period_text="2026年01月",
        plan_date="2026-01-31",
    )
    font_name, bold_name = register_fonts(Path(__file__).resolve().parents[2] / "backend" / "assets" / "fonts")
    styles = build_styles(font_name, bold_name)
    flowables = build_cover(cover, styles, get_theme("brand"))
    texts = []
    for item in flowables:
        if hasattr(item, "getPlainText"):
            texts.append(item.getPlainText())
    assert any("呈尚策划" in text for text in texts)
