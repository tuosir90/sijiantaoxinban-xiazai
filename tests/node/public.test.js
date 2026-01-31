const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("public/index.html 已移除以启用API入口", () => {
  assert.equal(fs.existsSync("public/index.html"), false);
});
