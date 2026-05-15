import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { interviewSchema, type InterviewFormValues } from '../../schemas/interview.schema'
import type { Application, Interview } from '../../types'
import DatePicker from '../common/DatePicker'
import StarRating from '../common/StarRating'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  id?: string
  initial?: Interview
  applications: Application[]
  onSubmit: (values: InterviewFormValues) => void
}

export default function InterviewForm({ id = 'interview-form', initial, applications, onSubmit }: Props) {
  const [dateOnly, setDateOnly] = useState(initial?.scheduledAt ? format(new Date(initial.scheduledAt), 'yyyy-MM-dd') : '')
  const [timeOnly, setTimeOnly] = useState(initial?.scheduledAt ? format(new Date(initial.scheduledAt), 'HH:mm') : '')

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    mode: 'onBlur',
    defaultValues: {
      applicationId: initial?.applicationId ?? '',
      round: initial?.round ?? '一面',
      scheduledAt: initial?.scheduledAt?.slice(0, 16) ?? '',
      duration: initial?.duration,
      format: initial?.format,
      location: initial?.location ?? '',
      interviewer: initial?.interviewer ?? '',
      questions: initial?.questions ?? '',
      selfReview: initial?.selfReview ?? '',
      rating: initial?.rating ?? 3,
    },
  })

  const scheduledValue = useMemo(() => {
    if (!dateOnly) return ''
    return `${dateOnly}T${timeOnly || '09:00'}`
  }, [dateOnly, timeOnly])

  return (
    <form id={id} onSubmit={form.handleSubmit((values) => onSubmit({ ...values, scheduledAt: scheduledValue || values.scheduledAt }))} className="space-y-4">
      <div><label className="mb-1 block text-sm">关联投递 <span className="text-primary-rose">*</span></label><select {...form.register('applicationId')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="">请选择</option>{applications.map((a) => <option key={a.id} value={a.id}>{a.position}</option>)}</select></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm">轮次</label><Input {...form.register('round')} /></div><div><label className="mb-1 block text-sm">时间</label><Input type="time" value={timeOnly} onChange={(e) => setTimeOnly(e.target.value)} /></div></div>
      <div><label className="mb-1 block text-sm">日期</label><DatePicker value={dateOnly || undefined} onChange={(value) => setDateOnly(value ?? '')} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><label className="mb-1 block text-sm">时长</label><Input type="number" {...form.register('duration')} /></div><div><label className="mb-1 block text-sm">形式</label><select {...form.register('format')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="">-</option><option value="onsite">现场</option><option value="video">视频</option><option value="phone">电话</option></select></div><div><label className="mb-1 block text-sm">地点/链接</label><Input {...form.register('location')} /></div></div>
      <div><label className="mb-1 block text-sm">面试官</label><Input {...form.register('interviewer')} /></div>
      <div><label className="mb-1 block text-sm">面试问题</label><Textarea rows={3} {...form.register('questions')} /></div>
      <div><label className="mb-1 block text-sm">回答复盘</label><Textarea rows={3} {...form.register('selfReview')} /></div>
      <div><label className="mb-1 block text-sm">评分</label><StarRating value={form.watch('rating') ?? 0} onChange={(v) => form.setValue('rating', v)} /></div>
    </form>
  )
}
