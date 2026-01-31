const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("后端渲染入口包含表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("<form"));
  assert.ok(code.includes("payload_json"));
});
