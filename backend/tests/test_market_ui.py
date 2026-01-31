from pathlib import Path


def test_market_form_without_area_name_field():
    template_path = Path(__file__).resolve().parents[2] / "backend" / "app" / "templates" / "unified-ui.html"
    html = template_path.read_text(encoding="utf-8")
    assert "market-areaName" not in html
    assert "商圈名称" not in html
    assert "店铺名称" in html
