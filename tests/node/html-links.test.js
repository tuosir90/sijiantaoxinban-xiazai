const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("品牌静态页已移除以启用API入口", () => {
  assert.equal(fs.existsSync("public/brand-analysis.html"), false);
});
