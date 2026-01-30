/**
 * 数据统计分析页面逻辑。
 */

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text || "";
}

function setLoading(loading) {
  $("btn-generate").disabled = loading;
  $("btn-reset").disabled = loading;
  $("btn-download").disabled = loading || !$("btn-download").dataset.pdfUrl;
}

function resetPage() {
  setText("error", "");
  setText("status", "");
  $("preview").src = "about:blank";
  $("markdown").value = "";
  $("btn-download").dataset.pdfUrl = "";
  $("btn-download").dataset.fallbackName = "report.pdf";
  $("btn-download").disabled = true;
}

function num(id) {
  const v = ($(`${id}`).value || "").trim();
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function text(id) {
  return ($(`${id}`).value || "").trim();
}

function hasValue(id) {
  return ($(`${id}`).value || "").trim() !== "";
}

function collectPayload() {
  const storeName = text("storeName");
  const storeAddress = text("storeAddress");
  const businessCategory = text("businessCategory");
  const businessHours = text("businessHours");

  const exposureCount = Math.floor(num("exposureCount"));
  const visitCount = Math.floor(num("visitCount"));
  const orderCount = Math.floor(num("orderCount"));

  let visitConversion = num("visitConversion");
  let orderConversion = num("orderConversion");

  if (!visitConversion && exposureCount > 0 && visitCount > 0) {
    visitConversion = parseFloat(((visitCount / exposureCount) * 100).toFixed(2));
  }
  if (!orderConversion && visitCount > 0 && orderCount > 0) {
    orderConversion = parseFloat(((orderCount / visitCount) * 100).toFixed(2));
  }

  const minOrderPrice = num("minOrderPrice");
  const deliveryFee = num("deliveryFee");
  const deliveryRange = num("deliveryRange");

  const idleCookingTime = text("idleCookingTime");
  const busyCookingTime = text("busyCookingTime");
  const greenCharity = text("greenCharity");
  const selfPickup = text("selfPickup");
  const preOrder = text("preOrder");
  const onTimeGuarantee = text("onTimeGuarantee");
  const foodSafety = text("foodSafety");

  return {
    storeName,
    storeAddress,
    businessCategory,
    businessHours,
    exposureCount,
    visitCount,
    orderCount,
    visitConversion,
    orderConversion,
    minOrderPrice,
    deliveryFee,
    deliveryRange,
    idleCookingTime,
    busyCookingTime,
    greenCharity,
    selfPickup,
    preOrder,
    onTimeGuarantee,
    foodSafety
  };
}

async function onGenerate() {
  setText("error", "");
  setText("status", "生成中，请稍候…");
  resetPage();
  setLoading(true);

  try {
    const payload = collectPayload();
    if (!payload.storeName || !payload.storeAddress || !payload.businessCategory || !payload.businessHours) {
      throw new Error("请填写店铺名称、店铺地址、经营品类、营业时间");
    }
    const requiredNumberFields = ["exposureCount", "visitCount", "orderCount", "minOrderPrice", "deliveryFee", "deliveryRange"];
    const requiredNumberMissing = requiredNumberFields.filter(k => !hasValue(k));
    if (requiredNumberMissing.length) {
      throw new Error("请填写曝光人数、入店人数、下单人数、起送价、配送费、配送范围");
    }
    if (payload.visitCount > payload.exposureCount) {
      throw new Error("入店人数不能超过曝光人数");
    }
    if (payload.orderCount > payload.visitCount) {
      throw new Error("下单人数不能超过入店人数");
    }

    const data = await generateReport({ module: "data-statistics", payload, screenshotFile: null });

    $("markdown").value = data.markdown || "";
    $("preview").src = toAbsoluteUrl(data.preview_url);
    $("btn-download").dataset.pdfUrl = data.pdf_url || "";
    $("btn-download").dataset.fallbackName = `${payload.storeName}_数据统计分析.pdf`;
    $("btn-download").disabled = !data.pdf_url;

    setText("status", "已生成，可预览并下载PDF");
  } catch (e) {
    setText("status", "");
    setText("error", `生成失败：${e && e.message ? e.message : e}`);
  } finally {
    setLoading(false);
  }
}

async function onDownload() {
  const pdfUrl = $("btn-download").dataset.pdfUrl || "";
  const name = $("btn-download").dataset.fallbackName || "report.pdf";
  if (!pdfUrl) return;

  setText("error", "");
  setText("status", "正在下载PDF…");
  $("btn-download").disabled = true;

  try {
    await downloadPdfFromUrl(pdfUrl, name);
    setText("status", "PDF已开始下载（如浏览器弹出拦截，请允许下载）");
  } catch (e) {
    setText("status", "");
    setText("error", `下载失败：${e && e.message ? e.message : e}`);
  } finally {
    $("btn-download").disabled = !pdfUrl;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("btn-generate").addEventListener("click", onGenerate);
  $("btn-reset").addEventListener("click", () => {
    [
      "storeName",
      "storeAddress",
      "businessCategory",
      "businessHours",
      "exposureCount",
      "visitCount",
      "orderCount",
      "visitConversion",
      "orderConversion",
      "minOrderPrice",
      "deliveryFee",
      "deliveryRange"
    ].forEach(id => ($(`${id}`).value = ""));

    const defaults = {
      idleCookingTime: "15",
      busyCookingTime: "20",
      greenCharity: "是",
      selfPickup: "是",
      preOrder: "是",
      onTimeGuarantee: "是",
      foodSafety: "是"
    };
    Object.entries(defaults).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.value = value;
    });
    resetPage();
  });
  $("btn-download").addEventListener("click", onDownload);

  resetPage();
});
