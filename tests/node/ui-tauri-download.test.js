const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("下载逻辑包含Tauri保存适配", () => {
  const js = fs.readFileSync("backend/app/templates/unified-ui-helpers.js", "utf-8");
  assert.ok(js.includes("__TAURI__"));
  assert.ok(js.includes("plugin:dialog|save"));
  assert.ok(js.includes("plugin:fs|write_file"));
});
