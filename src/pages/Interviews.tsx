import { isAfter } from 'date-fns'
import { Plus, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import InterviewForm from '../components/forms/InterviewForm'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import FormDialogLayout from '../components/common/FormDialogLayout'
import { Dialog } from '../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { interviewSchema, type InterviewFormValues } from '../schemas/interview.schema'
import type { Interview } from '../types'
import { pushActivity } from '../utils/activity'

export default function Interviews() {
  const applications = useApplicationStore((s) => s.applications)
  const companies = useCompanyStore((s) => s.companies)
  const { interviews, addInterview, updateInterview, deleteInterview } = useInterviewStore()
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)

  const [view, setView] = useState<'timeline' | 'table'>('timeline')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'done'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const list = useMemo(() => {
    return interviews
      .filter((i) => {
        if (filter === 'all') return true
        const future = isAfter(new Date(i.scheduledAt), new Date())
        return filter === 'upcoming' ? future : !future
      })
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  }, [filter, interviews])

  const submit = (values: InterviewFormValues) => {
    const parsed = interviewSchema.parse(values)
    const payload = {
      ...parsed,
      scheduledAt: new Date(parsed.scheduledAt).toISOString(),
    }
    if (editing) {
      updateInterview(editing.id, payload)
      pushActivity(`更新面试：${payload.round}`)
      toast.success('已更新')
    } else {
      addInterview(payload)
      pushActivity(`新增面试：${payload.round}`)
      toast.success('已添加')
    }
    syncFromOtherStores()
    setDialogOpen(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="timeline">时间线</TabsTrigger>
              <TabsTrigger value="table">表格</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" className="md:hidden" onClick={() => setShowFilters((v) => !v)}>
            筛选
          </Button>
        </div>
        <div className={`flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <div className="inline-flex flex-wrap gap-2">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>所有面试</Button>
            <Button size="sm" variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>即将到来</Button>
            <Button size="sm" variant={filter === 'done' ? 'default' : 'outline'} onClick={() => setFilter('done')}>已完成</Button>
          </div>
          <Button onClick={() => { setEditing(undefined); setDialogOpen(true) }}><Plus className="mr-1 h-4 w-4" />新建面试</Button>
        </div>
      </div>

      {!list.length ? (
        <EmptyState text="还没有面试记录，先添加一场吧 🎯" />
      ) : view === 'timeline' ? (
        <div className="space-y-4">
          {list.map((interview, index) => {
            const app = applications.find((a) => a.id === interview.applicationId)
            const company = companies.find((c) => c.id === app?.companyId)
            return (
              <div key={interview.id} className="flex gap-4">
                <div className="flex flex-col items-center pt-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-mist" />
                  {index !== list.length - 1 && <span className="mt-1 h-full w-px bg-neutral-border" />}
                </div>
                <Card className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{company?.name ?? '未知公司'} · {interview.round}</h3>
                      <p className="mt-1 text-sm text-neutral-muted">{new Date(interview.scheduledAt).toLocaleString()}</p>
                      <p className="mt-2 text-sm text-neutral-muted">评分：{'★'.repeat(interview.rating ?? 0)}{'☆'.repeat(5 - (interview.rating ?? 0))}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === interview.id ? null : interview.id)}>展开</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(interview); setDialogOpen(true) }}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeletingId(interview.id)}>删除</Button>
                    </div>
                  </div>
                  {expanded === interview.id && (
                    <div className="mt-3 space-y-2 rounded-xl bg-neutral-bg p-3 text-sm text-neutral-muted">
                      <p>面试官：{interview.interviewer ?? '-'}</p>
                      <p>形式：{interview.format ?? '-'}</p>
                      <p>地点/链接：{interview.location ?? '-'}</p>
                      <p>问题：{interview.questions ?? '-'}</p>
                      <p>复盘：{interview.selfReview ?? '-'}</p>
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-neutral-border text-left text-neutral-muted">
                <th className="py-2">公司</th><th>轮次</th><th>时间</th><th>时长</th><th>形式</th><th>评分</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((interview) => {
                const app = applications.find((a) => a.id === interview.applicationId)
                const company = companies.find((c) => c.id === app?.companyId)
                return (
                  <tr key={interview.id} className="border-b border-neutral-border last:border-0">
                    <td className="py-3">{company?.name ?? '-'}</td>
                    <td>{interview.round}</td>
                    <td>{new Date(interview.scheduledAt).toLocaleString()}</td>
                    <td>{interview.duration ? <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" />{interview.duration}m</span> : '-'}</td>
                    <td>{interview.format ?? '-'}</td>
                    <td>{interview.rating ?? '-'}</td>
                    <td className="space-x-1"><Button size="sm" variant="ghost" onClick={() => { setEditing(interview); setDialogOpen(true) }}>编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeletingId(interview.id)}>删</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <FormDialogLayout
          title={editing ? '编辑面试' : '新建面试'}
          formId="interview-form"
          onCancel={() => setDialogOpen(false)}
         
          maxWidthClass="sm:max-w-2xl"
        >
          <InterviewForm id="interview-form" initial={editing} applications={applications} onSubmit={submit} />
        </FormDialogLayout>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="删除面试"
        description="确认删除该面试记录吗？"
        onConfirm={() => {
          if (!deletingId) return
          const round = interviews.find((i) => i.id === deletingId)?.round ?? '面试'
          deleteInterview(deletingId)
          pushActivity(`删除面试：${round}`)
          syncFromOtherStores()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
