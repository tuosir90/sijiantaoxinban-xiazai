const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("报告下载能力通过统一客户端封装访问 /api/generate", () => {
  const code = fs.readFileSync("lib/report-download.ts", "utf-8");

  assert.ok(code.includes('fetch("/api/generate"'));
  assert.ok(code.includes('formData.append("module", module)'));
  assert.ok(code.includes('formData.append("payload_json", JSON.stringify(payload))'));
});
