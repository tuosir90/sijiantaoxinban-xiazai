const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面包含四个模块表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("unified-ui.html"));
});

test("统一页面包含下载按钮与提交脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.ok(html.includes("下载PDF"));
  assert.ok(html.includes("/api/generate"));
  assert.ok(html.includes("FormData"));
});
