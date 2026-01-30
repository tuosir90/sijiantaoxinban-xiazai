# 前端（静态）

本目录用于放置重构后的前端静态页面与资源：

- 四个模块页面（品牌/商圈/活动/统计）
- 预览（iframe 加载后端预览 HTML）
- 下载（调用后端 PDF 直出接口）

目标是：前端可以继续部署在 Vercel 等静态托管；PDF 生成不依赖 Serverless。

## 配置

编辑 `js/runtime-config.js`：

- `apiBaseUrl`: 指向你的 FastAPI 后端，例如：
  - 本地：`http://localhost:8000`
  - 生产：`https://api.example.com`
