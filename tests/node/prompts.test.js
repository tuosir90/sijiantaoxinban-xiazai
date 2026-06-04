const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildBrandPrompt,
  buildDataStatisticsPrompt,
  buildMarketPrompt
} = require("../../api/_lib/prompts");

test("品牌提示词包含店铺信息段落", () => {
  const prompt = buildBrandPrompt({ storeName: "示例店", category: "火锅" });
  assert.ok(prompt.includes("## 店铺信息"));
  assert.ok(prompt.includes("店铺名称：示例店"));
});

test("商圈提示词包含截图分析开关说明", () => {
  const prompt = buildMarketPrompt({ enableScreenshotAnalysis: true });
  assert.ok(prompt.includes("截图分析：开启"));
});

test("数据统计提示词不包含配送服务字段", () => {
  const prompt = buildDataStatisticsPrompt({
    storeName: "示例店",
    exposureCount: 1000,
    visitCount: 100,
    orderCount: 30
  });
  assert.equal(prompt.includes("起送价"), false);
  assert.equal(prompt.includes("配送费"), false);
  assert.equal(prompt.includes("配送范围"), false);
});
