"""报告生成服务。"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
import re
from typing import Any

import httpx

from app.domain.report_schema import ReportData
from app.prompts.registry import build_prompt
from app.services.json_parser import parse_json_text
from app.services.reportlab.pdf_builder import build_pdf_bytes
from app.services.upstream_llm import UpstreamConfig, UpstreamError, chat_completions
from app.settings import get_settings


class ReportServiceError(RuntimeError):
    pass


def _china_now() -> datetime:
    return datetime.now(timezone(timedelta(hours=8)))


def apply_cover_defaults(report: ReportData, *, now: datetime | None = None) -> None:
    ts = now or _china_now()
    report.cover.period_text = f"{ts.year}年{ts.month:02d}月"
    report.cover.plan_date = ts.strftime("%Y-%m-%d")


def _replace_date_text(text: str, ts: datetime) -> str:
    if not text:
        return ""
    s = str(text)
    year = ts.year
    month = ts.month
    day = ts.day

    def repl_sep(match: re.Match) -> str:
        sep = match.group(2)
        return f"{year}{sep}{month:02d}{sep}{day:02d}"

    def repl_cn(match: re.Match) -> str:
        return f"{year}年{month:02d}月{day:02d}日"

    def repl_sep_month(match: re.Match) -> str:
        sep = match.group(2)
        return f"{year}{sep}{month:02d}"

    def repl_cn_month(match: re.Match) -> str:
        return f"{year}年{month:02d}月"

    s = re.sub(r"(20\d{2})([-/.])(1[0-2]|0?[1-9])\2([12]\d|3[01]|0?[1-9])", repl_sep, s)
    s = re.sub(r"(20\d{2})年(1[0-2]|0?[1-9])月([12]\d|3[01]|0?[1-9])日?", repl_cn, s)
    s = re.sub(r"(20\d{2})([-/.])(1[0-2]|0?[1-9])(?!\2[0-3]?\d)", repl_sep_month, s)
    s = re.sub(r"(20\d{2})年(1[0-2]|0?[1-9])月", repl_cn_month, s)
    return s


def apply_content_date_defaults(report: ReportData, *, now: datetime | None = None) -> None:
    ts = now or _china_now()
    for section in report.sections:
        section.title = _replace_date_text(section.title, ts)
        section.summary = _replace_date_text(section.summary, ts)
        for block in section.blocks:
            if block.type in {"paragraph", "subtitle"}:
                block.text = _replace_date_text(block.text, ts)
            elif block.type == "bullets":
                block.items = [_replace_date_text(item, ts) for item in block.items]
            elif block.type == "table":
                block.headers = [_replace_date_text(item, ts) for item in block.headers]
                block.rows = [
                    [_replace_date_text(item, ts) for item in row]
                    for row in block.rows
                ]
            elif block.type == "highlight_cards":
                for item in block.items:
                    item.title = _replace_date_text(item.title, ts)
                    item.text = _replace_date_text(item.text, ts)


def _trim_text(text: str, *, limit: int = 2000) -> str:
    if text is None:
        return ""
    s = str(text)
    return s[:limit]


def _log_diag(event: str, payload: dict[str, Any]) -> None:
    if os.getenv("DIAGNOSTIC_LOGS") != "1":
        return
    parts = [f"诊断事件={event}"]
    for key, value in payload.items():
        text = _trim_text(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False))
        parts.append(f"{key}={text}")
    print("[诊断日志] " + " | ".join(parts))


def _select_model(settings: Any, module: str) -> str:
    default = (getattr(settings, "upstream_model_default", "") or "").strip()
    if module == "brand":
        return (getattr(settings, "upstream_model_brand", "") or "").strip() or default
    if module == "market":
        return (getattr(settings, "upstream_model_market", "") or "").strip() or default
    if module == "store-activity":
        return (getattr(settings, "upstream_model_store_activity", "") or "").strip() or default
    if module == "data-statistics":
        return (getattr(settings, "upstream_model_data_statistics", "") or "").strip() or default
    return default


async def _repair_json(client: httpx.AsyncClient, cfg: UpstreamConfig, raw: str) -> str:
    repair_text = raw[:12000]
    prompt = (
        "请将以下内容修复为严格 JSON 对象，仅输出 JSON，不要 Markdown/HTML：\n\n"
        f"{repair_text}"
    )
    return await chat_completions(
        client,
        cfg=cfg,
        system="你是一位严格的JSON修复助手。",
        user_prompt=prompt,
        temperature=0.2,
        max_tokens=12000,
    )


async def generate_pdf_bytes(
    *,
    module: str,
    payload: dict[str, Any],
    screenshot_data_url: str | None = None,
) -> bytes:
    settings = get_settings()
    try:
        prompt = build_prompt(module, payload)
    except ValueError as e:
        raise ReportServiceError(str(e)) from e
    model = _select_model(settings, module)
    cfg = UpstreamConfig(base_url=settings.upstream_base_url, api_key=settings.upstream_api_key, model=model)

    system = (
        "你是一位资深的餐饮外卖运营与市场分析专家。"
        "请严格按照JSON规则输出，不要附加多余文字。"
    )

    async with httpx.AsyncClient() as client:
        try:
            raw = await chat_completions(
                client,
                cfg=cfg,
                system=system,
                user_prompt=prompt,
                image_data_url=screenshot_data_url if module == "market" else None,
            )
        except UpstreamError as e:
            raise ReportServiceError(str(e)) from e

        try:
            data = parse_json_text(raw)
        except json.JSONDecodeError as e:
            _log_diag(
                "json_parse_failed",
                {"module": module, "model": model, "raw": raw},
            )
            try:
                repaired = await _repair_json(client, cfg, raw)
                _log_diag(
                    "json_repair_attempt",
                    {"module": module, "model": model, "repaired": repaired},
                )
                data = parse_json_text(repaired)
            except Exception as err:
                _log_diag(
                    "json_repair_failed",
                    {"module": module, "model": model, "error": str(err)},
                )
                raise ReportServiceError("JSON解析失败，且修复无效") from err

    report = ReportData.model_validate(data)
    apply_cover_defaults(report)
    apply_content_date_defaults(report)
    return build_pdf_bytes(report, module=module)
