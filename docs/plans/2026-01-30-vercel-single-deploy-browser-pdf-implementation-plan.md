# Vercel 单体部署浏览器 PDF Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 Vercel 单体部署下，后端仅生成 Markdown，前端在浏览器渲染固定模板并直接下载 PDF。

**Architecture:** 使用 Node.js 无服务器函数(Serverless Function)调用上游接口并返回 Markdown + meta。前端静态页面加载模板样式与字体，浏览器端渲染模板并用 html2pdf.js 导出 PDF，保证与现有模板一致。

**Tech Stack:** Node.js Serverless Functions、Vercel、HTML/CSS/JavaScript、markdown-it、html2pdf.js

---

### Task 1: 添加 Node.js 测试骨架与环境变量读取工具

**Files:**
- Create: `package.json`
- Create: `api/_lib/env.js`
- Test: `tests/node/env.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { readEnv } = require("../../api/_lib/env");

test("readEnv 在缺失时返回默认值", () => {
  delete process.env.TEST_KEY;
  const value = readEnv("TEST_KEY", "fallback");
  assert.equal(value, "fallback");
});

test("readEnv 返回去空格后的字符串", () => {
  process.env.TEST_KEY = "  abc  ";
  const value = readEnv("TEST_KEY", "");
  assert.equal(value, "abc");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/env.test.js`
Expected: FAIL with "Cannot find module '../../api/_lib/env'"

**Step 3: Write minimal implementation**

```json
{
  "name": "sijiantaoxinban-xiazai",
  "private": true,
  "scripts": {
    "test": "node --test tests/node/*.test.js"
  }
}
```

```js
function readEnv(key, fallback = "", env = process.env) {
  const raw = env[key];
  if (raw === undefined || raw === null) return fallback;
  const value = String(raw).trim();
  return value ? value : fallback;
}

module.exports = { readEnv };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/env.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json api/_lib/env.js tests/node/env.test.js
git commit -m "chore: add node env helper and test harness"
```

---

### Task 2: 迁移提示词生成到 Node.js

**Files:**
- Create: `api/_lib/prompts.js`
- Test: `tests/node/prompts.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBrandPrompt, buildMarketPrompt } = require("../../api/_lib/prompts");

test("品牌提示词包含店铺信息段落", () => {
  const prompt = buildBrandPrompt({ storeName: "示例店", category: "火锅" });
  assert.ok(prompt.includes("## 店铺信息"));
  assert.ok(prompt.includes("店铺名称：示例店"));
});

test("商圈提示词包含截图分析开关说明", () => {
  const prompt = buildMarketPrompt({ enableScreenshotAnalysis: true });
  assert.ok(prompt.includes("截图分析：开启"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/prompts.test.js`
Expected: FAIL with "Cannot find module '../../api/_lib/prompts'"

**Step 3: Write minimal implementation**

```js
function buildBrandPrompt(payload = {}) {
  const storeName = (payload.storeName || "").trim();
  const category = (payload.category || "").trim();
  const address = (payload.address || "").trim();
  const targetGroup = (payload.targetGroup || "").trim();
  const priceRange = (payload.priceRange || "").trim();
  const mainProducts = (payload.mainProducts || "").trim();

  return (
    "请基于以下信息输出一份餐饮品牌定位分析报告。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 店铺地址：${address || "未提供"}\n` +
    `- 目标客群：${targetGroup || "未提供"}\n` +
    `- 人均价格：${priceRange || "未提供"}\n` +
    `- 主营产品：${mainProducts || "未提供"}\n\n` +
    "请重点给出：定位结论、差异化卖点、菜单结构建议、价格带建议、包装与品牌表达建议、" +
    "美团外卖运营建议（转化、复购、活动），并尽量用清晰的小标题和要点列表呈现。\n"
  );
}

function buildMarketPrompt(payload = {}) {
  const areaName = (payload.areaName || "").trim();
  const location = (payload.location || "").trim();
  const areaType = (payload.areaType || "").trim();
  const storeName = (payload.storeName || "").trim();
  const enableScreenshot = Boolean(payload.enableScreenshotAnalysis);
  const screenshotHint = enableScreenshot
    ? "会提供一张美团外卖竞品截图，请结合截图内容给出分析与建议。"
    : "不提供截图，仅根据文本信息分析。";

  return (
    "请输出一份商圈调研分析报告（面向外卖经营/选址/投放决策）。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 商圈信息\n" +
    `- 商圈名称：${areaName || "未提供"}\n` +
    `- 所在位置：${location || "未提供"}\n` +
    `- 商圈类型：${areaType || "未提供"}\n` +
    `- 拟开店/参考店铺：${storeName || "未提供"}\n` +
    `- 截图分析：${enableScreenshot ? "开启" : "关闭"}（${screenshotHint}）\n\n` +
    "请覆盖：客群画像、消费水平、餐饮业态、竞争强度、机会点与风险点、" +
    "针对美团外卖的具体动作（菜品结构、定价、活动、配送、评价与复购）。\n"
  );
}

function buildStoreActivityPrompt(payload = {}) {
  const storeName = (payload.storeName || payload["store-name"] || "").trim();
  const storeAddress = (payload.storeAddress || payload["store-address"] || "").trim();
  const category = (payload.businessCategory || payload["business-category"] || "").trim();
  const hours = (payload.businessHours || payload["business-hours"] || "").trim();
  const menuItems = payload.menuItems || "";
  let menuPreview = "";

  if (Array.isArray(menuItems)) {
    const lines = [];
    menuItems.slice(0, 30).forEach(item => {
      const name = (item.name || "").trim();
      const price = (item.price || "").trim();
      if (name) lines.push(`- ${name}（${price || "未标价"}）`);
    });
    if (lines.length) menuPreview = lines.join("\n");
  } else if (typeof menuItems === "string") {
    menuPreview = menuItems
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 30)
      .map(line => `- ${line}`)
      .join("\n");
  }

  return (
    "请基于以下信息输出一份“美团外卖店铺活动方案”。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 店铺地址：${storeAddress || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 营业时间：${hours || "未提供"}\n\n` +
    "## 菜品（节选）\n" +
    `${menuPreview || "- 未提供"}\n\n` +
    "请给出：满减/配送费/返券/秒杀/套餐搭配/好评返券等方案，" +
    "并包含执行时间、门槛、目标（转化/复购/评分）与注意事项。\n"
  );
}

function buildDataStatisticsPrompt(payload = {}) {
  const storeName = (payload.storeName || "").trim();
  const category = (payload.businessCategory || "").trim();
  const storeAddress = (payload.storeAddress || "").trim();
  const businessHours = (payload.businessHours || "").trim();

  const f = value => {
    if (value === null || value === undefined) return "未提供";
    if (typeof value === "string" && !value.trim()) return "未提供";
    return String(value);
  };

  return (
    "请基于以下30天运营数据，输出一份外卖店铺数据统计分析报告。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 店铺地址：${storeAddress || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 营业时间：${businessHours || "未提供"}\n\n` +
    "## 核心漏斗数据（30天）\n" +
    `- 曝光人数：${f(payload.exposureCount)}\n` +
    `- 入店人数：${f(payload.visitCount)}\n` +
    `- 下单人数：${f(payload.orderCount)}\n` +
    `- 入店转化率：${f(payload.visitConversion)}%\n` +
    `- 下单转化率：${f(payload.orderConversion)}%\n\n` +
    "## 配送服务设置\n" +
    `- 起送价：${f(payload.minOrderPrice)}\n` +
    `- 配送费：${f(payload.deliveryFee)}\n` +
    `- 配送范围：${f(payload.deliveryRange)}\n\n` +
    "## 店铺权重与服务开通\n" +
    `- 闲时出餐时长：${f(payload.idleCookingTime)}分钟\n` +
    `- 忙时出餐时长：${f(payload.busyCookingTime)}分钟\n` +
    `- 青山公益：${f(payload.greenCharity)}\n` +
    `- 到店自取：${f(payload.selfPickup)}\n` +
    `- 接受预订单：${f(payload.preOrder)}\n` +
    `- 准时宝：${f(payload.onTimeGuarantee)}\n` +
    `- 放心吃：${f(payload.foodSafety)}\n\n` +
    "请分析：漏斗问题定位、配送竞争力、店铺权重设置影响、" +
    "以及最重要的3-5条可执行优化动作（按优先级排序）。\n"
  );
}

function buildPrompt(module, payload) {
  switch (module) {
    case "brand":
      return buildBrandPrompt(payload);
    case "market":
      return buildMarketPrompt(payload);
    case "store-activity":
      return buildStoreActivityPrompt(payload);
    case "data-statistics":
      return buildDataStatisticsPrompt(payload);
    default:
      throw new Error(`不支持的module: ${module}`);
  }
}

module.exports = {
  buildBrandPrompt,
  buildMarketPrompt,
  buildStoreActivityPrompt,
  buildDataStatisticsPrompt,
  buildPrompt
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/prompts.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add api/_lib/prompts.js tests/node/prompts.test.js
git commit -m "feat: port prompt builders to node"
```

---

### Task 3: 迁移报告 meta 与主题配置

**Files:**
- Create: `api/_lib/meta.js`
- Test: `tests/node/meta.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMeta, MODULE_THEMES } = require("../../api/_lib/meta");

test("brand 模块标题包含品牌定位分析", () => {
  const meta = buildMeta("brand", { storeName: "示例店" });
  assert.ok(meta.title.includes("品牌定位分析报告"));
});

test("module 主题包含颜色字段", () => {
  assert.ok(MODULE_THEMES["market"].color);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/meta.test.js`
Expected: FAIL with "Cannot find module '../../api/_lib/meta'"

**Step 3: Write minimal implementation**

```js
const MODULE_THEMES = {
  "brand": { name: "品牌定位分析", color: "#3b82f6", dark: "#1e3a8a", tint: "#eff6ff" },
  "market": { name: "商圈调研分析", color: "#8b5cf6", dark: "#6d28d9", tint: "#f5f3ff" },
  "store-activity": { name: "店铺活动方案", color: "#f97316", dark: "#9a3412", tint: "#fff7ed" },
  "data-statistics": { name: "数据统计分析", color: "#667eea", dark: "#3730a3", tint: "#eef2ff" }
};

function buildMeta(module, payload = {}) {
  const theme = MODULE_THEMES[module] || { name: module };
  const storeName = String(payload.storeName || payload["store-name"] || "").trim();
  const areaName = String(payload.areaName || "").trim();
  const category = String(payload.category || payload.businessCategory || "").trim();

  let title = "";
  if (module === "market") {
    const base = areaName || storeName || theme.name;
    title = `${base} 商圈调研分析报告`;
  } else if (module === "store-activity") {
    const base = storeName || theme.name;
    title = `${base} 店铺活动方案`;
  } else if (module === "data-statistics") {
    const base = storeName || theme.name;
    title = `${base} 数据统计分析报告`;
  } else {
    const base = storeName || theme.name;
    title = `${base} 品牌定位分析报告`;
  }

  const subtitle = category || "呈尚策划 · 专业分析";
  return { title, subtitle };
}

function safeModule(module) {
  if (!MODULE_THEMES[module]) throw new Error(`不支持的module: ${module}`);
  return module;
}

module.exports = { MODULE_THEMES, buildMeta, safeModule };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/meta.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add api/_lib/meta.js tests/node/meta.test.js
git commit -m "feat: add report meta and themes"
```

---

### Task 4: 上游接口调用与 Markdown 清洗

**Files:**
- Create: `api/_lib/upstream.js`
- Test: `tests/node/upstream.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeMarkdown, looksLikeHtml } = require("../../api/_lib/upstream");

test("normalizeMarkdown 去除 ``` 包裹", () => {
  const text = "```markdown\\n# 标题\\n```";
  assert.equal(normalizeMarkdown(text), "# 标题");
});

test("looksLikeHtml 能识别常见 HTML 标签", () => {
  assert.equal(looksLikeHtml("<div><h1>hi</h1><p>x</p></div>"), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/upstream.test.js`
Expected: FAIL with "Cannot find module '../../api/_lib/upstream'"

**Step 3: Write minimal implementation**

```js
function normalizeMarkdown(text = "") {
  let s = String(text).trim();
  if (s.startsWith("```")) {
    const parts = s.split("```");
    if (parts.length >= 3) {
      s = parts.slice(1, -1).join("```").trim();
      if (s.startsWith("markdown\n") || s.startsWith("md\n")) {
        s = s.split("\n").slice(1).join("\n").trim();
      }
    }
  }
  return s.trim();
}

function looksLikeHtml(text = "") {
  const s = String(text || "").toLowerCase();
  const markers = ["<div", "</div", "<p", "</p", "<h1", "<h2", "<h3", "<ul", "<ol", "<li", "</li"];
  const hits = markers.filter(m => s.includes(m)).length;
  return hits >= 3;
}

async function requestChatCompletions(fetchFn, cfg, payload) {
  const res = await fetchFn(cfg.baseUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`上游接口返回错误: ${res.status} ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("上游接口返回格式异常（缺少choices/message/content）");
  return normalizeMarkdown(content);
}

function buildMessages(system, userPrompt, imageDataUrl) {
  if (imageDataUrl) {
    return [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ];
  }
  return [
    { role: "system", content: system },
    { role: "user", content: userPrompt }
  ];
}

module.exports = {
  normalizeMarkdown,
  looksLikeHtml,
  requestChatCompletions,
  buildMessages
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/upstream.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add api/_lib/upstream.js tests/node/upstream.test.js
git commit -m "feat: add upstream helpers"
```

---

### Task 5: 实现 Vercel API `POST /api/reports/generate`

**Files:**
- Create: `api/reports/generate.js`
- Create: `api/_lib/handler.js`
- Test: `tests/node/handler.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { handleGenerate } = require("../../api/_lib/handler");

test("handleGenerate 返回 markdown 与 meta", async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: "# 标题" } }] })
  });

  const res = await handleGenerate(
    {
      module: "brand",
      payload: { storeName: "示例店" },
      screenshotDataUrl: null
    },
    {
      env: { UPSTREAM_API_KEY: "k", UPSTREAM_BASE_URL: "https://x" },
      fetchFn: fakeFetch
    }
  );

  assert.equal(res.markdown, "# 标题");
  assert.ok(res.meta.title.includes("品牌定位分析报告"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/handler.test.js`
Expected: FAIL with "Cannot find module '../../api/_lib/handler'"

**Step 3: Write minimal implementation**

```js
const { readEnv } = require("./env");
const { buildPrompt } = require("./prompts");
const { buildMeta, safeModule } = require("./meta");
const { buildMessages, looksLikeHtml, requestChatCompletions } = require("./upstream");

async function handleGenerate(body, options = {}) {
  const env = options.env || process.env;
  const fetchFn = options.fetchFn || fetch;
  const module = safeModule(String(body.module || "").trim());
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const screenshotDataUrl = body.screenshotDataUrl || null;

  const apiKey = readEnv("UPSTREAM_API_KEY", "", env);
  const baseUrl = readEnv("UPSTREAM_BASE_URL", "https://jeniya.top/v1/chat/completions", env);
  if (!apiKey) throw new Error("未配置UPSTREAM_API_KEY，无法调用上游接口");

  const modelDefault = readEnv("UPSTREAM_MODEL_DEFAULT", "gemini-2.5-flash-lite", env);
  const modelBrand = readEnv("UPSTREAM_MODEL_BRAND", "", env);
  const modelMarket = readEnv("UPSTREAM_MODEL_MARKET", "", env);
  const modelStoreActivity = readEnv("UPSTREAM_MODEL_STORE_ACTIVITY", "", env);
  const modelDataStatistics = readEnv("UPSTREAM_MODEL_DATA_STATISTICS", "", env);

  let model = modelDefault;
  if (module === "brand" && modelBrand) model = modelBrand;
  if (module === "market" && modelMarket) model = modelMarket;
  if (module === "store-activity" && modelStoreActivity) model = modelStoreActivity;
  if (module === "data-statistics" && modelDataStatistics) model = modelDataStatistics;

  const system = "你是一位资深的餐饮外卖运营与市场分析专家。你的目标是输出清晰、可执行、可落地的建议。严格输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。";
  const prompt = buildPrompt(module, payload);
  const messages = buildMessages(system, prompt, module === "market" ? screenshotDataUrl : null);

  const payloadBody = {
    model,
    messages,
    temperature: 0.8,
    max_tokens: 16384,
    stream: false
  };

  let markdown = await requestChatCompletions(fetchFn, { baseUrl, apiKey }, payloadBody);
  if (looksLikeHtml(markdown)) {
    const repairPrompt = `请将下面内容转换为Markdown正文（只输出Markdown，不要HTML，不要```包裹全文），保持信息完整，不要添加额外内容：\n\n${markdown.slice(0, 12000)}`;
    const repairMessages = buildMessages("你是一位专业内容编辑，擅长将文本整理为结构清晰的Markdown。", repairPrompt, null);
    const repairBody = { ...payloadBody, messages: repairMessages, temperature: 0.2 };
    markdown = await requestChatCompletions(fetchFn, { baseUrl, apiKey }, repairBody);
  }

  const meta = buildMeta(module, payload);
  return {
    module,
    markdown,
    meta,
    screenshot_data_url: screenshotDataUrl,
    created_at: new Date().toISOString()
  };
}

module.exports = { handleGenerate };
```

```js
const { handleGenerate } = require("../_lib/handler");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "仅支持POST" }));
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  try {
    const data = await handleGenerate(body);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message || String(err) }));
  }
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/handler.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add api/_lib/handler.js api/reports/generate.js tests/node/handler.test.js
git commit -m "feat: add vercel generate api"
```

---

### Task 6: 迁移静态前端到 Vercel public 目录

**Files:**
- Create: `public/`（从 `frontend/` 拷贝）
- Modify: `README.md`
- Test: `tests/node/public.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("public/index.html 存在", () => {
  assert.equal(fs.existsSync("public/index.html"), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/public.test.js`
Expected: FAIL with "expected false to equal true"

**Step 3: Write minimal implementation**

```bash
# 复制静态资源到 public
robocopy frontend public /E
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/public.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public README.md tests/node/public.test.js
git commit -m "chore: move static site to public"
```

---

### Task 7: 前端模板渲染与 PDF 导出组件

**Files:**
- Create: `public/css/report-template.css`
- Create: `public/js/report-template.js`
- Create: `public/js/report-renderer.js`
- Create: `public/fonts/NotoSansSC-Regular.otf`
- Create: `public/fonts/NotoSansSC-Bold.otf`
- Test: `tests/node/report-template.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildReportHtml } = require("../../public/js/report-template");

test("模板生成包含 header 与 markdown 内容", () => {
  const html = buildReportHtml({
    module: "brand",
    title: "示例标题",
    subtitle: "示例副标题",
    dateText: "2026-01-30 12:00:00",
    screenshotDataUrl: null,
    contentHtml: "<h1>内容</h1>",
    rawMarkdown: "# 内容"
  });
  assert.ok(html.includes("class=\"header\""));
  assert.ok(html.includes("示例标题"));
  assert.ok(html.includes("<h1>内容</h1>"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/report-template.test.js`
Expected: FAIL with "Cannot find module '../../public/js/report-template'"

**Step 3: Write minimal implementation**

```bash
# 拷贝字体到静态目录
robocopy backend/assets/fonts public/fonts /E
```

```css
@font-face {
  font-family: "Noto Sans SC";
  font-style: normal;
  font-weight: 400;
  src: url("/fonts/NotoSansSC-Regular.otf") format("opentype");
  font-display: swap;
}

@font-face {
  font-family: "Noto Sans SC";
  font-style: normal;
  font-weight: 700;
  src: url("/fonts/NotoSansSC-Bold.otf") format("opentype");
  font-display: swap;
}

:root {
  --theme: #3b82f6;
  --theme-dark: #1e3a8a;
  --theme-tint: #eff6ff;
  --text: #111827;
  --muted: #6b7280;
  --bg: #ffffff;
  --card: #ffffff;
  --border: #e5e7eb;
  --shadow: 0 10px 30px rgba(17, 24, 39, 0.08);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
body { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif; line-height: 1.7; }

@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  details.raw-md { display: none !important; }
}

.page {
  width: 794px;
  margin: 0 auto;
  padding: 28px 28px 40px;
}

.header {
  background: linear-gradient(135deg, #111827 0%, var(--theme-dark) 55%, var(--theme) 100%);
  color: white;
  border-radius: 14px;
  padding: 22px 22px;
  margin-bottom: 18px;
  position: relative;
  overflow: hidden;
}
.header::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -60px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%);
}
.header .kicker {
  font-size: 12px;
  letter-spacing: 0.12em;
  opacity: 0.9;
  text-transform: uppercase;
}
.header .title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.header .title-row h1 {
  margin: 10px 0 6px;
  font-size: 26px;
  line-height: 1.3;
  flex: 1 1 auto;
  min-width: 0;
}
.header .brand-mark {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  white-space: nowrap;
}
.header .brand-mark .logo {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  line-height: 1;
}
.header .brand-mark .name {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.header .meta {
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.header .meta > div {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 16px;
  margin-bottom: 14px;
  box-shadow: var(--shadow);
}
.card h2 {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--theme);
}

.screenshot {
  display: flex;
  justify-content: center;
  padding: 10px 10px;
}
.screenshot img {
  max-width: 100%;
  max-height: 720px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: white;
}

.md h1, .md h2, .md h3 { line-height: 1.35; }
.md h1 {
  font-size: 22px;
  margin: 18px 0 12px;
  color: var(--theme-dark);
  padding-bottom: 10px;
  border-bottom: 3px solid var(--theme);
}
.md h2 {
  font-size: 16px;
  margin: 18px 0 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border-left: 4px solid var(--theme);
  background: var(--theme-tint);
  color: var(--theme-dark);
  border: 1px solid var(--border);
}
.md h3 { font-size: 14px; margin: 14px 0 8px; color: var(--theme-dark); }
.md p { margin: 8px 0; color: #111827; }
.md ul, .md ol { margin: 8px 0 8px 20px; padding: 0; }
.md li { margin: 4px 0; }
.md blockquote {
  margin: 10px 0;
  padding: 10px 12px;
  border-left: 4px solid var(--theme);
  background: var(--theme-tint);
  border-radius: 10px;
  color: #374151;
}
.md strong, .md b { color: var(--theme-dark); }
.md table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: white;
  margin: 10px 0;
}
.md th, .md td { padding: 10px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
.md th {
  text-align: left;
  background: linear-gradient(135deg, var(--theme), var(--theme-dark));
  color: white;
  font-weight: 700;
}
.md tr:last-child td { border-bottom: none; }

.raw-md summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}
.raw-md pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
  background: #0b1020;
  color: #dbeafe;
  padding: 12px 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}
```

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ReportTemplate = factory();
  }
})(this, function () {
  const MODULE_THEMES = {
    "brand": { name: "品牌定位分析", color: "#3b82f6", dark: "#1e3a8a", tint: "#eff6ff" },
    "market": { name: "商圈调研分析", color: "#8b5cf6", dark: "#6d28d9", tint: "#f5f3ff" },
    "store-activity": { name: "店铺活动方案", color: "#f97316", dark: "#9a3412", tint: "#fff7ed" },
    "data-statistics": { name: "数据统计分析", color: "#667eea", dark: "#3730a3", tint: "#eef2ff" }
  };

  function buildReportHtml(options) {
    const theme = MODULE_THEMES[options.module] || MODULE_THEMES.brand;
    const styleVars = `--theme:${theme.color};--theme-dark:${theme.dark};--theme-tint:${theme.tint};`;
    const screenshot = options.screenshotDataUrl
      ? `<div class="card"><h2>截图</h2><div class="screenshot"><img src="${options.screenshotDataUrl}" alt="截图" /></div></div>`
      : "";

    return `
      <div class="page" style="${styleVars}">
        <div class="header">
          <div class="kicker">${theme.name}</div>
          <div class="title-row">
            <h1>${options.title || theme.name}</h1>
            <div class="brand-mark"><span class="logo">呈</span><span class="name">呈尚策划</span></div>
          </div>
          <div class="meta">
            ${options.subtitle ? `<div>${options.subtitle}</div>` : ""}
            ${options.dateText ? `<div>调研时间：${options.dateText}</div>` : ""}
          </div>
        </div>
        ${screenshot}
        <div class="card md">${options.contentHtml || ""}</div>
        <details class="card raw-md"><summary>查看原始 Markdown（用于复制）</summary><pre>${options.rawMarkdown || ""}</pre></details>
      </div>
    `;
  }

  return { MODULE_THEMES, buildReportHtml };
});
```

```js
(function () {
  function ensureLib(name) {
    if (!window[name]) throw new Error(`缺少依赖库：${name}`);
  }

  async function renderReport({ module, markdown, meta, screenshotDataUrl, createdAt }, container) {
    ensureLib("markdownit");
    const md = window.markdownit({ html: false, linkify: true, typographer: true }).enable("table").enable("strikethrough");
    const contentHtml = md.render(markdown || "");
    const dateText = (createdAt || "").replace("T", " ").slice(0, 19);
    const html = window.ReportTemplate.buildReportHtml({
      module,
      title: meta?.title || "",
      subtitle: meta?.subtitle || "",
      dateText,
      screenshotDataUrl,
      contentHtml,
      rawMarkdown: markdown || ""
    });
    container.innerHTML = html;
  }

  async function downloadPdf(container, filename) {
    ensureLib("html2pdf");
    await document.fonts.ready;
    return window.html2pdf().from(container).set({
      margin: [10, 10, 10, 10],
      filename: filename || "report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).save();
  }

  window.ReportRenderer = { renderReport, downloadPdf };
})();
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/report-template.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public/css/report-template.css public/js/report-template.js public/js/report-renderer.js tests/node/report-template.test.js
git commit -m "feat: add browser report template renderer"
```

---

### Task 8: 前端 API 调用与截图压缩

**Files:**
- Modify: `public/js/api.js`
- Create: `public/js/screenshot.js`
- Test: `tests/node/api-utils.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildApiUrl } = require("../../public/js/api");

test("buildApiUrl 能拼接相对路径", () => {
  assert.equal(buildApiUrl("/api/reports/generate"), "/api/reports/generate");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/api-utils.test.js`
Expected: FAIL with "Cannot find module '../../public/js/api'"

**Step 3: Write minimal implementation**

```js
function buildApiUrl(path) {
  if (!path) return "";
  const root = typeof window !== "undefined" ? window : {};
  const base = (root.APP_CONFIG && root.APP_CONFIG.apiBaseUrl) || "";
  const trimmed = String(base).replace(/\/+$/, "");
  if (!trimmed) return path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function generateReport({ module, payload, screenshotDataUrl }) {
  const res = await fetch(buildApiUrl("/api/reports/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      module,
      payload: payload || {},
      screenshotDataUrl: screenshotDataUrl || null
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  return data;
}

if (typeof module === "object" && module.exports) {
  module.exports = { buildApiUrl, generateReport };
} else {
  window.buildApiUrl = buildApiUrl;
  window.generateReport = generateReport;
}
```

```js
function compressImageToDataUrl(file, options = {}) {
  const maxWidth = options.maxWidth || 1280;
  const maxSizeBytes = options.maxSizeBytes || 800000;
  const minQuality = options.minQuality || 0.6;

  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > maxSizeBytes * 1.37 && quality > minQuality) {
          quality -= 0.05;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

if (typeof module === "object" && module.exports) {
  module.exports = { compressImageToDataUrl };
} else {
  window.compressImageToDataUrl = compressImageToDataUrl;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/api-utils.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public/js/api.js public/js/screenshot.js tests/node/api-utils.test.js
git commit -m "feat: update api client for vercel json payload"
```

---

### Task 9: 更新页面依赖与运行时配置

**Files:**
- Modify: `public/brand-analysis.html`
- Modify: `public/market-research.html`
- Modify: `public/store-activity.html`
- Modify: `public/data-statistics.html`
- Modify: `public/js/runtime-config.js`
- Test: `tests/node/html-links.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("模块页引入 report-template 相关资源", () => {
  const html = fs.readFileSync("public/brand-analysis.html", "utf-8");
  assert.ok(html.includes("css/report-template.css"));
  assert.ok(html.includes("js/report-template.js"));
  assert.ok(html.includes("js/report-renderer.js"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/html-links.test.js`
Expected: FAIL with "expected false to be truthy"

**Step 3: Write minimal implementation**

```html
<!-- 在各模块页 head 中新增模板样式 -->
<link rel="stylesheet" href="css/report-template.css">

<!-- 在各模块页底部新增依赖 -->
<script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"></script>
<script src="js/report-template.js"></script>
<script src="js/report-renderer.js"></script>
<script src="js/screenshot.js"></script>
```

```html
<!-- 移除对 /api/check-screenshot-app 与 /api/launch-screenshot 的依赖，改为纯前端提示 -->
<script>
  function showScreenshotGuide() {
    alert("当前为在线环境，请使用系统截图工具手动截取报告");
  }
  const btn = document.getElementById("brand-screenshot-btn");
  if (btn) btn.addEventListener("click", showScreenshotGuide);
</script>
```

```js
window.APP_CONFIG = {
  apiBaseUrl: ""
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/html-links.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public/brand-analysis.html public/market-research.html public/store-activity.html public/data-statistics.html public/js/runtime-config.js tests/node/html-links.test.js
git commit -m "chore: load report template libs in pages"
```

---

### Task 10: 更新各模块页面调用链（预览 + 下载）

**Files:**
- Modify: `public/js/pages/common.js`
- Modify: `public/js/pages/brand-analysis.js`
- Modify: `public/js/pages/market-research.js`
- Modify: `public/js/pages/store-activity.js`
- Modify: `public/js/pages/data-statistics.js`
- Test: `tests/node/pages-smoke.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("模块页面脚本存在", () => {
  assert.equal(fs.existsSync("public/js/pages/brand-analysis.js"), true);
  assert.equal(fs.existsSync("public/js/pages/market-research.js"), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/pages-smoke.test.js`
Expected: FAIL with "expected false to equal true"（如果尚未迁移 public）

**Step 3: Write minimal implementation**

```js
// common.js 新增辅助
window.LegacyUi = {
  ...window.LegacyUi,
  mountReport(container, reportData) {
    return window.ReportRenderer.renderReport(reportData, container);
  }
};
```

```js
// brand-analysis.js 生成后直接渲染与下载
const data = await generateReport({ module: "brand", payload, screenshotDataUrl: null });
await window.LegacyUi.mountReport(reportContainer, data);
downloadBtn.disabled = false;
downloadBtn.onclick = async () => {
  await window.ReportRenderer.downloadPdf(reportContainer, `${payload.storeName}_品牌定位分析.pdf`);
};
```

```js
// market-research.js 上传截图改为 dataURL
const screenshotDataUrl = enable ? await window.compressImageToDataUrl(currentScreenshotFile) : null;
const data = await generateReport({ module: "market", payload, screenshotDataUrl });
await window.LegacyUi.mountReport(reportContainer, data);
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/pages-smoke.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add public/js/pages/common.js public/js/pages/brand-analysis.js public/js/pages/market-research.js public/js/pages/store-activity.js public/js/pages/data-statistics.js tests/node/pages-smoke.test.js
git commit -m "feat: switch pages to browser report render and pdf"
```

---

### Task 11: Vercel 配置与文档更新

**Files:**
- Create: `vercel.json`
- Modify: `README.md`
- Test: `tests/node/vercel-config.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("vercel.json 存在", () => {
  assert.equal(fs.existsSync("vercel.json"), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/node/vercel-config.test.js`
Expected: FAIL with "expected false to equal true"

**Step 3: Write minimal implementation**

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/node/vercel-config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add vercel.json README.md tests/node/vercel-config.test.js
git commit -m "docs: update vercel single deploy guide"
```

---

## 验证清单（手动）

1. 运行 `node --test tests/node/*.test.js` 全部通过
2. 本地用静态服务器打开 `public/index.html`，生成报告预览正常
3. 点击“下载PDF”可直接下载且模板一致
4. 在 Vercel 配置环境变量后部署成功，API 返回正常
