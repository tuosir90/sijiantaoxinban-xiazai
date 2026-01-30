"""店铺活动方案提示词（输出 Markdown）。"""

from __future__ import annotations

from typing import Any


def build_store_activity_prompt(payload: dict[str, Any]) -> str:
    store_name = (payload.get("storeName") or payload.get("store-name") or "").strip()
    store_address = (payload.get("storeAddress") or payload.get("store-address") or "").strip()
    category = (payload.get("businessCategory") or payload.get("business-category") or "").strip()
    hours = (payload.get("businessHours") or payload.get("business-hours") or "").strip()
    menu_items = payload.get("menuItems") or ""

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
        "请基于以下信息输出一份“美团外卖店铺活动方案”。\n"
        "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n"
        "## 店铺信息\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 店铺地址：{store_address or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 营业时间：{hours or '未提供'}\n\n"
        "## 菜品（节选）\n"
        f"{menu_preview or '- 未提供'}\n\n"
        "请给出：满减/配送费/返券/秒杀/套餐搭配/好评返券等方案，"
        "并包含执行时间、门槛、目标（转化/复购/评分）与注意事项。\n"
    )

