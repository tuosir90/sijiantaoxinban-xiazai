"""结构化报告数据模型。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class CoverInfo(BaseModel):
    store_name: str
    report_title: str
    report_subtitle: str
    business_line: str
    period_text: str
    plan_date: str


class ParagraphBlock(BaseModel):
    type: Literal["paragraph"]
    text: str


class Section(BaseModel):
    title: str
    summary: str
    blocks: list[ParagraphBlock]


class ReportData(BaseModel):
    cover: CoverInfo
    sections: list[Section]
