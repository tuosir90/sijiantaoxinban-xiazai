const test = require("node:test");
const assert = require("node:assert/strict");
const { handleGenerate } = require("../../api/_lib/handler");

test("handleGenerate 返回 markdown 与 meta", async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: "# 标题" } }] })
  });

  const res = await handleGenerate(
    {
      module: "brand",
      payload: { storeName: "示例店" },
      screenshotDataUrl: null
    },
    {
      env: { UPSTREAM_API_KEY: "k", UPSTREAM_BASE_URL: "https://x" },
      fetchFn: fakeFetch
    }
  );

  assert.equal(res.markdown, "# 标题");
  assert.ok(res.meta.title.includes("品牌定位分析报告"));
});
