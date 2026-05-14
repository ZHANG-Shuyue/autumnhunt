import { Inbox, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  text?: string
}

export default function EmptyState({ icon: Icon = Inbox, text = '这里还没有内容哦' }: EmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-border bg-white/70 p-6 text-center">
      <Icon className="mb-3 h-9 w-9 text-neutral-muted" />
      <p className="text-sm text-neutral-muted">{text}</p>
    </div>
  )
}
