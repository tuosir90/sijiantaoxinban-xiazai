/**
 * 品牌定位分析（旧版完整UI）→ 浏览器渲染与PDF下载
 */

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setGenerating(isGenerating) {
    const btn = $("brand-generateBtn");
    if (!btn) return;
    btn.disabled = isGenerating;

    const textEl = btn.querySelector(".btn-text");
    const loadingEl = btn.querySelector(".btn-loading");
    if (textEl) textEl.style.display = isGenerating ? "none" : "";
    if (loadingEl) loadingEl.style.display = isGenerating ? "" : "none";
  }

  function showLoadingOverlay(show) {
    const overlay = $("brand-loading-overlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
  }

  function showInput() {
    const input = $("brand-input-section");
    const report = $("brand-report-section");
    if (input) input.style.display = "";
    if (report) report.style.display = "none";
  }

  function showReport() {
    const input = $("brand-input-section");
    const report = $("brand-report-section");
    if (input) input.style.display = "none";
    if (report) report.style.display = "";
  }

  function getFallbackFilename(storeName) {
    const name = (storeName || "").trim() || "品牌定位分析";
    return `${name}_品牌定位分析.pdf`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("brand-store-form");
    const reportContainer = $("brand-report-content");
    const copyBtn = $("brand-copyNameBtn");
    const downloadBtn = $("brand-downloadPdfBtn");

    if (!form) return;

    let reportReady = false;
    let lastFilename = "品牌定位分析.pdf";

    if (downloadBtn) downloadBtn.disabled = true;

    form.addEventListener("submit", async e => {
      e.preventDefault();

      const payload = window.LegacyUi ? window.LegacyUi.formToPayload(form) : {};
      const storeName = payload.storeName || "";

      if (!payload.storeName || !payload.category) {
        alert("请填写店铺名称与经营品类");
        return;
      }

      setGenerating(true);
      showLoadingOverlay(true);

      try {
        const data = await generateReport({ module: "brand", payload, screenshotDataUrl: null });
        lastFilename = getFallbackFilename(storeName);

        showReport();
        if (window.LegacyUi) await window.LegacyUi.mountReport(reportContainer, data);

        reportReady = true;
        if (downloadBtn) downloadBtn.disabled = !reportReady;
        $("brand-report-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        alert(`生成失败：${err && err.message ? err.message : err}`);
      } finally {
        showLoadingOverlay(false);
        setGenerating(false);
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
        if (!reportReady) return;
        try {
          downloadBtn.disabled = true;
          await window.ReportRenderer.downloadPdf(reportContainer, lastFilename);
        } catch (err) {
          alert(`下载失败：${err && err.message ? err.message : err}`);
        } finally {
          downloadBtn.disabled = !reportReady;
        }
      });
    }

    // 默认展示输入区
    showInput();
  });
})();
