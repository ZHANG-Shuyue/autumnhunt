import { lazy, Suspense, useMemo, useState } from 'react'
import type { Application, CalendarEvent, Company, Resume } from '../../types'
import type { HeatmapDatum, TrendDatum } from '../../lib/dashboardStats'
import { buildFunnelAndCategory } from '../../lib/dashboardStats'
import HeatmapCard from './HeatmapCard'
import FunnelChart from './FunnelChart'
import ResumeConversionCard from './ResumeConversionCard'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

const TrendChart = lazy(() => import('./TrendChart'))
const CategoryPie = lazy(() => import('./CategoryPie'))

interface QuietZoneProps {
  applications: Application[]
  companies: Company[]
  resumes: Resume[]
  events: CalendarEvent[]
  heatmap: HeatmapDatum[]
  trend: TrendDatum[]
}

export default function QuietZone({ applications, companies, resumes, events, heatmap, trend }: QuietZoneProps) {
  const [open, setOpen] = useState(false)

  const { funnel, categoryPie } = useMemo(() => buildFunnelAndCategory(applications, companies, events), [applications, companies, events])

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">🌱 慢节奏区</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '展开'}</Button>
      </div>

      {open && (
        <div className="mt-4 space-y-5">
          <HeatmapCard data={heatmap} embedded />

          <div className="border-t border-neutral-border" />
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-primary-cream/40" />}>
            <TrendChart data={trend} embedded />
          </Suspense>

          <div className="border-t border-neutral-border" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FunnelChart data={funnel} embedded />
            <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-primary-cream/40" />}>
              <CategoryPie data={categoryPie} embedded />
            </Suspense>
          </div>

          <div className="border-t border-neutral-border" />
          <ResumeConversionCard resumes={resumes} applications={applications} />
        </div>
      )}
    </Card>
  )
}
