/**
 * 旧版完整UI适配工具：
 * - 表单序列化(Form Serialization)
 * - 统一预览渲染（iframe）
 * - 复制到剪贴板
 * - 进度条动画
 * - DaisyUI 主题切换
 */

(function () {
  function isNumberInput(el) {
    return el && el.tagName === "INPUT" && el.type === "number";
  }

  function parseNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function formToPayload(formEl) {
    const payload = {};
    if (!formEl || !formEl.elements) return payload;

    Array.from(formEl.elements).forEach(el => {
      if (!el || !el.name || el.disabled) return;
      if (el.type === "file") return;

      const name = el.name;

      if (el.type === "checkbox") {
        payload[name] = Boolean(el.checked);
        return;
      }

      if (el.type === "radio") {
        if (el.checked) payload[name] = (el.value || "").trim();
        return;
      }

      const raw = (el.value || "").toString();
      if (isNumberInput(el)) {
        if (raw.trim() === "") {
          payload[name] = "";
          return;
        }
        const n = parseNumber(raw);
        payload[name] = n === null ? "" : n;
        return;
      }

      payload[name] = raw.trim();
    });

    return payload;
  }

  function setVisible(el, visible) {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  }

  function mountPreviewIframe(containerEl, previewUrl) {
    if (!containerEl) return;
    const src = typeof toAbsoluteUrl === "function" ? toAbsoluteUrl(previewUrl) : (previewUrl || "");
    containerEl.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "预览";
    iframe.style.width = "100%";
    iframe.style.height = "1100px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "12px";
    iframe.style.background = "#ffffff";
    containerEl.appendChild(iframe);
  }

  async function copyText(text) {
    const value = (text || "").toString();
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function startProgress(progressEl) {
    if (!progressEl) return () => {};
    let value = 0;
    progressEl.value = 0;

    const timer = window.setInterval(() => {
      value = Math.min(92, value + Math.max(1, Math.round((92 - value) * 0.08)));
      progressEl.value = value;
    }, 120);

    return () => {
      window.clearInterval(timer);
      progressEl.value = 100;
    };
  }

  function initDaisyThemeSwitcher() {
    const themeButtons = document.querySelectorAll("[data-theme]");
    if (!themeButtons.length) return;

    themeButtons.forEach(button => {
      button.addEventListener("click", function () {
        const theme = this.getAttribute("data-theme");
        if (!theme) return;
        document.documentElement.setAttribute("data-theme", theme);
        try {
          localStorage.setItem("theme", theme);
        } catch (e) {
          // ignore
        }
      });
    });

    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);
    } catch (e) {
      // ignore
    }
  }

  document.addEventListener("DOMContentLoaded", initDaisyThemeSwitcher);

  window.LegacyUi = {
    formToPayload,
    setVisible,
    mountPreviewIframe,
    copyText,
    startProgress
  };
})();

