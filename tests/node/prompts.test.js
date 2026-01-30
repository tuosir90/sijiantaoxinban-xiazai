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
