"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, ImageIcon, Store } from "lucide-react"
import { DownloadConfirmDialog } from "@/components/download-confirm-dialog"
import { FileUpload } from "@/components/file-upload"
import { FormField } from "@/components/form-field"
import { ModuleCard } from "@/components/module-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { downloadReportPdf } from "@/lib/report-download"

const AREA_TYPES = ["写字楼商圈", "社区商圈", "高校商圈", "综合商业区", "交通枢纽"]

export function MarketSection() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: "",
    location: "",
    areaType: "写字楼商圈",
    screenshot: null as File | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) nextErrors.storeName = "请填写店铺名称"
    if (!formData.location.trim()) nextErrors.location = "请填写所在位置"
    if (!formData.screenshot) nextErrors.screenshot = "请上传竞品截图"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openDownloadDialog = () => {
    if (!validate()) {
      toast({ variant: "destructive", title: "表单验证失败", description: "请填写必填字段并上传截图" })
      return
    }
    setDialogOpen(true)
  }

  const handleConfirmDownload = async () => {
    setIsLoading(true)
    try {
      const status = await downloadReportPdf({
        module: "market",
        payload: {
          storeName: formData.storeName,
          location: formData.location,
          areaType: formData.areaType,
        },
        screenshot: formData.screenshot,
        filename: `${formData.storeName || "未命名店铺"}_商圈调研分析.pdf`,
      })
      setDialogOpen(false)
      toast({
        variant: "success",
        title: status === "canceled" ? "已取消保存" : "生成成功",
        description: status === "canceled" ? "你已取消本次保存" : "文件已开始下载或弹出保存窗口",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ModuleCard title="商圈调研分析" description="关注客群、消费力与竞争强度，支持截图辅助分析" tag="商圈洞察" icon={Store} accentColor="market" gradientClass="gradient-market">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="店铺名称" required error={errors.storeName}>
              <Input placeholder="如：吴家牛羊肉馆" value={formData.storeName} onChange={(e) => updateField("storeName", e.target.value)} className={errors.storeName ? "border-destructive" : ""} />
            </FormField>
            <FormField label="所在位置" required error={errors.location}>
              <Input placeholder="如：XX地铁口/写字楼群" value={formData.location} onChange={(e) => updateField("location", e.target.value)} className={errors.location ? "border-destructive" : ""} />
            </FormField>
          </div>
          <FormField label="商圈类型" required>
            <Select value={formData.areaType} onValueChange={(value) => updateField("areaType", value)}>
              <SelectTrigger><SelectValue placeholder="选择商圈类型" /></SelectTrigger>
              <SelectContent>{AREA_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="竞品截图" required error={errors.screenshot} hint="用于提取竞品店铺信息与对比分析，建议包含店铺列表信息">
            <FileUpload value={formData.screenshot} onChange={(file) => updateField("screenshot", file)} required className={errors.screenshot ? "border-destructive" : ""} />
          </FormField>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><ImageIcon className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium">需要拼接多张截图？</p>
              <p className="text-xs text-muted-foreground">使用图片拼接工具将多张截图合并成一张</p>
            </div>
            <Link href="/image-merger"><Button variant="outline" size="sm" className="rounded-full">打开工具</Button></Link>
          </div>
          <div className="flex items-center gap-4 border-t pt-4">
            <Button onClick={openDownloadDialog} disabled={isLoading} size="lg" className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              下载 PDF
            </Button>
          </div>
        </div>
      </ModuleCard>
      <DownloadConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title="确认下载商圈调研分析" description="确认后将生成包含截图分析的 PDF；在桌面端会弹出保存对话框，在浏览器中会直接开始下载。" loading={isLoading} onConfirm={handleConfirmDownload} />
    </>
  )
}
