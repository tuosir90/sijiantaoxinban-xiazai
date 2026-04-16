const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面包含四个模块表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("unified-ui.html"));
});

test("统一页面包含下载按钮与提交脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const js = fs.readFileSync("backend/app/templates/unified-ui.js", "utf-8");
  assert.ok(html.includes("下载PDF"));
  assert.ok(html.includes("/ui/unified-ui.css"));
  assert.ok(html.includes("/ui/unified-ui-form.js"));
  assert.ok(html.includes("/ui/unified-ui-helpers.js"));
  assert.ok(html.includes("/ui/unified-ui.js"));
  assert.ok(js.includes("/api/generate"));
});

test("统一页面不再内联大段样式和脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.equal(html.includes("<style>"), false);
  assert.equal(html.includes("const collectPayload ="), false);
});
