const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("商圈截图不启用粘贴上传", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.ok(!html.includes("handleScreenshotPaste"));
  assert.ok(!html.includes("DataTransfer"));
  assert.ok(!html.includes("paste"));
});
