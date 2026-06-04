from app.prompts.registry import build_prompt


def test_prompt_contains_json_instructions():
    payload = {"store_name": "示例店"}
    prompt = build_prompt("brand", payload)
    assert "JSON" in prompt
    assert "sections" in prompt


def test_data_statistics_prompt_omits_delivery_service_fields():
    payload = {
        "storeName": "示例店",
        "businessCategory": "快餐",
        "exposureCount": 1000,
        "visitCount": 100,
        "orderCount": 30,
    }
    prompt = build_prompt("data-statistics", payload)
    assert "起送价" not in prompt
    assert "配送费" not in prompt
    assert "配送范围" not in prompt
