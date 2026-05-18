import { addDays, format, isAfter, isBefore, startOfDay } from 'date-fns'
import { Building2, ClipboardList, Mail, Send, Trophy } from 'lucide-react'
import { Suspense, useMemo } from 'react'
import QuietZone from '../components/dashboard/QuietZone'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { buildHeatmapAndTrend, getAttentionItems, getTodayEvents } from '../lib/dashboardStats'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useResumeStore } from '../store/useResumeStore'
import { readActivities } from '../utils/activity'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const companies = useCompanyStore((s) => s.companies)
  const applications = useApplicationStore((s) => s.applications)
  const interviews = useInterviewStore((s) => s.interviews)
  const events = useCalendarStore((s) => s.events)
  const resumes = useResumeStore((s) => s.resumes)

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  const todayEvents = useMemo(() => getTodayEvents(events, applications, now), [events, applications, now])
  const attentionItems = useMemo(() => getAttentionItems(applications, companies, events), [applications, companies, events])
  const todos = [...todayEvents, ...attentionItems.slice(0, 6).map((item) => ({ id: item.id, time: null, text: item.text, href: item.href }))]

  const upcomingInterviews = useMemo(() => {
    const companyMap = new Map(companies.map((company) => [company.id, company]))
    const appMap = new Map(applications.map((app) => [app.id, app]))

    return interviews
      .filter((item) => {
        const d = new Date(item.scheduledAt)
        return isAfter(d, startOfDay(now)) && isBefore(d, addDays(startOfDay(now), 8))
      })
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .map((item) => {
        const app = appMap.get(item.applicationId)
        const companyName = app ? companyMap.get(app.companyId)?.name ?? '未知公司' : '未知公司'
        return {
          id: item.id,
          datetime: format(new Date(item.scheduledAt), 'MM/dd HH:mm'),
          companyName,
          round: item.round,
          href: app ? `/applications/${app.id}` : '/interviews',
        }
      })
  }, [interviews, companies, applications, now])

  const todayCompanies = companies.filter((item) => item.createdAt === today)

  const interviewingCount = applications.filter((a) => a.status === 'interviewing').length + upcomingInterviews.length
  const offerCount = applications.filter((a) => a.finalResult === 'offer' || a.status === 'offer').length

  const stats = [
    { title: '已投递公司数', value: applications.length, icon: Send, tone: 'bg-primary-mist/50' },
    { title: '进行中面试数', value: interviewingCount, icon: ClipboardList, tone: 'bg-primary-rose/35' },
    { title: '已收 Offer 数', value: offerCount, icon: Trophy, tone: 'bg-primary-sage/55' },
    { title: '公司库总数', value: companies.length, icon: Building2, tone: 'bg-primary-cream/70' },
  ]

  const activityFromLog = readActivities().slice(0, 8)
  const fallbackActivities = [
    ...applications
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4)
      .map((app) => ({
        id: `app-${app.id}`,
        createdAt: app.updatedAt,
        message: `投递状态变更:${app.position} → ${app.status}`,
      })),
    ...interviews
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4)
      .map((item) => ({
        id: `iv-${item.id}`,
        createdAt: item.updatedAt,
        message: `面试状态变更:${item.round} → ${item.result ?? '待定'}`,
      })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const activities = activityFromLog.length ? activityFromLog : fallbackActivities

  const { heatmap, trend } = useMemo(() => buildHeatmapAndTrend(applications, companies), [applications, companies])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} tone={item.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">今日待办</h3>
          {todos.length ? (
            <div className="space-y-2">
              {todos.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-neutral-border bg-neutral-bg p-3 text-sm">
                  <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-neutral-text">
                    <ClipboardList className="h-4 w-4 text-neutral-muted" />
                    <span className="truncate">{item.text}</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate(item.href)}>去处理</Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="今天没有变化,可以好好准备面试 ☕" />
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">近期面试日程</h3>
          {upcomingInterviews.length ? (
            <div className="space-y-2">
              {upcomingInterviews.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(item.href)} className="w-full rounded-xl border border-neutral-border bg-neutral-bg p-3 text-left text-sm">
                  · {item.datetime} · {item.companyName} · {item.round}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState text="未来 7 天暂无面试安排" />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">今日新增公司</h3>
          {todayCompanies.length ? (
            <div className="space-y-2">
              {todayCompanies.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-border bg-neutral-bg p-3 text-sm">
                  <p className="text-neutral-text">{item.name}</p>
                  <Badge variant="mist" className="mt-2 w-fit">{item.industry}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Mail} text="今天没注意到新增公司,去公司库看看吧" />
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">最近活动</h3>
          {activities.length ? (
            <div className="space-y-2">
              {activities.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-border bg-neutral-bg p-3 text-sm text-neutral-muted">
                  {item.message}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="最近还没有操作记录" />
          )}
        </Card>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-primary-cream/40" />}>
        <QuietZone applications={applications} companies={companies} resumes={resumes} events={events} heatmap={heatmap} trend={trend} />
      </Suspense>
    </div>
  )
}
