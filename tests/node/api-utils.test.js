const test = require("node:test");
const assert = require("node:assert/strict");
const { buildApiUrl } = require("../../public/js/api");

test("buildApiUrl 能拼接相对路径", () => {
  assert.equal(buildApiUrl("/api/reports/generate"), "/api/reports/generate");
});
