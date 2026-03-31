"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { ModuleCard } from "@/components/module-card"
import { FormField } from "@/components/form-field"
import { FileUpload } from "@/components/file-upload"
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
import { Store, Download, Loader2, ImageIcon } from "lucide-react"

const AREA_TYPES = [
  "写字楼商圈",
  "社区商圈",
  "高校商圈",
  "综合商业区",
  "交通枢纽",
]

export default function MarketPage() {
  const { toast } = useToast()
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
    const newErrors: Record<string, string> = {}
    if (!formData.storeName.trim()) {
      newErrors.storeName = "请填写店铺名称"
    }
    if (!formData.location.trim()) {
      newErrors.location = "请填写所在位置"
    }
    if (!formData.screenshot) {
      newErrors.screenshot = "请上传竞品截图"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast({
        variant: "destructive",
        title: "表单验证失败",
        description: "请填写必填字段并上传截图",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        storeName: formData.storeName,
        location: formData.location,
        areaType: formData.areaType,
      }

      const formDataObj = new FormData()
      formDataObj.append("module", "market")
      formDataObj.append("payload_json", JSON.stringify(payload))
      if (formData.screenshot) {
        formDataObj.append("screenshot", formData.screenshot)
      }

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
      const fileName = `${formData.storeName || "未命名店铺"}_商圈调研分析.pdf`
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
          title="商圈调研分析"
          description="关注客群、消费力与竞争强度，支持截图辅助分析"
          tag="商圈洞察"
          icon={Store}
          accentColor="market"
          gradientClass="gradient-market"
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
              <FormField label="所在位置" required error={errors.location}>
                <Input
                  placeholder="如：XX地铁口/写字楼群"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className={errors.location ? "border-destructive" : ""}
                />
              </FormField>
            </div>

            <FormField label="商圈类型" required>
              <Select
                value={formData.areaType}
                onValueChange={(value) => updateField("areaType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择商圈类型" />
                </SelectTrigger>
                <SelectContent>
                  {AREA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Screenshot Upload */}
            <FormField 
              label="竞品截图" 
              required 
              error={errors.screenshot}
              hint="用于提取竞品店铺信息与对比分析，建议包含店铺列表信息"
            >
              <FileUpload
                value={formData.screenshot}
                onChange={(file) => updateField("screenshot", file)}
                required
                className={errors.screenshot ? "border-destructive" : ""}
              />
            </FormField>

            {/* Image Merger Link */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">需要拼接多张截图？</p>
                <p className="text-xs text-muted-foreground">
                  使用图片拼接工具将多张截图合并成一张
                </p>
              </div>
              <Link href="/image-merger">
                <Button variant="outline" size="sm">
                  打开工具
                </Button>
              </Link>
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
