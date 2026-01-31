from reportlab.lib.pagesizes import A4

from app.services.reportlab.pdf_builder import get_pagesize


def test_pagesize_is_long():
    width, height = get_pagesize()
    assert width == A4[0]
    assert height > A4[1]
