const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("public/index.html 存在", () => {
  assert.equal(fs.existsSync("public/index.html"), true);
});
