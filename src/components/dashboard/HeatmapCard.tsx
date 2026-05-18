import { useState } from 'react'
import EmptyState from '../common/EmptyState'
import { Card } from '../ui/card'
import type { HeatmapDatum } from '../../lib/dashboardStats'

interface HeatmapCardProps {
  data: HeatmapDatum[]
  embedded?: boolean
}

const colorByCount = (count: number) => {
  if (count <= 0) return 'bg-primary-cream/10'
  if (count === 1) return 'bg-primary-cream/30'
  if (count === 2) return 'bg-primary-cream/50'
  if (count === 3) return 'bg-primary-cream/70'
  return 'bg-primary-cream'
}

function Content({ data }: { data: HeatmapDatum[] }) {
  const [hovered, setHovered] = useState<HeatmapDatum | null>(null)

  if (data.length === 0) return <EmptyState text="还没有数据,先去添加几条投递吧" />

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex w-max flex-wrap gap-1">
          {data.map((day) => (
            <div
              key={day.date}
              className={`h-3 w-3 rounded-sm border border-neutral-border sm:h-4 sm:w-4 ${colorByCount(day.count)}`}
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 min-h-8 text-[10px] text-neutral-muted sm:text-xs">
        {hovered ? `${hovered.date} · ${hovered.count} 条投递${hovered.companyNames.length ? `（${hovered.companyNames.join('、')}）` : ''}` : '悬停查看日期与投递公司'}
      </p>
    </>
  )
}

export default function HeatmapCard({ data, embedded = false }: HeatmapCardProps) {
  if (embedded) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold">30 天投递热力图</h4>
        <Content data={data} />
      </div>
    )
  }

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">近 30 天投递活跃度</h3>
      <Content data={data} />
    </Card>
  )
}
