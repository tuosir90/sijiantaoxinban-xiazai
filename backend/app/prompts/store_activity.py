"""店铺活动方案提示词（输出结构化 JSON）。"""

from __future__ import annotations

from typing import Any

from app.prompts.json_schema import JSON_RULES

def _get_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def build_store_activity_prompt(payload: dict[str, Any]) -> str:
    store_name = _get_text(payload, "store_name", "storeName", "store-name")
    store_address = _get_text(payload, "store_address", "storeAddress", "store-address")
    category = _get_text(payload, "business_category", "businessCategory", "business-category")
    hours = _get_text(payload, "business_hours", "businessHours", "business-hours")
    menu_items = payload.get("menuItems") or payload.get("menu_items") or ""

    menu_preview = ""
    if isinstance(menu_items, list):
        lines = []
        for item in menu_items[:30]:
            name = (item.get("name") or "").strip()
            price = (item.get("price") or "").strip()
            if name:
                lines.append(f"- {name}（{price or '未标价'}）")
        if lines:
            menu_preview = "\n".join(lines)
    elif isinstance(menu_items, str):
        menu_preview = "\n".join([f"- {line.strip()}" for line in menu_items.splitlines() if line.strip()][:30])

    return (
        f"{JSON_RULES}\n\n"
        "请基于以下信息输出一份“外卖店铺活动方案”，严格填充 JSON 字段：\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 店铺地址：{store_address or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 营业时间：{hours or '未提供'}\n\n"
        "菜品节选：\n"
        f"{menu_preview or '- 未提供'}\n\n"
        "请给出：满减/配送费/返券/秒杀/套餐搭配/好评返券等方案，"
        "并包含执行时间、门槛、目标（转化/复购/评分）与注意事项。\n"
        "cover.report_title 建议为“店铺活动方案”，report_subtitle 自拟。\n"
    )

