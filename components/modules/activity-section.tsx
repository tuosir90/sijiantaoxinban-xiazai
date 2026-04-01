"use client"

import { useState } from "react"
import { Download, Megaphone } from "lucide-react"
import { DownloadConfirmDialog } from "@/components/download-confirm-dialog"
import { FormField } from "@/components/form-field"
import { ModuleCard } from "@/components/module-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { downloadReportPdf } from "@/lib/report-download"

export function ActivitySection() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: "",
    storeAddress: "",
    businessCategory: "",
    businessHours: "",
    menuItems: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) nextErrors.storeName = "请填写店铺名称"
    if (!formData.businessCategory.trim()) nextErrors.businessCategory = "请填写经营品类"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openDownloadDialog = () => {
    if (!validate()) {
      toast({ variant: "destructive", title: "表单验证失败", description: "请填写必填字段" })
      return
    }
    setDialogOpen(true)
  }

  const handleConfirmDownload = async () => {
    setIsLoading(true)
    try {
      const status = await downloadReportPdf({
        module: "store-activity",
        payload: formData,
        filename: `${formData.storeName || "未命名店铺"}_店铺活动方案.pdf`,
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
      <ModuleCard title="店铺活动方案" description="围绕满减、返券与套餐搭配给出可落地方案" tag="活动策划" icon={Megaphone} accentColor="activity" gradientClass="gradient-activity">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="店铺名称" required error={errors.storeName}>
              <Input placeholder="如：吴家牛羊肉馆" value={formData.storeName} onChange={(e) => updateField("storeName", e.target.value)} className={errors.storeName ? "border-destructive" : ""} />
            </FormField>
            <FormField label="店铺地址">
              <Input placeholder="如：XX市XX区XX路" value={formData.storeAddress} onChange={(e) => updateField("storeAddress", e.target.value)} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="经营品类" required error={errors.businessCategory}>
              <Input placeholder="如：牛羊肉、烧烤" value={formData.businessCategory} onChange={(e) => updateField("businessCategory", e.target.value)} className={errors.businessCategory ? "border-destructive" : ""} />
            </FormField>
            <FormField label="营业时间">
              <Input placeholder="如：10:00-22:00" value={formData.businessHours} onChange={(e) => updateField("businessHours", e.target.value)} />
            </FormField>
          </div>
          <FormField label="菜品列表" hint="每行一个菜品，格式：菜品名 价格">
            <Textarea placeholder={"如：\n招牌牛肉面 26\n羊肉串 8\n秘制卤味拼盘 28"} value={formData.menuItems} onChange={(e) => updateField("menuItems", e.target.value)} className="min-h-[150px]" />
          </FormField>
          <div className="flex items-center gap-4 border-t pt-4">
            <Button onClick={openDownloadDialog} disabled={isLoading} size="lg" className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              下载 PDF
            </Button>
          </div>
        </div>
      </ModuleCard>
      <DownloadConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title="确认下载店铺活动方案" description="确认后将根据店铺基础信息和菜品列表生成活动方案 PDF，并触发下载或保存弹窗。" loading={isLoading} onConfirm={handleConfirmDownload} />
    </>
  )
}
