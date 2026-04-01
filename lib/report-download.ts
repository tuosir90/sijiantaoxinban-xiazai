"use client"

import { saveBlobWithDialog } from "@/lib/download"

type ReportModule = "brand" | "market" | "store-activity" | "data-statistics"

type DownloadReportParams = {
  module: ReportModule
  payload: Record<string, unknown>
  screenshot?: File | null
  filename: string
}

export async function downloadReportPdf({
  module,
  payload,
  screenshot,
  filename,
}: DownloadReportParams) {
  const formData = new FormData()
  formData.append("module", module)
  formData.append("payload_json", JSON.stringify(payload))

  if (screenshot) {
    formData.append("screenshot", screenshot)
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseResponseError(response))
  }

  const blob = await response.blob()
  const result = await saveBlobWithDialog(blob, filename, [
    { name: "PDF文件", extensions: ["pdf"] },
    { name: "所有文件", extensions: ["*"] },
  ])

  return result.canceled ? "canceled" : "saved"
}

async function parseResponseError(response: Response) {
  const errorText = await response.text()
  try {
    const errorData = JSON.parse(errorText)
    return errorData.detail || errorData.error || "生成失败"
  } catch {
    return errorText || "生成失败"
  }
}
