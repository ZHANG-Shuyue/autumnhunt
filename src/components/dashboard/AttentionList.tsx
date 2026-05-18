import { AlertCircle, BellRing, CalendarClock, Clock3, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import type { DashboardAttentionItem } from '../../lib/dashboardStats'

interface AttentionListProps {
  items: DashboardAttentionItem[]
}

const iconMap = {
  stale_application: Clock3,
  deadline_soon: AlertCircle,
  interview_soon: CalendarClock,
  interview_unupdated: ShieldAlert,
  offer_pending: BellRing,
} as const

export default function AttentionList({ items }: AttentionListProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">✨ 需要关注</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">目前没有需要关注的事项,继续保持 ✨</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => {
            const Icon = iconMap[item.type]
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-border bg-neutral-bg p-3">
                <p className="inline-flex items-start gap-2 text-sm text-neutral-text"><Icon className="mt-0.5 h-4 w-4 text-[#C89E6A]" />{item.text}</p>
                <Button size="sm" variant="outline" onClick={() => navigate(item.href)}>去处理</Button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
