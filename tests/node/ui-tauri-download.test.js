const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("下载逻辑包含Tauri保存适配", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.ok(html.includes("__TAURI__"));
  assert.ok(html.includes("plugin:dialog|save"));
  assert.ok(html.includes("plugin:fs|write_file"));
});
