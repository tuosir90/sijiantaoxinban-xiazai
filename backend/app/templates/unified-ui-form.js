(() => {
  const collectPayload = (form, module) => {
    const payload = {};
    const elements = Array.from(form.querySelectorAll("[name]"));

    elements.forEach((el) => {
      const name = el.name;
      if (!name || el.type === "file" || name === "targetGroup") {
        return;
      }
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

    if (module === "brand") {
      const targetGroups = Array.from(
        form.querySelectorAll('input[name="targetGroup"]:checked')
      )
        .map((el) => (el.value || "").trim())
        .filter(Boolean);
      payload.targetGroup = targetGroups.join("、");
    }

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
  };

  const validatePayload = (form, module, payload, screenshotFile) => {
    const requiredMap = {
      storeName: "店铺名称",
      category: "经营品类",
      location: "所在位置",
      areaType: "商圈类型",
      storeAddress: "店铺地址",
      businessCategory: "经营品类",
      businessHours: "营业时间",
      exposureCount: "曝光人数",
      visitCount: "入店人数",
      orderCount: "下单人数"
    };

    const markError = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) {
        el.classList.add("is-error");
      }
    };

    const valueOf = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      return el ? (el.value || "").trim() : "";
    };

    const missing = [];
    const check = (name) => {
      if (!valueOf(name)) {
        missing.push(requiredMap[name] || name);
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
      if (!screenshotFile) {
        return "请上传竞品截图。";
      }
    }
    if (module === "store-activity") {
      check("storeName");
      check("businessCategory");
    }
    if (module === "data-statistics") {
      ["storeName", "storeAddress", "businessCategory", "businessHours"].forEach(check);
      ["exposureCount", "visitCount", "orderCount"].forEach(check);
      const exposure = Number(payload.exposureCount || 0);
      const visit = Number(payload.visitCount || 0);
      const order = Number(payload.orderCount || 0);
      if (visit > exposure) {
        return "入店人数不能超过曝光人数。";
      }
      if (order > visit) {
        return "下单人数不能超过入店人数。";
      }
    }

    return missing.length ? `请填写：${missing.join("、")}` : "";
  };

  const setupPriceRange = (form) => {
    const priceInput = form.querySelector('input[name="priceRange"]');
    const priceValue = form.querySelector('[data-role="priceValue"]');
    if (!priceInput || !priceValue) {
      return;
    }
    priceValue.textContent = priceInput.value;
    priceInput.addEventListener("input", () => {
      priceValue.textContent = priceInput.value;
    });
  };

  const resetFieldErrors = (form) => {
    form.querySelectorAll(".is-error").forEach((el) => el.classList.remove("is-error"));
  };

  window.UnifiedUiForm = {
    collectPayload,
    resetFieldErrors,
    setupPriceRange,
    validatePayload
  };
})();
