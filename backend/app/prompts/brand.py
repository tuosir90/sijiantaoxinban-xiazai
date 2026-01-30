"""品牌定位分析提示词（输出 Markdown）。"""

from __future__ import annotations

from typing import Any


def build_brand_prompt(payload: dict[str, Any]) -> str:
    store_name = (payload.get("storeName") or "").strip()
    category = (payload.get("category") or "").strip()
    address = (payload.get("address") or "").strip()
    target_group = (payload.get("targetGroup") or "").strip()
    price_range = (payload.get("priceRange") or "").strip()
    main_products = (payload.get("mainProducts") or "").strip()

    return (
        "请基于以下信息输出一份餐饮品牌定位分析报告。\n"
        "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n"
        "## 店铺信息\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 店铺地址：{address or '未提供'}\n"
        f"- 目标客群：{target_group or '未提供'}\n"
        f"- 人均价格：{price_range or '未提供'}\n"
        f"- 主营产品：{main_products or '未提供'}\n\n"
        "请重点给出：定位结论、差异化卖点、菜单结构建议、价格带建议、包装与品牌表达建议、"
        "美团外卖运营建议（转化、复购、活动），并尽量用清晰的小标题和要点列表呈现。\n"
    )

