const { readEnv } = require("./env");
const { buildPrompt } = require("./prompts");
const { buildMeta, safeModule } = require("./meta");
const { buildMessages, looksLikeHtml, requestChatCompletions } = require("./upstream");

async function handleGenerate(body, options = {}) {
  const env = options.env || process.env;
  const fetchFn = options.fetchFn || fetch;
  const module = safeModule(String(body.module || "").trim());
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const screenshotDataUrl = body.screenshotDataUrl || null;

  const apiKey = readEnv("UPSTREAM_API_KEY", "", env);
  const baseUrl = readEnv("UPSTREAM_BASE_URL", "https://jeniya.top/v1/chat/completions", env);
  if (!apiKey) throw new Error("未配置UPSTREAM_API_KEY，无法调用上游接口");

  const modelDefault = readEnv("UPSTREAM_MODEL_DEFAULT", "gemini-2.5-flash-lite", env);
  const modelBrand = readEnv("UPSTREAM_MODEL_BRAND", "", env);
  const modelMarket = readEnv("UPSTREAM_MODEL_MARKET", "", env);
  const modelStoreActivity = readEnv("UPSTREAM_MODEL_STORE_ACTIVITY", "", env);
  const modelDataStatistics = readEnv("UPSTREAM_MODEL_DATA_STATISTICS", "", env);

  let model = modelDefault;
  if (module === "brand" && modelBrand) model = modelBrand;
  if (module === "market" && modelMarket) model = modelMarket;
  if (module === "store-activity" && modelStoreActivity) model = modelStoreActivity;
  if (module === "data-statistics" && modelDataStatistics) model = modelDataStatistics;

  const system = "你是一位资深的餐饮外卖运营与市场分析专家。你的目标是输出清晰、可执行、可落地的建议。严格输出Markdown正文，不要输出任何问候/开场白；不要输出HTML标签；不要用```包裹全文。";
  const prompt = buildPrompt(module, payload);
  const messages = buildMessages(system, prompt, module === "market" ? screenshotDataUrl : null);

  const payloadBody = {
    model,
    messages,
    temperature: 0.8,
    max_tokens: 16384,
    stream: false
  };

  let markdown = await requestChatCompletions(fetchFn, { baseUrl, apiKey }, payloadBody);
  if (looksLikeHtml(markdown)) {
    const repairPrompt =
      "请将下面内容转换为Markdown正文（只输出Markdown，不要HTML，不要```包裹全文），保持信息完整，不要添加额外内容：\n\n" +
      markdown.slice(0, 12000);
    const repairMessages = buildMessages("你是一位专业内容编辑，擅长将文本整理为结构清晰的Markdown。", repairPrompt, null);
    const repairBody = { ...payloadBody, messages: repairMessages, temperature: 0.2 };
    markdown = await requestChatCompletions(fetchFn, { baseUrl, apiKey }, repairBody);
  }

  const meta = buildMeta(module, payload);
  return {
    module,
    markdown,
    meta,
    screenshot_data_url: screenshotDataUrl,
    created_at: new Date().toISOString()
  };
}

module.exports = { handleGenerate };
