"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/form-field"
import { Input } from "@/components/ui/input"
import { DownloadConfirmDialog } from "@/components/download-confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { 
  ImageIcon, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Download, 
  RefreshCw,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { saveBlobWithDialog } from "@/lib/download"
import { cn } from "@/lib/utils"

interface ImageItem {
  id: string
  name: string
  size: number
  width: number
  height: number
  dataUrl: string
  img: HTMLImageElement
}

export default function ImageMergerPage() {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [images, setImages] = useState<ImageItem[]>([])
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical")
  const [alignment, setAlignment] = useState<"center" | "left" | "right">("center")
  const [spacing, setSpacing] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasPreview, setHasPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const readImage = (file: File): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            dataUrl: reader.result as string,
            img,
          })
        }
        img.onerror = () => reject(new Error("图片解析失败"))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error("读取文件失败"))
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "无效文件",
        description: "请选择图片文件",
      })
      return
    }

    setIsProcessing(true)
    try {
      const newImages = await Promise.all(imageFiles.map(readImage))
      setImages((prev) => [...prev, ...newImages])
      setHasPreview(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "读取失败",
        description: error instanceof Error ? error.message : "请重试",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const moveImage = (index: number, delta: number) => {
    const newIndex = index + delta
    if (newIndex < 0 || newIndex >= images.length) return
    
    const newImages = [...images]
    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    setImages(newImages)
    setHasPreview(false)
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setHasPreview(false)
  }

  const generatePreview = useCallback(() => {
    if (images.length === 0) {
      toast({
        variant: "destructive",
        title: "没有图片",
        description: "请先上传至少一张图片",
      })
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const maxW = Math.max(...images.map((i) => i.width))
    const maxH = Math.max(...images.map((i) => i.height))

    if (direction === "horizontal") {
      canvas.width = images.reduce((sum, i) => sum + i.width, 0) + spacing * (images.length - 1)
      canvas.height = maxH
    } else {
      canvas.width = maxW
      canvas.height = images.reduce((sum, i) => sum + i.height, 0) + spacing * (images.length - 1)
    }

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let offset = 0
    images.forEach((item) => {
      let x = 0
      let y = 0

      if (direction === "horizontal") {
        x = offset
        if (alignment === "left") y = 0
        else if (alignment === "right") y = maxH - item.height
        else y = Math.round((maxH - item.height) / 2)
        offset += item.width + spacing
      } else {
        y = offset
        if (alignment === "left") x = 0
        else if (alignment === "right") x = maxW - item.width
        else x = Math.round((maxW - item.width) / 2)
        offset += item.height + spacing
      }

      ctx.drawImage(item.img, x, y, item.width, item.height)
    })

    setHasPreview(true)
  }, [images, direction, alignment, spacing, toast])

  const openDownloadDialog = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasPreview) {
      toast({
        variant: "destructive",
        title: "无预览",
        description: "请先生成预览",
      })
      return
    }
    setDialogOpen(true)
  }

  const downloadImage = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasPreview) return

    setIsDownloading(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/png")
      )
      if (!blob) throw new Error("导出失败")

      const filename = `merged_${new Date().toISOString().slice(0, 10)}.png`
      const result = await saveBlobWithDialog(blob, filename, [
        { name: "PNG图片", extensions: ["png"] },
        { name: "所有文件", extensions: ["*"] },
      ])
      setDialogOpen(false)

      toast({
        variant: "success",
        title: result.canceled ? "已取消保存" : "下载成功",
        description: result.canceled ? "你已取消本次保存" : "图片已开始下载或弹出保存窗口",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "下载失败",
        description: error instanceof Error ? error.message : "请重试",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      <Toaster />
      
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/market" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            返回商圈调研
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight">图片拼接工具</h1>
          <p className="mt-2 text-muted-foreground">
            将多张竞品截图拼接成一张完整图片，用于商圈调研分析
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Settings & Upload */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">拼接设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="拼接方向">
                    <Select value={direction} onValueChange={(v) => { setDirection(v as "vertical" | "horizontal"); setHasPreview(false); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">纵向拼接</SelectItem>
                        <SelectItem value="horizontal">横向拼接</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="图片对齐">
                    <Select value={alignment} onValueChange={(v) => { setAlignment(v as "center" | "left" | "right"); setHasPreview(false); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">居中对齐</SelectItem>
                        <SelectItem value="left">左对齐</SelectItem>
                        <SelectItem value="right">右对齐</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="图片间距 (px)">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={spacing}
                      onChange={(e) => { setSpacing(Math.max(0, Math.min(50, parseInt(e.target.value) || 0))); setHasPreview(false); }}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">上传图片</CardTitle>
                <CardDescription>点击上传或拖拽图片到下方区域</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    dragOver && "border-primary bg-primary/10",
                    isProcessing && "pointer-events-none opacity-50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                >
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-medium text-sm">
                      {isProcessing ? "正在处理..." : "点击上传或拖拽文件到此处"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持 JPG、PNG、WEBP 格式，可同时选择多张图片
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image List */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">图片列表</CardTitle>
                  <span className="text-sm text-muted-foreground">{images.length} 张</span>
                </div>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">暂无图片</p>
                    <p className="text-xs text-muted-foreground mt-1">上传图片后将显示在这里</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{image.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(image.size)} | {image.width} x {image.height}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === images.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">拼接预览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/50 min-h-[300px] flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className={cn(
                      "max-w-full max-h-[500px] rounded-md",
                      !hasPreview && "hidden"
                    )}
                  />
                  {!hasPreview && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/20 mb-4" />
                      <p className="text-sm text-muted-foreground">暂无预览</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        上传图片后点击"生成预览"按钮
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <Button
                    onClick={generatePreview}
                    disabled={images.length === 0}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    生成预览
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={openDownloadDialog}
                    disabled={!hasPreview}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    下载图片
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <DownloadConfirmDialog open={dialogOpen} onOpenChange={setDialogOpen} title="确认下载拼接图片" description="确认后将导出当前拼接结果；在桌面端会弹出保存对话框，在浏览器中会直接开始下载。" loading={isDownloading} confirmText="立即下载" onConfirm={downloadImage} />
    </div>
  )
}
