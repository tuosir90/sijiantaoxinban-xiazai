const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面顶部提供线路1和线路2切换，且默认选中线路1", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const css = fs.readFileSync("backend/app/templates/unified-ui.css", "utf-8");
  assert.ok(html.includes("线路1"));
  assert.ok(html.includes("线路2"));
  assert.match(html, /value="line1"[\s\S]*checked/);
  assert.ok(html.includes("line-option-line1"));
  assert.ok(html.includes("line-option-line2"));
  assert.ok(css.includes(".line-option-line1"));
  assert.ok(css.includes(".line-option-line2"));
});
