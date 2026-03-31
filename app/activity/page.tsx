"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ModuleCard } from "@/components/module-card"
import { FormField } from "@/components/form-field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, Download, Loader2 } from "lucide-react"

export default function ActivityPage() {
  const { toast } = useToast()
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
    const newErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) {
      newErrors.storeName = "请填写店铺名称"
    }
    if (!formData.businessCategory.trim()) {
      newErrors.businessCategory = "请填写经营品类"
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
      const formDataObj = new FormData()
      formDataObj.append("module", "store-activity")
      formDataObj.append("payload_json", JSON.stringify(formData))

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
      const fileName = `${formData.storeName || "未命名店铺"}_店铺活动方案.pdf`
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
          title="店铺活动方案"
          description="围绕满减、返券与套餐搭配给出可落地方案"
          tag="活动策划"
          icon={Megaphone}
          accentColor="activity"
          gradientClass="gradient-activity"
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
              <FormField label="店铺地址">
                <Input
                  placeholder="如：XX市XX区XX路"
                  value={formData.storeAddress}
                  onChange={(e) => updateField("storeAddress", e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="经营品类" required error={errors.businessCategory}>
                <Input
                  placeholder="如：牛羊肉、烧烤"
                  value={formData.businessCategory}
                  onChange={(e) => updateField("businessCategory", e.target.value)}
                  className={errors.businessCategory ? "border-destructive" : ""}
                />
              </FormField>
              <FormField label="营业时间">
                <Input
                  placeholder="如：10:00-22:00"
                  value={formData.businessHours}
                  onChange={(e) => updateField("businessHours", e.target.value)}
                />
              </FormField>
            </div>

            {/* Menu Items */}
            <FormField 
              label="菜品列表" 
              hint="每行一个菜品，格式：菜品名 价格"
            >
              <Textarea
                placeholder={`如：
招牌牛肉面 26
羊肉串 8
秘制卤味拼盘 28`}
                value={formData.menuItems}
                onChange={(e) => updateField("menuItems", e.target.value)}
                className="min-h-[150px]"
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
