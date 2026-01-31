from app.web_ui import render_index_html


def test_index_html_contains_four_forms():
    html = render_index_html()
    assert html.count('data-module="') >= 4
    assert "brand" in html
    assert "market" in html
    assert "store-activity" in html
    assert "data-statistics" in html
