function normalizeMarkdown(text = "") {
  let s = String(text).trim();
  if (s.startsWith("```")) {
    const parts = s.split("```");
    if (parts.length >= 3) {
      s = parts.slice(1, -1).join("```").trim();
      if (s.startsWith("markdown\n") || s.startsWith("md\n")) {
        s = s.split("\n").slice(1).join("\n").trim();
      }
    }
  }
  return s.trim();
}

function looksLikeHtml(text = "") {
  const s = String(text || "").toLowerCase();
  const markers = ["<div", "</div", "<p", "</p", "<h1", "<h2", "<h3", "<ul", "<ol", "<li", "</li"];
  const hits = markers.filter(m => s.includes(m)).length;
  return hits >= 3;
}

async function requestChatCompletions(fetchFn, cfg, payload) {
  const res = await fetchFn(cfg.baseUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`上游接口返回错误: ${res.status} ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("上游接口返回格式异常（缺少choices/message/content）");
  return normalizeMarkdown(content);
}

function buildMessages(system, userPrompt, imageDataUrl) {
  if (imageDataUrl) {
    return [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ];
  }
  return [
    { role: "system", content: system },
    { role: "user", content: userPrompt }
  ];
}

module.exports = {
  normalizeMarkdown,
  looksLikeHtml,
  requestChatCompletions,
  buildMessages
};
