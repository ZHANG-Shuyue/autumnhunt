import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Ellipsis, Filter, Kanban, List, X } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import EventCard from '../components/calendar/EventCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import ApplicationForm from '../components/forms/ApplicationForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import FormDialogLayout from '../components/common/FormDialogLayout'
import { Dialog } from '../components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { applicationSchema, type ApplicationFormValues } from '../schemas/application.schema'
import { fetchResumeFile } from '../services/githubSync'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useResumeStore } from '../store/useResumeStore'
import { useUiStore } from '../store/useUiStore'
import type { Application } from '../types'
import { pushActivity } from '../utils/activity'

const columns: { key: Application['status']; label: string; tone: 'mist' | 'cream' | 'rose' | 'sage' | 'ash' }[] = [
  { key: 'applied', label: '已投递', tone: 'mist' },
  { key: 'written_test', label: '笔试中', tone: 'cream' },
  { key: 'interviewing', label: '面试中', tone: 'rose' },
  { key: 'offer', label: 'Offer', tone: 'sage' },
  { key: 'rejected', label: '已挂', tone: 'ash' },
]

const statusLabel: Record<Application['status'], string> = {
  applied: '已投递',
  written_test: '笔试中',
  interviewing: '面试中',
  offer: 'Offer',
  rejected: '已挂',
}

const toneClassMap: Record<(typeof columns)[number]['tone'], string> = {
  cream: 'bg-primary-cream/70',
  mist: 'bg-primary-mist/70',
  rose: 'bg-primary-rose/70',
  sage: 'bg-primary-sage/70',
  ash: 'bg-primary-ash/70',
}

const tableStatusOptions = ['已投递', '笔试', '一面', '二面', '三面', '终面', 'Offer', '拒绝', '流程结束'] as const

type TableSortKey = 'appliedAtDesc' | 'updatedAtDesc' | 'companyName' | 'status'

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`h-full rounded-2xl transition-colors ${isOver ? 'bg-primary-cream/30' : ''}`}>
      {children}
    </div>
  )
}

interface ApplicationCardProps {
  app: Application
  company?: string
  nextTodo?: string
  resumeName?: string
  onPreviewResume: () => void
  onEdit: () => void
  onDelete: () => void
}

const ApplicationCard = memo(function ApplicationCard({ app, company, nextTodo, resumeName, onPreviewResume, onEdit, onDelete }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  })
  const style = {
    transform: `${CSS.Transform.toString(transform) ?? ''} translate3d(0,0,0)`,
    transition: isDragging ? 'none' : transition,
    willChange: isDragging ? 'transform' : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
    opacity: isDragging ? 0.4 : 1,
  } as const

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`p-2.5 ${isDragging ? '' : 'group'}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-neutral-text">{company ?? '未知公司'}</p>
          {!isDragging && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="opacity-0 transition group-hover:opacity-100">
                  <Ellipsis className="h-4 w-4 text-neutral-muted" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-28 rounded-xl p-1">
                <button type="button" className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-primary-cream/20" onClick={onEdit}>编辑</button>
                <button type="button" className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-primary-ash/20" onClick={onDelete}>删除</button>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-muted">{app.position}</p>
        <p className="mt-1.5 text-xs text-neutral-muted">投递于 {app.appliedAt}</p>
        {resumeName ? (
          <button
            type="button"
            className="mt-1 text-xs text-neutral-muted underline-offset-2 hover:underline"
            onClick={(event) => {
              event.stopPropagation()
              onPreviewResume()
            }}
          >
            📄 使用：{resumeName}
          </button>
        ) : null}
        {nextTodo && <p className="mt-1 text-xs text-neutral-muted">下一步：{nextTodo}</p>}
      </Card>
    </div>
  )
}, (prev, next) => prev.app === next.app && prev.company === next.company && prev.nextTodo === next.nextTodo && prev.resumeName === next.resumeName)

function DraggingCardOverlay({ app, company, tone }: { app: Application; company?: string; tone: (typeof columns)[number]['tone'] }) {
  return (
    <div className="shadow-2xl cursor-grabbing" style={{ transform: 'rotate(1.5deg) scale(1.02)' }}>
      <div className="w-72 overflow-hidden rounded-2xl border border-neutral-border bg-white">
        <div className={`h-1.5 ${toneClassMap[tone]}`} />
        <div className="p-3">
          <p className="text-sm font-semibold text-neutral-text">{company ?? '未知公司'}</p>
          <p className="mt-1 text-sm text-neutral-muted">{app.position}</p>
          <Badge variant={tone} className="mt-2 w-fit">{statusLabel[app.status]}</Badge>
        </div>
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  column: (typeof columns)[number]
  applications: Application[]
  className?: string
  companyNameMap: Record<string, string>
  nextTodoMap: Record<string, string | undefined>
  resumeNameMap: Record<string, string | undefined>
  onPreviewResume: (app: Application) => void
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
}

const KanbanColumn = memo(function KanbanColumn({ column, applications, className, companyNameMap, nextTodoMap, resumeNameMap, onPreviewResume, onEdit, onDelete }: KanbanColumnProps) {
  const itemIds = useMemo(() => applications.map((item) => item.id), [applications])

  return (
    <div className={className}>
      <DroppableColumn id={column.key}>
        <Card className="flex h-full flex-col p-3">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant={column.tone}>{column.label}</Badge>
            <span className="text-xs text-neutral-muted">{applications.length}</span>
          </div>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-4" style={{ contain: 'layout', minHeight: 120 }}>
              {applications.length === 0 ? (
                <div className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-neutral-border/60 text-xs text-neutral-text/30">
                  拖动到此处
                </div>
              ) : (
                applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    company={companyNameMap[app.companyId]}
                    nextTodo={nextTodoMap[app.id]}
                    resumeName={resumeNameMap[app.id]}
                    onPreviewResume={() => onPreviewResume(app)}
                    onEdit={() => onEdit(app)}
                    onDelete={() => onDelete(app.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </Card>
      </DroppableColumn>
    </div>
  )
}, (prev, next) => prev.column.key === next.column.key && prev.applications === next.applications && prev.resumeNameMap === next.resumeNameMap && prev.className === next.className)

function getInterviewStageLabel(round?: string) {
  if (!round) return '一面'
  if (round.includes('终') || round.toLowerCase().includes('hr')) return '终面'
  if (round.includes('三')) return '三面'
  if (round.includes('二')) return '二面'
  return '一面'
}

function getFilterStatuses(app: Application, latestRound?: string) {
  const labels: string[] = []

  if (app.status === 'applied') labels.push('已投递')
  if (app.status === 'written_test') labels.push('笔试')
  if (app.status === 'interviewing') labels.push(getInterviewStageLabel(latestRound))
  if (app.status === 'offer' || app.finalResult === 'offer') labels.push('Offer')
  if (app.status === 'rejected' || app.finalResult === 'rejected') labels.push('拒绝')
  if (app.finalResult === 'withdrawn') labels.push('流程结束')

  return labels
}

function getStatusSortValue(app: Application, latestRound?: string) {
  const labels = getFilterStatuses(app, latestRound)
  return labels[0] ?? statusLabel[app.status]
}

export default function Applications() {
  const navigate = useNavigate()
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const token = useAuthStore((s) => s.token)
  const companies = useCompanyStore((s) => s.companies)
  const interviews = useInterviewStore((s) => s.interviews)
  const resumes = useResumeStore((s) => s.resumes)
  const { applications, addApplication, updateApplication, deleteApplication } = useApplicationStore()
  const { syncFromOtherStores, events } = useCalendarStore()
  const applicationsFilter = useUiStore((s) => s.applicationsFilter)
  const setApplicationsFilter = useUiStore((s) => s.setApplicationsFilter)
  const resetApplicationsFilter = useUiStore((s) => s.resetApplicationsFilter)

  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban')
  const [tableSort, setTableSort] = useState<TableSortKey>('appliedAtDesc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Application | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeColumnIndex, setActiveColumnIndex] = useState(0)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const columnsScrollRef = useRef<HTMLDivElement | null>(null)

  const appEvents = useMemo(() => events.filter((e) => ['投递', '笔试'].includes(e.type)), [events])

  const submit = (values: ApplicationFormValues) => {
    const parsed = applicationSchema.parse(values)
    const payload = {
      ...parsed,
      writtenTestAt: parsed.writtenTestAt || undefined,
      jobUrl: parsed.jobUrl || undefined,
      preparationDocUrl: parsed.preparationDocUrl || undefined,
      resumeId: parsed.resumeId || undefined,
    }
    if (editing) {
      updateApplication(editing.id, payload)
      pushActivity(`更新投递：${payload.position}`)
      toast.success('已更新')
    } else {
      addApplication(payload)
      pushActivity(`新增投递：${payload.position}`)
      toast.success('已添加')
    }
    syncFromOtherStores()
    setDialogOpen(false)
    setEditing(undefined)
  }

  const nextTodoOf = (app: Application) => {
    const now = new Date().toISOString().slice(0, 16)
    const candidates: { time: string; text: string }[] = []
    if (app.writtenTestAt && `${app.writtenTestAt}T00:00` > now) candidates.push({ time: `${app.writtenTestAt}T00:00`, text: `${app.writtenTestAt.slice(5)} 笔试` })
    const nextInterview = interviews
      .filter((i) => i.applicationId === app.id && i.scheduledAt > new Date().toISOString())
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
    if (nextInterview) candidates.push({ time: nextInterview.scheduledAt, text: `${nextInterview.scheduledAt.slice(5, 10)} ${nextInterview.round}` })
    candidates.sort((a, b) => a.time.localeCompare(b.time))
    return candidates[0]?.text
  }

  const companyNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const company of companies) map[company.id] = company.name
    return map
  }, [companies])

  const nextTodoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    for (const app of applications) {
      map[app.id] = nextTodoOf(app)
    }
    return map
  }, [applications, interviews])

  const resumeById = useMemo(() => new Map(resumes.map((item) => [item.id, item])), [resumes])

  const resumeNameMap = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    applications.forEach((application) => {
      if (!application.resumeId) return
      const resume = resumeById.get(application.resumeId)
      if (!resume) return
      try {
        map[application.id] = decodeURIComponent(resume.name)
      } catch {
        map[application.id] = resume.name
      }
    })
    return map
  }, [applications, resumeById])

  const latestRoundByApplication = useMemo(() => {
    const map = new Map<string, string>()
    interviews.forEach((interview) => {
      const current = map.get(interview.applicationId)
      if (!current) {
        map.set(interview.applicationId, interview.round)
        return
      }
      const currentInterview = interviews.find((item) => item.applicationId === interview.applicationId && item.round === current)
      if (!currentInterview || interview.scheduledAt > currentInterview.scheduledAt) {
        map.set(interview.applicationId, interview.round)
      }
    })
    return map
  }, [interviews])

  const filteredTableApplications = useMemo(() => {
    const keyword = applicationsFilter.keyword.trim().toLowerCase()
    const byFilter = applications.filter((app) => {
      if (applicationsFilter.companyId && app.companyId !== applicationsFilter.companyId) return false
      if (applicationsFilter.resumeId && app.resumeId !== applicationsFilter.resumeId) return false

      if (applicationsFilter.statuses.length > 0) {
        const labels = getFilterStatuses(app, latestRoundByApplication.get(app.id))
        if (!labels.some((label) => applicationsFilter.statuses.includes(label))) return false
      }

      if (keyword) {
        const company = (companyNameMap[app.companyId] ?? '').toLowerCase()
        const position = app.position.toLowerCase()
        const notes = (app.notes ?? '').toLowerCase()
        if (!company.includes(keyword) && !position.includes(keyword) && !notes.includes(keyword)) return false
      }

      return true
    })

    const sorted = [...byFilter]
    sorted.sort((a, b) => {
      if (tableSort === 'appliedAtDesc') return b.appliedAt.localeCompare(a.appliedAt)
      if (tableSort === 'updatedAtDesc') return b.updatedAt.localeCompare(a.updatedAt)
      if (tableSort === 'companyName') return (companyNameMap[a.companyId] ?? '').localeCompare(companyNameMap[b.companyId] ?? '', 'zh-Hans-CN')
      return getStatusSortValue(a, latestRoundByApplication.get(a.id)).localeCompare(getStatusSortValue(b, latestRoundByApplication.get(b.id)), 'zh-Hans-CN')
    })
    return sorted
  }, [applications, applicationsFilter, companyNameMap, latestRoundByApplication, tableSort])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (applicationsFilter.companyId) count += 1
    if (applicationsFilter.resumeId) count += 1
    if (applicationsFilter.statuses.length > 0) count += 1
    if (applicationsFilter.keyword.trim()) count += 1
    return count
  }, [applicationsFilter])

  const previewResume = async (app: Application) => {
    if (!app.resumeId) return
    const resume = resumeById.get(app.resumeId)
    if (!resume) return

    if (resume.source === 'link') {
      if (resume.externalUrl) {
        window.open(resume.externalUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }

    if (!resume.filePath || !token) return

    try {
      const blob = await fetchResumeFile(token, resume.filePath)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      toast.error('简历预览失败')
    }
  }

  const kanbanColumns = useMemo(
    () => columns.map((column) => ({ column, applications: applications.filter((app) => app.status === column.key) })),
    [applications],
  )

  useEffect(() => {
    const container = columnsScrollRef.current
    if (!container) return

    const onScroll = () => {
      const width = container.clientWidth * 0.8 + 12
      const index = Math.round(container.scrollLeft / Math.max(width, 1))
      setActiveColumnIndex(Math.min(columns.length - 1, Math.max(0, index)))
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  const activeApp = useMemo(() => applications.find((item) => item.id === activeId), [applications, activeId])

  const setDraggingClass = (dragging: boolean) => {
    document.body.classList.toggle('is-dragging', dragging)
  }

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
    setDraggingClass(true)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setDraggingClass(false)
    setActiveId(null)

    const { active, over } = event
    if (!over) return

    const rawTo = String(over.id)
    const directColumn = columns.find((item) => item.key === rawTo)
    const overApp = applications.find((item) => item.id === rawTo)
    const to = (directColumn?.key ?? overApp?.status) as Application['status'] | undefined

    if (!to) return

    const app = applications.find((item) => item.id === active.id)
    if (!app || app.status === to) return

    updateApplication(app.id, { status: to })
    pushActivity(`投递状态变更：${app.position} → ${statusLabel[to]}`)
    syncFromOtherStores()
    toast.success(`已更新为 ${statusLabel[to]}`)
  }

  const onDragCancel = () => {
    setDraggingClass(false)
    setActiveId(null)
  }

  const filterPanel = (
    <div className="space-y-3 rounded-xl border border-neutral-border bg-neutral-bg p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <select
          value={applicationsFilter.companyId ?? ''}
          onChange={(event) => setApplicationsFilter({ companyId: event.target.value || null })}
          className="h-10 rounded-xl border border-neutral-border bg-white px-3 text-sm"
        >
          <option value="">全部公司</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <select
          value={applicationsFilter.resumeId ?? ''}
          onChange={(event) => setApplicationsFilter({ resumeId: event.target.value || null })}
          className="h-10 rounded-xl border border-neutral-border bg-white px-3 text-sm"
        >
          <option value="">全部简历版本</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}
            </option>
          ))}
        </select>

        <input
          value={applicationsFilter.keyword}
          onChange={(event) => setApplicationsFilter({ keyword: event.target.value })}
          className="h-10 rounded-xl border border-neutral-border bg-white px-3 text-sm md:col-span-2"
          placeholder="搜索职位 / 公司 / 备注"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tableStatusOptions.map((option) => {
          const active = applicationsFilter.statuses.includes(option)
          return (
            <button
              key={option}
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-primary-cream text-neutral-text' : 'bg-white text-neutral-muted border border-neutral-border'}`}
              onClick={() => {
                if (active) {
                  setApplicationsFilter({ statuses: applicationsFilter.statuses.filter((item) => item !== option) })
                } else {
                  setApplicationsFilter({ statuses: [...applicationsFilter.statuses, option] })
                }
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-muted">
        <span>共 {applications.length} 条 / 已筛选出 {filteredTableApplications.length} 条</span>
        <div className="inline-flex items-center gap-2">
          <select
            value={tableSort}
            onChange={(event) => setTableSort(event.target.value as TableSortKey)}
            className="h-9 rounded-xl border border-neutral-border bg-white px-3 text-sm"
          >
            <option value="appliedAtDesc">按投递时间倒序</option>
            <option value="updatedAtDesc">按更新时间倒序</option>
            <option value="companyName">按公司名</option>
            <option value="status">按状态</option>
          </select>
          {activeFiltersCount > 0 && (
            <Button size="sm" variant="ghost" onClick={resetApplicationsFilter}>
              清空筛选
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="inline-flex gap-2">
          <Button size="sm" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}><Kanban className="mr-1 h-4 w-4" />看板</Button>
          <Button size="sm" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}><List className="mr-1 h-4 w-4" />表格</Button>
          <Button size="sm" variant={view === 'calendar' ? 'default' : 'outline'} onClick={() => setView('calendar')}><Calendar className="mr-1 h-4 w-4" />日历</Button>
        </div>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true) }}>新建投递</Button>
      </div>

      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div
            ref={columnsScrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:auto-rows-max md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {kanbanColumns.map(({ column, applications: columnApplications }) => (
              <KanbanColumn
                key={column.key}
                column={column}
                applications={columnApplications}
                className="w-[80vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink md:snap-none"
                companyNameMap={companyNameMap}
                nextTodoMap={nextTodoMap}
                resumeNameMap={resumeNameMap}
                onPreviewResume={(app) => {
                  void previewResume(app)
                }}
                onEdit={(app) => {
                  setEditing(app)
                  setDialogOpen(true)
                }}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-1.5 md:hidden">
            {columns.map((column, index) => (
              <span key={column.key} className={`h-1.5 w-1.5 rounded-full ${index === activeColumnIndex ? 'bg-neutral-text' : 'bg-neutral-border'}`} />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 150,
              easing: 'cubic-bezier(0, 0, 0.2, 1)',
            }}
          >
            {activeApp ? (
              <DraggingCardOverlay
                app={activeApp}
                company={companyNameMap[activeApp.companyId]}
                tone={columns.find((item) => item.key === activeApp.status)?.tone ?? 'mist'}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {view === 'table' && (
        <div className="space-y-3">
          <div className="md:hidden">
            <Button size="sm" variant="outline" onClick={() => setMobileFilterOpen(true)}>
              <Filter className="mr-1 h-4 w-4" />
              筛选 ({activeFiltersCount})
            </Button>
          </div>
          <div className="hidden md:block">{filterPanel}</div>

          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-neutral-border text-left text-neutral-muted">
                  <th className="py-2">公司</th><th>岗位</th><th>状态</th><th>投递日期</th><th>笔试日期</th><th>最近面试</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableApplications.map((app) => {
                  const recent = interviews.filter((i) => i.applicationId === app.id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0]
                  return (
                    <tr key={app.id} className="cursor-pointer border-b border-neutral-border last:border-0 hover:bg-primary-cream/10" onClick={() => navigate(`/applications/${app.id}`)}>
                      <td className="py-3">{companyNameMap[app.companyId] ?? '-'}</td>
                      <td>{app.position}</td>
                      <td>{getStatusSortValue(app, latestRoundByApplication.get(app.id))}</td>
                      <td>{app.appliedAt}</td>
                      <td>{app.writtenTestAt ?? '-'}</td>
                      <td>{recent?.scheduledAt?.slice(0, 10) ?? '-'}</td>
                      <td><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(app); setDialogOpen(true) }}>编辑</Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {view === 'calendar' && (
        <div className="space-y-2">
          {appEvents.length ? appEvents.map((event) => <EventCard key={event.id} event={event} />) : <EmptyState text="暂无投递相关日历事件" />}
        </div>
      )}

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} aria-label="关闭筛选抽屉" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-neutral-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-text">筛选 ({activeFiltersCount})</p>
              <button type="button" onClick={() => setMobileFilterOpen(false)} className="rounded-lg p-2 hover:bg-neutral-bg">
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <FormDialogLayout
          title={editing ? '编辑投递' : '新建投递'}
          formId="application-form"
          onCancel={() => setDialogOpen(false)}
          maxWidthClass="sm:max-w-2xl"
        >
          <ApplicationForm id="application-form" initial={editing} companies={companies} onSubmit={submit} />
        </FormDialogLayout>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="删除投递"
        description="确认删除该投递记录吗？"
        onConfirm={() => {
          if (!deletingId) return
          const title = applications.find((a) => a.id === deletingId)?.position ?? '投递'
          deleteApplication(deletingId)
          pushActivity(`删除投递：${title}`)
          syncFromOtherStores()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
