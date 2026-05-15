import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { companySchema, type CompanyFormValues } from '../../schemas/company.schema'
import type { Company } from '../../types'
import DatePicker from '../common/DatePicker'
import TagInput from '../common/TagInput'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  id?: string
  initial?: Company
  onSubmit: (values: CompanyFormValues) => void
}

const industries = ['互联网', '金融', '制造', '教育', '其他']

export default function CompanyForm({ id = 'company-form', initial, onSubmit }: Props) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      name: initial?.name ?? '',
      industry: initial?.industry ?? '互联网',
      status: initial?.status ?? 'open',
      applyUrl: initial?.applyUrl ?? '',
      positions: initial?.positions ?? [],
      deadline: initial?.deadline ?? '',
      baseLocation: initial?.baseLocation ?? '',
      salaryRange: initial?.salaryRange ?? '',
      referralCode: initial?.referralCode ?? '',
      contactInfo: initial?.contactInfo ?? '',
      description: initial?.description ?? '',
      researchNotes: initial?.researchNotes ?? '',
      source: initial?.source ?? '手动添加',
      relatedLinks: initial?.relatedLinks ?? [],
    },
  })

  const links = useFieldArray({ control: form.control, name: 'relatedLinks' })

  return (
    <form id={id} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* 第 1 行 */}
      <div>
        <label className="mb-1 block text-sm">公司名称 <span className="text-primary-rose">*</span></label>
        <Input {...form.register('name')} />
      </div>

      {/* 第 2 行 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">行业</label>
          <input list="industry" {...form.register('industry')} className="h-10 w-full rounded-xl border border-neutral-border px-3 text-sm" />
          <datalist id="industry">{industries.map((i) => <option key={i} value={i} />)}</datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm">招聘状态 <span className="text-primary-rose">*</span></label>
          <select {...form.register('status')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm">
            <option value="open">开放中</option>
            <option value="upcoming">即将开放</option>
            <option value="closed">已截止</option>
          </select>
        </div>
      </div>

      {/* 第 3 行 */}
      <div>
        <label className="mb-1 block text-sm">投递官网 <span className="text-primary-rose">*</span></label>
        <Input {...form.register('applyUrl')} />
      </div>

      {/* 第 4 行 */}
      <div>
        <label className="mb-1 block text-sm">开放岗位</label>
        <TagInput value={form.watch('positions') ?? []} onChange={(v) => form.setValue('positions', v)} />
      </div>

      {/* 第 5 行 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">截止日期</label>
          <DatePicker value={form.watch('deadline') || undefined} onChange={(value) => form.setValue('deadline', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">Base 地点</label><Input {...form.register('baseLocation')} /></div>
      </div>

      {/* 第 6 行 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm">薪资范围</label><Input {...form.register('salaryRange')} /></div>
        <div><label className="mb-1 block text-sm">内推码</label><Input {...form.register('referralCode')} /></div>
      </div>

      {/* 第 7 行 */}
      <div><label className="mb-1 block text-sm">HR 联系方式</label><Input {...form.register('contactInfo')} /></div>

      {/* 第 8 行 */}
      <div><label className="mb-1 block text-sm">公司简介</label><Textarea rows={3} {...form.register('description')} /></div>

      {/* 第 9 行 */}
      <div><label className="mb-1 block text-sm">调研笔记</label><Textarea rows={3} {...form.register('researchNotes')} placeholder="可以记录公司发展、面经摘要等" /></div>

      {/* 第 10 行 */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span>相关链接</span>
          <Button type="button" size="sm" variant="outline" onClick={() => links.append({ title: '', url: '' })}>+ 添加链接</Button>
        </div>
        <div className="space-y-2">
          {links.fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="标题" {...form.register(`relatedLinks.${idx}.title`)} />
              <Input placeholder="URL" {...form.register(`relatedLinks.${idx}.url`)} />
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => links.remove(idx)}>
                <Trash2 className="h-4 w-4 text-neutral-muted" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 第 11 行 */}
      <div>
        <label className="mb-1 block text-sm">数据来源</label>
        <Input {...form.register('source')} readOnly className="bg-neutral-bg text-neutral-muted" />
      </div>
    </form>
  )
}
