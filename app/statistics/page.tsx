"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { ModuleCard } from "@/components/module-card"
import { FormField } from "@/components/form-field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, Download, Loader2 } from "lucide-react"

export default function StatisticsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: "",
    storeAddress: "",
    businessCategory: "",
    businessHours: "",
    exposureCount: "",
    visitCount: "",
    orderCount: "",
    visitConversion: "",
    orderConversion: "",
    minOrderPrice: "",
    deliveryFee: "",
    deliveryRange: "",
    idleCookingTime: "15",
    busyCookingTime: "20",
    greenCharity: "是",
    selfPickup: "是",
    preOrder: "是",
    onTimeGuarantee: "是",
    foodSafety: "是",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  // Auto-calculate conversion rates
  const calculatedVisitConversion = useMemo(() => {
    const exposure = parseFloat(formData.exposureCount) || 0
    const visit = parseFloat(formData.visitCount) || 0
    if (exposure > 0 && visit > 0) {
      return ((visit / exposure) * 100).toFixed(2)
    }
    return ""
  }, [formData.exposureCount, formData.visitCount])

  const calculatedOrderConversion = useMemo(() => {
    const visit = parseFloat(formData.visitCount) || 0
    const order = parseFloat(formData.orderCount) || 0
    if (visit > 0 && order > 0) {
      return ((order / visit) * 100).toFixed(2)
    }
    return ""
  }, [formData.visitCount, formData.orderCount])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const requiredFields = [
      { key: "storeName", label: "店铺名称" },
      { key: "storeAddress", label: "店铺地址" },
      { key: "businessCategory", label: "经营品类" },
      { key: "businessHours", label: "营业时间" },
      { key: "exposureCount", label: "曝光人数" },
      { key: "visitCount", label: "入店人数" },
      { key: "orderCount", label: "下单人数" },
      { key: "minOrderPrice", label: "起送价" },
      { key: "deliveryFee", label: "配送费" },
      { key: "deliveryRange", label: "配送范围" },
    ]

    requiredFields.forEach(({ key, label }) => {
      if (!formData[key as keyof typeof formData].toString().trim()) {
        newErrors[key] = `请填写${label}`
      }
    })

    // Validate logic
    const exposure = parseFloat(formData.exposureCount) || 0
    const visit = parseFloat(formData.visitCount) || 0
    const order = parseFloat(formData.orderCount) || 0

    if (visit > exposure && exposure > 0) {
      newErrors.visitCount = "入店人数不能超过曝光人数"
    }
    if (order > visit && visit > 0) {
      newErrors.orderCount = "下单人数不能超过入店人数"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast({
        variant: "destructive",
        title: "表单验证失败",
        description: "请填写必填字段并检查数据",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        exposureCount: parseFloat(formData.exposureCount),
        visitCount: parseFloat(formData.visitCount),
        orderCount: parseFloat(formData.orderCount),
        visitConversion: formData.visitConversion || calculatedVisitConversion,
        orderConversion: formData.orderConversion || calculatedOrderConversion,
        minOrderPrice: parseFloat(formData.minOrderPrice),
        deliveryFee: parseFloat(formData.deliveryFee),
        deliveryRange: parseFloat(formData.deliveryRange),
        idleCookingTime: parseFloat(formData.idleCookingTime),
        busyCookingTime: parseFloat(formData.busyCookingTime),
      }

      const formDataObj = new FormData()
      formDataObj.append("module", "data-statistics")
      formDataObj.append("payload_json", JSON.stringify(payload))

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formDataObj,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "生成失败"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const fileName = `${formData.storeName || "未命名店铺"}_数据统计分析.pdf`
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast({
        variant: "success",
        title: "生成成功",
        description: "PDF 已开始下载",
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      <Toaster />
      
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <ModuleCard
          title="数据统计分析"
          description="填写 30 天核心数据，自动给出漏斗与配送优化建议"
          tag="运营诊断"
          icon={BarChart3}
          accentColor="statistics"
          gradientClass="gradient-statistics"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">基本信息</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="店铺名称" required error={errors.storeName}>
                  <Input
                    placeholder="如：吴家牛羊肉馆"
                    value={formData.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    className={errors.storeName ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="店铺地址" required error={errors.storeAddress}>
                  <Input
                    placeholder="如：XX市XX区XX路"
                    value={formData.storeAddress}
                    onChange={(e) => updateField("storeAddress", e.target.value)}
                    className={errors.storeAddress ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="经营品类" required error={errors.businessCategory}>
                  <Input
                    placeholder="如：牛羊肉、快餐"
                    value={formData.businessCategory}
                    onChange={(e) => updateField("businessCategory", e.target.value)}
                    className={errors.businessCategory ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="营业时间" required error={errors.businessHours}>
                  <Input
                    placeholder="如：10:00-22:00"
                    value={formData.businessHours}
                    onChange={(e) => updateField("businessHours", e.target.value)}
                    className={errors.businessHours ? "border-destructive" : ""}
                  />
                </FormField>
              </div>
            </div>

            {/* Traffic Data */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">流量数据（30天）</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="曝光人数" required error={errors.exposureCount}>
                  <Input
                    type="number"
                    placeholder="如：38000"
                    value={formData.exposureCount}
                    onChange={(e) => updateField("exposureCount", e.target.value)}
                    className={errors.exposureCount ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="入店人数" required error={errors.visitCount}>
                  <Input
                    type="number"
                    placeholder="如：4200"
                    value={formData.visitCount}
                    onChange={(e) => updateField("visitCount", e.target.value)}
                    className={errors.visitCount ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="下单人数" required error={errors.orderCount}>
                  <Input
                    type="number"
                    placeholder="如：1260"
                    value={formData.orderCount}
                    onChange={(e) => updateField("orderCount", e.target.value)}
                    className={errors.orderCount ? "border-destructive" : ""}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField 
                  label="入店转化率（%）" 
                  hint={calculatedVisitConversion ? `自动计算：${calculatedVisitConversion}%` : ""}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="如：11.05"
                    value={formData.visitConversion}
                    onChange={(e) => updateField("visitConversion", e.target.value)}
                  />
                </FormField>
                <FormField 
                  label="下单转化率（%）" 
                  hint={calculatedOrderConversion ? `自动计算：${calculatedOrderConversion}%` : ""}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="如：29.6"
                    value={formData.orderConversion}
                    onChange={(e) => updateField("orderConversion", e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">配送设置</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="起送价" required error={errors.minOrderPrice}>
                  <Input
                    type="number"
                    placeholder="如：25"
                    value={formData.minOrderPrice}
                    onChange={(e) => updateField("minOrderPrice", e.target.value)}
                    className={errors.minOrderPrice ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="配送费" required error={errors.deliveryFee}>
                  <Input
                    type="number"
                    placeholder="如：3"
                    value={formData.deliveryFee}
                    onChange={(e) => updateField("deliveryFee", e.target.value)}
                    className={errors.deliveryFee ? "border-destructive" : ""}
                  />
                </FormField>
                <FormField label="配送范围（公里）" required error={errors.deliveryRange}>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="如：3"
                    value={formData.deliveryRange}
                    onChange={(e) => updateField("deliveryRange", e.target.value)}
                    className={errors.deliveryRange ? "border-destructive" : ""}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="闲时出餐时长（分钟）" hint="默认 15 分钟">
                  <Input
                    type="number"
                    value={formData.idleCookingTime}
                    onChange={(e) => updateField("idleCookingTime", e.target.value)}
                    readOnly
                    className="bg-muted"
                  />
                </FormField>
                <FormField label="忙时出餐时长（分钟）" hint="默认 20 分钟">
                  <Input
                    type="number"
                    value={formData.busyCookingTime}
                    onChange={(e) => updateField("busyCookingTime", e.target.value)}
                    readOnly
                    className="bg-muted"
                  />
                </FormField>
              </div>
            </div>

            {/* Service Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">服务设置</h3>
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
                {[
                  { key: "greenCharity", label: "青山公益" },
                  { key: "selfPickup", label: "到店自取" },
                  { key: "preOrder", label: "接受预订单" },
                  { key: "onTimeGuarantee", label: "准时宝" },
                  { key: "foodSafety", label: "放心吃" },
                ].map(({ key, label }) => (
                  <FormField key={key} label={label}>
                    <Select
                      value={formData[key as keyof typeof formData]}
                      onValueChange={(value) => updateField(key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="是">是</SelectItem>
                        <SelectItem value="否">否</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="lg"
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    下载 PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </ModuleCard>
      </main>
    </div>
  )
}
