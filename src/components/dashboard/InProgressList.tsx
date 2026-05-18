import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import type { InProgressItem } from '../../lib/dashboardStats'

interface InProgressListProps {
  items: InProgressItem[]
}

const statusMap: Record<string, string> = {
  applied: '已投递',
  written_test: '笔试中',
  interviewing: '面试中',
  offer: 'Offer待决策',
}

export default function InProgressList({ items }: InProgressListProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">💼 进行中的投递 ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">当前没有进行中的投递</p>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <button key={item.id} type="button" className="w-full rounded-xl border border-neutral-border bg-neutral-bg p-3 text-left" onClick={() => navigate(item.href)}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-neutral-text">{item.companyName} · {item.position}</p>
                <Badge variant="mist">{statusMap[item.status] ?? item.status}</Badge>
              </div>
              <p className={`mt-1 text-xs ${item.days > 14 ? 'text-[#C89E6A]' : 'text-neutral-muted'}`}>已 {item.days} 天</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
