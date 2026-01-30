const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("vercel.json 存在", () => {
  assert.equal(fs.existsSync("vercel.json"), true);
});
