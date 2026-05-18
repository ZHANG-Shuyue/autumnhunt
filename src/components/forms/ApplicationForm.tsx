import { zodResolver } from '@hookform/resolvers/zod'
import { Link2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { applicationSchema, type ApplicationFormValues } from '../../schemas/application.schema'
import type { Application, Company, RecruitingLink } from '../../types'
import { useResumeStore } from '../../store/useResumeStore'
import DatePicker from '../common/DatePicker'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface Props {
  id?: string
  initial?: Application
  companies: Company[]
  onSubmit: (values: ApplicationFormValues) => void
  fixedCompanyId?: string
}

const typeLabel: Record<RecruitingLink['type'], string> = {
  official: '官网',
  jd: 'JD',
  referral: '内推',
  note: '备注',
  other: '其他',
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function ApplicationForm({ id = 'application-form', initial, companies, onSubmit, fixedCompanyId }: Props) {
  const resumes = useResumeStore((s) => s.resumes)
  const initialCompanyIndustry = useMemo(
    () => companies.find((company) => company.id === (fixedCompanyId ?? initial?.companyId ?? ''))?.industry,
    [companies, fixedCompanyId, initial?.companyId],
  )
  const defaultResumeId = useMemo(() => {
    if (initial?.resumeId) return initial.resumeId
    const activeByIndustry = resumes.find((item) => item.isActive && item.category === initialCompanyIndustry)
    if (activeByIndustry) return activeByIndustry.id
    const anyActive = resumes.find((item) => item.isActive)
    return anyActive?.id ?? ''
  }, [initial?.resumeId, initialCompanyIndustry, resumes])

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    mode: 'onBlur',
    defaultValues: {
      companyId: fixedCompanyId ?? initial?.companyId ?? '',
      position: initial?.position ?? '',
      status: initial?.status ?? 'applied',
      appliedAt: initial?.appliedAt ?? new Date().toISOString().slice(0, 10),
      resumeId: initial?.resumeId ?? defaultResumeId,
      jobUrl: initial?.jobUrl ?? '',
      preparationDocUrl: initial?.preparationDocUrl ?? '',
      writtenTestAt: initial?.writtenTestAt ?? '',
      writtenTestResult: initial?.writtenTestResult ?? 'pending',
      finalResult: initial?.finalResult ?? 'pending',
      notes: initial?.notes ?? '',
    },
  })

  const selectedCompanyId = form.watch('companyId')
  const selectedCompany = useMemo(() => companies.find((company) => company.id === selectedCompanyId), [companies, selectedCompanyId])
  const recruitingLinks = selectedCompany?.recruitingLinks ?? []
  const resumeOptions = useMemo(
    () => resumes.map((item) => ({ value: item.id, label: `${safeDecode(item.name)} (${item.category})` })),
    [resumes],
  )

  useEffect(() => {
    const currentResumeId = form.getValues('resumeId')
    if (currentResumeId) return

    const preferred = resumes.find((item) => item.isActive && item.category === selectedCompany?.industry)
    const fallback = resumes.find((item) => item.isActive)
    const targetId = preferred?.id ?? fallback?.id
    if (targetId) {
      form.setValue('resumeId', targetId, { shouldDirty: false })
    }
  }, [form, resumes, selectedCompany?.industry])

  return (
    <form id={id} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm">关联公司 <span className="text-primary-rose">*</span></label>
        <select {...form.register('companyId')} disabled={!!fixedCompanyId} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm disabled:opacity-70">
          <option value="">请选择</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">投递岗位 <span className="text-primary-rose">*</span></label>
        <Input {...form.register('position')} />
      </div>

      {recruitingLinks.length > 0 && (
        <div>
          <label className="mb-1 inline-flex items-center gap-1 text-sm"><Link2 className="h-4 w-4" /> 关联招聘链接（可选）</label>
          <select
            className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"
            defaultValue=""
            onChange={(event) => {
              const link = recruitingLinks.find((item) => item.id === event.target.value)
              if (!link) return
              const current = form.getValues('jobUrl')?.trim()
              if (!current) {
                form.setValue('jobUrl', link.url, { shouldValidate: true })
                return
              }
              if (current !== link.url) {
                const shouldOverride = window.confirm('已存在 JD 链接，是否覆盖?')
                if (shouldOverride) {
                  form.setValue('jobUrl', link.url, { shouldValidate: true })
                } else {
                  toast('已保留当前 JD 链接')
                }
              }
            }}
          >
            <option value="">请选择关联链接</option>
            {recruitingLinks.map((link) => (
              <option key={link.id} value={link.id}>{`[${typeLabel[link.type]}] ${link.label}`}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">JD 链接</label>
          <Input {...form.register('jobUrl')} placeholder="https://..." />
        </div>
        <div>
          <label className="mb-1 block text-sm">投递日期</label>
          <DatePicker value={form.watch('appliedAt')} onChange={(value) => form.setValue('appliedAt', value ?? '')} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm">投递状态</label>
        <select {...form.register('status')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm">
          <option value="applied">已投递</option>
          <option value="written_test">笔试中</option>
          <option value="interviewing">面试中</option>
          <option value="offer">Offer</option>
          <option value="rejected">已挂</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">使用简历版本</label>
        <select {...form.register('resumeId')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm">
          <option value="">不选择</option>
          {resumeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div><label className="mb-1 block text-sm">准备文档</label><Input {...form.register('preparationDocUrl')} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">笔试日期</label>
          <DatePicker value={form.watch('writtenTestAt') || undefined} onChange={(value) => form.setValue('writtenTestAt', value ?? '')} />
        </div>
        <div><label className="mb-1 block text-sm">笔试结果</label><select {...form.register('writtenTestResult')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="pending">待定</option><option value="passed">通过</option><option value="failed">未通过</option></select></div>
        <div><label className="mb-1 block text-sm">最终结果</label><select {...form.register('finalResult')} className="h-10 w-full rounded-xl border border-neutral-border bg-white px-3 text-sm"><option value="pending">进行中</option><option value="offer">Offer</option><option value="rejected">Rejected</option><option value="withdrawn">已撤回</option></select></div>
      </div>
      <div><label className="mb-1 block text-sm">备注</label><Textarea rows={3} {...form.register('notes')} /></div>
    </form>
  )
}
