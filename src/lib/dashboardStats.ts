import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { Application, CalendarEvent, Company, Interview } from '../types'

export type AttentionType = 'stale_application' | 'deadline_soon' | 'interview_soon' | 'interview_unupdated' | 'offer_pending'

export interface DashboardAttentionItem {
  id: string
  type: AttentionType
  text: string
  href: string
}

export interface StatsBarItem {
  title: string
  value: number
  delta: number
  highlight?: boolean
}

export interface FunnelDatum {
  stage: string
  value: number
  conversion: number
  companies: string[]
  fill: string
}

export interface HeatmapDatum {
  date: string
  count: number
  companyNames: string[]
}

export interface TrendDatum {
  date: string
  label: string
  newCount: number
  cumulative: number
}

export interface TodayItem {
  id: string
  time: string | null
  text: string
  href: string
}

export interface ScheduleItem {
  id: string
  date: string
  dayLabel: string
  isToday: boolean
  isPast: boolean
  text: string
  href: string
}

export interface InProgressItem {
  id: string
  companyName: string
  position: string
  status: string
  days: number
  href: string
}

export interface ReflectionPreview {
  id: string
  date: string
  companyName: string
  round: string
  summary: string
  href: string
}

export interface WeekReviewData {
  totalApplications: number
  totalInterviews: number
  totalOffers: number
  bars: Array<{ day: string; count: number; companies: string[] }>
  summary: string
}

export interface GreetingStats {
  weeklyOffers: number
  weeklyApplications: number
  todayInterviews: number
  daysSinceLastApplication: number
}

function companyMap(companies: Company[]) {
  return new Map(companies.map((company) => [company.id, company]))
}

function getDaysDiff(from: string, to: Date) {
  const ms = startOfDay(to).getTime() - startOfDay(parseISO(from)).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}

function toDateSafe(value: string) {
  const d = parseISO(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getTodayEvents(events: CalendarEvent[], applications: Application[], today = new Date()): TodayItem[] {
  const day = startOfDay(today)

  const offerPendingSet = new Set(
    applications
      .filter((app) => app.status === 'offer' && app.finalResult !== 'offer' && app.finalResult !== 'withdrawn')
      .map((app) => app.id),
  )

  return events
    .filter((event) => {
      const d = toDateSafe(event.date)
      if (!d || !isSameDay(d, day)) return false
      if (event.type === '面试' || event.type === '笔试') return true
      if (event.type === '待办') return true
      if (event.type === 'Offer回复' && event.linkedTo?.kind === 'application') {
        return offerPendingSet.has(event.linkedTo.id)
      }
      return false
    })
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
    .map((event) => ({
      id: event.id,
      time: event.time ?? null,
      text: event.title,
      href: event.linkedTo?.kind === 'application' ? `/applications/${event.linkedTo.id}` : '/calendar',
    }))
}

export function getWeekSchedule(events: CalendarEvent[], weekStart: Date): ScheduleItem[] {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })
  const today = startOfDay(new Date())

  return events
    .filter((event) => {
      if (event.type !== '面试' && event.type !== '笔试') return false
      const d = toDateSafe(event.date)
      return !!d && !isBefore(d, start) && !isAfter(d, end)
    })
    .sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`))
    .map((event) => {
      const d = parseISO(event.date)
      const isToday = isSameDay(d, today)
      const isPast = isBefore(d, today)
      return {
        id: event.id,
        date: event.date,
        dayLabel: `周${'日一二三四五六'[d.getDay()]} ${format(d, 'MM/dd')}`,
        isToday,
        isPast,
        text: `[${event.type}] ${event.title}`,
        href: event.linkedTo?.kind === 'application' ? `/applications/${event.linkedTo.id}` : '/calendar',
      }
    })
}

export function getInProgressApplications(applications: Application[], companies: Company[]): InProgressItem[] {
  const map = companyMap(companies)
  const now = new Date()

  return applications
    .filter((app) => {
      if (app.status === 'rejected') return false
      if (app.finalResult === 'rejected' || app.finalResult === 'withdrawn' || app.finalResult === 'offer') return false
      return true
    })
    .map((app) => ({
      id: app.id,
      companyName: map.get(app.companyId)?.name ?? '未知公司',
      position: app.position,
      status: app.status,
      days: getDaysDiff(app.appliedAt, now),
      href: `/applications/${app.id}`,
    }))
    .sort((a, b) => b.days - a.days)
}

export function getRecentReflections(interviews: Interview[], companies: Company[], applications: Application[], n = 2): ReflectionPreview[] {
  const cMap = companyMap(companies)
  const aMap = new Map(applications.map((app) => [app.id, app]))

  return interviews
    .filter((item) => !!item.selfReview?.trim())
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, n)
    .map((item) => {
      const app = aMap.get(item.applicationId)
      const companyName = app ? cMap.get(app.companyId)?.name ?? '未知公司' : '未知公司'
      const raw = item.selfReview?.trim() ?? ''
      return {
        id: item.id,
        date: format(parseISO(item.scheduledAt), 'MM/dd'),
        companyName,
        round: item.round,
        summary: raw.length > 80 ? `${raw.slice(0, 80)}...` : raw,
        href: `/applications/${item.applicationId}`,
      }
    })
}

export function getWeekReview(applications: Application[], companies: Company[], interviews: Interview[], weekStart: Date): WeekReviewData {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })
  const map = companyMap(companies)

  const weekApps = applications.filter((app) => {
    const d = parseISO(app.appliedAt)
    return !isBefore(d, start) && !isAfter(d, endOfWeek(weekStart, { weekStartsOn: 1 }))
  })

  const bars = days.map((day) => {
    const list = weekApps.filter((app) => isSameDay(parseISO(app.appliedAt), day))
    return {
      day: `周${'日一二三四五六'[day.getDay()]}`,
      count: list.length,
      companies: list.map((app) => map.get(app.companyId)?.name ?? '未知公司'),
    }
  })

  const totalInterviews = interviews.filter((item) => {
    const d = parseISO(item.scheduledAt)
    return !isBefore(d, start) && !isAfter(d, endOfWeek(weekStart, { weekStartsOn: 1 }))
  }).length

  const totalOffers = applications.filter((app) => {
    if (!(app.status === 'offer' || app.finalResult === 'offer')) return false
    const d = parseISO(app.updatedAt)
    return !isBefore(d, start) && !isAfter(d, endOfWeek(weekStart, { weekStartsOn: 1 }))
  }).length

  const maxBar = bars.reduce((acc, curr) => (curr.count > acc.count ? curr : acc), bars[0] ?? { day: '周一', count: 0, companies: [] })
  const summary = totalOffers > 0
    ? '拿到 Offer 的一周,值得开心'
    : weekApps.length === 0
      ? '本周还没投递,周末抓紧补一下?'
      : `${maxBar.day} 你最积极,投了 ${maxBar.count} 家`

  return {
    totalApplications: weekApps.length,
    totalInterviews,
    totalOffers,
    bars,
    summary,
  }
}

export function getGreetingMessage(stats: GreetingStats, hour: number): string {
  if (stats.weeklyOffers > 0) return '恭喜拿到 Offer!继续保持节奏。'
  if (stats.weeklyApplications >= 3) return `本周已投递 ${stats.weeklyApplications} 家,做得不错。`
  if (stats.todayInterviews > 0) return '今天有面试,深呼吸,你已经准备很久了。'
  if (stats.daysSinceLastApplication >= 7) return '好久没投递了,要不要看看新机会?'
  if (hour >= 22 || hour < 5) return '夜深了,早点休息。'
  return '慢慢来,秋招是场马拉松,不是短跑。'
}

export function getAttentionItems(applications: Application[], companies: Company[], events: CalendarEvent[]): DashboardAttentionItem[] {
  const now = new Date()
  const today = startOfDay(now)
  const cMap = companyMap(companies)
  const items: DashboardAttentionItem[] = []

  applications.forEach((app) => {
    if (app.status === 'applied' && getDaysDiff(app.appliedAt, now) >= 14) {
      items.push({
        id: `stale-${app.id}`,
        type: 'stale_application',
        text: `${cMap.get(app.companyId)?.name ?? '某公司'} 投递 14 天无进展`,
        href: `/applications/${app.id}`,
      })
    }
  })

  companies.forEach((company) => {
    if (!company.deadline) return
    const d = parseISO(company.deadline)
    const hasApplied = applications.some((app) => app.companyId === company.id)
    if (!hasApplied && !isBefore(d, today) && !isAfter(d, addDays(today, 3))) {
      items.push({
        id: `deadline-${company.id}`,
        type: 'deadline_soon',
        text: `${company.name} 截止还剩 3 天`,
        href: `/companies/${company.id}`,
      })
    }
  })

  events.forEach((event) => {
    if (event.type !== '面试') return
    const d = parseISO(event.date)
    if (!isBefore(d, today) && !isAfter(d, addDays(today, 3))) {
      items.push({
        id: `interview-${event.id}`,
        type: 'interview_soon',
        text: `${event.title} 将在 3 天内进行`,
        href: '/interviews',
      })
    }
  })

  applications.forEach((app) => {
    const hasPastInterview = events.some((event) =>
      event.type === '面试' && event.linkedTo?.id === app.id && isBefore(parseISO(event.date), today),
    )
    if (hasPastInterview && app.status === 'interviewing') {
      items.push({
        id: `interview-unupdated-${app.id}`,
        type: 'interview_unupdated',
        text: `${cMap.get(app.companyId)?.name ?? '某公司'} 面试后还没更新状态`,
        href: `/applications/${app.id}`,
      })
    }

    if (app.status === 'offer' && app.finalResult !== 'offer' && app.finalResult !== 'withdrawn') {
      items.push({
        id: `offer-${app.id}`,
        type: 'offer_pending',
        text: `${cMap.get(app.companyId)?.name ?? '某公司'} Offer 待回复 4 天`,
        href: `/applications/${app.id}`,
      })
    }
  })

  return items.filter((item, idx, arr) => arr.findIndex((other) => other.id === item.id) === idx)
}

export function buildHeatmapAndTrend(applications: Application[], companies: Company[]) {
  const today = startOfDay(new Date())
  const cMap = companyMap(companies)
  const dates = eachDayOfInterval({ start: subDays(today, 29), end: today })

  const heatmap: HeatmapDatum[] = dates.map((date) => {
    const list = applications.filter((app) => isSameDay(parseISO(app.appliedAt), date))
    return {
      date: format(date, 'yyyy-MM-dd'),
      count: list.length,
      companyNames: list.map((app) => cMap.get(app.companyId)?.name ?? '未知公司'),
    }
  })

  let cumulative = 0
  const trend: TrendDatum[] = heatmap.map((item) => {
    cumulative += item.count
    return {
      date: item.date,
      label: format(parseISO(item.date), 'MM/dd'),
      newCount: item.count,
      cumulative,
    }
  })

  return { heatmap, trend }
}


const FUNNEL_COLORS = ['#E8D5B7', '#DCC2A1', '#B8C5D6', '#D4B5B0', '#AFC4AF', '#8FAE8F']
const PIE_COLORS = ['#E8D5B7', '#B8C5D6', '#D4B5B0', '#A8B5A0', '#C5BDB5']


export function buildFunnelAndCategory(applications: Application[], companies: Company[], events: CalendarEvent[]) {
  const cMap = companyMap(companies)

  const hasAnyInterview = (appId: string) =>
    events.some((event) => event.type === '面试' && event.linkedTo?.kind === 'application' && event.linkedTo.id === appId)

  const hasFinalOrHr = (appId: string) =>
    events.some(
      (event) =>
        event.type === '面试' &&
        event.linkedTo?.kind === 'application' &&
        event.linkedTo.id === appId &&
        (event.title.includes('终面') || event.title.includes('HR')),
    )

  const stageApplied = applications
  const stageWrittenPassed = applications.filter(
    (app) => app.writtenTestResult === 'passed' || ['interviewing', 'offer'].includes(app.status) || hasAnyInterview(app.id),
  )
  const stageInterview = applications.filter((app) => ['interviewing', 'offer'].includes(app.status) || hasAnyInterview(app.id))
  const stageFinal = applications.filter((app) => app.status === 'offer' || hasFinalOrHr(app.id))
  const stageOffer = applications.filter((app) => app.status === 'offer' || app.finalResult === 'offer')

  const stageLists = [
    { stage: '已投递', list: stageApplied },
    { stage: '笔试通过', list: stageWrittenPassed },
    { stage: '进入面试', list: stageInterview },
    { stage: '终面/HR', list: stageFinal },
    { stage: 'Offer', list: stageOffer },
  ]

  const funnel: FunnelDatum[] = stageLists.map((item, index) => {
    const prev = index === 0 ? item.list.length : stageLists[index - 1].list.length
    const conversion = prev > 0 ? Number(((item.list.length / prev) * 100).toFixed(1)) : 0
    return {
      stage: item.stage,
      value: item.list.length,
      conversion: index === 0 ? 100 : conversion,
      companies: item.list.map((app) => cMap.get(app.companyId)?.name ?? '未知公司'),
      fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    }
  })

  const byIndustry = new Map<string, number>()
  applications.forEach((app) => {
    const industry = cMap.get(app.companyId)?.industry ?? '其他'
    byIndustry.set(industry, (byIndustry.get(industry) ?? 0) + 1)
  })

  const categoryPie = [...byIndustry.entries()].map(([name, value], index) => ({
    name,
    value,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }))

  return { funnel, categoryPie }
}

