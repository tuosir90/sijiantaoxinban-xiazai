"""结构化报告数据模型。"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


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


class SubtitleBlock(BaseModel):
    type: Literal["subtitle"]
    text: str


class BulletsBlock(BaseModel):
    type: Literal["bullets"]
    items: list[str]


class TableBlock(BaseModel):
    type: Literal["table"]
    headers: list[str]
    rows: list[list[str]]


class HighlightCard(BaseModel):
    title: str
    text: str


class HighlightCardsBlock(BaseModel):
    type: Literal["highlight_cards"]
    items: list[HighlightCard]


Block = Annotated[
    ParagraphBlock | SubtitleBlock | BulletsBlock | TableBlock | HighlightCardsBlock,
    Field(discriminator="type"),
]


class Section(BaseModel):
    title: str
    summary: str
    blocks: list[Block]


class ReportData(BaseModel):
    cover: CoverInfo
    sections: list[Section]
