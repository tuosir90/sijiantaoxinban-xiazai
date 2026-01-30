# 后端（FastAPI）

本目录用于实现后端能力：

1. 接收四模块表单与（可选）商圈截图
2. 调用上游 OpenAI 兼容接口生成**纯 Markdown**
3. Markdown 使用固定模板渲染预览 HTML
4. 使用 Playwright 渲染并直出**长页 PDF**

实现细节与任务拆分请看：
- `../docs/plans/2026-01-29-fastapi-pdf-design.md`
- `../docs/plans/2026-01-29-fastapi-pdf-implementation-plan.md`

## 环境变量

建议先复制 `fastapi-refactor/backend/.env.example` 为 `.env` 或 `.env.local` 再填写密钥。

- `UPSTREAM_API_KEY`：上游 OpenAI 兼容接口密钥（必填）
- `UPSTREAM_BASE_URL`：上游接口地址（默认 `https://jeniya.top/v1/chat/completions`）
- `UPSTREAM_MODEL_DEFAULT`：默认模型名（默认 `gemini-2.5-flash-lite`）
- `UPSTREAM_MODEL_BRAND`：品牌定位分析模块单独指定模型名（可选，默认回退到 `UPSTREAM_MODEL_DEFAULT`）
- `UPSTREAM_MODEL_MARKET`：商圈调研分析模块单独指定模型名（可选，默认回退到 `UPSTREAM_MODEL_DEFAULT`）
- `UPSTREAM_MODEL_STORE_ACTIVITY`：店铺活动方案模块单独指定模型名（可选，默认回退到 `UPSTREAM_MODEL_DEFAULT`）
- `UPSTREAM_MODEL_DATA_STATISTICS`：数据统计分析模块单独指定模型名（可选，默认回退到 `UPSTREAM_MODEL_DEFAULT`）
- `CORS_ALLOW_ORIGINS`：允许的前端域名（默认 `*`，生产建议配置具体域名）
- `REPORT_TTL_SECONDS`：有状态报告保存时间（默认 86400 秒）

## 启动命令

在 `fastapi-refactor/backend` 目录：

```powershell
python -m pip install -r requirements.txt
python -m playwright install chromium

$env:UPSTREAM_API_KEY="你的上游key"
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000
```

启动后访问：
- `http://localhost:8000/healthz`
- `http://localhost:8000/ui/index.html`
