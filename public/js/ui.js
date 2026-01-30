/**
 * 页面交互逻辑：生成 → 预览 → 下载PDF（浏览器渲染）。
 */

const SAMPLE_PAYLOADS = {
  "brand": {
    storeName: "示例店",
    category: "火锅",
    address: "北京市朝阳区示例路",
    targetGroup: "上班族、学生",
    priceRange: "60元",
    mainProducts: "牛油锅底、毛肚、肥牛"
  },
  "market": {
    areaName: "示例商圈",
    location: "北京市朝阳区",
    areaType: "写字楼商圈",
    storeName: "示例店",
    enableScreenshotAnalysis: true
  },
  "store-activity": {
    storeName: "示例店",
    storeAddress: "北京市朝阳区示例路",
    businessCategory: "火锅",
    businessHours: "10:00-22:00",
    menuItems: "毛肚 38元\n肥牛 48元\n鸭血 12元\n青菜 8元\n米饭 2元"
  },
  "data-statistics": {
    storeName: "示例店",
    businessCategory: "火锅",
    exposureCount: 120000,
    visitCount: 24000,
    orderCount: 3600,
    visitConversion: 20,
    orderConversion: 15,
    minOrderPrice: 20,
    deliveryFee: 3,
    deliveryRange: 3
  }
};

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text || "";
}

function setDisabled(disabled) {
  $("btn-generate").disabled = disabled;
  $("btn-reset").disabled = disabled;
}

function updatePayloadTemplate() {
  const module = $("module").value;
  const sample = SAMPLE_PAYLOADS[module] || {};
  $("payload-json").value = JSON.stringify(sample, null, 2);
}

function parsePayload() {
  const text = $("payload-json").value || "{}";
  return JSON.parse(text);
}

function getScreenshotFileIfNeeded() {
  const module = $("module").value;
  const file = $("screenshot").files && $("screenshot").files[0] ? $("screenshot").files[0] : null;
  if (module !== "market") return null;
  return file;
}

async function getScreenshotDataUrlIfNeeded() {
  const file = getScreenshotFileIfNeeded();
  if (!file) return null;
  if (typeof window.compressImageToDataUrl !== "function") {
    throw new Error("缺少截图处理能力");
  }
  return await window.compressImageToDataUrl(file);
}

async function onGenerate() {
  setText("error", "");
  setDisabled(true);
  $("btn-download").disabled = true;
  setText("status", "生成中，请稍候…");

  try {
    const module = $("module").value;
    const payload = parsePayload();
    const screenshotDataUrl = await getScreenshotDataUrlIfNeeded();

    const data = await generateReport({ module, payload, screenshotDataUrl });

    $("markdown").value = data.markdown || "";
    const preview = $("preview");
    if (preview && window.ReportRenderer) {
      await window.ReportRenderer.renderReport(data, preview);
    }
    const fallbackName = (data.meta && data.meta.title ? `${data.meta.title}.pdf` : "report.pdf");
    $("btn-download").dataset.fallbackName = fallbackName;
    $("btn-download").disabled = false;

    setText("status", "已生成，可直接下载PDF");
  } catch (e) {
    setText("status", "");
    setText("error", `生成失败：${e && e.message ? e.message : e}`);
  } finally {
    setDisabled(false);
  }
}

function onReset() {
  setText("error", "");
  setText("status", "");
  $("preview").innerHTML = "";
  $("markdown").value = "";
  $("screenshot").value = "";
  $("btn-download").dataset.fallbackName = "report.pdf";
  $("btn-download").disabled = true;
}

async function onDownload() {
  const name = $("btn-download").dataset.fallbackName || "report.pdf";
  const preview = $("preview");
  if (!preview || !window.ReportRenderer) return;

  setText("error", "");
  $("btn-download").disabled = true;
  setText("status", "正在下载PDF…");

  try {
    await window.ReportRenderer.downloadPdf(preview, name);
    setText("status", "PDF已开始下载（如浏览器弹出拦截，请允许下载）");
  } catch (e) {
    setText("status", "");
    setText("error", `下载失败：${e && e.message ? e.message : e}`);
  } finally {
    $("btn-download").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("module").addEventListener("change", updatePayloadTemplate);
  $("btn-generate").addEventListener("click", onGenerate);
  $("btn-reset").addEventListener("click", onReset);
  $("btn-download").addEventListener("click", onDownload);

  updatePayloadTemplate();
  $("btn-download").disabled = true;
});
