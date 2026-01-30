"""报告领域模型。"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class Report:
    report_id: str
    module: str
    markdown: str
    meta: dict[str, Any]
    screenshot_data_url: str | None
    created_at: datetime
    expires_at: datetime

