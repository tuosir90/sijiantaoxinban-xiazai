const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeMarkdown, looksLikeHtml } = require("../../api/_lib/upstream");

test("normalizeMarkdown 去除 ``` 包裹", () => {
  const text = "```markdown\n# 标题\n```";
  assert.equal(normalizeMarkdown(text), "# 标题");
});

test("looksLikeHtml 能识别常见 HTML 标签", () => {
  assert.equal(looksLikeHtml("<div><h1>hi</h1><p>x</p></div>"), true);
});
