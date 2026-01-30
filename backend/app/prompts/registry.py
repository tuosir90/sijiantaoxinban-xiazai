"""提示词注册表。"""

from __future__ import annotations

from typing import Any, Callable

from app.prompts.brand import build_brand_prompt
from app.prompts.data_statistics import build_data_statistics_prompt
from app.prompts.market import build_market_prompt
from app.prompts.store_activity import build_store_activity_prompt


_BUILDERS: dict[str, Callable[[dict[str, Any]], str]] = {
    "brand": build_brand_prompt,
    "market": build_market_prompt,
    "store-activity": build_store_activity_prompt,
    "data-statistics": build_data_statistics_prompt,
}


def build_prompt(module: str, payload: dict[str, Any]) -> str:
    builder = _BUILDERS.get(module)
    if not builder:
        raise ValueError(f"不支持的module: {module}")
    return builder(payload)

