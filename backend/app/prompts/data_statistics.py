"""数据统计分析提示词（输出结构化 JSON）。"""

from __future__ import annotations

from typing import Any

from app.prompts.json_schema import JSON_RULES

def _get_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def build_data_statistics_prompt(payload: dict[str, Any]) -> str:
    store_name = _get_text(payload, "store_name", "storeName")
    category = _get_text(payload, "business_category", "businessCategory")
    store_address = _get_text(payload, "store_address", "storeAddress")
    business_hours = _get_text(payload, "business_hours", "businessHours")

    def v(key: str) -> Any:
        return payload.get(key)

    def f(value: Any) -> str:
        if value is None:
            return "未提供"
        if isinstance(value, str) and not value.strip():
            return "未提供"
        return str(value)

    return (
        f"{JSON_RULES}\n\n"
        "请基于以下30天运营数据，输出一份外卖店铺数据统计分析报告，严格填充 JSON 字段。\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 店铺地址：{store_address or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 营业时间：{business_hours or '未提供'}\n\n"
        "核心漏斗数据（30天）：\n"
        f"- 曝光人数：{f(v('exposureCount'))}\n"
        f"- 入店人数：{f(v('visitCount'))}\n"
        f"- 下单人数：{f(v('orderCount'))}\n"
        f"- 入店转化率：{f(v('visitConversion'))}%\n"
        f"- 下单转化率：{f(v('orderConversion'))}%\n\n"
        "配送服务设置：\n"
        f"- 起送价：{f(v('minOrderPrice'))}\n"
        f"- 配送费：{f(v('deliveryFee'))}\n"
        f"- 配送范围：{f(v('deliveryRange'))}\n\n"
        "店铺权重与服务开通：\n"
        f"- 闲时出餐时长：{f(v('idleCookingTime'))}分钟\n"
        f"- 忙时出餐时长：{f(v('busyCookingTime'))}分钟\n"
        f"- 青山公益：{f(v('greenCharity'))}\n"
        f"- 到店自取：{f(v('selfPickup'))}\n"
        f"- 接受预订单：{f(v('preOrder'))}\n"
        f"- 准时宝：{f(v('onTimeGuarantee'))}\n"
        f"- 放心吃：{f(v('foodSafety'))}\n\n"
        "请分析：漏斗问题定位、配送竞争力、店铺权重设置影响，"
        "以及最重要的3-5条可执行优化动作（按优先级排序）。\n"
        "cover.report_title 建议为“数据统计分析”，report_subtitle 自拟。\n"
    )
