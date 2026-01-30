/**
 * 数据统计分析（旧版完整UI）→ FastAPI 后端生成与PDF下载
 */

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function show(el, visible) {
    if (!el) return;
    el.classList.toggle("hidden", !visible);
  }

  function toNum(v) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getFilename(storeName) {
    const base = (storeName || "").toString().trim() || "数据统计分析";
    return `${base}_数据统计分析.pdf`;
  }

  function fillConversions(payload) {
    const exposure = toNum(payload.exposureCount);
    const visit = toNum(payload.visitCount);
    const order = toNum(payload.orderCount);

    if (!payload.visitConversion && exposure > 0 && visit > 0) {
      payload.visitConversion = Number(((visit / exposure) * 100).toFixed(2));
    }
    if (!payload.orderConversion && visit > 0 && order > 0) {
      payload.orderConversion = Number(((order / visit) * 100).toFixed(2));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("data-statistics-form");
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
    let lastFilename = "数据统计分析.pdf";

    function resetView() {
      show(inputSection, true);
      show(loadingSection, false);
      show(reportSection, false);
      if (reportContent) reportContent.innerHTML = "";
      if (downloadBtn) downloadBtn.disabled = true;
      lastPdfUrl = "";
      lastFilename = "数据统计分析.pdf";
    }

    resetView();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = window.LegacyUi ? window.LegacyUi.formToPayload(form) : {};

      if (!payload.storeName || !payload.storeAddress || !payload.businessCategory || !payload.businessHours) {
        alert("请填写店铺名称、店铺地址、经营品类、营业时间");
        return;
      }

      fillConversions(payload);

      const exposure = toNum(payload.exposureCount);
      const visit = toNum(payload.visitCount);
      const order = toNum(payload.orderCount);
      if (visit > exposure) {
        alert("入店人数不能超过曝光人数");
        return;
      }
      if (order > visit) {
        alert("下单人数不能超过入店人数");
        return;
      }

      show(inputSection, false);
      show(reportSection, false);
      show(loadingSection, true);

      const stopProgress = window.LegacyUi ? window.LegacyUi.startProgress(progressBar) : () => {};

      try {
        const data = await generateReport({ module: "data-statistics", payload, screenshotFile: null });
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

