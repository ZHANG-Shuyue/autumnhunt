import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import EmptyState from '../common/EmptyState'
import { Card } from '../ui/card'
import { useApplicationStore } from '../../store/useApplicationStore'
import { useCompanyStore } from '../../store/useCompanyStore'
import type { TrendDatum } from '../../lib/dashboardStats'

interface TrendChartProps {
  data: TrendDatum[]
  embedded?: boolean
}

function toLocalDayKey(value?: string) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return format(d, 'yyyy-MM-dd')
}

function ChartContent({ data }: { data: TrendDatum[] }) {
  const applications = useApplicationStore((s) => s.applications)
  const companies = useCompanyStore((s) => s.companies)

  const chartData = useMemo(() => {
    const today = startOfDay(new Date())
    const days = eachDayOfInterval({ start: subDays(today, 29), end: today })

    const appCountMap = new Map<string, number>()
    applications.forEach((app) => {
      const raw = (app as { createdAt?: string }).createdAt ?? app.appliedAt
      const key = toLocalDayKey(raw)
      if (!key) return
      appCountMap.set(key, (appCountMap.get(key) ?? 0) + 1)
    })

    const companyCountMap = new Map<string, number>()
    companies.forEach((company) => {
      const key = toLocalDayKey(company.createdAt)
      if (!key) return
      companyCountMap.set(key, (companyCountMap.get(key) ?? 0) + 1)
    })

    return days.map((day, index) => {
      const key = format(day, 'yyyy-MM-dd')
      const fallbackApp = data[index]?.newCount ?? 0
      return {
        date: format(day, 'MM/dd'),
        applications: appCountMap.get(key) ?? fallbackApp,
        companies: companyCountMap.get(key) ?? 0,
      }
    })
  }, [applications, companies, data])

  const hasData = chartData.some((item) => item.applications > 0 || item.companies > 0)
  if (!hasData) return <EmptyState text="趋势数据还不够,先记录几条投递吧" />

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="coGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fill: '#78716c', fontSize: 11 }} />
          <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: '#78716c', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#e7e5e4', background: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            formatter={(value, name) => {
              if (name === 'applications') return [`${value} 份`, '投递（份）']
              return [`${value} 家`, '新增公司（家）']
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: '12px', color: '#78716c' }}
            formatter={(value) => (value === 'applications' ? '投递（份）' : '新增公司（家）')}
          />
          <Area type="monotone" dataKey="applications" stroke="#d97706" fill="url(#appGradient)" fillOpacity={0.4} strokeWidth={2} />
          <Area type="monotone" dataKey="companies" stroke="#94a3b8" fill="url(#coGradient)" fillOpacity={0.4} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function TrendChart({ data, embedded = false }: TrendChartProps) {
  if (embedded) {
    return (
      <div>
        <h4 className="mb-1 text-base font-semibold">30 天趋势</h4>
        <p className="mb-3 text-xs text-stone-500">投递数与新增公司数对比</p>
        <ChartContent data={data} />
      </div>
    )
  }

  return (
    <Card>
      <h3 className="mb-1 text-base font-semibold">30 天趋势</h3>
      <p className="mb-3 text-xs text-stone-500">投递数与新增公司数对比</p>
      <ChartContent data={data} />
    </Card>
  )
}
