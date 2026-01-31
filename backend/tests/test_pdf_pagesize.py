from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

from app.services.reportlab.pdf_builder import get_pagesize


def test_pagesize_defaults_to_a4(monkeypatch):
    monkeypatch.delenv("PDF_LONG_PAGE_HEIGHT_MM", raising=False)
    width, height = get_pagesize()
    assert width == A4[0]
    assert height == A4[1]


def test_pagesize_respects_env_height(monkeypatch):
    monkeypatch.setenv("PDF_LONG_PAGE_HEIGHT_MM", "1200")
    width, height = get_pagesize()
    assert width == A4[0]
    assert height == 1200 * mm
