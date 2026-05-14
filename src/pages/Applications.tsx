import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Kanban, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import ApplicationForm from '../components/forms/ApplicationForm'
import EventCard from '../components/calendar/EventCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import type { Application } from '../types'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { applicationSchema, type ApplicationFormValues } from '../schemas/application.schema'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

const columns: { key: Application['status']; label: string; tone: 'mist' | 'cream' | 'rose' | 'sage' | 'ash' }[] = [
  { key: 'applied', label: '已投递', tone: 'mist' },
  { key: 'written_test', label: '笔试中', tone: 'cream' },
  { key: 'interviewing', label: '面试中', tone: 'rose' },
  { key: 'offer', label: 'Offer', tone: 'sage' },
  { key: 'rejected', label: '已挂', tone: 'ash' },
]

function SortableCard({ app, company, onEdit, onDelete }: { app: Application; company?: string; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`p-3 ${isDragging ? 'rotate-2 shadow-[0_12px_30px_rgba(92,80,72,0.2)]' : ''}`}>
        <p className="font-medium">{company ?? '未知公司'}</p>
        <p className="mt-1 text-sm text-neutral-muted">{app.position}</p>
        <p className="mt-2 text-xs text-neutral-muted">投递于 {app.appliedAt}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>编辑</Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>删除</Button>
        </div>
      </Card>
    </div>
  )
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef}>{children}</div>
}

export default function Applications() {
  const navigate = useNavigate()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const companies = useCompanyStore((s) => s.companies)
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
      toast.success('已更新')
    } else {
      addApplication(payload)
      toast.success('已添加')
    }
    syncFromOtherStores()
    setDialogOpen(false)
    setEditing(undefined)
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
    syncFromOtherStores()
    toast.success('状态已更新')
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
                            onEdit={() => { setEditing(app); setDialogOpen(true) }}
                            onDelete={() => setDeletingId(app.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </Card>
                </DroppableColumn>
              )
            })}
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
                const interviews = useCalendarStore.getState().events.filter((e) => e.linkedTo?.kind === 'interview')
                const recent = interviews.find((e) => e.linkedTo?.id === app.id)
                return (
                  <tr key={app.id} className="cursor-pointer border-b border-neutral-border last:border-0 hover:bg-primary-cream/10" onClick={() => navigate(`/applications/${app.id}`)}>
                    <td className="py-3">{companies.find((c) => c.id === app.companyId)?.name ?? '-'}</td>
                    <td>{app.position}</td>
                    <td>{columns.find((c) => c.key === app.status)?.label}</td>
                    <td>{app.appliedAt}</td>
                    <td>{app.writtenTestAt ?? '-'}</td>
                    <td>{recent?.date ?? '-'}</td>
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
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? '编辑投递' : '新建投递'}</DialogTitle></DialogHeader><ApplicationForm initial={editing} companies={companies} onSubmit={submit} onCancel={() => setDialogOpen(false)} /></DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="删除投递"
        description="确认删除该投递记录吗？"
        onConfirm={() => {
          if (!deletingId) return
          deleteApplication(deletingId)
          syncFromOtherStores()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
