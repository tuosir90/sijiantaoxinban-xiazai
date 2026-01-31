from app.web_ui import render_index_html


def test_index_html_contains_form():
    html = render_index_html()
    assert "<form" in html
    assert "module" in html
