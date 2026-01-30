"""报告存储（MVP：内存 TTL）。"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from typing import Any


@dataclass
class _StoredReport:
    data: dict[str, Any]
    expires_at_epoch: float


class InMemoryReportStore:
    def __init__(self, ttl_seconds: int):
        self._ttl_seconds = max(1, int(ttl_seconds))
        self._items: dict[str, _StoredReport] = {}

    def save(self, data: dict[str, Any]) -> str:
        report_id = uuid.uuid4().hex
        expires_at = time.time() + self._ttl_seconds
        self._items[report_id] = _StoredReport(data=data, expires_at_epoch=expires_at)
        return report_id

    def get(self, report_id: str) -> dict[str, Any] | None:
        item = self._items.get(report_id)
        if not item:
            return None

        if item.expires_at_epoch <= time.time():
            self._items.pop(report_id, None)
            return None

        return item.data

    def purge_expired(self) -> int:
        now = time.time()
        expired = [key for key, value in self._items.items() if value.expires_at_epoch <= now]
        for key in expired:
            self._items.pop(key, None)
        return len(expired)

