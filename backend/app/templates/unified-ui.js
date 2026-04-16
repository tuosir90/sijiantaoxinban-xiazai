(() => {
  const moduleNameMap = {
    "brand": "品牌定位分析",
    "market": "商圈调研分析",
    "store-activity": "店铺活动方案",
    "data-statistics": "数据统计分析"
  };

  const helpers = window.UnifiedUiHelpers;
  const formHelpers = window.UnifiedUiForm;
  if (!helpers) {
    throw new Error("UnifiedUiHelpers 未加载");
  }
  if (!formHelpers) {
    throw new Error("UnifiedUiForm 未加载");
  }

  const {
    getSelectedLineId,
    isTauriEnvironment,
    parseDispositionFilename,
    parseErrorMessage,
    safeText,
    sanitizeFilename,
    saveBinaryInTauri,
    triggerDownload
  } = helpers;
  const { collectPayload, resetFieldErrors, setupPriceRange, validatePayload } = formHelpers;

  document.querySelectorAll("form[data-module]").forEach((form) => {
    const module = form.dataset.module;
    const reportName = form.dataset.reportName || moduleNameMap[module] || module;
    const button = form.querySelector('[data-action="download"]');
    const statusEl = form.querySelector('[data-role="status"]');
    const errorEl = form.querySelector('[data-role="error"]');
    const screenshotInput = form.querySelector('input[type="file"][name="screenshot"]');

    setupPriceRange(form);

    form.querySelectorAll("input, textarea, select").forEach((el) => {
      el.addEventListener("input", () => el.classList.remove("is-error"));
      el.addEventListener("change", () => el.classList.remove("is-error"));
    });

    if (module === "market" && screenshotInput) {
      const nameEl = form.querySelector('[data-role="marketScreenshotName"]');
      const updateName = () => {
        const file = screenshotInput.files && screenshotInput.files[0];
        if (nameEl) {
          nameEl.textContent = file ? file.name : "未选择文件";
        }
      };
      screenshotInput.addEventListener("change", updateName);
      updateName();
    }

    if (!button) {
      return;
    }
    const defaultText = button.textContent;

    button.addEventListener("click", async () => {
      resetFieldErrors(form);
      safeText(errorEl, "");
      safeText(statusEl, "生成中，请稍候…");
      button.disabled = true;
      button.textContent = "生成中…";

      const payload = collectPayload(form, module);
      const screenshotFile = screenshotInput ? screenshotInput.files[0] : null;

      const validationError = validatePayload(form, module, payload, screenshotFile);
      if (validationError) {
        safeText(statusEl, "");
        safeText(errorEl, validationError);
        button.disabled = false;
        button.textContent = defaultText;
        return;
      }

      const formData = new FormData();
      formData.append("module", module);
      formData.append("line_id", getSelectedLineId());
      formData.append("payload_json", JSON.stringify(payload));
      if (module === "market" && screenshotFile) {
        formData.append("screenshot", screenshotFile);
      }

      try {
        const response = await fetch("/api/generate", { method: "POST", body: formData });
        if (!response.ok) {
          const rawText = await response.text();
          const message = parseErrorMessage(rawText);
          throw new Error(message || "生成失败");
        }

        const headerFilename = parseDispositionFilename(
          response.headers.get("content-disposition")
        );
        const storeName = sanitizeFilename(
          payload.storeName || payload.areaName || "未命名店铺"
        );
        const fallbackName = `${storeName}_${reportName}.pdf`;
        const downloadName = fallbackName || sanitizeFilename(headerFilename);

        if (isTauriEnvironment()) {
          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const result = await saveBinaryInTauri(bytes, downloadName, [
            { name: "PDF文件", extensions: ["pdf"] },
            { name: "所有文件", extensions: ["*"] }
          ]);
          if (result.canceled) {
            safeText(statusEl, "已取消保存");
            return;
          }
          safeText(statusEl, "PDF已保存");
        } else {
          const blob = await response.blob();
          triggerDownload(blob, downloadName);
          safeText(statusEl, "PDF已开始下载");
        }
      } catch (err) {
        safeText(statusEl, "");
        safeText(errorEl, `下载失败：${err && err.message ? err.message : err}`);
      } finally {
        button.disabled = false;
        button.textContent = defaultText;
      }
    });
  });
})();
