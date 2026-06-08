/**
 * unified-ui-form.js
 * 表单数据收集、校验与辅助交互 — 暴露到 window.UnifiedUiForm
 */
(function () {
  "use strict";

  /* ── 字段必填映射 ────────────────────────────────────────── */
  const FIELD_LABELS = {
    storeName: "店铺名称",
    category: "经营品类",
    location: "所在位置",
    areaType: "商圈类型",
    storeAddress: "店铺地址",
    businessCategory: "经营品类",
    businessHours: "营业时间",
    exposureCount: "曝光人数",
    visitCount: "入店人数",
    orderCount: "下单人数",
  };

  /* ── 数据收集 ────────────────────────────────────────────── */

  /**
   * 从表单收集所有命名控件的值，构建 payload 对象。
   * @param {HTMLFormElement} form
   * @param {string} module
   * @returns {Record<string, unknown>}
   */
  function collectPayload(form, module) {
    const payload = {};

    Array.from(form.querySelectorAll("[name]")).forEach((el) => {
      const name = el.name;
      if (!name || el.type === "file" || name === "targetGroup") return;

      if (el.type === "checkbox") {
        payload[name] = el.checked;
        return;
      }
      if (el.type === "number") {
        payload[name] = el.value === "" ? "" : Number(el.value);
        return;
      }
      if (el.type === "range") {
        payload[name] = el.value ? `${el.value}元` : "";
        return;
      }
      payload[name] = (el.value || "").trim();
    });

    // 品牌模块：将 checkbox 组合并为字符串
    if (module === "brand") {
      const selected = Array.from(
        form.querySelectorAll('input[name="targetGroup"]:checked')
      )
        .map((el) => (el.value || "").trim())
        .filter(Boolean);
      payload.targetGroup = selected.join("、");
    }

    // 数据统计模块：自动计算转化率（若用户未填写）
    if (module === "data-statistics") {
      const exposure = Number(payload.exposureCount || 0);
      const visit = Number(payload.visitCount || 0);
      const order = Number(payload.orderCount || 0);

      if (!payload.visitConversion && exposure > 0 && visit > 0) {
        payload.visitConversion = Number(((visit / exposure) * 100).toFixed(2));
      }
      if (!payload.orderConversion && visit > 0 && order > 0) {
        payload.orderConversion = Number(((order / visit) * 100).toFixed(2));
      }
    }

    return payload;
  }

  /* ── 校验 ────────────────────────────────────────────────── */

  /**
   * 校验 payload，标记错误字段并返回错误信息（空字符串表示通过）。
   * @param {HTMLFormElement} form
   * @param {string} module
   * @param {Record<string, unknown>} payload
   * @param {File|null} screenshotFile
   * @returns {string}
   */
  function validatePayload(form, module, payload, screenshotFile) {
    const missing = [];

    const markError = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.classList.add("is-error");
    };

    const valueOf = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      return el ? (el.value || "").trim() : "";
    };

    const check = (name) => {
      if (!valueOf(name)) {
        missing.push(FIELD_LABELS[name] || name);
        markError(name);
      }
    };

    if (module === "brand") {
      check("storeName");
      check("category");
    }

    if (module === "market") {
      check("storeName");
      check("location");
      check("areaType");
      if (!screenshotFile) return "请上传竞品截图。";
    }

    if (module === "store-activity") {
      check("storeName");
      check("businessCategory");
    }

    if (module === "data-statistics") {
      ["storeName", "storeAddress", "businessCategory", "businessHours"].forEach(check);
      ["exposureCount", "visitCount", "orderCount"].forEach(check);

      if (!missing.length) {
        const exposure = Number(payload.exposureCount || 0);
        const visit = Number(payload.visitCount || 0);
        const order = Number(payload.orderCount || 0);
        if (visit > exposure) return "入店人数不能超过曝光人数。";
        if (order > visit) return "下单人数不能超过入店人数。";
      }
    }

    return missing.length ? `请填写：${missing.join("、")}` : "";
  }

  /* ── 辅助交互 ────────────────────────────────────────────── */

  /**
   * 初始化价格 range 输入的实时数值显示。
   * @param {HTMLFormElement} form
   */
  function setupPriceRange(form) {
    const rangeEl = form.querySelector('input[name="priceRange"]');
    const displayEl = form.querySelector('[data-role="priceValue"]');
    if (!rangeEl || !displayEl) return;

    displayEl.textContent = rangeEl.value;
    rangeEl.addEventListener("input", () => {
      displayEl.textContent = rangeEl.value;
    });
  }

  /**
   * 清除表单内所有 is-error 状态。
   * @param {HTMLFormElement} form
   */
  function resetFieldErrors(form) {
    form.querySelectorAll(".is-error").forEach((el) => el.classList.remove("is-error"));
  }

  /* ── 导出 ───────────────────────────────────────────────── */
  window.UnifiedUiForm = Object.freeze({
    collectPayload,
    resetFieldErrors,
    setupPriceRange,
    validatePayload,
  });
})();
