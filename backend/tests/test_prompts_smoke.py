def test_prompts_can_build():
    from app.prompts.registry import build_prompt

    prompt = build_prompt("brand", {"storeName": "示例店", "category": "火锅"})
    assert isinstance(prompt, str)
    assert "示例店" in prompt

