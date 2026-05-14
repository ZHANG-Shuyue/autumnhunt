import { Link } from 'react-router-dom'
import { Card } from '../ui/card'

interface InterviewCardProps {
  title: string
  time: string
  summary: string
  rating: number
  to: string
}

export default function InterviewCard({ title, time, summary, rating, to }: InterviewCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-medium text-neutral-text">{title}</h3>
        <p className="mt-1 text-sm text-neutral-muted">{time}</p>
        <p className="mt-2 line-clamp-2 text-sm text-neutral-muted">{summary}</p>
      </div>
      <div className="min-w-[110px] text-right">
        <div className="text-sm text-primary-cream">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
        <Link to={to} className="mt-3 inline-block text-sm text-neutral-muted underline underline-offset-4">
          查看详情
        </Link>
      </div>
    </Card>
  )
}
