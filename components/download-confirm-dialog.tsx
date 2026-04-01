"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type DownloadConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function DownloadConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "立即下载",
  loading = false,
  onConfirm,
}: DownloadConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-amber-200/70 bg-white p-6 shadow-2xl">
          <div className="absolute right-4 top-4">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="关闭弹窗"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 pr-8">
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              确认下载
            </div>
            <div className="space-y-2">
              <Dialog.Title className="font-serif text-2xl font-semibold text-slate-900">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-6 text-slate-600">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-5"
                disabled={loading}
              >
                稍后再说
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              className="rounded-full px-5"
              disabled={loading}
              onClick={() => void onConfirm()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
