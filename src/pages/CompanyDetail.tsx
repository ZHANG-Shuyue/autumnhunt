import { ArrowLeft, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import EmptyState from '../components/common/EmptyState'
import ApplicationForm from '../components/forms/ApplicationForm'
import RecruitingLinkForm, { type RecruitingLinkFormValues } from '../components/forms/RecruitingLinkForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import FormDialogLayout from '../components/common/FormDialogLayout'
import { Dialog } from '../components/ui/dialog'
import { applicationSchema, type ApplicationFormValues } from '../schemas/application.schema'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import type { RecruitingLink } from '../types'

const recruitingTypeMeta: Record<RecruitingLink['type'], { label: string; variant: 'cream' | 'mist' | 'rose' | 'sage' | 'ash' }> = {
  official: { label: '官网', variant: 'cream' },
  jd: { label: 'JD', variant: 'mist' },
  referral: { label: '内推', variant: 'rose' },
  note: { label: '备注', variant: 'sage' },
  other: { label: '其他', variant: 'ash' },
}

function looksLikeReferralCode(text?: string) {
  if (!text) return false
  const value = text.trim()
  if (!value || value.length > 24) return false
  if (/https?:\/\//i.test(value)) return false
  return /^[A-Za-z0-9_-]{4,24}$/.test(value)
}

export default function CompanyDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const company = useCompanyStore((s) => s.getCompanyById(id))
  const apps = useApplicationStore((s) => s.applications)
  const addApplication = useApplicationStore((s) => s.addApplication)
  const sync = useCalendarStore((s) => s.syncFromOtherStores)
  const addRecruitingLink = useCompanyStore((s) => s.addRecruitingLink)
  const updateRecruitingLink = useCompanyStore((s) => s.updateRecruitingLink)
  const deleteRecruitingLink = useCompanyStore((s) => s.deleteRecruitingLink)

  const [open, setOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<RecruitingLink | undefined>()

  const list = useMemo(() => apps.filter((item) => item.companyId === id), [apps, id])
  const recruitingLinks = company?.recruitingLinks ?? []

  if (!company) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />返回</Button>
        <p className="text-neutral-muted">未找到该公司。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <h2 className="text-2xl font-semibold">{company.name}</h2>
            <div className="mt-2 flex gap-2"><Badge variant="sage">{company.industry}</Badge><Badge variant="cream">{company.status}</Badge></div>
            <div className="mt-4 space-y-2 text-sm text-neutral-muted">
              <p>官网：{company.applyUrl}</p><p>截止：{company.deadline ?? '-'}</p><p>Base：{company.baseLocation ?? '-'}</p><p>薪资：{company.salaryRange ?? '-'}</p>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">🔗 招聘链接 ({recruitingLinks.length})</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingLink(undefined)
                  setLinkDialogOpen(true)
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> 添加
              </Button>
            </div>
            {recruitingLinks.length === 0 ? (
              <EmptyState text="还没有招聘链接,添加官网、JD 或内推码方便随时查看" />
            ) : (
              <div className="space-y-2">
                {recruitingLinks.map((link) => {
                  const meta = recruitingTypeMeta[link.type]
                  return (
                    <div key={link.id} className="group rounded-xl border border-neutral-border p-3 hover:bg-primary-cream/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 gap-2">
                          <Badge variant={meta.variant} className="h-fit">{meta.label}</Badge>
                          <div className="min-w-0 flex-1">
                            <a href={link.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 truncate text-sm font-medium text-neutral-text underline underline-offset-4">
                              {link.label}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            {link.note && (
                              <p className="mt-1 flex items-center gap-2 text-xs text-neutral-muted">
                                <span>{link.note}</span>
                                {looksLikeReferralCode(link.note) && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-md border border-neutral-border px-2 py-0.5 hover:bg-primary-sage/15"
                                    onClick={() => {
                                      void navigator.clipboard.writeText(link.note ?? '')
                                      toast.success('已复制')
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />复制
                                  </button>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="rounded-md p-1 hover:bg-primary-cream/30"
                            onClick={() => {
                              setEditingLink(link)
                              setLinkDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 text-neutral-muted" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md p-1 hover:bg-primary-ash/25"
                            onClick={() => {
                              deleteRecruitingLink(company.id, link.id)
                              toast.success('链接已删除')
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-neutral-muted" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card><h3 className="mb-2 font-semibold">调研笔记</h3><p className="whitespace-pre-wrap text-sm text-neutral-muted">{company.researchNotes || '暂无记录'}</p></Card>
          <Card>
            <h3 className="mb-2 font-semibold">相关链接</h3>
            <div className="space-y-2 text-sm">
              {(company.relatedLinks ?? []).map((link) => <a key={link.url} href={link.url} target="_blank" className="block text-neutral-muted underline">{link.title}</a>)}
              {!company.relatedLinks?.length && <p className="text-neutral-muted">暂无链接</p>}
            </div>
          </Card>
        </div>
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">我的投递</h3><Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />新建投递</Button></div>
            <div className="space-y-2">
              {list.map((app) => {
                const from = recruitingLinks.find((item) => item.url === app.jobUrl)
                return (
                  <Link key={app.id} to={`/applications/${app.id}`} className="block rounded-xl border border-neutral-border p-3 text-sm hover:bg-primary-cream/10">
                    <p className="font-medium">{app.position}</p>
                    <p className="text-neutral-muted">{app.status} · {app.appliedAt}</p>
                    {from && <Badge variant={recruitingTypeMeta[from.type].variant} className="mt-2 w-fit">来自:{from.label}</Badge>}
                  </Link>
                )
              })}
              {!list.length && <p className="text-sm text-neutral-muted">暂无投递记录</p>}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <FormDialogLayout title="新建投递" formId="application-form" onCancel={() => setOpen(false)} maxWidthClass="sm:max-w-2xl">
          <ApplicationForm
            id="application-form"
            fixedCompanyId={id}
            companies={[company]}
            onSubmit={(values: ApplicationFormValues) => {
              const parsed = applicationSchema.parse({ ...values, companyId: id })
              addApplication({ ...parsed, companyId: id, writtenTestAt: parsed.writtenTestAt || undefined, jobUrl: parsed.jobUrl || undefined, preparationDocUrl: parsed.preparationDocUrl || undefined })
              sync()
              toast.success('已添加')
              setOpen(false)
            }}
          />
        </FormDialogLayout>
      </Dialog>

      <RecruitingLinkForm
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initial={editingLink}
        onSubmit={(values: RecruitingLinkFormValues) => {
          if (editingLink) {
            updateRecruitingLink(company.id, editingLink.id, {
              label: values.label,
              url: values.url,
              type: values.type,
              note: values.note || undefined,
            })
            toast.success('招聘链接已更新')
          } else {
            addRecruitingLink(company.id, {
              label: values.label,
              url: values.url,
              type: values.type,
              note: values.note || undefined,
            })
            toast.success('招聘链接已添加')
          }
          setEditingLink(undefined)
          setLinkDialogOpen(false)
        }}
      />
    </div>
  )
}
