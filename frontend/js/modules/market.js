/**
 * 商圈调研分析页面逻辑（支持截图）。
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
  const areaName = ($("areaName").value || "").trim();
  const location = ($("location").value || "").trim();
  const areaType = ($("areaType").value || "").trim();
  const storeName = ($("storeName").value || "").trim();
  const enableScreenshotAnalysis = !!$("enableScreenshotAnalysis").checked;
  return { areaName, location, areaType, storeName, enableScreenshotAnalysis };
}

function getScreenshotFile() {
  const file = $("screenshot").files && $("screenshot").files[0] ? $("screenshot").files[0] : null;
  return file;
}

async function onGenerate() {
  setText("error", "");
  setText("status", "生成中，请稍候…");
  resetPage();
  setLoading(true);

  try {
    const payload = collectPayload();
    if (!payload.areaName || !payload.location || !payload.areaType) {
      throw new Error("请填写商圈名称、所在位置与商圈类型");
    }

    const screenshotFile = payload.enableScreenshotAnalysis ? getScreenshotFile() : null;
    if (payload.enableScreenshotAnalysis && !screenshotFile) {
      throw new Error("已开启截图分析，请上传竞品截图");
    }

    const data = await generateReport({ module: "market", payload, screenshotFile });

    $("markdown").value = data.markdown || "";
    $("preview").src = toAbsoluteUrl(data.preview_url);
    $("btn-download").dataset.pdfUrl = data.pdf_url || "";
    $("btn-download").dataset.fallbackName = `${payload.areaName}_商圈调研分析.pdf`;
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
    $("areaName").value = "";
    $("location").value = "";
    $("areaType").value = "写字楼商圈";
    $("storeName").value = "";
    $("enableScreenshotAnalysis").checked = true;
    $("screenshot").value = "";
    resetPage();
  });
  $("btn-download").addEventListener("click", onDownload);

  resetPage();
});

