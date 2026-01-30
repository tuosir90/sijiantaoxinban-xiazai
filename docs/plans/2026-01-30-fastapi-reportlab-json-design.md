# 外卖四件套 FastAPI + ReportLab 结构化 JSON 报告设计

日期：2026-01-30

## 目标
- 使用 FastAPI 在 Vercel Serverless 部署，稳定生成 PDF 并可直接下载。
- 复刻参考 PDF 的版式（封面、目录、章节标题线、浅色信息块、表格、页脚）。
- 封面图片区域完全移除。
- 四个方案使用不同主题色（品牌/商圈/活动/数据）。
- 通过结构化 JSON 输出保证版式稳定性。

## 约束
- 必须在 Vercel Serverless 运行（不可依赖浏览器或 Playwright）。
- 仅依赖 ReportLab 进行 PDF 绘制。
- 中文字体使用内置字体（NotoSansSC），无图片依赖。
- 所有注释、文档、提示词、日志信息使用中文。

## 主题色
- 品牌定位：#9B5B2A
- 商圈调研：#2F6FBD
- 店铺活动：#E07A2F
- 数据统计：#6B5FB5

## 数据结构（模型输出）
采用结构化 JSON，后端使用 Pydantic 校验。

```json
{
  "cover": {
    "store_name": "吴家牛羊肉馆",
    "report_title": "店铺活动方案",
    "report_subtitle": "美团外卖营销策划方案",
    "business_line": "主营：快餐简餐 · 羊汤/牛肉汤",
    "period_text": "活动周期：2023年10月26日 - 2023年11月25日",
    "plan_date": "策划日期：2026年1月"
  },
  "sections": [
    {
      "title": "活动目标",
      "blocks": [
        { "type": "paragraph", "text": "..." },
        { "type": "highlight_cards", "items": [
          { "title": "短期目标（1-2周）", "text": "..." },
          { "title": "中期目标（1个月）", "text": "..." },
          { "title": "长期目标（3个月）", "text": "..." }
        ]}
      ]
    }
  ]
}
```

### block 类型
- `paragraph`: 正文段落
- `bullets`: 条目列表（文本数组）
- `table`: 表格（含表头与行）
- `highlight_cards`: 浅色信息块（多卡片）

目录由服务端根据 `sections` 自动生成，避免模型输出不稳定。

## 版式与渲染规则
- 纸张：A4 竖版。
- 封面：
  - 店铺名 36pt 居中
  - “店铺活动方案” 18pt 居中
  - 中部留白（图片区域移除）
  - 底部左对齐信息行（方案名/主营/周期/日期）
- 目录页：
  - 标题 + 主题色细横线
  - 浅色圆角盒 + 左侧竖色条
  - 列表项含点状引导与摘要
- 正文页：
  - 章节标题 22pt（序号 + 标题）+ 主题色横线
  - 正文 11pt，行距 1.5
  - 子章节（如 3.1）左侧竖线强调
  - 表格：表头主题色，隔行浅色填充
  - 信息块：浅色圆角 + 主题色左边框
- 页脚：居中页码
- 收尾页：追加“— 店铺 · 方案 —”与祝福语

## 后端流程
1. 接收前端请求（模块 + 门店信息 + 周期等）。
2. 组装提示词，要求模型输出固定 JSON。
3. 校验 JSON（Pydantic）。
4. 渲染 PDF 并直接返回二进制下载。

## 错误处理
- JSON 校验失败：触发一次“修复 JSON”重试。
- 重试失败：返回明确错误信息（缺失字段/类型错误）。
- 表格与段落换行超限：自动换行与分页处理。

## 测试
- JSON 结构校验测试（必填字段/类型）。
- 4 模块 PDF 生成测试（页数/关键文本校验）。
- 本地人工核对版式与色彩。

## 部署
- `api/index.py` 作为 FastAPI 入口。
- `vercel.json` rewrite 到 `/api/index.py`。
- 根目录 `requirements.txt` 包含 fastapi/reportlab/pydantic。
- 字体放在 `backend/assets/fonts`，通过环境变量或相对路径加载。
