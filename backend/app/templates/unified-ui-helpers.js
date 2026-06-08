/**
 * unified-ui-helpers.js
 * 平台级工具函数 — 纯函数，无副作用，暴露到 window.UnifiedUiHelpers
 */
(function () {
  "use strict";

  /* ── 常量 ──────────────────────────────────────────────── */
  const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;

  /* ── 环境检测 ───────────────────────────────────────────── */

  /**
   * 判断当前是否运行在 Tauri 桌面环境中。
   * @returns {boolean}
   */
  function isTauriEnvironment() {
    return (
      typeof window !== "undefined" &&
      Boolean(window.__TAURI__) &&
      Boolean(window.__TAURI__.core) &&
      typeof window.__TAURI__.core.invoke === "function"
    );
  }

  /* ── 文件工具 ───────────────────────────────────────────── */

  /**
   * 在 Tauri 环境中通过原生对话框保存二进制文件。
   * @param {Uint8Array} bytes
   * @param {string} filename - 默认文件名
   * @param {Array<{name:string, extensions:string[]}>} filters
   * @returns {Promise<{canceled: boolean, path?: string}>}
   */
  async function saveBinaryInTauri(bytes, filename, filters) {
    const filePath = await window.__TAURI__.core.invoke("plugin:dialog|save", {
      options: { defaultPath: filename, title: "保存文件", filters },
    });
    if (!filePath) return { canceled: true };

    await window.__TAURI__.core.invoke("plugin:fs|write_file", bytes, {
      headers: {
        path: encodeURIComponent(filePath),
        options: JSON.stringify({}),
      },
    });
    return { canceled: false, path: filePath };
  }

  /**
   * 通过隐藏 <a> 触发浏览器文件下载。
   * @param {Blob} blob
   * @param {string} filename
   */
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  /* ── 字符串工具 ─────────────────────────────────────────── */

  /**
   * 移除文件名中的非法字符。
   * @param {string} name
   * @returns {string}
   */
  function sanitizeFilename(name) {
    return (name || "").replace(ILLEGAL_FILENAME_CHARS, "_").trim();
  }

  /**
   * 安全地将文本内容写入 DOM 节点（忽略空节点）。
   * @param {Element|null} el
   * @param {string} text
   */
  function safeText(el, text) {
    if (el) el.textContent = text != null ? text : "";
  }

  /* ── HTTP / Response 工具 ───────────────────────────────── */

  /**
   * 从 Content-Disposition 响应头解析文件名。
   * 优先处理 RFC 5987 的 filename* 格式，回退到普通 filename。
   * @param {string|null} header
   * @returns {string}
   */
  function parseDispositionFilename(header) {
    if (!header) return "";

    const rfc5987 = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (rfc5987 && rfc5987[1]) {
      try {
        return decodeURIComponent(rfc5987[1]);
      } catch {
        return rfc5987[1];
      }
    }

    const plain = header.match(/filename="?([^";]+)"?/i);
    return plain ? plain[1] : "";
  }

  /**
   * 从原始错误响应文本中提取可读的错误信息。
   * @param {string} rawText
   * @returns {string}
   */
  function parseErrorMessage(rawText) {
    if (!rawText) return "";
    try {
      const data = JSON.parse(rawText);
      return data.detail || data.error || rawText;
    } catch {
      return rawText;
    }
  }

  /* ── UI 状态工具 ────────────────────────────────────────── */

  /**
   * 读取当前用户选中的线路 ID。
   * @returns {"line1"|"line2"}
   */
  function getSelectedLineId() {
    const checked = document.querySelector('input[name="reportLine"]:checked');
    return (checked && checked.value) ? checked.value : "line1";
  }

  /* ── 导出 ───────────────────────────────────────────────── */
  window.UnifiedUiHelpers = Object.freeze({
    getSelectedLineId,
    isTauriEnvironment,
    parseDispositionFilename,
    parseErrorMessage,
    safeText,
    sanitizeFilename,
    saveBinaryInTauri,
    triggerDownload,
  });
})();
