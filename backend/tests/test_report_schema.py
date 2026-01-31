from app.domain.report_schema import ReportData


def test_report_schema_validates_minimal():
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
                "blocks": [{"type": "paragraph", "text": "测试内容"}],
            }
        ],
    }
    report = ReportData.model_validate(data)
    assert report.cover.store_name == "示例店"
