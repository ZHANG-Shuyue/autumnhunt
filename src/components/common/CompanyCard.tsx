import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Company } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

const statusMap: Record<Company['status'], { label: string; variant: 'sage' | 'ash' | 'cream' }> = {
  open: { label: '开放中', variant: 'sage' },
  closed: { label: '已截止', variant: 'ash' },
  upcoming: { label: '即将开放', variant: 'cream' },
}

export default function CompanyCard({ company }: { company: Company }) {
  const status = statusMap[company.status]
  return (
    <Card className="space-y-4">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-cream/70 to-primary-mist/60" />
      <div>
        <h3 className="text-lg font-semibold text-neutral-text">{company.name}</h3>
        <div className="mt-2 flex gap-2">
          <Badge variant="sage">{company.industry}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
      <p className="text-sm text-neutral-muted">截止日期：{company.deadline ?? '待更新'}</p>
      <Link to={`/companies/${company.id}`}>
        <Button variant="ghost" className="w-full justify-between">
          查看详情 <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </Card>
  )
}
