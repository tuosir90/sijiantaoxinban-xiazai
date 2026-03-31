"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ModuleCard } from "@/components/module-card"
import { FormField } from "@/components/form-field"
import { CheckboxGroup } from "@/components/checkbox-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Target, Download, Loader2 } from "lucide-react"

const TARGET_GROUPS = [
  "白领上班族",
  "学生群体",
  "健身爱好者",
  "年轻消费者",
  "家庭用户",
  "夜宵用户",
]

export default function BrandPage() {
  const { toast } = useToast()
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
    const newErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) {
      newErrors.storeName = "请填写店铺名称"
    }
    if (!formData.category.trim()) {
      newErrors.category = "请填写经营品类"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast({
        variant: "destructive",
        title: "表单验证失败",
        description: "请填写必填字段",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        targetGroup: formData.targetGroup.join("、"),
        priceRange: `${formData.priceRange}元`,
      }

      const formDataObj = new FormData()
      formDataObj.append("module", "brand")
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
      const fileName = `${formData.storeName || "未命名店铺"}_品牌定位分析.pdf`
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
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            外卖店铺四件套生成平台
          </h1>
          <p className="mt-3 text-muted-foreground text-pretty">
            一站式外卖店铺策划方案，填写表单即可下载专业 PDF 报告
          </p>
        </div>

        <ModuleCard
          title="品牌定位分析"
          description="用于定位结论、差异化卖点与菜单结构建议"
          tag="品牌主线"
          icon={Target}
          accentColor="brand"
          gradientClass="gradient-brand"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="店铺名称" required error={errors.storeName}>
                <Input
                  placeholder="如：吴家牛羊肉馆"
                  value={formData.storeName}
                  onChange={(e) => updateField("storeName", e.target.value)}
                  className={errors.storeName ? "border-destructive" : ""}
                />
              </FormField>
              <FormField label="经营品类" required error={errors.category}>
                <Input
                  placeholder="如：牛羊肉、烧烤、快餐"
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={errors.category ? "border-destructive" : ""}
                />
              </FormField>
            </div>

            <FormField label="店铺地址">
              <Input
                placeholder="如：XX市XX区XX路"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </FormField>

            {/* Target Group */}
            <FormField label="目标客群">
              <CheckboxGroup
                options={TARGET_GROUPS}
                value={formData.targetGroup}
                onChange={(value) => updateField("targetGroup", value)}
              />
            </FormField>

            {/* Price Range */}
            <FormField label="价格区间（人均）" hint={`当前：${formData.priceRange} 元`}>
              <Slider
                value={[formData.priceRange]}
                onValueChange={(value) => updateField("priceRange", value[0])}
                min={10}
                max={120}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10 元</span>
                <span>120 元</span>
              </div>
            </FormField>

            {/* Main Products */}
            <FormField label="主营产品">
              <Input
                placeholder="如：手切牛肉面、麻辣香锅、招牌烤串"
                value={formData.mainProducts}
                onChange={(e) => updateField("mainProducts", e.target.value)}
              />
            </FormField>

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
