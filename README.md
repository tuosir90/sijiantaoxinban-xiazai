# Vercel 单体部署版（目标：Markdown → 固定模板 → 浏览器 PDF）

> 本目录用于在不破坏旧版的前提下，重构「外卖店铺四件套方案生成」项目。
>
> 核心目标：
> 1) 后端无服务器函数(Serverless Function)负责调用上游大模型并输出**纯 Markdown**；
> 2) 前端在浏览器中使用固定模板渲染，并直接下载**PDF**；
> 3) 前后端同部署在 Vercel，避免运行 Playwright/Chromium。

## 目录规划

- `api/`：Node.js API（上游调用与 Markdown 输出）
- `public/`：前端静态页面与资源（浏览器渲染 + PDF 导出）
- `backend/`：旧版 FastAPI 后端（保留用于参考/对照）
- `frontend/`：旧版静态页面源（保留用于参考/对照）
- `docs/plans/`：设计与实现计划文档

## 本地运行（推荐）

### 方式一：使用 Vercel 本地开发

1) 安装 Vercel CLI：

```powershell
npm i -g vercel
```

2) 设置环境变量（本地或 Vercel 环境面板）：

```powershell
$env:UPSTREAM_API_KEY="你的上游key"
$env:UPSTREAM_BASE_URL="https://jeniya.top/v1/chat/completions"
$env:UPSTREAM_MODEL_DEFAULT="gemini-2.5-flash-lite"
# 可选：四模块分别指定模型（不填则回退到默认）
# $env:UPSTREAM_MODEL_BRAND="..."
# $env:UPSTREAM_MODEL_MARKET="..."
# $env:UPSTREAM_MODEL_STORE_ACTIVITY="..."
# $env:UPSTREAM_MODEL_DATA_STATISTICS="..."
```

3) 启动本地开发服务器：

```powershell
vercel dev
```

4) 访问页面：

- `http://localhost:3000/index.html`
- `http://localhost:3000/brand-analysis.html`
- `http://localhost:3000/market-research.html`
- `http://localhost:3000/store-activity.html`
- `http://localhost:3000/data-statistics.html`

### 方式二：仅预览静态页面（不推荐）

可用任意静态服务器预览 `public/`，但不会调用后端 API，无法生成报告与 PDF。

## 生产部署（Vercel 单体）

1) 直接将仓库部署到 Vercel。
2) 在 Vercel 项目环境变量中配置 `UPSTREAM_*`。
3) 保持 `public/js/runtime-config.js` 中 `apiBaseUrl` 为空字符串（同源调用）。

## PDF 下载说明

- PDF 在浏览器侧生成，首次加载请等待字体资源加载完成。
- 若浏览器弹出下载拦截，请允许下载。

## 文档

- 设计文档：`docs/plans/2026-01-30-vercel-single-deploy-browser-pdf-design.md`
- 实施计划：`docs/plans/2026-01-30-vercel-single-deploy-browser-pdf-implementation-plan.md`
