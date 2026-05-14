import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { eventSchema, type EventFormValues } from '../../schemas/event.schema'
import type { CalendarEvent } from '../../types'
import DatePicker from '../common/DatePicker'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  initial?: CalendarEvent
  onSubmit: (values: EventFormValues) => void
  onCancel: () => void
}

export default function EventForm({ initial, onSubmit, onCancel }: Props) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    mode: 'onBlur',
    defaultValues: {
      title: initial?.title ?? '',
      type: initial?.type ?? '',
      color: initial?.color ?? 'cream',
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      time: initial?.time ?? '',
      endTime: initial?.endTime ?? '',
      description: initial?.description ?? '',
      linkedKind: initial?.linkedTo?.kind ?? '',
      linkedId: initial?.linkedTo?.id ?? '',
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div><label className="mb-1 block text-sm">标题 <span className="text-primary-rose">*</span></label><Input {...form.register('title')} /></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm">类型</label><Input {...form.register('type')} /></div><div><label className="mb-1 block text-sm">颜色</label><select {...form.register('color')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="cream">cream</option><option value="mist">mist</option><option value="rose">rose</option><option value="sage">sage</option><option value="ash">ash</option></select></div></div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm">日期</label>
          {/* v0.2.1: 统一 DatePicker */}
          <DatePicker value={form.watch('date')} onChange={(value) => form.setValue('date', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">开始时间</label><Input type="time" {...form.register('time')} /></div>
        <div><label className="mb-1 block text-sm">结束时间</label><Input type="time" {...form.register('endTime')} /></div>
      </div>
      <div><label className="mb-1 block text-sm">描述</label><Textarea {...form.register('description')} /></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm">关联类型</label><select {...form.register('linkedKind')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="">无</option><option value="company">公司</option><option value="application">投递</option><option value="interview">面试</option></select></div><div><label className="mb-1 block text-sm">关联ID</label><Input {...form.register('linkedId')} /></div></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>取消</Button><Button type="submit">保存</Button></div>
    </form>
  )
}
