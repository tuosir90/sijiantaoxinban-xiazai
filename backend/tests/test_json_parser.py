from app.services.json_parser import parse_json_text


def test_parse_json_text_strips_code_fence():
    raw = (
        "```json\n"
        "{\"cover\": {\"store_name\": \"A\", \"report_title\": \"B\", "
        "\"report_subtitle\": \"C\", \"business_line\": \"D\", \"period_text\": \"E\", "
        "\"plan_date\": \"F\"}, \"sections\": []}\n"
        "```"
    )
    data = parse_json_text(raw)
    assert data["cover"]["store_name"] == "A"
