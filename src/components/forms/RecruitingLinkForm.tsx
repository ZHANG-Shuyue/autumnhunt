import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import FormDialogLayout from '../common/FormDialogLayout'
import { Dialog } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import type { RecruitingLink } from '../../types'

const recruitingLinkSchema = z.object({
  label: z.string().min(1, '请输入链接名称'),
  url: z.string().url('请输入有效 URL'),
  type: z.enum(['official', 'jd', 'referral', 'note', 'other']),
  note: z.string().optional(),
})

export type RecruitingLinkFormValues = z.infer<typeof recruitingLinkSchema>

interface RecruitingLinkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: RecruitingLink
  onSubmit: (values: RecruitingLinkFormValues) => void
}

const typeOptions: Array<{ value: RecruitingLink['type']; label: string }> = [
  { value: 'official', label: '官网' },
  { value: 'jd', label: 'JD' },
  { value: 'referral', label: '内推' },
  { value: 'note', label: '备注' },
  { value: 'other', label: '其他' },
]

export default function RecruitingLinkForm({ open, onOpenChange, initial, onSubmit }: RecruitingLinkFormProps) {
  const form = useForm<RecruitingLinkFormValues>({
    resolver: zodResolver(recruitingLinkSchema),
    mode: 'onBlur',
    defaultValues: {
      label: initial?.label ?? '',
      url: initial?.url ?? '',
      type: initial?.type ?? 'jd',
      note: initial?.note ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      label: initial?.label ?? '',
      url: initial?.url ?? '',
      type: initial?.type ?? 'jd',
      note: initial?.note ?? '',
    })
  }, [initial, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={initial ? '编辑招聘链接' : '添加招聘链接'}
        formId="recruiting-link-form"
        onCancel={() => onOpenChange(false)}
        maxWidthClass="sm:max-w-xl"
      >
        <form id="recruiting-link-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm">名称 <span className="text-primary-rose">*</span></label>
            <Input {...form.register('label')} placeholder="如：2026 秋招前端 JD" />
          </div>
          <div>
            <label className="mb-1 block text-sm">链接 <span className="text-primary-rose">*</span></label>
            <Input {...form.register('url')} placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">类型</label>
            <select {...form.register('type')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm">
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">备注（可选）</label>
            <Textarea rows={3} {...form.register('note')} placeholder="可填写内推码、注意事项等" />
          </div>
        </form>
      </FormDialogLayout>
    </Dialog>
  )
}
