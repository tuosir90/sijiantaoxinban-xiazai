"""品牌定位分析提示词（输出结构化 JSON）。"""

from __future__ import annotations

from typing import Any

from app.prompts.json_schema import JSON_RULES

def _get_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def build_brand_prompt(payload: dict[str, Any]) -> str:
    store_name = _get_text(payload, "store_name", "storeName")
    category = _get_text(payload, "category", "categoryName")
    address = _get_text(payload, "address", "storeAddress")
    target_group = _get_text(payload, "target_group", "targetGroup")
    price_range = _get_text(payload, "price_range", "priceRange")
    main_products = _get_text(payload, "main_products", "mainProducts")

    return (
        f"{JSON_RULES}\n\n"
        "请基于以下信息输出一份餐饮品牌定位分析方案，严格填充 JSON 字段：\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 店铺地址：{address or '未提供'}\n"
        f"- 目标客群：{target_group or '未提供'}\n"
        f"- 人均价格：{price_range or '未提供'}\n"
        f"- 主营产品：{main_products or '未提供'}\n\n"
        "内容要求：包含定位结论、差异化卖点、菜单结构建议、价格带建议、包装与品牌表达建议、"
        "外卖运营建议（转化、复购、活动）。\n"
        "请将内容拆分为若干章节，每章提供 summary，并用 blocks 组织段落、要点和表格。\n"
        "cover.report_title 建议为“品牌定位分析”，report_subtitle 自拟。\n"
    )

