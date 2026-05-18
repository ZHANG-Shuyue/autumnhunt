import { useState } from 'react'
import { Card } from '../ui/card'
import type { WeekReviewData } from '../../lib/dashboardStats'

interface WeekReviewCardProps {
  data: WeekReviewData
}

export default function WeekReviewCard({ data }: WeekReviewCardProps) {
  const [hoverText, setHoverText] = useState('')

  return (
    <Card>
      <h3 className="mb-2 text-base font-semibold">📊 本周回顾</h3>
      <p className="text-sm text-neutral-text">本周投递 {data.totalApplications} · 面试 {data.totalInterviews} · 收到 {data.totalOffers} 个 Offer</p>
      <div className="mt-3 flex items-end gap-2">
        {data.bars.map((bar) => (
          <div key={bar.day} className="flex flex-col items-center gap-1">
            <div
              className="w-8 rounded-t bg-primary-cream"
              style={{ height: `${Math.max(8, bar.count * 10)}px` }}
              onMouseEnter={() => setHoverText(`${bar.day}：${bar.companies.join('、') || '无投递'}`)}
              onMouseLeave={() => setHoverText('')}
            />
            <span className="text-[11px] text-neutral-muted">{bar.day.slice(1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-5 text-xs text-neutral-muted">{hoverText}</p>
      <p className="mt-1 text-xs text-[#B08A63]">{data.summary}</p>
    </Card>
  )
}
