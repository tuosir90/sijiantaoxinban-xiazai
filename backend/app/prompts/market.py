"""商圈调研分析提示词（输出 Markdown，可结合截图分析）。"""

from __future__ import annotations

from typing import Any


def build_market_prompt(payload: dict[str, Any]) -> str:
    area_name = (payload.get("areaName") or "").strip()
    location = (payload.get("location") or "").strip()
    area_type = (payload.get("areaType") or "").strip()
    store_name = (payload.get("storeName") or "").strip()
    enable_screenshot = bool(payload.get("enableScreenshotAnalysis"))

    screenshot_hint = "会提供一张美团外卖竞品截图，请结合截图内容给出分析与建议。" if enable_screenshot else "不提供截图，仅根据文本信息分析。"

    return (
        "请输出一份商圈调研分析报告（面向外卖经营/选址/投放决策）。\n"
        "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n"
        "## 商圈信息\n"
        f"- 商圈名称：{area_name or '未提供'}\n"
        f"- 所在位置：{location or '未提供'}\n"
        f"- 商圈类型：{area_type or '未提供'}\n"
        f"- 拟开店/参考店铺：{store_name or '未提供'}\n"
        f"- 截图分析：{'开启' if enable_screenshot else '关闭'}（{screenshot_hint}）\n\n"
        "请覆盖：客群画像、消费水平、餐饮业态、竞争强度、机会点与风险点、"
        "针对美团外卖的具体动作（菜品结构、定价、活动、配送、评价与复购）。\n"
    )

