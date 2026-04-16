const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("统一页面提交请求时会附带当前所选线路标识", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const js = fs.readFileSync("backend/app/templates/unified-ui.js", "utf-8");
  assert.ok(html.includes('name="reportLine"'));
  assert.ok(js.includes('formData.append("line_id"'));
});
