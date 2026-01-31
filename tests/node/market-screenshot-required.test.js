const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("商圈调研截图为必选且不显示启用按钮", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.ok(!html.includes("enableScreenshotAnalysis"));
  assert.ok(html.includes("market-screenshot"));
  assert.ok(html.includes('name="screenshot"'));
  assert.ok(html.includes("required"));
});
