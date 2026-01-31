from pathlib import Path
import re


def _extract_input_block(html: str, input_id: str) -> str:
    pattern = rf"<input[^>]*id=\"{re.escape(input_id)}\"[^>]*>"
    match = re.search(pattern, html)
    assert match, f"未找到输入框: {input_id}"
    return match.group(0)


def test_stats_idle_busy_defaults_are_fixed():
    template_path = Path(__file__).resolve().parents[2] / "backend" / "app" / "templates" / "unified-ui.html"
    html = template_path.read_text(encoding="utf-8")
    idle_input = _extract_input_block(html, "stats-idleCookingTime")
    busy_input = _extract_input_block(html, "stats-busyCookingTime")
    assert 'value="15"' in idle_input
    assert "readonly" in idle_input
    assert 'value="20"' in busy_input
    assert "readonly" in busy_input
