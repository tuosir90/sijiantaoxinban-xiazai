const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("统一页面错误解析函数可处理JSON与纯文本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const start = html.indexOf("function parseErrorMessage");
  assert.ok(start !== -1, "未找到 parseErrorMessage 函数定义");

  const braceStart = html.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < html.length; i += 1) {
    const ch = html[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  assert.ok(end !== -1, "未能解析 parseErrorMessage 函数体");

  const fnSource = html.slice(start, end);
  const parseErrorMessage = vm.runInNewContext(`${fnSource}; parseErrorMessage;`);
  assert.equal(parseErrorMessage('{"detail":"错误信息"}'), "错误信息");
  assert.equal(parseErrorMessage("纯文本错误"), "纯文本错误");
});
