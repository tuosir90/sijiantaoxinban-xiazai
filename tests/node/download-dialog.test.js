const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("下载能力包含确认弹窗组件", () => {
  assert.equal(fs.existsSync("components/download-confirm-dialog.tsx"), true);

  const code = fs.readFileSync("components/download-confirm-dialog.tsx", "utf-8");
  assert.ok(code.includes("确认下载"));
  assert.ok(code.includes("立即下载"));
});

test("下载能力保留 Tauri 保存对话框", () => {
  assert.equal(fs.existsSync("lib/download.ts"), true);

  const code = fs.readFileSync("lib/download.ts", "utf-8");
  assert.ok(code.includes("plugin:dialog|save"));
});
