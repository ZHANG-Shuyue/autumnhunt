import { ArrowLeft, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import ApplicationForm from '../components/forms/ApplicationForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { applicationSchema, type ApplicationFormValues } from '../schemas/application.schema'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'

export default function CompanyDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const company = useCompanyStore((s) => s.getCompanyById(id))
  const apps = useApplicationStore((s) => s.applications)
  const addApplication = useApplicationStore((s) => s.addApplication)
  const sync = useCalendarStore((s) => s.syncFromOtherStores)
  const [open, setOpen] = useState(false)

  const list = useMemo(() => apps.filter((item) => item.companyId === id), [apps, id])

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
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />返回</Button>
        <div className="space-x-2"><Button variant="outline" onClick={() => navigate('/companies')}>编辑</Button></div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <h2 className="text-2xl font-semibold">{company.name}</h2>
            <div className="mt-2 flex gap-2"><Badge variant="sage">{company.industry}</Badge><Badge variant="cream">{company.status}</Badge></div>
            <div className="mt-4 space-y-2 text-sm text-neutral-muted">
              <p>官网：{company.applyUrl}</p><p>截止：{company.deadline ?? '-'}</p><p>Base：{company.baseLocation ?? '-'}</p><p>薪资：{company.salaryRange ?? '-'}</p>
            </div>
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
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">该公司投递记录</h3><Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />新建投递</Button></div>
            <div className="space-y-2">
              {list.map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`} className="block rounded-xl border border-neutral-border p-3 text-sm hover:bg-primary-cream/10">
                  <p className="font-medium">{app.position}</p>
                  <p className="text-neutral-muted">{app.status} · {app.appliedAt}</p>
                </Link>
              ))}
              {!list.length && <p className="text-sm text-neutral-muted">暂无投递记录</p>}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>新建投递</DialogTitle></DialogHeader>
          <ApplicationForm
            companies={[company]}
            onCancel={() => setOpen(false)}
            onSubmit={(values: ApplicationFormValues) => {
              const parsed = applicationSchema.parse({ ...values, companyId: id })
              addApplication({ ...parsed, companyId: id, writtenTestAt: parsed.writtenTestAt || undefined, preparationDocUrl: parsed.preparationDocUrl || undefined })
              sync()
              toast.success('已添加')
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
