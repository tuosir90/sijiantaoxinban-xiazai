"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Upload, ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  accept?: string
  onChange: (file: File | null) => void
  value?: File | null
  required?: boolean
  className?: string
}

export function FileUpload({
  accept = "image/*",
  onChange,
  value,
  required,
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = useCallback((file: File | null) => {
    onChange(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFile(file)
  }, [handleFile])

  const clearFile = useCallback(() => {
    handleFile(null)
  }, [handleFile])

  if (preview && value) {
    return (
      <div className={cn("relative rounded-lg border bg-muted/50 p-4", className)}>
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-background">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <label
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        dragOver && "border-primary bg-primary/10",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        required={required}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium text-sm">点击上传或拖拽文件到此处</p>
        <p className="text-xs text-muted-foreground mt-1">
          支持 JPG、PNG、WEBP 格式
        </p>
      </div>
    </label>
  )
}
