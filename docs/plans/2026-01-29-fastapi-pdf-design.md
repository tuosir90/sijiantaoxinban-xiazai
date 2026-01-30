# FastAPI 后端：表单 → 纯 Markdown → 固定模板 → 长页 PDF（设计文档）

## 1. 背景与现状复盘

当前项目由 4 个独立模块组成：品牌定位分析、商圈调研分析、店铺活动方案、数据统计分析。每个模块基本遵循同一条流程链路：用户在页面填写表单 → 前端组装提示词(Prompt Template) → 通过 `/api/chat/completions` 调用上游接口 → 返回内容为 **HTML 片段** → 前端渲染成报告并持久化到浏览器本地存储(LocalStorage)。PDF 导出方面，现有代码同时存在三套路径：① 前端 `html2pdf.js` 生成；② 本地 Node 代理服务器用 Puppeteer 生成（`proxy-server.js` 的 `/api/generate-pdf`）；③ Vercel Serverless Function 用 `@sparticuz/chromium + puppeteer-core` 生成（`api/generate-pdf.js`）。为规避 Serverless 资源限制，前端 `js/pdf-service.js` 在“云端环境”会直接降级使用前端生成器，导致“在 Vercel 上无法稳定服务端直出 PDF”的体验问题。

> 本次重构目标不再是“把 HTML 变 PDF”，而是把“报告的文本内容”统一收敛成 **Markdown**，再由后端用固定模板渲染为 PDF，彻底摆脱 Vercel Serverless 限制。

## 2. 最终需求（已确认）

1. 采用 **方案 C：全后端化**（前端只提交表单/截图、预览、下载）。
2. AI 输出为**纯 Markdown 文本**（不要求固定章节结构，允许自由发挥）。
3. PDF 使用**固定美化排版样式**，并且是 **长页不分页**（整篇一张长页）。
4. 商圈调研模块保留**截图上传 + 截图分析**，并且 **PDF 中展示截图**。
5. 前端先预览后下载（“生成 → 预览 → 下载 PDF”）。
6. 同时支持**无状态**与**有状态**两种“预览/下载”传递方式（默认可用有状态，另外提供无状态接口）。
7. PDF 版式统一，但按模块配色（品牌蓝/商圈紫/活动橙/统计靛紫）。
8. 上游接口沿用当前项目的 OpenAI 兼容接口（`/v1/chat/completions`，支持 `image_url` 多模态）。

## 3. 四模块“完整流程”拆解（当前实现，作为迁移参考）

> 下面按“前端模块结构 + 数据流”描述，便于迁移时保持行为一致（尤其是输入字段、截图处理与提示词语义）。

### 3.1 品牌定位分析（brand-analysis）

- 入口：`brand-analysis.html`
- JS 分层：`js/app.js`（流程控制）→ `js/form-handler.js`（校验/采集）→ `js/content-generator.js`（提示词/解析）→ `js/api-client.js`（调用 `/api/chat/completions`）→ `js/report-renderer.js`（渲染与历史记录）
- 关键点：提示词模板输出严格 HTML；报告渲染直接插入 HTML。

### 3.2 商圈调研分析（market-research）

- 入口：`market-research.html`
- JS 分层：`js/market-*.js` 一组文件（同模式）
- 关键点：支持截图上传；`js/market-api-client.js` 使用 `image_url` 的 `data:image/jpeg;base64,...` 做多模态请求；并包含压缩/降质逻辑。
- 图表：现有实现依赖 Chart.js + canvas（新架构不做前端绘图，改为 Markdown 表格/列表 + 固定模板排版）。

### 3.3 店铺活动方案（store-activity）

- 入口：`store-activity.html`
- 技术栈：Tailwind CSS + DaisyUI；`js/store-activity-*.js` 一组文件
- 关键点：提示词模板输出 HTML（活动卡片/列表）。

### 3.4 数据统计分析（data-statistics）

- 入口：`data-statistics.html`
- 技术栈：Tailwind CSS + DaisyUI；`js/data-statistics-*.js` 一组文件
- 关键点：提示词模板输出 HTML（表格 + 建议 + 可视化容器）。

## 4. 新架构总览（方案 C：后端一体化）

### 4.1 前端职责

1. 收集表单数据与（可选）截图文件。
2. 调用后端 `POST /api/reports/generate` 获取 Markdown（以及 report_id）。
3. 预览：优先使用后端渲染的预览 HTML（保证与 PDF 模板一致），同时保留“显示原始 Markdown”的开关方便复制。
4. 下载：使用后端 PDF 直出接口下载保存。

### 4.2 后端职责（FastAPI）

1. 接收表单 + 截图（multipart/form-data）。
2. 调用上游 OpenAI 兼容 `/v1/chat/completions`：
   - 文本模块：纯文本消息
   - 商圈模块：文本 + `image_url`（截图 base64 dataURL）
3. 规范化返回：清洗响应（去掉 ```、去掉多余前缀），确保输出为纯 Markdown 文本。
4. 报告存储（有状态模式）：保存 `markdown + module + meta + screenshot(base64) + created_at`，设置 TTL。
5. 预览渲染：Markdown → HTML（禁用 Markdown 原生 HTML）→ Jinja2 固定模板（按模块配色）→ 返回可直接嵌入的预览页。
6. PDF 渲染：使用 Playwright 渲染预览 HTML，计算内容高度，输出“长页不分页 PDF”，并返回 `application/pdf` 下载。

## 5. API 设计（同时支持有状态/无状态）

### 5.1 有状态（推荐路径）

- `POST /api/reports/generate`
  - 入参：`module` + 表单字段 + `screenshot`(可选文件)
  - 出参：`report_id`、`markdown`、`preview_url`、`pdf_url`、`expires_at`

- `GET /api/reports/{report_id}`
  - 出参：`markdown`、`module`、`meta`、`assets`（截图 base64 可选）

- `GET /api/reports/{report_id}/preview`
  - 出参：`text/html`（使用固定模板渲染的预览页）

- `GET /api/reports/{report_id}/pdf`
  - 出参：`application/pdf`（长页 PDF，带 `Content-Disposition`）

### 5.2 无状态（兜底/兼容）

- `POST /api/reports/preview`
  - 入参：`module`、`markdown`、`meta`、`screenshot_base64`(可选)
  - 出参：`text/html`

- `POST /api/reports/pdf`
  - 入参：`module`、`markdown`、`meta`、`screenshot_base64`(可选)
  - 出参：`application/pdf`

## 6. Markdown 输出规范（尽量宽松，但要可渲染）

虽然不要求固定结构，但为保证预览与 PDF 的排版效果，后端会在 system prompt 中加入最低限度的输出约束：

1. 只输出 Markdown 正文，不要使用 ``` 代码块包裹全文
2. 不要输出 HTML 标签（后端会禁用 Markdown 原生 HTML）
3. 如果需要表格，请使用 Markdown 表格语法
4. 可以自由使用 `#`/`##`/列表/引用/加粗等

## 7. PDF 固定模板（长页、不分页、模块配色）

### 7.1 视觉结构（建议）

- 顶部：模块标题 + 店铺/商圈名称 + 日期
- 如果有截图：截图区（自适应宽度，限制最大高度，下面可加“截图要点”）
- 正文：Markdown 渲染后的 HTML（统一字体、行距、间距、表格样式）
- 页脚：可选（长页模式通常不强调页码）

### 7.2 技术实现要点

- 字体：后端读取 Noto Sans SC OTF，转 base64 内嵌 `@font-face`
- 资源自包含：避免依赖 CDN；截图与图标尽量使用 dataURL 或内嵌 SVG
- 长页 PDF：Playwright 渲染后 `evaluate` 获取 `document.documentElement.scrollHeight`，将 `page.pdf(height=...)` 设置为该高度 + 余量

### 7.3 模块主题色（建议沿用旧版）

- 品牌定位分析：`#3b82f6`
- 商圈调研分析：`#8b5cf6`
- 店铺活动方案：`#f97316`
- 数据统计分析：`#667eea`

## 8. 存储与过期策略（有状态模式）

MVP：单实例内存 TTL 存储（例如 `report_id -> Report`，默认 24 小时过期）。

后续可选：接入 Redis 以支持多实例/横向扩展。

## 9. 风险与边界

- Playwright/Chromium 体积较大，部署推荐使用 Docker（Playwright 官方镜像最稳）。
- 上游多模态请求对图片大小敏感：后端需压缩/缩放截图（Pillow），避免请求体过大。
- Markdown 自由输出可能导致排版不一致：通过模板与 CSS 做兜底（例如段落/列表/表格的统一样式）。
