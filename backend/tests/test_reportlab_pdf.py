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
    assert len(pdf_bytes) > 1000
