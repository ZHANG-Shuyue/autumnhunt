import ApplicationCard from '../components/common/ApplicationCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { mockApplications } from '../mock/applications'
import { mockCompanies } from '../mock/companies'

const columns = [
  { key: 'applied', label: '已投递', tone: 'mist' as const },
  { key: 'written_test', label: '笔试中', tone: 'cream' as const },
  { key: 'interviewing', label: '面试中', tone: 'rose' as const },
  { key: 'offer', label: 'Offer', tone: 'sage' as const },
  { key: 'rejected', label: '已挂', tone: 'ash' as const },
]

export default function Applications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">投递进度看板</h3>
        <div className="flex gap-2">
          <Button size="sm">看板</Button>
          <Button size="sm" variant="outline">
            表格
          </Button>
          <Button size="sm" variant="outline">
            日历
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5">
        {columns.map((column) => {
          const list = mockApplications.filter((app) => app.status === column.key)
          return (
            <Card key={column.key} className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant={column.tone}>{column.label}</Badge>
                <span className="text-xs text-neutral-muted">{list.length}</span>
              </div>
              <div className="space-y-3">
                {list.map((app) => {
                  const company = mockCompanies.find((item) => item.id === app.companyId)
                  return (
                    <ApplicationCard
                      key={app.id}
                      companyName={company?.name ?? '未知公司'}
                      position={app.position}
                      appliedAt={app.appliedAt}
                    />
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
