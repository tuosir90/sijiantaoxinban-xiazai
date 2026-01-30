(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ReportTemplate = factory();
  }
})(this, function () {
  const MODULE_THEMES = {
    "brand": { name: "品牌定位分析", color: "#3b82f6", dark: "#1e3a8a", tint: "#eff6ff" },
    "market": { name: "商圈调研分析", color: "#8b5cf6", dark: "#6d28d9", tint: "#f5f3ff" },
    "store-activity": { name: "店铺活动方案", color: "#f97316", dark: "#9a3412", tint: "#fff7ed" },
    "data-statistics": { name: "数据统计分析", color: "#667eea", dark: "#3730a3", tint: "#eef2ff" }
  };

  function buildReportHtml(options) {
    const theme = MODULE_THEMES[options.module] || MODULE_THEMES.brand;
    const styleVars = `--theme:${theme.color};--theme-dark:${theme.dark};--theme-tint:${theme.tint};`;
    const screenshot = options.screenshotDataUrl
      ? `<div class="card"><h2>截图</h2><div class="screenshot"><img src="${options.screenshotDataUrl}" alt="截图" /></div></div>`
      : "";

    return `
      <div class="page" style="${styleVars}">
        <div class="header">
          <div class="kicker">${theme.name}</div>
          <div class="title-row">
            <h1>${options.title || theme.name}</h1>
            <div class="brand-mark"><span class="logo">呈</span><span class="name">呈尚策划</span></div>
          </div>
          <div class="meta">
            ${options.subtitle ? `<div>${options.subtitle}</div>` : ""}
            ${options.dateText ? `<div>调研时间：${options.dateText}</div>` : ""}
          </div>
        </div>
        ${screenshot}
        <div class="card md">${options.contentHtml || ""}</div>
        <details class="card raw-md"><summary>查看原始 Markdown（用于复制）</summary><pre>${options.rawMarkdown || ""}</pre></details>
      </div>
    `;
  }

  return { MODULE_THEMES, buildReportHtml };
});
