import re

import pytest
from reportlab.lib.pagesizes import A4

from app.domain.report_schema import ReportData
from app.services.reportlab.pdf_builder import build_pdf_bytes


def test_build_pdf_bytes_basic():
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "店铺活动方案",
            "report_subtitle": "外卖营销策划方案",
            "business_line": "主营：快餐简餐",
            "period_text": "活动周期：2026年01月01日 - 2026年01月31日",
            "plan_date": "策划日期：2026年01月",
        },
        "sections": [
            {
                "title": "活动目标",
                "summary": "制定短期、中期、长期目标",
                "blocks": [{"type": "paragraph", "text": "测试段落内容"}],
            }
        ],
    }
    report = ReportData.model_validate(data)
    pdf_bytes = build_pdf_bytes(report, module="store-activity")
    assert pdf_bytes[:4] == b"%PDF"
    assert len(pdf_bytes) > 8000


def test_build_pdf_bytes_with_subtitle_block():
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "品牌定位分析",
            "report_subtitle": "副标题",
            "business_line": "主营：快餐简餐",
            "period_text": "2026年01月",
            "plan_date": "2026-01-31",
        },
        "sections": [
            {
                "title": "策略建议",
                "summary": "转化与复购",
                "blocks": [
                    {"type": "subtitle", "text": "1. 转化策略"},
                    {"type": "paragraph", "text": "提升转化率的做法。"},
                ],
            }
        ],
    }
    report = ReportData.model_validate(data)
    pdf_bytes = build_pdf_bytes(report, module="brand")
    assert pdf_bytes[:4] == b"%PDF"
    assert len(pdf_bytes) > 8000


def _extract_media_box_height(pdf_bytes: bytes) -> float:
    match = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]", pdf_bytes)
    assert match, "未找到MediaBox"
    return float(match.group(2))


def test_build_pdf_bytes_auto_height(monkeypatch):
    monkeypatch.setenv("PDF_LONG_PAGE_HEIGHT_MM", "0")
    long_text = "测试内容" * 120
    blocks = [{"type": "paragraph", "text": long_text} for _ in range(20)]
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "品牌定位分析",
            "report_subtitle": "副标题",
            "business_line": "主营：快餐简餐",
            "period_text": "2026年01月",
            "plan_date": "2026-01-31",
        },
        "sections": [
            {
                "title": "策略建议",
                "summary": "转化与复购",
                "blocks": blocks,
            }
        ],
    }
    report = ReportData.model_validate(data)
    try:
        pdf_bytes = build_pdf_bytes(report, module="brand")
    except Exception as exc:
        pytest.fail(f"生成PDF失败: {exc}")
    height = _extract_media_box_height(pdf_bytes)
    assert height > A4[1]
    assert height < A4[1] * 8
