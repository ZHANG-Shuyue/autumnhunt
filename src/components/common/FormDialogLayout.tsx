import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface FormDialogLayoutProps {
  title: string
  formId: string
  onCancel: () => void
  submitLabel?: string
  children: React.ReactNode
  maxWidthClass?: string
}

// v0.2.2: 通用三段式表单弹窗（Header 固定 + Body 滚动 + Footer 固定）
export default function FormDialogLayout({
  title,
  formId,
  onCancel,
  submitLabel = '保存',
  children,
  maxWidthClass = 'sm:max-w-3xl',
}: FormDialogLayoutProps) {
  return (
    <DialogContent className={`left-0 top-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none p-0 sm:left-1/2 sm:top-1/2 sm:h-auto sm:w-[95vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl ${maxWidthClass}`}>
      <div className="flex h-full max-h-[100dvh] flex-col bg-neutral-card sm:max-h-[85vh]">
        <DialogHeader className="shrink-0 border-b border-neutral-border px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-primary-cream/20 sm:hidden">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="dialog-scroll flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>

        <div className="sticky bottom-0 shrink-0 border-t border-neutral-border bg-neutral-card px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-neutral-border text-neutral-muted hover:bg-neutral-bg sm:w-auto"
              onClick={onCancel}
            >
              取消
            </Button>
            <Button type="submit" form={formId} className="h-10 w-full shadow-soft sm:w-auto">
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}
