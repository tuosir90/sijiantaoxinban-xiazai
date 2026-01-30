/**
 * 商圈调研分析（旧版完整UI）→ FastAPI 后端生成与PDF下载
 *
 * 说明：
 * - 保留旧版上传区的交互（点击/拖拽/预览/移除）
 * - 生成后使用后端预览HTML（iframe）确保与PDF一致
 */

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  let currentScreenshotFile = null;

  function setGenerating(isGenerating) {
    const btn = $("market-generateBtn");
    if (!btn) return;
    btn.disabled = isGenerating;

    const textEl = btn.querySelector(".market-btn-text");
    const loadingEl = btn.querySelector(".market-btn-loading");
    if (textEl) textEl.style.display = isGenerating ? "none" : "";
    if (loadingEl) loadingEl.style.display = isGenerating ? "" : "none";
  }

  function showLoadingOverlay(show) {
    const overlay = $("market-loading-overlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
  }

  function showInput() {
    $("market-input-section") && ($("market-input-section").style.display = "");
    $("market-report-section") && ($("market-report-section").style.display = "none");
  }

  function showReport() {
    $("market-input-section") && ($("market-input-section").style.display = "none");
    $("market-report-section") && ($("market-report-section").style.display = "");
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  function updateFilePreview(file) {
    const preview = $("market-file-preview");
    const nameEl = document.querySelector(".market-file-name");
    const sizeEl = document.querySelector(".market-file-size");
    const imgWrap = $("market-image-preview");
    const img = $("market-preview-image");

    if (!preview) return;

    if (!file) {
      preview.style.display = "none";
      if (imgWrap) imgWrap.style.display = "none";
      if (img) img.src = "";
      return;
    }

    preview.style.display = "";
    if (nameEl) nameEl.textContent = file.name || "截图";
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);

    if (img && imgWrap) {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
        imgWrap.style.display = "";
      };
      reader.readAsDataURL(file);
    }
  }

  function bindUploadArea() {
    const area = $("market-file-upload-area");
    const input = $("market-screenshot");
    const removeBtn = document.querySelector(".market-file-remove");

    if (!area || !input) return;

    area.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      currentScreenshotFile = input.files && input.files[0] ? input.files[0] : null;
      updateFilePreview(currentScreenshotFile);
    });

    if (removeBtn) {
      removeBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        currentScreenshotFile = null;
        input.value = "";
        updateFilePreview(null);
      });
    }

    area.addEventListener("dragover", e => {
      e.preventDefault();
      area.classList.add("dragover");
    });
    area.addEventListener("dragleave", () => area.classList.remove("dragover"));
    area.addEventListener("drop", e => {
      e.preventDefault();
      area.classList.remove("dragover");
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        currentScreenshotFile = file;
        input.value = "";
        updateFilePreview(file);
      }
    });
  }

  function getFallbackFilename(payload) {
    const base = (payload.areaName || payload.storeName || "商圈调研分析").toString().trim() || "商圈调研分析";
    return `${base}_商圈调研分析.pdf`;
  }

  window.openImageMerger = function () {
    window.open("image-merger.html", "_blank");
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("market-survey-form");
    const reportContainer = $("market-report-content");
    const copyBtn = $("market-copyNameBtn");
    const downloadBtn = $("market-downloadPdfBtn");

    const enableBox = $("market-enableScreenshotAnalysis");

    if (!form) return;
    bindUploadArea();

    let reportReady = false;
    let lastFilename = "商圈调研分析.pdf";

    if (downloadBtn) downloadBtn.disabled = true;

    form.addEventListener("submit", async e => {
      e.preventDefault();

      const payload = window.LegacyUi ? window.LegacyUi.formToPayload(form) : {};
      const enable = Boolean(enableBox && enableBox.checked && currentScreenshotFile);

      payload.enableScreenshotAnalysis = enable;

      if (!payload.areaName || !payload.location || !payload.areaType) {
        alert("请填写店铺名称、经营品类、店铺地址");
        return;
      }

      setGenerating(true);
      showLoadingOverlay(true);

      try {
        const screenshotDataUrl = enable ? await window.compressImageToDataUrl(currentScreenshotFile) : null;
        const data = await generateReport({
          module: "market",
          payload,
          screenshotDataUrl
        });
        lastFilename = getFallbackFilename(payload);

        showReport();
        if (window.LegacyUi) await window.LegacyUi.mountReport(reportContainer, data);

        reportReady = true;
        if (downloadBtn) downloadBtn.disabled = !reportReady;
        $("market-report-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    showInput();
  });
})();
