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
    <DialogContent className={`w-[95vw] ${maxWidthClass} max-h-[85vh] overflow-hidden rounded-2xl p-0`}>
      <div className="flex h-full max-h-[85vh] flex-col bg-neutral-card">
        <DialogHeader className="shrink-0 border-b border-neutral-border px-6 pb-4 pt-6">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="dialog-scroll flex-1 overflow-y-auto px-6 py-4">{children}</div>

        <div className="shrink-0 border-t border-neutral-border bg-neutral-card px-6 pb-6 pt-4">
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
