const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("通用入口包含必要控件与脚本", () => {
  const html = fs.readFileSync("public/index.html", "utf-8");
  assert.ok(html.includes('id="module"'));
  assert.ok(html.includes('id="payload-json"'));
  assert.ok(html.includes('id="btn-generate"'));
  assert.ok(html.includes("css/report-template.css"));
  assert.ok(html.includes("js/report-renderer.js"));
  assert.ok(html.includes("js/ui.js"));
});

test("通用入口脚本使用 ReportRenderer", () => {
  const code = fs.readFileSync("public/js/ui.js", "utf-8");
  assert.ok(code.includes("ReportRenderer"));
});
