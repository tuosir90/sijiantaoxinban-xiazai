/**
 * 店铺活动方案（旧版完整UI）→ FastAPI 后端生成与PDF下载
 */

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function show(el, visible) {
    if (!el) return;
    el.classList.toggle("hidden", !visible);
  }

  function getFilename(storeName) {
    const base = (storeName || "").toString().trim() || "店铺活动方案";
    return `${base}_店铺活动方案.pdf`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("store-activity-form");
    const inputSection = $("input-section");
    const loadingSection = $("loading-section");
    const reportSection = $("report-section");
    const progressBar = $("progress-bar");
    const reportContent = $("report-content");

    const copyBtn = $("copy-report-name");
    const newBtn = $("new-analysis");
    const downloadBtn = $("download-pdf");

    if (!form) return;

    let lastPdfUrl = "";
    let lastFilename = "店铺活动方案.pdf";

    function resetView() {
      show(inputSection, true);
      show(loadingSection, false);
      show(reportSection, false);
      if (reportContent) reportContent.innerHTML = "";
      if (downloadBtn) downloadBtn.disabled = true;
      lastPdfUrl = "";
      lastFilename = "店铺活动方案.pdf";
    }

    resetView();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = window.LegacyUi ? window.LegacyUi.formToPayload(form) : {};

      if (!payload.storeName || !payload.storeAddress || !payload.businessCategory || !payload.businessHours) {
        alert("请填写店铺名称、店铺地址、经营品类、营业时间");
        return;
      }

      show(inputSection, false);
      show(reportSection, false);
      show(loadingSection, true);

      const stopProgress = window.LegacyUi ? window.LegacyUi.startProgress(progressBar) : () => {};

      try {
        const data = await generateReport({ module: "store-activity", payload, screenshotFile: null });
        stopProgress();
        show(loadingSection, false);
        show(reportSection, true);

        lastPdfUrl = data.pdf_url || "";
        lastFilename = getFilename(payload.storeName);
        if (downloadBtn) downloadBtn.disabled = !lastPdfUrl;

        if (window.LegacyUi) window.LegacyUi.mountPreviewIframe(reportContent, data.preview_url);
        reportSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        stopProgress();
        show(loadingSection, false);
        show(inputSection, true);
        alert(`生成失败：${err && err.message ? err.message : err}`);
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const ok = window.LegacyUi ? await window.LegacyUi.copyText(lastFilename) : false;
        if (!ok) alert("复制失败，请手动复制");
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", async () => {
        if (!lastPdfUrl) return;
        try {
          downloadBtn.disabled = true;
          await downloadPdfFromUrl(lastPdfUrl, lastFilename);
        } catch (err) {
          alert(`下载失败：${err && err.message ? err.message : err}`);
        } finally {
          downloadBtn.disabled = !lastPdfUrl;
        }
      });
    }

    if (newBtn) {
      newBtn.addEventListener("click", () => {
        form.reset();
        resetView();
      });
    }
  });
})();

