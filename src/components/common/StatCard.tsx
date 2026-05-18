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
    <Card className="p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-neutral-muted sm:text-[14px]">{title}</p>
          <p className="mt-1.5 text-[28px] font-semibold leading-none text-neutral-text sm:mt-2 sm:text-[32px]">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${tone} sm:p-2.5`}>
          <Icon className="h-4 w-4 text-neutral-text sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  )
}
