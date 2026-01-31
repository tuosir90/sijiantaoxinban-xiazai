from datetime import datetime, timedelta, timezone

from app.domain.report_schema import ReportData
from app.services.report_service import apply_content_date_defaults


def test_apply_content_date_defaults_rewrites_old_dates():
    now = datetime(2026, 1, 31, tzinfo=timezone(timedelta(hours=8)))
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "店铺活动方案",
            "report_subtitle": "外卖营销策划方案",
            "business_line": "主营：快餐简餐",
            "period_text": "2023年10月",
            "plan_date": "2023-10-27",
        },
        "sections": [
            {
                "title": "活动节奏",
                "summary": "活动周期：2023年10月",
                "blocks": [
                    {"type": "paragraph", "text": "执行时间：2023年10月27日"},
                    {"type": "bullets", "items": ["2023-10-27", "2023/10/27", "2023.10.27"]},
                    {
                        "type": "table",
                        "headers": ["时间", "动作"],
                        "rows": [["2023年10月", "测试"], ["2023-10-27", "测试"]],
                    },
                    {
                        "type": "highlight_cards",
                        "items": [{"title": "节点", "text": "2023年10月27日"}],
                    },
                ],
            }
        ],
    }
    report = ReportData.model_validate(data)
    apply_content_date_defaults(report, now=now)
    summary = report.sections[0].summary
    assert "2026年01月" in summary
    paragraph = report.sections[0].blocks[0].text
    assert "2026年01月31日" in paragraph
    bullets = report.sections[0].blocks[1].items
    assert bullets[0] == "2026-01-31"
    assert bullets[1] == "2026/01/31"
    assert bullets[2] == "2026.01.31"
    table_rows = report.sections[0].blocks[2].rows
    assert table_rows[0][0] == "2026年01月"
    assert table_rows[1][0] == "2026-01-31"
    card_text = report.sections[0].blocks[3].items[0].text
    assert "2026年01月31日" in card_text
