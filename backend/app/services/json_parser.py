"""JSON 文本解析与清洗。"""

from __future__ import annotations

import json


def parse_json_text(text: str) -> dict:
    s = (text or "").strip()
    if s.startswith("```"):
        parts = s.split("```")
        if len(parts) >= 3:
            s = "```".join(parts[1:-1]).strip()
            if "\n" in s:
                first_line, rest = s.split("\n", 1)
                if first_line.strip().lower().startswith("json"):
                    s = rest.strip()
    s = _strip_plain_json_label(s)
    return json.loads(s)


def _strip_plain_json_label(text: str) -> str:
    s = (text or "").lstrip()
    if not s:
        return s
    if s.lower().startswith("json"):
        remainder = s[4:].lstrip()
        if remainder.startswith(":"):
            remainder = remainder[1:].lstrip()
        if remainder.startswith("{") or remainder.startswith("["):
            return remainder
        if "\n" in s:
            _, rest = s.split("\n", 1)
            return rest.strip()
    return s
