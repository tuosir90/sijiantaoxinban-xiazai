"""数据统计分析提示词（输出 Markdown）。"""

from __future__ import annotations

from typing import Any


def build_data_statistics_prompt(payload: dict[str, Any]) -> str:
    store_name = (payload.get("storeName") or "").strip()
    category = (payload.get("businessCategory") or "").strip()
    store_address = (payload.get("storeAddress") or "").strip()
    business_hours = (payload.get("businessHours") or "").strip()

    def v(key: str) -> Any:
        return payload.get(key)

    def f(value: Any) -> str:
        if value is None:
            return "未提供"
        if isinstance(value, str) and not value.strip():
            return "未提供"
        return str(value)

    return (
        "请基于以下30天运营数据，输出一份外卖店铺数据统计分析报告。\n"
        "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n"
        "## 店铺信息\n"
        f"- 店铺名称：{store_name or '未提供'}\n"
        f"- 店铺地址：{store_address or '未提供'}\n"
        f"- 经营品类：{category or '未提供'}\n"
        f"- 营业时间：{business_hours or '未提供'}\n\n"
        "## 核心漏斗数据（30天）\n"
        f"- 曝光人数：{f(v('exposureCount'))}\n"
        f"- 入店人数：{f(v('visitCount'))}\n"
        f"- 下单人数：{f(v('orderCount'))}\n"
        f"- 入店转化率：{f(v('visitConversion'))}%\n"
        f"- 下单转化率：{f(v('orderConversion'))}%\n\n"
        "## 配送服务设置\n"
        f"- 起送价：{f(v('minOrderPrice'))}\n"
        f"- 配送费：{f(v('deliveryFee'))}\n"
        f"- 配送范围：{f(v('deliveryRange'))}\n\n"
        "## 店铺权重与服务开通\n"
        f"- 闲时出餐时长：{f(v('idleCookingTime'))}分钟\n"
        f"- 忙时出餐时长：{f(v('busyCookingTime'))}分钟\n"
        f"- 青山公益：{f(v('greenCharity'))}\n"
        f"- 到店自取：{f(v('selfPickup'))}\n"
        f"- 接受预订单：{f(v('preOrder'))}\n"
        f"- 准时宝：{f(v('onTimeGuarantee'))}\n"
        f"- 放心吃：{f(v('foodSafety'))}\n\n"
        "请分析：漏斗问题定位、配送竞争力、店铺权重设置影响、"
        "以及最重要的3-5条可执行优化动作（按优先级排序）。\n"
    )
