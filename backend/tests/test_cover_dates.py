from datetime import datetime, timezone, timedelta

from app.domain.report_schema import CoverInfo, ReportData, Section
from app.services.report_service import apply_cover_defaults


def test_apply_cover_defaults_overrides_dates():
    cover = CoverInfo(
        store_name="示例店",
        report_title="品牌定位分析",
        report_subtitle="示例",
        business_line="美食",
        period_text="2020年01月",
        plan_date="2020-01-01",
    )
    report = ReportData(cover=cover, sections=[Section(title="A", summary="B", blocks=[])])
    fixed_now = datetime(2026, 1, 31, 10, 0, tzinfo=timezone(timedelta(hours=8)))

    apply_cover_defaults(report, now=fixed_now)

    assert report.cover.period_text == "2026年01月"
    assert report.cover.plan_date == "2026-01-31"
