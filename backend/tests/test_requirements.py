from pathlib import Path


def test_requirements_no_playwright():
    content = Path("backend/requirements.txt").read_text(encoding="utf-8")
    assert "playwright" not in content
