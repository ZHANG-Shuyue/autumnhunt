import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import EmptyState from '../common/EmptyState'
import { Card } from '../ui/card'

interface CategoryPieProps {
  data: Array<{ name: string; value: number; fill: string }>
  embedded?: boolean
}

function Content({ data }: { data: Array<{ name: string; value: number; fill: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) return <EmptyState text="暂无数据" />

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={88}
            label={(entry) => `[${entry.name}] ${((entry.value / total) * 100).toFixed(0)}%`}
            labelLine
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#EDE6DB', background: '#FAF7F2' }} />
          <Legend verticalAlign="bottom" height={30} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function CategoryPie({ data, embedded = false }: CategoryPieProps) {
  if (embedded) {
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold">投递行业分布</h4>
        <Content data={data} />
      </div>
    )
  }

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold">投递行业分布</h3>
      <Content data={data} />
    </Card>
  )
}
