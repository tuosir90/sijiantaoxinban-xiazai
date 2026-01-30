const test = require("node:test");
const assert = require("node:assert/strict");
const { buildReportHtml } = require("../../public/js/report-template");

test("模板生成包含 header 与 markdown 内容", () => {
  const html = buildReportHtml({
    module: "brand",
    title: "示例标题",
    subtitle: "示例副标题",
    dateText: "2026-01-30 12:00:00",
    screenshotDataUrl: null,
    contentHtml: "<h1>内容</h1>",
    rawMarkdown: "# 内容"
  });
  assert.ok(html.includes("class=\"header\""));
  assert.ok(html.includes("示例标题"));
  assert.ok(html.includes("<h1>内容</h1>"));
});
