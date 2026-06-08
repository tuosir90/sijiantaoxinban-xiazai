/**
 * unified-ui.js
 * 主控制器：初始化所有 module-card 表单，绑定下载按钮交互逻辑。
 * 依赖：UnifiedUiHelpers（unified-ui-helpers.js）
 *       UnifiedUiForm（unified-ui-form.js）
 */
(function () {
  "use strict";

  /* ── 依赖检查 ────────────────────────────────────────────── */
  const helpers = window.UnifiedUiHelpers;
  const formHelpers = window.UnifiedUiForm;

  if (!helpers) throw new Error("[UnifiedUI] UnifiedUiHelpers 未加载");
  if (!formHelpers) throw new Error("[UnifiedUI] UnifiedUiForm 未加载");

  const {
    getSelectedLineId,
    isTauriEnvironment,
    parseDispositionFilename,
    parseErrorMessage,
    safeText,
    sanitizeFilename,
    saveBinaryInTauri,
    triggerDownload,
  } = helpers;

  const {
    collectPayload,
    resetFieldErrors,
    setupPriceRange,
    validatePayload,
  } = formHelpers;

  /* ── 模块名称映射 ────────────────────────────────────────── */
  const MODULE_NAMES = {
    "brand": "品牌定位分析",
    "market": "商圈调研分析",
    "store-activity": "店铺活动方案",
    "data-statistics": "数据统计分析",
  };

  /* ── UI 工具 ─────────────────────────────────────────────── */

  /**
   * 将按钮切换为「加载中」状态，返回用于还原的函数。
   * @param {HTMLButtonElement} btn
   * @returns {() => void}
   */
  function setButtonLoading(btn) {
    const originalHTML = btn.innerHTML;
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    btn.disabled = true;
    btn.innerHTML = "";
    btn.appendChild(spinner);
    btn.append(" 生成中…");
    return () => {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    };
  }

  /**
   * 将成功状态写入 status 节点（带勾号图标）。
   * @param {Element} statusEl
   * @param {string} message
   */
  function showSuccess(statusEl, message) {
    if (!statusEl) return;
    statusEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${message}
    `;
  }

  /* ── 截图文件名预览 ──────────────────────────────────────── */
  function bindScreenshotPreview(form) {
    const screenshotInput = form.querySelector('input[type="file"][name="screenshot"]');
    if (!screenshotInput) return;

    const nameEl = form.querySelector('[data-role="marketScreenshotName"]');
    const updateName = () => {
      const file = screenshotInput.files && screenshotInput.files[0];
      safeText(nameEl, file ? file.name : "未选择文件");
    };
    screenshotInput.addEventListener("change", updateName);
    updateName();
  }

  /* ── 清除错误状态监听 ────────────────────────────────────── */
  function bindFieldErrorClear(form) {
    form.querySelectorAll("input, textarea, select").forEach((el) => {
      const clear = () => el.classList.remove("is-error");
      el.addEventListener("input", clear);
      el.addEventListener("change", clear);
    });
  }

  /* ── 下载按钮核心逻辑 ────────────────────────────────────── */
  async function handleDownload(form, module, reportName) {
    const button = form.querySelector('[data-action="download"]');
    const statusEl = form.querySelector('[data-role="status"]');
    const errorEl = form.querySelector('[data-role="error"]');
    const screenshotInput = form.querySelector('input[type="file"][name="screenshot"]');

    if (!button) return;

    // 清理上次状态
    resetFieldErrors(form);
    safeText(statusEl, "");
    safeText(errorEl, "");

    const restoreButton = setButtonLoading(button);

    // 收集 & 校验
    const payload = collectPayload(form, module);
    const screenshotFile = screenshotInput ? screenshotInput.files[0] || null : null;
    const validationError = validatePayload(form, module, payload, screenshotFile);

    if (validationError) {
      safeText(errorEl, validationError);
      restoreButton();
      return;
    }

    // 构建 FormData
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
        throw new Error(parseErrorMessage(rawText) || `服务器返回 ${response.status}`);
      }

      // 解析文件名
      const headerFilename = parseDispositionFilename(
        response.headers.get("content-disposition")
      );
      const storeName = sanitizeFilename(
        payload.storeName || payload.areaName || "未命名店铺"
      );
      const downloadName =
        sanitizeFilename(headerFilename) || `${storeName}_${reportName}.pdf`;

      if (isTauriEnvironment()) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const result = await saveBinaryInTauri(bytes, downloadName, [
          { name: "PDF 文件", extensions: ["pdf"] },
          { name: "所有文件", extensions: ["*"] },
        ]);
        if (result.canceled) {
          safeText(statusEl, "已取消保存");
          return;
        }
        showSuccess(statusEl, "PDF 已保存");
      } else {
        const blob = await response.blob();
        triggerDownload(blob, downloadName);
        showSuccess(statusEl, "PDF 已开始下载");
      }
    } catch (err) {
      safeText(statusEl, "");
      safeText(errorEl, `下载失败：${err && err.message ? err.message : String(err)}`);
    } finally {
      restoreButton();
    }
  }

  /* ── 初始化所有模块卡片 ──────────────────────────────────── */
  function initModuleCards() {
    document.querySelectorAll("form[data-module]").forEach((form) => {
      const module = form.dataset.module;
      const reportName = form.dataset.reportName || MODULE_NAMES[module] || module;
      const button = form.querySelector('[data-action="download"]');

      // 辅助交互绑定
      setupPriceRange(form);
      bindFieldErrorClear(form);

      if (module === "market") {
        bindScreenshotPreview(form);
      }

      if (!button) return;

      button.addEventListener("click", () => handleDownload(form, module, reportName));
    });
  }

  /* ── 启动 ────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModuleCards);
  } else {
    initModuleCards();
  }
})();
