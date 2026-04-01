"use client"

import { useState } from "react"
import { Download, Target } from "lucide-react"
import { CheckboxGroup } from "@/components/checkbox-group"
import { DownloadConfirmDialog } from "@/components/download-confirm-dialog"
import { FormField } from "@/components/form-field"
import { ModuleCard } from "@/components/module-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { downloadReportPdf } from "@/lib/report-download"

const TARGET_GROUPS = ["白领上班族", "学生群体", "健身爱好者", "年轻消费者", "家庭用户", "夜宵用户"]

export function BrandSection() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: "",
    category: "",
    address: "",
    targetGroup: [] as string[],
    priceRange: 35,
    mainProducts: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) nextErrors.storeName = "请填写店铺名称"
    if (!formData.category.trim()) nextErrors.category = "请填写经营品类"
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
        module: "brand",
        payload: {
          ...formData,
          targetGroup: formData.targetGroup.join("、"),
          priceRange: `${formData.priceRange}元`,
        },
        filename: `${formData.storeName || "未命名店铺"}_品牌定位分析.pdf`,
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
      <ModuleCard title="品牌定位分析" description="用于定位结论、差异化卖点与菜单结构建议" tag="品牌主线" icon={Target} accentColor="brand" gradientClass="gradient-brand">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="店铺名称" required error={errors.storeName}>
              <Input placeholder="如：吴家牛羊肉馆" value={formData.storeName} onChange={(e) => updateField("storeName", e.target.value)} className={errors.storeName ? "border-destructive" : ""} />
            </FormField>
            <FormField label="经营品类" required error={errors.category}>
              <Input placeholder="如：牛羊肉、烧烤、快餐" value={formData.category} onChange={(e) => updateField("category", e.target.value)} className={errors.category ? "border-destructive" : ""} />
            </FormField>
          </div>
          <FormField label="店铺地址">
            <Input placeholder="如：XX市XX区XX路" value={formData.address} onChange={(e) => updateField("address", e.target.value)} />
          </FormField>
          <FormField label="目标客群">
            <CheckboxGroup options={TARGET_GROUPS} value={formData.targetGroup} onChange={(value) => updateField("targetGroup", value)} />
          </FormField>
          <FormField label="价格区间（人均）" hint={`当前：${formData.priceRange} 元`}>
            <Slider value={[formData.priceRange]} onValueChange={(value) => updateField("priceRange", value[0])} min={10} max={120} step={5} className="mt-2" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>10 元</span><span>120 元</span></div>
          </FormField>
          <FormField label="主营产品">
            <Input placeholder="如：手切牛肉面、麻辣香锅、招牌烤串" value={formData.mainProducts} onChange={(e) => updateField("mainProducts", e.target.value)} />
          </FormField>
          <div className="flex items-center gap-4 border-t pt-4">
            <Button onClick={openDownloadDialog} disabled={isLoading} size="lg" className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              下载 PDF
            </Button>
          </div>
        </div>
      </ModuleCard>
      <DownloadConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title="确认下载品牌定位分析" description="确认后将开始生成 PDF；在桌面端会弹出保存对话框，在浏览器中会直接开始下载。" loading={isLoading} onConfirm={handleConfirmDownload} />
    </>
  )
}
