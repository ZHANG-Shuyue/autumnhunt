import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Ellipsis, Kanban, List } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
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

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef}>{children}</div>
}

function SortableCard({
  app,
  company,
  nextTodo,
  onEdit,
  onDelete,
}: {
  app: Application
  company?: string
  nextTodo?: string
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* v0.2.1: 拖拽状态增加 2° 旋转与阴影增强 */}
      <Card className={`group p-3 ${isDragging ? 'rotate-2 shadow-[0_12px_30px_rgba(92,80,72,0.2)]' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-neutral-text">{company ?? '未知公司'}</p>
          {/* v0.2.1: hover 菜单替代卡片常驻按钮 */}
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
        </div>
        <p className="mt-1 text-sm text-neutral-muted">{app.position}</p>
        <p className="mt-2 text-xs text-neutral-muted">投递于 {app.appliedAt}</p>
        {app.resumeFile && <p className="mt-1 text-xs text-neutral-muted">简历：{app.resumeFile}</p>}
        {nextTodo && <p className="mt-1 text-xs text-neutral-muted">下一步：{nextTodo}</p>}
      </Card>
    </div>
  )
}

export default function Applications() {
  const navigate = useNavigate()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const companies = useCompanyStore((s) => s.companies)
  const interviews = useInterviewStore((s) => s.interviews)
  const { applications, addApplication, updateApplication, deleteApplication } = useApplicationStore()
  const { syncFromOtherStores, events } = useCalendarStore()

  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Application | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const appEvents = useMemo(() => events.filter((e) => ['投递', '笔试'].includes(e.type)), [events])

  const submit = (values: ApplicationFormValues) => {
    const parsed = applicationSchema.parse(values)
    const payload = {
      ...parsed,
      writtenTestAt: parsed.writtenTestAt || undefined,
      preparationDocUrl: parsed.preparationDocUrl || undefined,
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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const to = over.id as Application['status']
    const valid = columns.find((item) => item.key === to)
    if (!valid) return
    const app = applications.find((item) => item.id === active.id)
    if (!app || app.status === to) return
    updateApplication(app.id, { status: to })
    pushActivity(`投递状态变更：${app.position} → ${statusLabel[to]}`)
    syncFromOtherStores()
    toast.success(`已更新为 ${statusLabel[to]}`)
  }

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
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5">
            {columns.map((column) => {
              const list = applications.filter((app) => app.status === column.key)
              return (
                <DroppableColumn key={column.key} id={column.key}>
                  <Card className="p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant={column.tone}>{column.label}</Badge>
                      <span className="text-xs text-neutral-muted">{list.length}</span>
                    </div>
                    <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {list.map((app) => (
                          <SortableCard
                            key={app.id}
                            app={app}
                            company={companies.find((c) => c.id === app.companyId)?.name}
                            nextTodo={nextTodoOf(app)}
                            onEdit={() => { setEditing(app); setDialogOpen(true) }}
                            onDelete={() => setDeletingId(app.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </Card>
                </DroppableColumn>
              )}
            )}
          </div>
        </DndContext>
      )}

      {view === 'table' && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-neutral-border text-left text-neutral-muted">
                <th className="py-2">公司</th><th>岗位</th><th>状态</th><th>投递日期</th><th>笔试日期</th><th>最近面试</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const recent = interviews.filter((i) => i.applicationId === app.id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0]
                return (
                  <tr key={app.id} className="cursor-pointer border-b border-neutral-border last:border-0 hover:bg-primary-cream/10" onClick={() => navigate(`/applications/${app.id}`)}>
                    <td className="py-3">{companies.find((c) => c.id === app.companyId)?.name ?? '-'}</td>
                    <td>{app.position}</td>
                    <td>{columns.find((c) => c.key === app.status)?.label}</td>
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
      )}

      {view === 'calendar' && (
        <div className="space-y-2">
          {appEvents.length ? appEvents.map((event) => <EventCard key={event.id} event={event} />) : <EmptyState text="暂无投递相关日历事件" />}
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
