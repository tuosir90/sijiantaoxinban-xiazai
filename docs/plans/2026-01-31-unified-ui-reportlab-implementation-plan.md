# 统一四表单页面 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 Vercel 单入口下提供“单页四表单 + 直接下载 PDF”的统一页面，并按“店铺名_方案名.pdf”命名下载文件。

**Architecture:** 将统一页面静态模板放在 `backend/app/templates/unified-ui.html`，由 `backend/app/web_ui.py` 读取后返回给 `/`；前端用内联 JS 组装 `payload_json` 并以 `fetch` 获取 PDF 以避免页面跳转。

**Tech Stack:** FastAPI、ReportLab、原生 HTML/CSS/JS、Node.js test runner、pytest

---

### Task 1: 统一页面 HTML 与渲染入口

**Files:**
- Create: `backend/app/templates/unified-ui.html`
- Modify: `backend/app/web_ui.py`
- Test: `backend/tests/test_web_ui.py`
- Test: `tests/node/ui-page.test.js`

**Step 1: Write the failing test**

```python
from app.web_ui import render_index_html


def test_index_html_contains_four_forms():
    html = render_index_html()
    assert html.count('data-module="') >= 4
    assert "brand" in html
    assert "market" in html
    assert "store-activity" in html
    assert "data-statistics" in html
```

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面包含四个模块表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("unified-ui.html"));
});
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_web_ui.py -q`
Expected: FAIL (找不到新结构)

Run: `node --test tests/node/ui-page.test.js`
Expected: FAIL (未引用 unified-ui.html)

**Step 3: Write minimal implementation**

```python
from pathlib import Path


def render_index_html() -> str:
    template = Path(__file__).resolve().parent / "templates" / "unified-ui.html"
    return template.read_text(encoding="utf-8")
```

并新增 `backend/app/templates/unified-ui.html`，包含四个 `form`，每个 `form` 有 `data-module` 标识与独立“下载 PDF”按钮。

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_web_ui.py -q`
Expected: PASS

Run: `node --test tests/node/ui-page.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/web_ui.py backend/app/templates/unified-ui.html backend/tests/test_web_ui.py tests/node/ui-page.test.js
git commit -m "feat: 添加统一四表单页面模板"
```

### Task 2: 直接下载 PDF 的前端提交逻辑

**Files:**
- Modify: `backend/app/templates/unified-ui.html`
- Test: `tests/node/ui-page.test.js`

**Step 1: Write the failing test**

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面包含下载按钮与提交脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.ok(html.includes("下载PDF"));
  assert.ok(html.includes("/api/generate"));
  assert.ok(html.includes("FormData"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/ui-page.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

在 `unified-ui.html` 内加入 JS：
- 收集 `name` 字段形成 `payload_json`
- 对 `targetGroup` 多选合并为“、”
- 处理价格区间为 `XX元`
- 上传截图时带上文件
- 使用 `fetch` 获取 PDF Blob 并触发下载

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/ui-page.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/templates/unified-ui.html tests/node/ui-page.test.js
git commit -m "feat: 统一页面直连下载 PDF"
```

### Task 3: PDF 文件名规则

**Files:**
- Modify: `api/index.py`
- Create: `backend/tests/test_pdf_filename.py`

**Step 1: Write the failing test**

```python
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.index import build_pdf_filename


def test_build_pdf_filename_brand():
    payload = {"storeName": "吴家牛羊肉馆"}
    assert build_pdf_filename("brand", payload) == "吴家牛羊肉馆_品牌定位分析.pdf"
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_pdf_filename.py -q`
Expected: FAIL (函数不存在)

**Step 3: Write minimal implementation**

在 `api/index.py` 增加 `build_pdf_filename`：
- 兼容 `storeName/store_name/areaName`
- 模块映射到中文方案名
- 过滤非法文件名字符
- `Content-Disposition` 同时写入 `filename*`

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_pdf_filename.py -q`
Expected: PASS

**Step 5: Commit**

```bash
git add api/index.py backend/tests/test_pdf_filename.py
git commit -m "feat: 统一 PDF 文件名规则"
```
