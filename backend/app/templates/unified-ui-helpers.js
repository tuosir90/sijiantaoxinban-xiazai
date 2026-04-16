(() => {
  const illegalFilenameChars = /[\\/:*?"<>|]/g;

  const isTauriEnvironment = () =>
    typeof window !== "undefined" &&
    window.__TAURI__ &&
    window.__TAURI__.core &&
    typeof window.__TAURI__.core.invoke === "function";

  const saveBinaryInTauri = async (bytes, filename, filters) => {
    const filePath = await window.__TAURI__.core.invoke("plugin:dialog|save", {
      options: {
        defaultPath: filename,
        title: "保存文件",
        filters
      }
    });
    if (!filePath) {
      return { canceled: true };
    }
    await window.__TAURI__.core.invoke(
      "plugin:fs|write_file",
      bytes,
      {
        headers: {
          path: encodeURIComponent(filePath),
          options: JSON.stringify({})
        }
      }
    );
    return { canceled: false, path: filePath };
  };

  const safeText = (el, text) => {
    if (el) {
      el.textContent = text || "";
    }
  };

  const sanitizeFilename = (name) =>
    (name || "").replace(illegalFilenameChars, "_").trim();

  function parseErrorMessage(rawText) {
    if (!rawText) {
      return "";
    }
    try {
      const data = JSON.parse(rawText);
      return data.detail || data.error || rawText;
    } catch {
      return rawText;
    }
  }

  const parseDispositionFilename = (header) => {
    if (!header) {
      return "";
    }
    const starMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (starMatch && starMatch[1]) {
      try {
        return decodeURIComponent(starMatch[1]);
      } catch {
        return starMatch[1];
      }
    }
    const normalMatch = header.match(/filename="?([^";]+)"?/i);
    return normalMatch ? normalMatch[1] : "";
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getSelectedLineId = () => {
    const checked = document.querySelector('input[name="reportLine"]:checked');
    return checked && checked.value ? checked.value : "line1";
  };

  window.UnifiedUiHelpers = {
    getSelectedLineId,
    isTauriEnvironment,
    parseDispositionFilename,
    parseErrorMessage,
    safeText,
    sanitizeFilename,
    saveBinaryInTauri,
    triggerDownload
  };
})();
