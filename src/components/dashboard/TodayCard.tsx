import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import type { TodayItem } from '../../lib/dashboardStats'

interface TodayCardProps {
  items: TodayItem[]
}

export default function TodayCard({ items }: TodayCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">⏰ 今天要做的事 ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">今天没有特别安排,可以去看看新岗位 ☕</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-border bg-neutral-bg p-3 text-sm">
              <span className="w-20 text-xs text-neutral-muted">{item.time || '任意时段'}</span>
              <span className="flex-1 text-neutral-text">{item.text}</span>
              <Button size="sm" variant="outline" onClick={() => navigate(item.href)}>去处理</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
