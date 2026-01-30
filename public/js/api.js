function buildApiUrl(path) {
  if (!path) return "";
  const root = typeof window !== "undefined" ? window : {};
  const base = (root.APP_CONFIG && root.APP_CONFIG.apiBaseUrl) || "";
  const trimmed = String(base).replace(/\/+$/, "");
  if (!trimmed) return path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function generateReport({ module, payload, screenshotDataUrl }) {
  const res = await fetch(buildApiUrl("/api/reports/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      module,
      payload: payload || {},
      screenshotDataUrl: screenshotDataUrl || null
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  return data;
}

if (typeof module === "object" && module.exports) {
  module.exports = { buildApiUrl, generateReport };
} else {
  window.buildApiUrl = buildApiUrl;
  window.generateReport = generateReport;
}
