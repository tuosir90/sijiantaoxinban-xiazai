function buildBrandPrompt(payload = {}) {
  const storeName = (payload.storeName || "").trim();
  const category = (payload.category || "").trim();
  const address = (payload.address || "").trim();
  const targetGroup = (payload.targetGroup || "").trim();
  const priceRange = (payload.priceRange || "").trim();
  const mainProducts = (payload.mainProducts || "").trim();

  return (
    "请基于以下信息输出一份餐饮品牌定位分析报告。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 店铺地址：${address || "未提供"}\n` +
    `- 目标客群：${targetGroup || "未提供"}\n` +
    `- 人均价格：${priceRange || "未提供"}\n` +
    `- 主营产品：${mainProducts || "未提供"}\n\n` +
    "请重点给出：定位结论、差异化卖点、菜单结构建议、价格带建议、包装与品牌表达建议、" +
    "美团外卖运营建议（转化、复购、活动），并尽量用清晰的小标题和要点列表呈现。\n"
  );
}

function buildMarketPrompt(payload = {}) {
  const areaName = (payload.areaName || "").trim();
  const location = (payload.location || "").trim();
  const areaType = (payload.areaType || "").trim();
  const storeName = (payload.storeName || "").trim();
  const enableScreenshot = Boolean(payload.enableScreenshotAnalysis);
  const screenshotHint = enableScreenshot
    ? "会提供一张美团外卖竞品截图，请结合截图内容给出分析与建议。"
    : "不提供截图，仅根据文本信息分析。";

  return (
    "请输出一份商圈调研分析报告（面向外卖经营/选址/投放决策）。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 商圈信息\n" +
    `- 商圈名称：${areaName || "未提供"}\n` +
    `- 所在位置：${location || "未提供"}\n` +
    `- 商圈类型：${areaType || "未提供"}\n` +
    `- 拟开店/参考店铺：${storeName || "未提供"}\n` +
    `- 截图分析：${enableScreenshot ? "开启" : "关闭"}（${screenshotHint}）\n\n` +
    "请覆盖：客群画像、消费水平、餐饮业态、竞争强度、机会点与风险点、" +
    "针对美团外卖的具体动作（菜品结构、定价、活动、配送、评价与复购）。\n"
  );
}

function buildStoreActivityPrompt(payload = {}) {
  const storeName = (payload.storeName || payload["store-name"] || "").trim();
  const storeAddress = (payload.storeAddress || payload["store-address"] || "").trim();
  const category = (payload.businessCategory || payload["business-category"] || "").trim();
  const hours = (payload.businessHours || payload["business-hours"] || "").trim();
  const menuItems = payload.menuItems || "";
  let menuPreview = "";

  if (Array.isArray(menuItems)) {
    const lines = [];
    menuItems.slice(0, 30).forEach(item => {
      const name = (item.name || "").trim();
      const price = (item.price || "").trim();
      if (name) lines.push(`- ${name}（${price || "未标价"}）`);
    });
    if (lines.length) menuPreview = lines.join("\n");
  } else if (typeof menuItems === "string") {
    menuPreview = menuItems
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 30)
      .map(line => `- ${line}`)
      .join("\n");
  }

  return (
    "请基于以下信息输出一份“美团外卖店铺活动方案”。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 店铺地址：${storeAddress || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 营业时间：${hours || "未提供"}\n\n` +
    "## 菜品（节选）\n" +
    `${menuPreview || "- 未提供"}\n\n` +
    "请给出：满减/配送费/返券/秒杀/套餐搭配/好评返券等方案，" +
    "并包含执行时间、门槛、目标（转化/复购/评分）与注意事项。\n"
  );
}

function buildDataStatisticsPrompt(payload = {}) {
  const storeName = (payload.storeName || "").trim();
  const category = (payload.businessCategory || "").trim();
  const storeAddress = (payload.storeAddress || "").trim();
  const businessHours = (payload.businessHours || "").trim();

  const f = value => {
    if (value === null || value === undefined) return "未提供";
    if (typeof value === "string" && !value.trim()) return "未提供";
    return String(value);
  };

  return (
    "请基于以下30天运营数据，输出一份外卖店铺数据统计分析报告。\n" +
    "要求：只输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。\n\n" +
    "## 店铺信息\n" +
    `- 店铺名称：${storeName || "未提供"}\n` +
    `- 店铺地址：${storeAddress || "未提供"}\n` +
    `- 经营品类：${category || "未提供"}\n` +
    `- 营业时间：${businessHours || "未提供"}\n\n` +
    "## 核心漏斗数据（30天）\n" +
    `- 曝光人数：${f(payload.exposureCount)}\n` +
    `- 入店人数：${f(payload.visitCount)}\n` +
    `- 下单人数：${f(payload.orderCount)}\n` +
    `- 入店转化率：${f(payload.visitConversion)}%\n` +
    `- 下单转化率：${f(payload.orderConversion)}%\n\n` +
    "## 配送服务设置\n" +
    `- 起送价：${f(payload.minOrderPrice)}\n` +
    `- 配送费：${f(payload.deliveryFee)}\n` +
    `- 配送范围：${f(payload.deliveryRange)}\n\n` +
    "## 店铺权重与服务开通\n" +
    `- 闲时出餐时长：${f(payload.idleCookingTime)}分钟\n` +
    `- 忙时出餐时长：${f(payload.busyCookingTime)}分钟\n` +
    `- 青山公益：${f(payload.greenCharity)}\n` +
    `- 到店自取：${f(payload.selfPickup)}\n` +
    `- 接受预订单：${f(payload.preOrder)}\n` +
    `- 准时宝：${f(payload.onTimeGuarantee)}\n` +
    `- 放心吃：${f(payload.foodSafety)}\n\n` +
    "请分析：漏斗问题定位、配送竞争力、店铺权重设置影响、" +
    "以及最重要的3-5条可执行优化动作（按优先级排序）。\n"
  );
}

function buildPrompt(module, payload) {
  switch (module) {
    case "brand":
      return buildBrandPrompt(payload);
    case "market":
      return buildMarketPrompt(payload);
    case "store-activity":
      return buildStoreActivityPrompt(payload);
    case "data-statistics":
      return buildDataStatisticsPrompt(payload);
    default:
      throw new Error(`不支持的module: ${module}`);
  }
}

module.exports = {
  buildBrandPrompt,
  buildMarketPrompt,
  buildStoreActivityPrompt,
  buildDataStatisticsPrompt,
  buildPrompt
};
