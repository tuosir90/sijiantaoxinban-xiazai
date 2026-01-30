# 四件套 FastAPI（表单→Markdown→长页PDF）Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构为“全后端化”方案：前端提交表单与截图，后端调用上游 OpenAI 兼容接口生成**纯 Markdown**，前端先预览（后端固定模板 HTML），再一键下载**长页不分页 PDF**；同时提供有状态与无状态两种下载方式。

**Architecture:** FastAPI 后端提供“报告生成/预览渲染/PDF 直出”三类能力；Markdown 渲染统一由后端负责（禁用 Markdown 原生 HTML）；PDF 使用 Playwright 渲染固定模板并按内容高度输出长页 PDF；按模块应用统一版式与不同主题色；商圈模块支持截图多模态分析并在 PDF 中展示截图。

**Tech Stack:** FastAPI + Uvicorn + httpx + Playwright + Jinja2 + markdown-it-py + Pillow + pytest。

---

## Task 1: 后端工程骨架 + 健康检查 + CORS

**Files:**
- Create: `fastapi-refactor/backend/requirements.txt`
- Create: `fastapi-refactor/backend/app/__init__.py`
- Create: `fastapi-refactor/backend/app/main.py`
- Create: `fastapi-refactor/backend/app/settings.py`
- Create: `fastapi-refactor/backend/app/routes/__init__.py`
- Create: `fastapi-refactor/backend/app/routes/healthz.py`
- Test: `fastapi-refactor/backend/tests/test_healthz.py`

**Step 1: 写失败测试：healthz**

```python
from fastapi.testclient import TestClient

def test_healthz_returns_ok():
    from app.main import create_app
    client = TestClient(create_app())
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
```

**Step 2: 运行测试确认失败**

Run: `pytest fastapi-refactor/backend/tests/test_healthz.py -v`
Expected: FAIL

**Step 3: 最小实现**

```python
# app/routes/healthz.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/healthz")
def healthz():
    return {"status": "ok"}
```

```python
# app/main.py
from fastapi import FastAPI
from app.routes.healthz import router as healthz_router

def create_app() -> FastAPI:
    app = FastAPI(title="四件套 FastAPI 后端")
    app.include_router(healthz_router)
    return app
```

**Step 4: 运行测试确认通过**

Run: `pytest fastapi-refactor/backend/tests/test_healthz.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 初始化FastAPI后端骨架与healthz"
```

---

## Task 2: Settings（环境变量）+ 基础安全约束

**Files:**
- Modify: `fastapi-refactor/backend/app/settings.py`
- Test: `fastapi-refactor/backend/tests/test_settings.py`

**Step 1: 写失败测试：读取上游配置**

```python
def test_settings_reads_env(monkeypatch):
    monkeypatch.setenv("UPSTREAM_BASE_URL", "https://jeniya.top/v1/chat/completions")
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key")
    from app.settings import Settings

    s = Settings()
    assert s.upstream_base_url == "https://jeniya.top/v1/chat/completions"
    assert s.upstream_api_key == "test-key"
```

**Step 2: 运行测试确认失败**

Run: `pytest fastapi-refactor/backend/tests/test_settings.py -v`
Expected: FAIL

**Step 3: 最小实现 Settings（首次出现：配置管理(Configuration Management)）**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    upstream_base_url: str = "https://jeniya.top/v1/chat/completions"
    upstream_api_key: str = ""
    upstream_model_default: str = "gemini-2.5-flash-lite"

    report_ttl_seconds: int = 86400
    cors_allow_origins: str = "*"  # 生产建议收敛为具体域名
    max_upload_mb: int = 10

    class Config:
        env_prefix = ""
```

**Step 4: 运行测试确认通过**

Run: `pytest fastapi-refactor/backend/tests/test_settings.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add fastapi-refactor/backend/app/settings.py fastapi-refactor/backend/tests/test_settings.py
git commit -m "feat: 添加后端Settings配置与基础安全参数"
```

---

## Task 3: 报告领域模型 + 有状态存储（内存 TTL）

**Files:**
- Create: `fastapi-refactor/backend/app/domain/report.py`
- Create: `fastapi-refactor/backend/app/services/report_store.py`
- Test: `fastapi-refactor/backend/tests/test_report_store.py`

**Step 1: 写失败测试：TTL 过期**

```python
import time

def test_report_store_expires():
    from app.services.report_store import InMemoryReportStore
    store = InMemoryReportStore(ttl_seconds=1)

    report_id = store.save({"module": "brand", "markdown": "# hi"})
    assert store.get(report_id)["markdown"] == "# hi"

    time.sleep(1.2)
    assert store.get(report_id) is None
```

**Step 2: 运行测试确认失败**

Run: `pytest fastapi-refactor/backend/tests/test_report_store.py -v`
Expected: FAIL

**Step 3: 最小实现**

实现一个 `InMemoryReportStore`：`save()` 生成 `uuid4`，`get()` 若过期返回 `None`，并做惰性清理。

**Step 4: 运行测试确认通过**

Run: `pytest fastapi-refactor/backend/tests/test_report_store.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 添加内存TTL报告存储"
```

---

## Task 4: 截图处理服务（压缩/缩放/转 base64）

**Files:**
- Create: `fastapi-refactor/backend/app/services/image_processor.py`
- Test: `fastapi-refactor/backend/tests/test_image_processor.py`

**Step 1: 写失败测试：输出 base64 且格式正确**

```python
def test_image_processor_returns_base64_data_url(tmp_path):
    from PIL import Image
    img_path = tmp_path / "a.png"
    Image.new("RGB", (2000, 1200), color=(255, 0, 0)).save(img_path)

    from app.services.image_processor import process_image_to_data_url
    data_url = process_image_to_data_url(img_path.read_bytes())

    assert data_url.startswith("data:image/jpeg;base64,")
```

**Step 2: 运行测试确认失败**

Run: `pytest fastapi-refactor/backend/tests/test_image_processor.py -v`
Expected: FAIL

**Step 3: 最小实现**

- 使用 Pillow 将图片缩放到最大宽度（例如 1280px）
- 转 JPEG，质量从 85 开始，必要时降到 60
- 返回 `data:image/jpeg;base64,...`

**Step 4: 运行测试确认通过**

Run: `pytest fastapi-refactor/backend/tests/test_image_processor.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 添加截图压缩与base64转换服务"
```

---

## Task 5: 上游 LLM 客户端（OpenAI 兼容 /v1/chat/completions）

**Files:**
- Create: `fastapi-refactor/backend/app/services/upstream_llm.py`
- Test: `fastapi-refactor/backend/tests/test_upstream_llm_payload.py`

**Step 1: 写失败测试：多模态 payload 结构**

```python
def test_build_messages_with_image():
    from app.services.upstream_llm import build_messages
    msgs = build_messages(system="S", user_prompt="P", image_data_url="data:image/jpeg;base64,xxx")
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"
    assert isinstance(msgs[1]["content"], list)
```

**Step 2: 实现 build_messages + request body 构建**

要求：
- 文本：`content` 为字符串
- 有图：`content` 为 `[{type:'text',text:...},{type:'image_url',image_url:{url:...}}]`

**Step 3: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 增加上游LLM请求构造（含多模态）"
```

> 后续迭代：用 `httpx.AsyncClient` 真实调用上游，做超时、错误透传与中文错误信息。

---

## Task 6: 四模块提示词（输出“纯 Markdown”）

**Files:**
- Create: `fastapi-refactor/backend/app/prompts/brand.py`
- Create: `fastapi-refactor/backend/app/prompts/market.py`
- Create: `fastapi-refactor/backend/app/prompts/store_activity.py`
- Create: `fastapi-refactor/backend/app/prompts/data_statistics.py`
- Create: `fastapi-refactor/backend/app/prompts/registry.py`
- Test: `fastapi-refactor/backend/tests/test_prompts_smoke.py`

**Step 1: 写冒烟测试：四模块都能生成 prompt 字符串**

```python
def test_prompts_can_build():
    from app.prompts.registry import build_prompt
    md = build_prompt("brand", {"storeName": "示例店", "category": "火锅"})
    assert isinstance(md, str) and len(md) > 10
```

**Step 2: 实现提示词（关键约束）**

所有模块 system prompt 最低约束（不要强制章节）：
- 只输出 Markdown 正文
- 不要输出 ``` 包裹全文
- 不要输出 HTML 标签

商圈模块额外说明：需要结合截图做“竞品/门店信息/活动/配送/评分”等分析，并给出可执行建议。

**Step 3: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 增加四模块Markdown提示词生成器"
```

---

## Task 7: 报告生成接口（有状态）

**Files:**
- Create: `fastapi-refactor/backend/app/routes/reports.py`
- Modify: `fastapi-refactor/backend/app/main.py`
- Test: `fastapi-refactor/backend/tests/test_reports_generate.py`

**Step 1: 写失败测试：缺少 module 返回 400**

```python
from fastapi.testclient import TestClient

def test_generate_requires_module():
    from app.main import create_app
    client = TestClient(create_app())
    res = client.post("/api/reports/generate", files={})
    assert res.status_code in (400, 422)
```

**Step 2: 实现接口（先返回占位 markdown）**

接口先用占位内容跑通链路：
- 解析 `multipart/form-data`（module、json 字段、截图文件）
- 生成 `report_id` 并存入 store
- 返回 `{report_id, markdown, preview_url, pdf_url, expires_at}`

**Step 3: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 增加报告生成接口骨架（有状态）"
```

> 后续迭代：接入真实上游调用；响应清洗（去 ``` / 去多余前缀）；失败重试（可选）。

---

## Task 8: Markdown → HTML（固定模板，按模块配色）+ 预览接口

**Files:**
- Create: `fastapi-refactor/backend/app/services/markdown_renderer.py`
- Create: `fastapi-refactor/backend/app/templates/report.html.j2`
- Create: `fastapi-refactor/backend/app/routes/preview.py`（或合并到 reports 路由）
- Test: `fastapi-refactor/backend/tests/test_preview_html.py`

**Step 1: 写失败测试：preview 返回 HTML 且包含标题**

```python
from fastapi.testclient import TestClient

def test_preview_returns_html():
    from app.main import create_app
    client = TestClient(create_app())

    res = client.post("/api/reports/preview", json={"module": "brand", "markdown": "# 标题\\n内容"})
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "<h1" in res.text
```

**Step 2: 实现 markdown 渲染（禁用原生 HTML）**

建议使用 `markdown-it-py` 并设置 `html=False`，避免 AI 输出注入脚本。

**Step 3: 固定模板**

模板需包含：
- 模块标题/副标题/日期
- 主题色（brand/market/store-activity/data-statistics）
- 截图区（如果有 screenshot_data_url）
- Markdown 内容区（渲染后的 HTML）

**Step 4: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 增加Markdown预览渲染（固定模板+模块配色）"
```

---

## Task 9: PDF 渲染（Playwright，长页不分页）+ PDF 接口（有状态/无状态）

**Files:**
- Create: `fastapi-refactor/backend/app/services/pdf_renderer.py`
- Create: `fastapi-refactor/backend/app/routes/pdf.py`（或合并到 reports 路由）
- Test: `fastapi-refactor/backend/tests/test_pdf_bytes.py`

**Step 1: 写失败测试：PDF 返回 `%PDF` 开头**

```python
from fastapi.testclient import TestClient

def test_pdf_returns_pdf_bytes():
    from app.main import create_app
    client = TestClient(create_app())
    res = client.post("/api/reports/pdf", json={"module": "brand", "markdown": "# 中文测试\\n内容"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/pdf")
    assert res.content[:4] == b"%PDF"
```

**Step 2: 先用伪 PDF 通过测试，跑通端点**

**Step 3: 引入 Playwright 真渲染**

实现要点：
- 应用启动时初始化 browser（lifespan）
- 每次请求创建 page
- `page.set_content(html, wait_until="networkidle")`
- `await page.evaluate("document.fonts && document.fonts.ready")`（尽量等待字体）
- 计算内容高度：`document.documentElement.scrollHeight`
- `page.pdf(width="210mm", height=f"{height}px", print_background=True, margin=...)`

**Step 4: 字体内嵌**

- 后端读取 `NotoSansSC-Regular.otf` / `NotoSansSC-Bold.otf` 转 base64 注入 CSS
- 避免线上网络拉字体失败导致中文方块

**Step 5: Commit**

```bash
git add fastapi-refactor/backend
git commit -m "feat: 实现Playwright长页PDF直出（含字体内嵌）"
```

---

## Task 10: 前端（预览优先）最小可用版

**Files:**
- Create: `fastapi-refactor/frontend/index.html`
- Create: `fastapi-refactor/frontend/js/runtime-config.js`
- Create: `fastapi-refactor/frontend/js/api.js`
- Create: `fastapi-refactor/frontend/js/ui.js`
- Create: `fastapi-refactor/frontend/css/app.css`

**Step 1: 先做一个“通用表单 → 预览 → 下载”页面**

目的：先打通链路，再迁移四模块 UI。

- 输入：module 下拉 + JSON 文本框（临时）+ 截图上传
- 点击生成：调用 `/api/reports/generate`
- 预览：iframe 加载 `/api/reports/{id}/preview`
- 显示原始 Markdown（只读文本框）
- 下载：`GET /api/reports/{id}/pdf`

**Step 2: Commit**

```bash
git add fastapi-refactor/frontend
git commit -m "feat: 增加前端通用预览与PDF下载页面（MVP）"
```

---

## Task 11: 迁移四模块前端页面（复用旧 UI，但后端化）

**Files:**
- Create: `fastapi-refactor/frontend/brand-analysis.html`
- Create: `fastapi-refactor/frontend/market-research.html`
- Create: `fastapi-refactor/frontend/store-activity.html`
- Create: `fastapi-refactor/frontend/data-statistics.html`
- Create/Modify: `fastapi-refactor/frontend/js/modules/*`（每模块一个目录）

**Step 1: 拷贝旧版页面与样式**

从旧项目复制 HTML/CSS（保持视觉一致），删除：
- 前端直连上游 key
- 前端 HTML 报告渲染器（改为 iframe 预览后端 HTML）
- 旧 pdfService/pdfGenerator 逻辑（改为调用后端 PDF）

**Step 2: 每模块改为提交结构化表单数据**

- 用 `FormData` 发送：`module` + `payload_json` + `screenshot`(仅商圈)
- 后端生成 Markdown 并返回 report_id

**Step 3: Commit（按模块拆 commit）**

```bash
git add fastapi-refactor/frontend/brand-analysis.html fastapi-refactor/frontend/js/modules/brand
git commit -m "feat: 迁移品牌模块到后端Markdown与PDF直出"
```

---

## Task 12: 部署（Docker）+ 运维文档

**Files:**
- Create: `fastapi-refactor/backend/Dockerfile`
- Create: `fastapi-refactor/backend/docker-compose.yml`
- Modify: `fastapi-refactor/README.md`

**Step 1: 选基础镜像**

推荐使用 Playwright 官方镜像（减少 Chromium 依赖问题），并在镜像内运行 FastAPI。

**Step 2: docker-compose 本地验证**

Run: `docker compose up --build`
Expected:
- `GET /healthz` 返回 `{"status":"ok"}`
- `POST /api/reports/preview` 返回 HTML
- `POST /api/reports/pdf` 返回可下载 PDF

**Step 3: Commit**

```bash
git add fastapi-refactor/backend fastapi-refactor/README.md
git commit -m "docs: 添加FastAPI后端Docker部署与环境变量说明"
```

---

## 备注：如何“真正解决 Vercel 无法稳定 PDF”

- Vercel 只负责部署前端静态页面。
- PDF 生成由 FastAPI + Playwright 独立服务完成（部署在自建服务器/容器平台）。
- 前端通过 `runtime-config.js` 指向后端域名即可（无需 Serverless）。
