(function () {
  function ensureLib(name) {
    if (!window[name]) throw new Error(`缺少依赖库：${name}`);
  }

  async function renderReport({ module, markdown, meta, screenshotDataUrl, createdAt }, container) {
    ensureLib("markdownit");
    const md = window.markdownit({ html: false, linkify: true, typographer: true }).enable("table").enable("strikethrough");
    const contentHtml = md.render(markdown || "");
    const dateText = (createdAt || "").replace("T", " ").slice(0, 19);
    const html = window.ReportTemplate.buildReportHtml({
      module,
      title: meta?.title || "",
      subtitle: meta?.subtitle || "",
      dateText,
      screenshotDataUrl,
      contentHtml,
      rawMarkdown: markdown || ""
    });
    container.innerHTML = html;
  }

  async function downloadPdf(container, filename) {
    ensureLib("html2pdf");
    await document.fonts.ready;
    return window.html2pdf().from(container).set({
      margin: [10, 10, 10, 10],
      filename: filename || "report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).save();
  }

  window.ReportRenderer = { renderReport, downloadPdf };
})();
