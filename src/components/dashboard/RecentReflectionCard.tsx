import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/card'
import type { ReflectionPreview } from '../../lib/dashboardStats'

interface RecentReflectionCardProps {
  items: ReflectionPreview[]
}

export default function RecentReflectionCard({ items }: RecentReflectionCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">📝 最近的面试反思</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">完成面试后写下感受,会让你下一场更稳</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => navigate(item.href)} className="w-full rounded-xl border border-neutral-border bg-neutral-bg p-3 text-left">
              <p className="text-xs text-neutral-muted">{item.date}</p>
              <p className="mt-1 text-sm text-neutral-text">{item.companyName} · {item.round}</p>
              <p className="mt-1 text-sm text-neutral-muted">{item.summary}</p>
              <p className="mt-2 text-xs text-[#B08A63]">查看完整反思 →</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
