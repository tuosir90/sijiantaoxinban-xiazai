from app.prompts.market import build_market_prompt


def test_market_prompt_requires_screenshot_extraction_when_enabled():
    payload = {
        "areaName": "测试商圈",
        "location": "测试位置",
        "areaType": "写字楼商圈",
        "storeName": "测试店",
        "enableScreenshotAnalysis": True,
    }
    prompt = build_market_prompt(payload)
    assert "截图中提取" in prompt
    assert "店铺信息" in prompt
    assert "竞品" in prompt


def test_market_prompt_omits_screenshot_extraction_when_disabled():
    payload = {
        "areaName": "测试商圈",
        "location": "测试位置",
        "areaType": "写字楼商圈",
        "storeName": "测试店",
        "enableScreenshotAnalysis": False,
    }
    prompt = build_market_prompt(payload)
    assert "截图中提取" not in prompt


def test_market_prompt_uses_store_name_label():
    payload = {
        "areaName": "测试商圈",
        "location": "测试位置",
        "areaType": "写字楼商圈",
        "storeName": "运营店铺A",
    }
    prompt = build_market_prompt(payload)
    assert "运营店铺名称" in prompt
