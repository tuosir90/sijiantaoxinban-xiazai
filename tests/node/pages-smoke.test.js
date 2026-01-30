const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("公共脚本提供 mountReport", () => {
  const code = fs.readFileSync("public/js/pages/common.js", "utf-8");
  assert.ok(code.includes("mountReport"));
});

test("品牌页面使用 ReportRenderer 下载", () => {
  const code = fs.readFileSync("public/js/pages/brand-analysis.js", "utf-8");
  assert.ok(code.includes("ReportRenderer"));
});
