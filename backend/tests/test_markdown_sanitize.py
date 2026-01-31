from app.services.reportlab.blocks import sanitize_markdown_text


def test_sanitize_removes_emphasis_markers():
    raw = "**核心定位**：*高品质*"
    assert sanitize_markdown_text(raw) == "核心定位：高品质"


def test_sanitize_removes_list_prefix():
    raw = "- **卖点**：真材实料"
    assert sanitize_markdown_text(raw) == "卖点：真材实料"


def test_sanitize_removes_inline_code():
    raw = "推荐使用 `满减` 策略"
    assert sanitize_markdown_text(raw) == "推荐使用 满减 策略"
