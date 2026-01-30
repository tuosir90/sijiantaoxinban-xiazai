# Vercel 单体部署 + 前端 PDF 方案设计

## 1. 背景与目标

本项目希望实现“前后端同域部署、点击即可下载 PDF”的闭环体验，并在 Vercel(Vercel) 上稳定运行。现有后端使用 FastAPI(FastAPI) 与浏览器自动化(Playwright) 渲染 PDF，部署到 Vercel 的无服务器函数(Serverless Function)环境存在兼容性与稳定性风险。因此本方案改为：后端仅负责调用上游接口返回标记语言(Markdown)，前端在浏览器完成模板渲染与 PDF 导出。

### 目标
- 前后端同一 Vercel 项目部署
- 点击按钮即可下载可移植文档格式(PDF)
- 视觉模板与现有固定模板保持一致
- 不暴露上游接口密钥

### 非目标
- 不在 Vercel 上运行 Playwright/Chromium(Chromium)
- 不引入数据库持久化存储

## 2. 约束与前提

- Vercel 运行环境以无服务器函数(Serverless Function)为主，不适合运行浏览器自动化(Playwright)
- 前端运行在浏览器，需要确保字体与图片加载完成后再生成 PDF
- 上游接口密钥必须只存在于后端环境变量

## 3. 方案比较与选择

### 方案 A（推荐）：Vercel 单体部署 + 前端 PDF
- 后端改为 Node.js(Node.js) 无服务器函数，负责调用上游接口并返回 Markdown 与元信息
- 前端用超文本标记语言(HTML)/层叠样式表(CSS)/JavaScript(JavaScript) 还原模板并在浏览器内导出 PDF
- 优点：符合 Vercel 单体部署；无需浏览器自动化；部署简单
- 缺点：需要迁移后端逻辑到 Node.js；PDF 质量依赖浏览器渲染

### 方案 B：继续使用 FastAPI 的 Vercel Python Function
- 优点：改动较少
- 缺点：Vercel 对 Python ASGI 支持有限，且 PDF 渲染依赖 Playwright，稳定性差

### 方案 C：纯前端直连上游接口
- 优点：改动最少
- 缺点：密钥暴露，不可接受

最终选择：方案 A

## 4. 目标架构

### 部署结构
- `frontend/`：静态页面与脚本
- `api/`：Node.js 无服务器函数，负责上游接口调用
- `public/`：字体与静态资源（供前端模板引用）

### 运行时职责
- 后端(Backend)：接收表单与截图、构造提示词、请求上游接口、返回 Markdown 与 meta
- 前端(Frontend)：渲染模板、生成预览、导出 PDF

## 5. 模块与职责

### 后端 API（Node.js）
- `POST /api/reports/generate`
  - 参数：`module`、`payload`、`screenshot`(可选)
  - 行为：构造提示词、调用上游 OpenAI 兼容接口、返回 `{ markdown, meta, module, screenshot_data_url }`
  - 说明：截图在前端压缩为 dataURL 后传入

### 前端渲染
- Markdown 渲染：使用 `markdown-it`（浏览器版）
- 模板渲染：把现有 `report.html.j2` 改为前端模板函数
- PDF 导出：使用 `html2pdf.js(html2pdf.js)`（内部依赖 `html2canvas` 与 `jsPDF`）

## 6. 数据流

1. 用户填写表单并选择截图
2. 前端压缩截图，构造 `payload`
3. 调用 `POST /api/reports/generate`
4. 后端调用上游模型，返回 Markdown 与 meta
5. 前端将 Markdown 渲染为 HTML
6. 前端注入固定模板 HTML + CSS
7. 等待字体与图片加载完成
8. 前端生成并下载 PDF

## 7. 关键设计细节

### 7.1 模板一致性
- 复用 `report.html.j2` 的 HTML 结构与 CSS
- 将 `MODULE_THEMES` 配色与标题规则迁移到前端
- 标题规则保持与后端一致（品牌/商圈/活动/统计）

### 7.2 字体与资源
- 字体文件放入 `public/fonts/`
- CSS 中通过 `@font-face` 引用本地字体
- PDF 生成前等待 `document.fonts.ready`

### 7.3 PDF 导出参数
- 纸张宽度按 210mm
- 渲染比例提高（如 `scale: 2`），保证清晰度
- 自动根据内容高度生成长页

## 8. 错误处理与降级

- 上游接口失败：前端展示错误并保留表单内容
- 截图过大：前端拦截并提示用户压缩
- PDF 生成失败：提示用户重试，并提供“浏览器另存为 PDF”降级路径

## 9. 测试策略

- 后端单元测试(Unit Test)：参数校验、上游请求格式、错误码
- 前端功能测试：Markdown 渲染、模板渲染、PDF 生成
- 端到端测试(E2E)：完整流程生成并下载 PDF

## 10. 风险与缓解

- 浏览器兼容性：优先在 Chrome/Edge 测试
- PDF 质量波动：调整渲染比例与字体加载时机
- 大图片性能：前端压缩并限制尺寸

## 11. 下一步

- 将后端逻辑迁移为 Node.js Serverless Function
- 把 Jinja2 模板转换为前端模板
- 替换前端“下载 PDF”逻辑为浏览器生成
