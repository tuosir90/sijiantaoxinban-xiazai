const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("首页使用统一四模块排版与旧版文案方向一致", () => {
  const code = fs.readFileSync("app/page.tsx", "utf-8");

  assert.ok(code.includes("外卖店铺四件套一页生成台"));
  assert.ok(code.includes("一页填写四份方案"));
  assert.ok(code.includes("BrandSection"));
  assert.ok(code.includes("MarketSection"));
  assert.ok(code.includes("ActivitySection"));
  assert.ok(code.includes("StatisticsSection"));
});
