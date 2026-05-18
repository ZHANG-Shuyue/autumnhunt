import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/card'
import type { ScheduleItem } from '../../lib/dashboardStats'

interface WeekScheduleCardProps {
  items: ScheduleItem[]
}

export default function WeekScheduleCard({ items }: WeekScheduleCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">📅 本周日程</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">本周暂无面试/笔试安排</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.href)}
              className={`w-full rounded-xl border border-neutral-border p-3 text-left text-sm ${item.isToday ? 'bg-primary-cream/40' : 'bg-neutral-bg'} ${item.isPast ? 'text-neutral-muted' : 'text-neutral-text'}`}
            >
              {item.isToday ? '今天 ' : ''}{item.dayLabel}：{item.text}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
