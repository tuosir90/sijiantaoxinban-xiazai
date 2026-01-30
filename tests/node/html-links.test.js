const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("模块页引入 report-template 相关资源", () => {
  const html = fs.readFileSync("public/brand-analysis.html", "utf-8");
  assert.ok(html.includes("css/report-template.css"));
  assert.ok(html.includes("js/report-template.js"));
  assert.ok(html.includes("js/report-renderer.js"));
});
