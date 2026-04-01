const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("首页包含四个方案模块", () => {
  const code = fs.readFileSync("app/page.tsx", "utf-8");

  assert.ok(code.includes("品牌定位分析"));
  assert.ok(code.includes("商圈调研分析"));
  assert.ok(code.includes("店铺活动方案"));
  assert.ok(code.includes("数据统计分析"));
});
