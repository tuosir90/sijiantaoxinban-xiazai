from app.prompts.registry import build_prompt


def test_prompt_contains_json_instructions():
    payload = {"store_name": "示例店"}
    prompt = build_prompt("brand", payload)
    assert "JSON" in prompt
    assert "sections" in prompt
