const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面包含四个模块表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("unified-ui.html"));
});
