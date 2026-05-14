import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { companySchema, type CompanyFormValues } from '../../schemas/company.schema'
import type { Company } from '../../types'
import DatePicker from '../common/DatePicker'
import TagInput from '../common/TagInput'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  initial?: Company
  onSubmit: (values: CompanyFormValues) => void
  onCancel: () => void
}

const industries = ['互联网', '金融', '制造', '教育', '其他']

export default function CompanyForm({ initial, onSubmit, onCancel }: Props) {
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm">公司名称 <span className="text-primary-rose">*</span></label>
        <Input {...form.register('name')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
      <div>
        <label className="mb-1 block text-sm">投递官网 <span className="text-primary-rose">*</span></label>
        <Input {...form.register('applyUrl')} />
      </div>
      <div>
        <label className="mb-1 block text-sm">开放岗位</label>
        <TagInput value={form.watch('positions') ?? []} onChange={(v) => form.setValue('positions', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">截止日期</label>
          {/* v0.2.1: 统一使用 DatePicker */}
          <DatePicker value={form.watch('deadline') || undefined} onChange={(value) => form.setValue('deadline', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">Base 地点</label><Input {...form.register('baseLocation')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm">薪资范围</label><Input {...form.register('salaryRange')} /></div>
        <div><label className="mb-1 block text-sm">内推码</label><Input {...form.register('referralCode')} /></div>
      </div>
      <div><label className="mb-1 block text-sm">HR 联系方式</label><Input {...form.register('contactInfo')} /></div>
      <div><label className="mb-1 block text-sm">公司简介</label><Textarea {...form.register('description')} /></div>
      <div><label className="mb-1 block text-sm">调研笔记</label><Textarea {...form.register('researchNotes')} placeholder="可以记录公司发展、面经摘要等" /></div>
      <div>
        <div className="mb-1 flex items-center justify-between text-sm"><span>相关链接</span><Button type="button" size="sm" variant="outline" onClick={() => links.append({ title: '', url: '' })}>添加</Button></div>
        <div className="space-y-2">
          {links.fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input placeholder="标题" {...form.register(`relatedLinks.${idx}.title`)} />
              <Input placeholder="URL" {...form.register(`relatedLinks.${idx}.url`)} />
              <Button type="button" variant="destructive" size="sm" onClick={() => links.remove(idx)}>删</Button>
            </div>
          ))}
        </div>
      </div>
      <div><label className="mb-1 block text-sm">数据来源</label><Input {...form.register('source')} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>取消</Button><Button type="submit">保存</Button></div>
    </form>
  )
}
