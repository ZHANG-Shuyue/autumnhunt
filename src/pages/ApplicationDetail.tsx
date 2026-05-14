import { ArrowLeft, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InterviewForm from '../components/forms/InterviewForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { interviewSchema, type InterviewFormValues } from '../schemas/interview.schema'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import type { Interview } from '../types'

export default function ApplicationDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const application = useApplicationStore((s) => s.getById(id))
  const companies = useCompanyStore((s) => s.companies)
  const interviews = useInterviewStore((s) => s.interviews)
  const addInterview = useInterviewStore((s) => s.addInterview)
  const updateInterview = useInterviewStore((s) => s.updateInterview)
  const deleteInterview = useInterviewStore((s) => s.deleteInterview)
  const sync = useCalendarStore((s) => s.syncFromOtherStores)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const list = useMemo(
    () => interviews.filter((item) => item.applicationId === id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    [id, interviews],
  )

  if (!application) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />返回</Button>
        <p className="text-neutral-muted">未找到该投递。</p>
      </div>
    )
  }

  const company = companies.find((item) => item.id === application.companyId)

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />返回</Button>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{company?.name ?? '未知公司'} · {application.position}</h2>
            <p className="mt-1 text-sm text-neutral-muted">投递于 {application.appliedAt}</p>
            <div className="mt-2"><Badge variant="mist">{application.status}</Badge></div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">基本信息</h3>
        <div className="grid grid-cols-1 gap-2 text-sm text-neutral-muted md:grid-cols-2">
          <p>简历版本：{application.resumeFile ?? '-'}</p>
          <p>笔试日期：{application.writtenTestAt ?? '-'}</p>
          <p>笔试结果：{application.writtenTestResult ?? '-'}</p>
          <p>最终结果：{application.finalResult ?? '-'}</p>
          <p className="md:col-span-2">准备文档：{application.preparationDocUrl ?? '-'}</p>
          <p className="md:col-span-2">备注：{application.notes ?? '-'}</p>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">面试时间线</h3>
          <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true) }}><Plus className="mr-1 h-4 w-4" />添加新一轮面试</Button>
        </div>
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="rounded-xl border border-neutral-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.round}</p>
                  <p className="text-sm text-neutral-muted">{new Date(item.scheduledAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-neutral-muted">评分：{'★'.repeat(item.rating ?? 0)}{'☆'.repeat(5 - (item.rating ?? 0))}</p>
                  <p className="mt-2 text-sm text-neutral-muted whitespace-pre-wrap">{item.questions ?? item.selfReview ?? '-'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(item); setOpen(true) }}>编辑</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeletingId(item.id)}>删除</Button>
                </div>
              </div>
            </div>
          ))}
          {!list.length && <p className="text-sm text-neutral-muted">还没有面试记录。</p>}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? '编辑面试' : '添加面试'}</DialogTitle></DialogHeader>
          <InterviewForm
            initial={editing}
            applications={[application]}
            onCancel={() => setOpen(false)}
            onSubmit={(values: InterviewFormValues) => {
              const parsed = interviewSchema.parse({ ...values, applicationId: id })
              const payload = { ...parsed, applicationId: id, scheduledAt: new Date(parsed.scheduledAt).toISOString() }
              if (editing) updateInterview(editing.id, payload)
              else addInterview(payload)
              sync()
              toast.success(editing ? '已更新' : '已添加')
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(openState) => !openState && setDeletingId(null)}
        title="删除面试"
        description="确认删除该面试记录吗？"
        onConfirm={() => {
          if (!deletingId) return
          deleteInterview(deletingId)
          sync()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
