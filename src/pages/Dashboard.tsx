import { Building2, Calendar, Send, Trophy } from 'lucide-react'
import StatCard from '../components/common/StatCard'
import { Card } from '../components/ui/card'

const stats = [
  { title: '已投递公司数', value: 12, icon: Send, tone: 'bg-primary-mist/50' },
  { title: '进行中面试数', value: 3, icon: Calendar, tone: 'bg-primary-rose/50' },
  { title: '已收 Offer 数', value: 1, icon: Trophy, tone: 'bg-primary-sage/50' },
  { title: '公司库总数', value: 156, icon: Building2, tone: 'bg-primary-cream/70' },
]

const newCompanies = ['字节跳动 · 前端开发工程师', '腾讯 · 后端开发工程师', '招商银行 · 金融科技岗', '米哈游 · 图形开发工程师']
const schedules = ['05/16 10:30 网易 一面', '05/18 14:00 小红书 二面', '05/20 16:00 字节跳动 HR 面']

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">今日新增公司</h3>
          <div className="space-y-3">
            {newCompanies.map((item) => (
              <div key={item} className="rounded-2xl border border-neutral-border bg-neutral-bg p-3 text-sm text-neutral-text">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">近期面试日程</h3>
          <div className="space-y-4">
            {schedules.map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-rose" />
                  {index !== schedules.length - 1 && <span className="mt-1 h-8 w-px bg-neutral-border" />}
                </div>
                <p className="text-sm text-neutral-text">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
