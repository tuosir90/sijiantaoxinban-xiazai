"""商圈调研分析提示词（输出结构化 JSON，可结合截图分析）。"""

from __future__ import annotations

from typing import Any

from app.prompts.json_schema import JSON_RULES

def _get_text(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def build_market_prompt(payload: dict[str, Any]) -> str:
    area_name = _get_text(payload, "area_name", "areaName")
    location = _get_text(payload, "location", "areaLocation")
    area_type = _get_text(payload, "area_type", "areaType")
    store_name = _get_text(payload, "store_name", "storeName")
    enable_screenshot = bool(payload.get("enableScreenshotAnalysis"))

    screenshot_hint = "会提供一张美团外卖竞品截图，请结合截图内容给出分析与建议。" if enable_screenshot else "不提供截图，仅根据文本信息分析。"

    return (
        f"{JSON_RULES}\n\n"
        "请输出一份商圈调研分析报告（面向外卖经营/选址/投放决策）。\n"
        "请严格按 JSON 字段填写，包含封面信息与章节结构。\n"
        f"- 商圈名称：{area_name or '未提供'}\n"
        f"- 所在位置：{location or '未提供'}\n"
        f"- 商圈类型：{area_type or '未提供'}\n"
        f"- 拟开店/参考店铺：{store_name or '未提供'}\n"
        f"- 截图分析：{'开启' if enable_screenshot else '关闭'}（{screenshot_hint}）\n\n"
        "请覆盖：客群画像、消费水平、餐饮业态、竞争强度、机会点与风险点、"
        "针对外卖平台的具体动作（菜品结构、定价、活动、配送、评价与复购）。\n"
        "cover.report_title 建议为“商圈调研分析”，report_subtitle 自拟。\n"
    )

