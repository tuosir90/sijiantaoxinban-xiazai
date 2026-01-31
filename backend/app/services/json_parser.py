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
    return json.loads(s)
