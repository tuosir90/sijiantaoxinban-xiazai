"""ReportLab 主题色配置。"""

from __future__ import annotations

from dataclasses import dataclass

from reportlab.lib.colors import HexColor


@dataclass(frozen=True)
class Theme:
    name: str
    primary: HexColor
    light: HexColor
    dark: HexColor


THEMES: dict[str, Theme] = {
    "brand": Theme("品牌定位分析", HexColor("#9B5B2A"), HexColor("#F3E7DD"), HexColor("#6E3E1E")),
    "market": Theme("商圈调研分析", HexColor("#2F6FBD"), HexColor("#E7F0FB"), HexColor("#1F4C86")),
    "store-activity": Theme("店铺活动方案", HexColor("#E07A2F"), HexColor("#FBEBDD"), HexColor("#A64E1B")),
    "data-statistics": Theme("数据统计分析", HexColor("#6B5FB5"), HexColor("#ECE9F8"), HexColor("#40357E")),
}


DEFAULT_THEME = Theme("报告", HexColor("#9B5B2A"), HexColor("#F3E7DD"), HexColor("#6E3E1E"))


def get_theme(module: str) -> Theme:
    return THEMES.get(module, DEFAULT_THEME)
