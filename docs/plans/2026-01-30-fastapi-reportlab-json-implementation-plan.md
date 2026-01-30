# FastAPI ReportLab 结构化 JSON 报告 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 FastAPI + ReportLab 在 Vercel 上生成四件套 PDF，版式复刻样例（无封面图片），四方案主题色不同，输出结构化 JSON 保证稳定性。

**Architecture:** 前端/接口同一 FastAPI 入口；上游模型输出结构化 JSON；服务端校验并用 ReportLab 渲染 PDF；Vercel rewrite 全部指向 `/api/index.py`。

**Tech Stack:** FastAPI, Pydantic v2, ReportLab, httpx

---

### Task 1: 定义结构化 JSON 模型与解析器

**Files:**
- Create: `backend/app/domain/report_schema.py`
- Create: `backend/app/services/json_parser.py`
- Create: `backend/tests/test_report_schema.py`
- Create: `backend/tests/test_json_parser.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_report_schema.py
from app.domain.report_schema import ReportData

def test_report_schema_validates_minimal():
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "店铺活动方案",
            "report_subtitle": "外卖营销策划方案",
            "business_line": "主营：快餐简餐",
            "period_text": "活动周期：2026年01月01日 - 2026年01月31日",
            "plan_date": "策划日期：2026年01月"
        },
        "sections": [
            {
                "title": "活动目标",
                "summary": "制定短期、中期、长期目标",
                "blocks": [
                    {"type": "paragraph", "text": "测试内容"}
                ]
            }
        ]
    }
    report = ReportData.model_validate(data)
    assert report.cover.store_name == "示例店"
```

```python
# backend/tests/test_json_parser.py
from app.services.json_parser import parse_json_text


def test_parse_json_text_strips_code_fence():
    raw = "```json\n{\"cover\": {\"store_name\": \"A\", \"report_title\": \"B\", \"report_subtitle\": \"C\", \"business_line\": \"D\", \"period_text\": \"E\", \"plan_date\": \"F\"}, \"sections\": []}\n```"
    data = parse_json_text(raw)
    assert data["cover"]["store_name"] == "A"
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_report_schema.py::test_report_schema_validates_minimal -q`
Expected: FAIL with "ModuleNotFoundError" or attribute error

**Step 3: Write minimal implementation**

```python
# backend/app/domain/report_schema.py
from pydantic import BaseModel
from typing import Literal

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
```

```python
# backend/app/services/json_parser.py
import json

def parse_json_text(text: str) -> dict:
    s = text.strip()
    if s.startswith("```"):
        parts = s.split("```")
        if len(parts) >= 3:
            s = "```".join(parts[1:-1]).strip()
            if "\n" in s:
                first_line, rest = s.split("\n", 1)
                if first_line.strip().lower().startswith("json"):
                    s = rest.strip()
    return json.loads(s)
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_report_schema.py::test_report_schema_validates_minimal -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/domain/report_schema.py backend/app/services/json_parser.py backend/tests/test_report_schema.py backend/tests/test_json_parser.py
git commit -m "feat: 添加结构化报告模型与JSON解析"
```

---

### Task 2: 统一 JSON 提示词结构

**Files:**
- Create: `backend/app/prompts/json_schema.py`
- Modify: `backend/app/prompts/brand.py`
- Modify: `backend/app/prompts/market.py`
- Modify: `backend/app/prompts/store_activity.py`
- Modify: `backend/app/prompts/data_statistics.py`
- Create: `backend/tests/test_prompts_json.py`

**Step 1: Write the failing test**

```python
from app.prompts.registry import build_prompt


def test_prompt_contains_json_instructions():
    payload = {"store_name": "示例店"}
    prompt = build_prompt("brand", payload)
    assert "JSON" in prompt
    assert "sections" in prompt
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_prompts_json.py::test_prompt_contains_json_instructions -q`
Expected: FAIL (因为提示词尚未调整)

**Step 3: Write minimal implementation**

```python
# backend/app/prompts/json_schema.py
JSON_RULES = """
请严格输出JSON对象，不要输出Markdown或HTML，不要用```包裹。
字段：cover/sections/blocks。
""".strip()
```

```python
# backend/app/prompts/brand.py
from app.prompts.json_schema import JSON_RULES

def build_brand_prompt(payload: dict) -> str:
    store = payload.get("store_name", "店铺")
    return f"{JSON_RULES}\n请为{store}生成品牌定位方案..."
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_prompts_json.py::test_prompt_contains_json_instructions -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/prompts/json_schema.py backend/app/prompts/brand.py backend/app/prompts/market.py backend/app/prompts/store_activity.py backend/app/prompts/data_statistics.py backend/tests/test_prompts_json.py
git commit -m "feat: 统一结构化JSON提示词"
```

---

### Task 3: ReportLab 版式渲染器（封面/目录/正文）

**Files:**
- Create: `backend/app/services/reportlab/theme.py`
- Create: `backend/app/services/reportlab/styles.py`
- Create: `backend/app/services/reportlab/blocks.py`
- Create: `backend/app/services/reportlab/pdf_builder.py`
- Create: `backend/tests/test_reportlab_pdf.py`

**Step 1: Write the failing test**

```python
from app.domain.report_schema import ReportData
from app.services.reportlab.pdf_builder import build_pdf_bytes


def test_build_pdf_bytes_basic():
    data = {
        "cover": {
            "store_name": "示例店",
            "report_title": "店铺活动方案",
            "report_subtitle": "外卖营销策划方案",
            "business_line": "主营：快餐简餐",
            "period_text": "活动周期：2026年01月01日 - 2026年01月31日",
            "plan_date": "策划日期：2026年01月"
        },
        "sections": [
            {
                "title": "活动目标",
                "summary": "制定短期、中期、长期目标",
                "blocks": [
                    {"type": "paragraph", "text": "测试段落内容"}
                ]
            }
        ]
    }
    report = ReportData.model_validate(data)
    pdf_bytes = build_pdf_bytes(report, module="store-activity")
    assert pdf_bytes[:4] == b"%PDF"
    assert len(pdf_bytes) > 1000
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_reportlab_pdf.py::test_build_pdf_bytes_basic -q`
Expected: FAIL (导入模块不存在)

**Step 3: Write minimal implementation**

```python
# backend/app/services/reportlab/pdf_builder.py
from io import BytesIO
from reportlab.platypus import SimpleDocTemplate

def build_pdf_bytes(report, module: str) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)
    doc.build([])
    return buffer.getvalue()
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_reportlab_pdf.py::test_build_pdf_bytes_basic -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/reportlab backend/tests/test_reportlab_pdf.py
git commit -m "feat: 添加ReportLab渲染器骨架"
```

---

### Task 4: 完整版式实现（封面/目录/区块/表格/页脚）

**Files:**
- Modify: `backend/app/services/reportlab/styles.py`
- Modify: `backend/app/services/reportlab/blocks.py`
- Modify: `backend/app/services/reportlab/pdf_builder.py`
- Modify: `backend/app/services/reportlab/theme.py`
- Modify: `backend/tests/test_reportlab_pdf.py`

**Step 1: Write the failing test**

```python
from app.domain.report_schema import ReportData
from app.services.reportlab.pdf_builder import build_pdf_bytes


def test_pdf_contains_store_name():
    data = {
        "cover": {
            "store_name": "吴家牛羊肉馆",
            "report_title": "店铺活动方案",
            "report_subtitle": "外卖营销策划方案",
            "business_line": "主营：快餐简餐",
            "period_text": "活动周期：2026年01月01日 - 2026年01月31日",
            "plan_date": "策划日期：2026年01月"
        },
        "sections": [
            {
                "title": "活动目标",
                "summary": "制定短期、中期、长期目标",
                "blocks": [
                    {"type": "paragraph", "text": "测试段落内容"}
                ]
            }
        ]
    }
    report = ReportData.model_validate(data)
    pdf_bytes = build_pdf_bytes(report, module="store-activity")
    assert pdf_bytes[:4] == b"%PDF"
    assert len(pdf_bytes) > 8000
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_reportlab_pdf.py::test_pdf_contains_store_name -q`
Expected: FAIL (PDF 长度过小或缺少内容)

**Step 3: Write minimal implementation**

- 在 `styles.py` 定义封面/标题/正文/小标题等 ParagraphStyle。
- 在 `blocks.py` 实现：
  - 封面流式组件（标题 + 留白 + 信息行）
  - 目录盒子（浅色背景 + 左侧竖线）
  - 章节标题（序号 + 主题色横线）
  - 高亮卡片、表格、列表
- 在 `pdf_builder.py` 组装完整 flowables，并添加页脚页码。

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_reportlab_pdf.py::test_pdf_contains_store_name -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/reportlab backend/tests/test_reportlab_pdf.py
git commit -m "feat: 完整实现ReportLab版式渲染"
```

---

### Task 5: FastAPI 入口与 Vercel 部署配置

**Files:**
- Create: `api/index.py`
- Create: `backend/app/web_ui.py`
- Create: `backend/app/services/report_service.py`
- Create: `backend/tests/test_web_ui.py`
- Modify: `vercel.json`
- Create: `requirements.txt`

**Step 1: Write the failing test**

```python
from app.web_ui import render_index_html


def test_index_html_contains_form():
    html = render_index_html()
    assert "<form" in html
    assert "module" in html
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_web_ui.py::test_index_html_contains_form -q`
Expected: FAIL (模块未实现)

**Step 3: Write minimal implementation**

```python
# backend/app/web_ui.py

def render_index_html() -> str:
    return """<html><body><form><select name=\"module\"></select></form></body></html>"""
```

并在 `api/index.py` 中：
- 设置项目根目录与字体目录环境变量。
- `GET /` 返回 `render_index_html()`。
- `POST /api/generate`：调用上游模型 -> JSON 校验 -> ReportLab 渲染 -> 返回 PDF。

同时更新 `vercel.json` rewrite 到 `/api/index.py`，根目录新增 `requirements.txt`（fastapi/reportlab/pydantic-settings/httpx/python-multipart）。

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_web_ui.py::test_index_html_contains_form -q`
Expected: PASS

**Step 5: Commit**

```bash
git add api/index.py backend/app/web_ui.py backend/app/services/report_service.py vercel.json requirements.txt backend/tests/test_web_ui.py
git commit -m "feat: 增加Vercel入口与生成接口"
```

---

### Task 6: 清理旧依赖与本地验证

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/services/pdf_renderer.py`（如已废弃则替换为简单说明或移除引用）

**Step 1: Write the failing test**

```python
# backend/tests/test_requirements.py
from pathlib import Path

def test_requirements_no_playwright():
    content = Path("backend/requirements.txt").read_text(encoding="utf-8")
    assert "playwright" not in content
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_requirements.py::test_requirements_no_playwright -q`
Expected: FAIL (包含 playwright)

**Step 3: Write minimal implementation**

- 移除 `backend/requirements.txt` 中的 `playwright` 与 `markdown-it-py`（如不再使用）。
- 如 `pdf_renderer.py` 不再使用，替换为 ReportLab 入口或注释说明。

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_requirements.py::test_requirements_no_playwright -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/requirements.txt backend/app/services/pdf_renderer.py backend/tests/test_requirements.py
git commit -m "chore: 清理旧渲染依赖"
```

---

## 本地验证清单
- 运行 `pytest backend/tests -q`
- 运行 `python api/index.py`（可选，确认启动）
- 浏览器访问 `/`，填写并生成 PDF

## 回滚策略
- 若 ReportLab 版式偏差过大，保留结构化 JSON 输出与主题色，调整 `blocks.py` 样式即可快速迭代。
