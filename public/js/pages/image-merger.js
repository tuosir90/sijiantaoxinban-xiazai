/** 图片拼接工具（精简版）。 */

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function show(el, visible) {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  }

  function bytes(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
    return `${(v / 1024 / 1024).toFixed(1)} MB`;
  }

  const state = { items: [] };

  function setLoading(loading) {
    show($("loadingOverlay"), loading);
  }

  function syncCount() {
    const badge = $("imageCount");
    if (badge) badge.textContent = String(state.items.length);
  }

  function renderList() {
    const list = $("imageList");
    if (!list) return;
    list.innerHTML = "";
    syncCount();

    state.items.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "image-item";
      row.innerHTML = `
        <img class="image-preview" src="${it.dataUrl}" alt="预览" />
        <div class="image-info">
          <div class="image-name">${it.name}</div>
          <div class="image-size">${bytes(it.size)} · ${it.width}×${it.height}</div>
        </div>
        <div class="control-buttons">
          <button class="btn-control btn-up" type="button" title="上移"><i class="fas fa-arrow-up"></i></button>
          <button class="btn-control btn-down" type="button" title="下移"><i class="fas fa-arrow-down"></i></button>
          <button class="btn-control btn-remove" type="button" title="移除"><i class="fas fa-trash"></i></button>
        </div>
      `;

      const [btnUp, btnDown, btnRemove] = row.querySelectorAll("button");
      btnUp.addEventListener("click", () => moveItem(idx, -1));
      btnDown.addEventListener("click", () => moveItem(idx, 1));
      btnRemove.addEventListener("click", () => removeItem(idx));

      list.appendChild(row);
    });
  }

  function moveItem(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= state.items.length) return;
    const arr = state.items;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    renderList();
  }

  function removeItem(index) {
    state.items.splice(index, 1);
    renderList();
    show($("downloadBtn"), false);
    show($("previewCanvas"), false);
    show($("emptyPreview"), state.items.length === 0);
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () =>
          resolve({
            name: file.name || "图片",
            size: file.size || 0,
            width: img.naturalWidth,
            height: img.naturalHeight,
            dataUrl: reader.result,
            img
          });
        img.onerror = () => reject(new Error("图片解析失败"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(files) {
    const list = Array.from(files || []).filter(f => f && f.type && f.type.startsWith("image/"));
    if (!list.length) return;

    setLoading(true);
    try {
      for (const f of list) state.items.push(await readImage(f));
      renderList();
      show($("emptyPreview"), state.items.length === 0);
    } finally {
      setLoading(false);
    }
  }

  function getOptions() {
    const direction = ($("mergeDirection")?.value || "vertical").toLowerCase();
    const alignment = ($("imageAlignment")?.value || "center").toLowerCase();
    const spacing = Math.max(0, Math.min(50, Number($("imageSpacing")?.value || 0) || 0));
    return { direction, alignment, spacing };
  }

  function drawPreview() {
    if (!state.items.length) {
      alert("请先上传至少一张图片");
      return;
    }

    const { direction, alignment, spacing } = getOptions();
    const canvas = $("previewCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxW = Math.max(...state.items.map(i => i.width));
    const maxH = Math.max(...state.items.map(i => i.height));

    if (direction === "horizontal") {
      canvas.width = state.items.reduce((sum, i) => sum + i.width, 0) + spacing * (state.items.length - 1);
      canvas.height = maxH;
    } else {
      canvas.width = maxW;
      canvas.height = state.items.reduce((sum, i) => sum + i.height, 0) + spacing * (state.items.length - 1);
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let offset = 0;
    state.items.forEach(i => {
      let x = 0;
      let y = 0;

      if (direction === "horizontal") {
        x = offset;
        if (alignment === "top") y = 0;
        else if (alignment === "bottom") y = maxH - i.height;
        else y = Math.round((maxH - i.height) / 2);
        offset += i.width + spacing;
      } else {
        y = offset;
        if (alignment === "left") x = 0;
        else if (alignment === "right") x = maxW - i.width;
        else x = Math.round((maxW - i.width) / 2);
        offset += i.height + spacing;
      }

      ctx.drawImage(i.img, x, y, i.width, i.height);
    });

    show($("emptyPreview"), false);
    show(canvas, true);
    show($("downloadBtn"), true);
  }

  async function downloadImage() {
    const canvas = $("previewCanvas");
    if (!canvas) return;
    if (canvas.width === 0 || canvas.height === 0) {
      alert("请先生成预览");
      return;
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      alert("导出失败");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merged_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bindUpload() {
    const input = $("imageInput");
    const area = $("uploadArea");
    const btn = $("selectImagesBtn");

    if (btn && input) btn.addEventListener("click", () => input.click());
    if (input) input.addEventListener("change", () => addFiles(input.files));

    if (area) {
      area.addEventListener("click", () => input && input.click());
      area.addEventListener("dragover", e => e.preventDefault());
      area.addEventListener("drop", e => {
        e.preventDefault();
        addFiles(e.dataTransfer?.files);
      });
    }
  }

  window.generatePreview = drawPreview;
  window.downloadMergedImage = downloadImage;
  window.goBackToMarketResearch = function () {
    window.location.href = "market-research.html";
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindUpload();
    renderList();
    show($("emptyPreview"), true);
  });
})();
