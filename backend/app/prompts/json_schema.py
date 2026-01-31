"""结构化 JSON 输出规则。"""

JSON_RULES = """
请严格输出 JSON 对象，不要输出 Markdown 或 HTML，不要用 ``` 包裹。
顶层字段：cover、sections。
cover 字段包含：
- store_name
- report_title
- report_subtitle
- business_line
- period_text
- plan_date

sections 为数组，每项包含：
- title（章节标题）
- summary（目录摘要，一句话）
- blocks（内容块数组）

blocks 支持类型：
1) {"type": "paragraph", "text": "..."}
2) {"type": "bullets", "items": ["..."] }
3) {"type": "table", "headers": ["..."], "rows": [["..."]] }
4) {"type": "highlight_cards", "items": [{"title": "...", "text": "..."}] }
""".strip()
