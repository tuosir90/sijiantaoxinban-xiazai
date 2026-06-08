const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面顶部只提供线路1和线路2，且默认选中线路1", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const css = fs.readFileSync("backend/app/templates/unified-ui.css", "utf-8");
  assert.ok(html.includes("线路 1"));
  assert.ok(html.includes("线路 2"));
  assert.equal(html.includes("线路 3"), false);
  assert.ok(html.includes("云雾 AI"));
  assert.ok(html.includes("向量引擎"));
  assert.equal(html.includes("128API"), false);
  assert.ok(html.includes("line-option-copy"));
  assert.ok(html.includes("line-option-name"));
  assert.ok(html.includes("line-option-emblem"));
  assert.ok(html.includes("line-option-check"));
  assert.match(html, /value="line1"[\s\S]*checked/);
  assert.ok(html.includes("line-option-line1"));
  assert.ok(html.includes("line-option-line2"));
  assert.equal(html.includes("line-option-line3"), false);
  assert.ok(css.includes(".line-option-copy"));
  assert.ok(css.includes(".line-option-name"));
  assert.ok(css.includes(".line-option-emblem"));
  assert.ok(css.includes(".line-option-check"));
  assert.ok(css.includes(".line-option-line1"));
  assert.ok(css.includes(".line-option-line2"));
  assert.equal(css.includes(".line-option-line3"), false);
});
