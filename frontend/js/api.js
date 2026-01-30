/**
 * API 调用封装（与后端 fastapi-refactor/backend 对应）。
 */

function getApiBaseUrl() {
  const base = window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl;
  return (base || "").replace(/\/+$/, "");
}

function toAbsoluteUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function generateReport({ module, payload, screenshotFile }) {
  const fd = new FormData();
  fd.append("module", module);
  fd.append("payload_json", JSON.stringify(payload || {}));
  if (screenshotFile) fd.append("screenshot", screenshotFile);

  const res = await fetch(`${getApiBaseUrl()}/api/reports/generate`, {
    method: "POST",
    body: fd
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data && (data.detail || data.message) ? (data.detail || data.message) : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return data;
}

function parseContentDispositionFilename(contentDisposition) {
  if (!contentDisposition) return "";

  // RFC 5987: filename*=UTF-8''...
  const matchUtf8 = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (matchUtf8 && matchUtf8[1]) {
    try {
      return decodeURIComponent(matchUtf8[1]);
    } catch (e) {
      return matchUtf8[1];
    }
  }

  // fallback: filename="..."
  const match = contentDisposition.match(/filename\s*=\s*\"([^\"]+)\"/i);
  if (match && match[1]) return match[1];

  return "";
}

async function downloadPdfFromUrl(pdfUrl, fallbackFilename) {
  const url = toAbsoluteUrl(pdfUrl);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PDF下载失败：HTTP ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const filename = parseContentDispositionFilename(cd) || fallbackFilename || "report.pdf";

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
