const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMeta, MODULE_THEMES } = require("../../api/_lib/meta");

test("brand 模块标题包含品牌定位分析", () => {
  const meta = buildMeta("brand", { storeName: "示例店" });
  assert.ok(meta.title.includes("品牌定位分析报告"));
});

test("module 主题包含颜色字段", () => {
  assert.ok(MODULE_THEMES["market"].color);
});
