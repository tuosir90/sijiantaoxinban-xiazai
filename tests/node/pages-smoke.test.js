const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("API入口文件存在", () => {
  assert.equal(fs.existsSync("api/index.py"), true);
});

test("后端入口包含生成接口", () => {
  const code = fs.readFileSync("api/index.py", "utf-8");
  assert.ok(code.includes("/api/generate"));
});
