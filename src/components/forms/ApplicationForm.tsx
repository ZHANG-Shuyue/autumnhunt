import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { applicationSchema, type ApplicationFormValues } from '../../schemas/application.schema'
import type { Application, Company } from '../../types'
import DatePicker from '../common/DatePicker'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  initial?: Application
  companies: Company[]
  onSubmit: (values: ApplicationFormValues) => void
  onCancel: () => void
  fixedCompanyId?: string
}

export default function ApplicationForm({ initial, companies, onSubmit, onCancel, fixedCompanyId }: Props) {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    mode: 'onBlur',
    defaultValues: {
      companyId: fixedCompanyId ?? initial?.companyId ?? '',
      position: initial?.position ?? '',
      status: initial?.status ?? 'applied',
      appliedAt: initial?.appliedAt ?? new Date().toISOString().slice(0, 10),
      resumeFile: initial?.resumeFile ?? '',
      preparationDocUrl: initial?.preparationDocUrl ?? '',
      writtenTestAt: initial?.writtenTestAt ?? '',
      writtenTestResult: initial?.writtenTestResult ?? 'pending',
      finalResult: initial?.finalResult ?? 'pending',
      notes: initial?.notes ?? '',
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm">关联公司 <span className="text-primary-rose">*</span></label>
        <select {...form.register('companyId')} disabled={!!fixedCompanyId} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm disabled:opacity-70">
          <option value="">请选择</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label className="mb-1 block text-sm">投递岗位 <span className="text-primary-rose">*</span></label><Input {...form.register('position')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">投递日期</label>
          {/* v0.2.1: 统一使用 DatePicker */}
          <DatePicker value={form.watch('appliedAt')} onChange={(value) => form.setValue('appliedAt', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">投递状态</label><select {...form.register('status')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="applied">已投递</option><option value="written_test">笔试中</option><option value="interviewing">面试中</option><option value="offer">Offer</option><option value="rejected">已挂</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm">简历版本</label><Input {...form.register('resumeFile')} /></div><div><label className="mb-1 block text-sm">准备文档</label><Input {...form.register('preparationDocUrl')} /></div></div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm">笔试日期</label>
          {/* v0.2.1: 统一使用 DatePicker */}
          <DatePicker value={form.watch('writtenTestAt') || undefined} onChange={(value) => form.setValue('writtenTestAt', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">笔试结果</label><select {...form.register('writtenTestResult')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="pending">待定</option><option value="passed">通过</option><option value="failed">未通过</option></select></div>
        <div><label className="mb-1 block text-sm">最终结果</label><select {...form.register('finalResult')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="pending">进行中</option><option value="offer">Offer</option><option value="rejected">Rejected</option><option value="withdrawn">已撤回</option></select></div>
      </div>
      <div><label className="mb-1 block text-sm">备注</label><Textarea {...form.register('notes')} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>取消</Button><Button type="submit">保存</Button></div>
    </form>
  )
}
