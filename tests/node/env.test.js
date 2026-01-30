const test = require("node:test");
const assert = require("node:assert/strict");
const { readEnv } = require("../../api/_lib/env");

test("readEnv 在缺失时返回默认值", () => {
  delete process.env.TEST_KEY;
  const value = readEnv("TEST_KEY", "fallback");
  assert.equal(value, "fallback");
});

test("readEnv 返回去空格后的字符串", () => {
  process.env.TEST_KEY = "  abc  ";
  const value = readEnv("TEST_KEY", "");
  assert.equal(value, "abc");
});
