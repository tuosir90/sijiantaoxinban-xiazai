"use client"

import { useState } from "react"
import { BarChart3, Download } from "lucide-react"
import { DownloadConfirmDialog } from "@/components/download-confirm-dialog"
import { FormField } from "@/components/form-field"
import { ModuleCard } from "@/components/module-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { downloadReportPdf } from "@/lib/report-download"

export function StatisticsSection() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: "", storeAddress: "", businessCategory: "", businessHours: "",
    exposureCount: "", visitCount: "", orderCount: "", visitConversion: "", orderConversion: "",
    minOrderPrice: "", deliveryFee: "", deliveryRange: "", idleCookingTime: "15", busyCookingTime: "20",
    greenCharity: "是", selfPickup: "是", preOrder: "是", onTimeGuarantee: "是", foodSafety: "是",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const calcRate = (a: string, b: string) => {
    const x = parseFloat(a) || 0
    const y = parseFloat(b) || 0
    return x > 0 && y > 0 ? ((y / x) * 100).toFixed(2) : ""
  }

  const visitRate = calcRate(formData.exposureCount, formData.visitCount)
  const orderRate = calcRate(formData.visitCount, formData.orderCount)

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    ;["storeName", "storeAddress", "businessCategory", "businessHours", "exposureCount", "visitCount", "orderCount", "minOrderPrice", "deliveryFee", "deliveryRange"].forEach((key) => {
      if (!formData[key as keyof typeof formData].trim()) nextErrors[key] = "请填写此字段"
    })
    const exposure = parseFloat(formData.exposureCount) || 0
    const visit = parseFloat(formData.visitCount) || 0
    const order = parseFloat(formData.orderCount) || 0
    if (visit > exposure && exposure > 0) nextErrors.visitCount = "入店人数不能超过曝光人数"
    if (order > visit && visit > 0) nextErrors.orderCount = "下单人数不能超过入店人数"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openDownloadDialog = () => {
    if (!validate()) {
      toast({ variant: "destructive", title: "表单验证失败", description: "请填写必填字段并检查数据" })
      return
    }
    setDialogOpen(true)
  }

  const handleConfirmDownload = async () => {
    setIsLoading(true)
    try {
      const status = await downloadReportPdf({
        module: "data-statistics",
        payload: {
          ...formData,
          exposureCount: parseFloat(formData.exposureCount),
          visitCount: parseFloat(formData.visitCount),
          orderCount: parseFloat(formData.orderCount),
          visitConversion: formData.visitConversion || visitRate,
          orderConversion: formData.orderConversion || orderRate,
          minOrderPrice: parseFloat(formData.minOrderPrice),
          deliveryFee: parseFloat(formData.deliveryFee),
          deliveryRange: parseFloat(formData.deliveryRange),
          idleCookingTime: parseFloat(formData.idleCookingTime),
          busyCookingTime: parseFloat(formData.busyCookingTime),
        },
        filename: `${formData.storeName || "未命名店铺"}_数据统计分析.pdf`,
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

  const serviceFields = [
    { key: "greenCharity", label: "青山公益" }, { key: "selfPickup", label: "到店自取" },
    { key: "preOrder", label: "接受预订单" }, { key: "onTimeGuarantee", label: "准时宝" }, { key: "foodSafety", label: "放心吃" },
  ]

  return (
    <>
      <ModuleCard title="数据统计分析" description="填写 30 天核心数据，自动给出漏斗与配送优化建议" tag="运营诊断" icon={BarChart3} accentColor="statistics" gradientClass="gradient-statistics">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="店铺名称" required error={errors.storeName}><Input placeholder="如：吴家牛羊肉馆" value={formData.storeName} onChange={(e) => updateField("storeName", e.target.value)} className={errors.storeName ? "border-destructive" : ""} /></FormField>
              <FormField label="店铺地址" required error={errors.storeAddress}><Input placeholder="如：XX市XX区XX路" value={formData.storeAddress} onChange={(e) => updateField("storeAddress", e.target.value)} className={errors.storeAddress ? "border-destructive" : ""} /></FormField>
              <FormField label="经营品类" required error={errors.businessCategory}><Input placeholder="如：牛羊肉、快餐" value={formData.businessCategory} onChange={(e) => updateField("businessCategory", e.target.value)} className={errors.businessCategory ? "border-destructive" : ""} /></FormField>
              <FormField label="营业时间" required error={errors.businessHours}><Input placeholder="如：10:00-22:00" value={formData.businessHours} onChange={(e) => updateField("businessHours", e.target.value)} className={errors.businessHours ? "border-destructive" : ""} /></FormField>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">流量数据（30天）</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="曝光人数" required error={errors.exposureCount}><Input type="number" value={formData.exposureCount} onChange={(e) => updateField("exposureCount", e.target.value)} className={errors.exposureCount ? "border-destructive" : ""} /></FormField>
              <FormField label="入店人数" required error={errors.visitCount}><Input type="number" value={formData.visitCount} onChange={(e) => updateField("visitCount", e.target.value)} className={errors.visitCount ? "border-destructive" : ""} /></FormField>
              <FormField label="下单人数" required error={errors.orderCount}><Input type="number" value={formData.orderCount} onChange={(e) => updateField("orderCount", e.target.value)} className={errors.orderCount ? "border-destructive" : ""} /></FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="入店转化率（%）" hint={visitRate ? `自动计算：${visitRate}%` : ""}><Input type="number" step="0.01" value={formData.visitConversion} onChange={(e) => updateField("visitConversion", e.target.value)} /></FormField>
              <FormField label="下单转化率（%）" hint={orderRate ? `自动计算：${orderRate}%` : ""}><Input type="number" step="0.01" value={formData.orderConversion} onChange={(e) => updateField("orderConversion", e.target.value)} /></FormField>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">配送设置</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="起送价" required error={errors.minOrderPrice}><Input type="number" value={formData.minOrderPrice} onChange={(e) => updateField("minOrderPrice", e.target.value)} className={errors.minOrderPrice ? "border-destructive" : ""} /></FormField>
              <FormField label="配送费" required error={errors.deliveryFee}><Input type="number" value={formData.deliveryFee} onChange={(e) => updateField("deliveryFee", e.target.value)} className={errors.deliveryFee ? "border-destructive" : ""} /></FormField>
              <FormField label="配送范围（公里）" required error={errors.deliveryRange}><Input type="number" step="0.1" value={formData.deliveryRange} onChange={(e) => updateField("deliveryRange", e.target.value)} className={errors.deliveryRange ? "border-destructive" : ""} /></FormField>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">服务设置</h3>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
              {serviceFields.map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <Select value={formData[key as keyof typeof formData]} onValueChange={(value) => updateField(key, value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="是">是</SelectItem><SelectItem value="否">否</SelectItem></SelectContent>
                  </Select>
                </FormField>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 border-t pt-4">
            <Button onClick={openDownloadDialog} disabled={isLoading} size="lg" className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              下载 PDF
            </Button>
          </div>
        </div>
      </ModuleCard>
      <DownloadConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title="确认下载数据统计分析" description="确认后将根据近 30 天的核心经营数据生成诊断报告 PDF，并触发下载或保存弹窗。" loading={isLoading} onConfirm={handleConfirmDownload} />
    </>
  )
}
