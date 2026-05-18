import { ArrowRight, TrendingUp } from 'lucide-react'
import { Card } from '../ui/card'
import type { StatsBarItem } from '../../lib/dashboardStats'

interface StatsBarProps {
  items: StatsBarItem[]
}

export default function StatsBar({ items }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const positive = item.delta > 0
        const neutral = item.delta === 0
        return (
          <Card key={item.title} className={item.highlight ? 'border-primary-sage/50 bg-primary-sage/10' : ''}>
            <p className="text-sm text-neutral-muted">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className={`mt-2 inline-flex items-center gap-1 text-xs ${positive ? 'text-primary-sage' : 'text-neutral-muted'}`}>
              {neutral ? <ArrowRight className="h-3.5 w-3.5" /> : <TrendingUp className={`h-3.5 w-3.5 ${positive ? '' : 'rotate-180'}`} />}
              较上周 {neutral ? '持平' : `${positive ? '+' : ''}${item.delta}`}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
