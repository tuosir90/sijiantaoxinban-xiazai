/**
 * 店铺活动方案页面逻辑。
 */

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text || "";
}

function setLoading(loading) {
  $("btn-generate").disabled = loading;
  $("btn-reset").disabled = loading;
  $("btn-download").disabled = loading || !$("btn-download").dataset.pdfUrl;
}

function resetPage() {
  setText("error", "");
  setText("status", "");
  $("preview").src = "about:blank";
  $("markdown").value = "";
  $("btn-download").dataset.pdfUrl = "";
  $("btn-download").dataset.fallbackName = "report.pdf";
  $("btn-download").disabled = true;
}

function collectPayload() {
  const storeName = ($("storeName").value || "").trim();
  const storeAddress = ($("storeAddress").value || "").trim();
  const businessCategory = ($("businessCategory").value || "").trim();
  const businessHours = ($("businessHours").value || "").trim();
  const menuItems = ($("menuItems").value || "").trim();
  return { storeName, storeAddress, businessCategory, businessHours, menuItems };
}

async function onGenerate() {
  setText("error", "");
  setText("status", "生成中，请稍候…");
  resetPage();
  setLoading(true);

  try {
    const payload = collectPayload();
    if (!payload.storeName || !payload.businessCategory) {
      throw new Error("请填写店铺名称与经营品类");
    }

    const data = await generateReport({ module: "store-activity", payload, screenshotFile: null });

    $("markdown").value = data.markdown || "";
    $("preview").src = toAbsoluteUrl(data.preview_url);
    $("btn-download").dataset.pdfUrl = data.pdf_url || "";
    $("btn-download").dataset.fallbackName = `${payload.storeName}_店铺活动方案.pdf`;
    $("btn-download").disabled = !data.pdf_url;

    setText("status", "已生成，可预览并下载PDF");
  } catch (e) {
    setText("status", "");
    setText("error", `生成失败：${e && e.message ? e.message : e}`);
  } finally {
    setLoading(false);
  }
}

async function onDownload() {
  const pdfUrl = $("btn-download").dataset.pdfUrl || "";
  const name = $("btn-download").dataset.fallbackName || "report.pdf";
  if (!pdfUrl) return;

  setText("error", "");
  setText("status", "正在下载PDF…");
  $("btn-download").disabled = true;

  try {
    await downloadPdfFromUrl(pdfUrl, name);
    setText("status", "PDF已开始下载（如浏览器弹出拦截，请允许下载）");
  } catch (e) {
    setText("status", "");
    setText("error", `下载失败：${e && e.message ? e.message : e}`);
  } finally {
    $("btn-download").disabled = !pdfUrl;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("btn-generate").addEventListener("click", onGenerate);
  $("btn-reset").addEventListener("click", () => {
    $("storeName").value = "";
    $("storeAddress").value = "";
    $("businessCategory").value = "";
    $("businessHours").value = "";
    $("menuItems").value = "";
    resetPage();
  });
  $("btn-download").addEventListener("click", onDownload);

  resetPage();
});

