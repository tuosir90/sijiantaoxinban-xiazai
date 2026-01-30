const MODULE_THEMES = {
  "brand": { name: "品牌定位分析", color: "#3b82f6", dark: "#1e3a8a", tint: "#eff6ff" },
  "market": { name: "商圈调研分析", color: "#8b5cf6", dark: "#6d28d9", tint: "#f5f3ff" },
  "store-activity": { name: "店铺活动方案", color: "#f97316", dark: "#9a3412", tint: "#fff7ed" },
  "data-statistics": { name: "数据统计分析", color: "#667eea", dark: "#3730a3", tint: "#eef2ff" }
};

function buildMeta(module, payload = {}) {
  const theme = MODULE_THEMES[module] || { name: module };
  const storeName = String(payload.storeName || payload["store-name"] || "").trim();
  const areaName = String(payload.areaName || "").trim();
  const category = String(payload.category || payload.businessCategory || "").trim();

  let title = "";
  if (module === "market") {
    const base = areaName || storeName || theme.name;
    title = `${base} 商圈调研分析报告`;
  } else if (module === "store-activity") {
    const base = storeName || theme.name;
    title = `${base} 店铺活动方案`;
  } else if (module === "data-statistics") {
    const base = storeName || theme.name;
    title = `${base} 数据统计分析报告`;
  } else {
    const base = storeName || theme.name;
    title = `${base} 品牌定位分析报告`;
  }

  const subtitle = category || "呈尚策划 · 专业分析";
  return { title, subtitle };
}

function safeModule(module) {
  if (!MODULE_THEMES[module]) throw new Error(`不支持的module: ${module}`);
  return module;
}

module.exports = { MODULE_THEMES, buildMeta, safeModule };
