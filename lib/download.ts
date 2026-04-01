"use client"

type TauriDialogFilter = {
  name: string
  extensions: string[]
}

type SaveResult = {
  canceled: boolean
  path?: string
}

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke?: (command: string, payload?: unknown) => Promise<any>
      }
    }
  }
}

export function isTauriSaveSupported() {
  return typeof window !== "undefined" &&
    typeof window.__TAURI__?.core?.invoke === "function"
}

export async function saveBlobWithDialog(
  blob: Blob,
  filename: string,
  filters: TauriDialogFilter[],
) {
  if (isTauriSaveSupported()) {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    return saveBinaryInTauri(bytes, filename, filters)
  }

  triggerBrowserDownload(blob, filename)
  return { canceled: false }
}

async function saveBinaryInTauri(
  bytes: Uint8Array,
  filename: string,
  filters: TauriDialogFilter[],
): Promise<SaveResult> {
  const invoke = window.__TAURI__?.core?.invoke
  if (!invoke) {
    return { canceled: true }
  }

  const filePath = await invoke("plugin:dialog|save", {
    options: {
      defaultPath: filename,
      title: "保存文件",
      filters,
    },
  })

  if (!filePath) {
    return { canceled: true }
  }

  await invoke("plugin:fs|write_file", {
    path: filePath,
    contents: Array.from(bytes),
  })

  return { canceled: false, path: String(filePath) }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
