import { Card } from '../ui/card'
import type { FunnelDatum } from '../../lib/dashboardStats'

interface FunnelChartProps {
  data: FunnelDatum[]
  embedded?: boolean
}

type StageKey = 'submitted' | 'written' | 'interview' | 'final' | 'offer'

const stageDefs: Array<{ key: StageKey; label: string; barColor: string }> = [
  { key: 'submitted', label: '已投递', barColor: 'bg-primary-cream/45' },
  { key: 'written', label: '笔试通过', barColor: 'bg-primary-cream/60' },
  { key: 'interview', label: '进入面试', barColor: 'bg-primary-mist/55' },
  { key: 'final', label: '终面/HR', barColor: 'bg-primary-ash/65' },
  { key: 'offer', label: 'Offer', barColor: 'bg-primary-sage/70' },
]

function normalizeCounts(data: FunnelDatum[]) {
  const byLabel = new Map(data.map((item) => [item.stage, item.value]))
  return {
    submitted: byLabel.get('已投递') ?? 0,
    written: byLabel.get('笔试通过') ?? 0,
    interview: byLabel.get('进入面试') ?? 0,
    final: byLabel.get('终面/HR') ?? 0,
    offer: byLabel.get('Offer') ?? 0,
  } satisfies Record<StageKey, number>
}

function Content({ data }: { data: FunnelDatum[] }) {
  const counts = normalizeCounts(data)
  const maxCount = counts.submitted

  if (maxCount === 0) {
    return <div className="py-8 text-center text-sm text-neutral-muted">还没有投递记录</div>
  }

  return (
    <div className="space-y-2">
      {stageDefs.map((stage) => {
        const count = counts[stage.key]
        const ratio = maxCount > 0 ? count / maxCount : 0

        return (
          <div key={stage.key} className="grid grid-cols-[5rem_1fr] items-center gap-3">
            <div className="text-sm text-neutral-muted">{stage.label}</div>
            <div className="relative h-8 w-full overflow-hidden rounded-md bg-neutral-bg">
              <div
                className={`h-full ${stage.barColor} flex items-center justify-end px-3 transition-all`}
                style={{ width: `${Math.max(ratio * 100, 0)}%`, minWidth: '2.5rem' }}
              >
                <span className="text-xs font-medium text-neutral-text">{count} 份</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FunnelChart({ data, embedded = false }: FunnelChartProps) {
  const body = (
    <>
      <h4 className="mb-1 text-base font-semibold text-neutral-text">投递统计</h4>
      <p className="mb-3 text-xs text-neutral-muted">每份投递记录的进展，一家公司多个岗位会分别计数</p>
      <Content data={data} />
    </>
  )

  if (embedded) {
    return <div>{body}</div>
  }

  return <Card>{body}</Card>
}
