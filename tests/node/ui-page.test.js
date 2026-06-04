const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("统一页面包含四个模块表单", () => {
  const code = fs.readFileSync("backend/app/web_ui.py", "utf-8");
  assert.ok(code.includes("unified-ui.html"));
});

test("统一页面包含下载按钮与提交脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  const js = fs.readFileSync("backend/app/templates/unified-ui.js", "utf-8");
  assert.ok(html.includes("下载PDF"));
  assert.ok(html.includes("/ui/unified-ui.css"));
  assert.ok(html.includes("/ui/unified-ui-form.js"));
  assert.ok(html.includes("/ui/unified-ui-helpers.js"));
  assert.ok(html.includes("/ui/unified-ui.js"));
  assert.ok(js.includes("/api/generate"));
});

test("统一页面不再内联大段样式和脚本", () => {
  const html = fs.readFileSync("backend/app/templates/unified-ui.html", "utf-8");
  assert.equal(html.includes("<style>"), false);
  assert.equal(html.includes("const collectPayload ="), false);
});

test("数据统计分析校验不要求配送服务字段", () => {
  const js = fs.readFileSync("backend/app/templates/unified-ui-form.js", "utf-8");
  const context = { window: {} };
  vm.runInNewContext(js, context);

  const values = {
    storeName: "示例店",
    storeAddress: "示例地址",
    businessCategory: "快餐",
    businessHours: "10:00-22:00",
    exposureCount: "1000",
    visitCount: "100",
    orderCount: "30"
  };
  const form = {
    querySelector(selector) {
      const match = selector.match(/^\[name="([^"]+)"\]$/);
      if (!match || !(match[1] in values)) return null;
      return {
        value: values[match[1]],
        classList: { add() {} }
      };
    }
  };
  const payload = {
    storeName: "示例店",
    storeAddress: "示例地址",
    businessCategory: "快餐",
    businessHours: "10:00-22:00",
    exposureCount: 1000,
    visitCount: 100,
    orderCount: 30
  };

  assert.equal(
    context.window.UnifiedUiForm.validatePayload(form, "data-statistics", payload, null),
    ""
  );
});
