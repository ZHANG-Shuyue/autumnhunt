import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/card'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  tone: string
}

export default function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-text">{value}</p>
        </div>
        <div className={`rounded-2xl p-2 ${tone}`}>
          <Icon className="h-5 w-5 text-neutral-text" />
        </div>
      </div>
    </Card>
  )
}
