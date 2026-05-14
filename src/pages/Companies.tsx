import { Ellipsis, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import ApplicationForm from '../components/forms/ApplicationForm'
import CompanyForm from '../components/forms/CompanyForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { applicationSchema, type ApplicationFormValues } from '../schemas/application.schema'
import { companySchema, type CompanyFormValues } from '../schemas/company.schema'
import { useApplicationStore } from '../store/useApplicationStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import type { Company } from '../types'
import { pushActivity } from '../utils/activity'

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '开放中', value: 'open' },
  { label: '即将开放', value: 'upcoming' },
  { label: '已截止', value: 'closed' },
] as const

type StatusFilter = (typeof statusOptions)[number]['value']

const statusMap: Record<Company['status'], { label: string; variant: 'sage' | 'ash' | 'cream' }> = {
  open: { label: '开放中', variant: 'sage' },
  closed: { label: '已截止', variant: 'ash' },
  upcoming: { label: '即将开放', variant: 'cream' },
}

export default function Companies() {
  const { companies, addCompany, updateCompany, deleteCompany } = useCompanyStore()
  const addApplication = useApplicationStore((s) => s.addApplication)
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)

  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt' | 'name'>('deadline')
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Company | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false)
  const [targetCompanyId, setTargetCompanyId] = useState<string | null>(null)

  const list = useMemo(() => {
    const filtered = companies
      .filter((c) => c.name.toLowerCase().includes(keyword.trim().toLowerCase()))
      .filter((c) => (industry === 'all' ? true : c.industry === industry))
      .filter((c) => (status === 'all' ? true : c.status === status))

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-Hans-CN')
      if (sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt)
      return (a.deadline ?? '9999-12-31').localeCompare(b.deadline ?? '9999-12-31')
    })
  }, [companies, keyword, industry, status, sortBy])

  const onSubmitCompany = (values: CompanyFormValues) => {
    const parsed = companySchema.parse(values)
    if (editing) {
      updateCompany(editing.id, { ...parsed, deadline: parsed.deadline || undefined })
      pushActivity(`更新公司：${parsed.name}`)
      toast.success('已更新')
    } else {
      addCompany({ ...parsed, deadline: parsed.deadline || undefined, attachments: [] })
      pushActivity(`新增公司：${parsed.name}`)
      toast.success('已添加')
    }
    syncFromOtherStores()
    setCompanyDialogOpen(false)
    setEditing(undefined)
  }

  const onSubmitApplication = (values: ApplicationFormValues) => {
    if (!targetCompanyId) return
    const parsed = applicationSchema.parse({ ...values, companyId: targetCompanyId })
    addApplication({ ...parsed, companyId: targetCompanyId, writtenTestAt: parsed.writtenTestAt || undefined, preparationDocUrl: parsed.preparationDocUrl || undefined })
    const cname = companies.find((c) => c.id === targetCompanyId)?.name ?? '未知公司'
    pushActivity(`新增投递：${cname} · ${parsed.position}`)
    syncFromOtherStores()
    toast.success('已添加投递')
    setApplicationDialogOpen(false)
    setTargetCompanyId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-muted" />
            <Input placeholder="搜索公司..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={industry} onValueChange={setIndustry}>
            <TabsList>
              {['all', '互联网', '金融', '制造', '教育', '其他'].map((tab) => (
                <TabsTrigger key={tab} value={tab}>{tab === 'all' ? '全部' : tab}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="h-10 rounded-2xl border border-neutral-border bg-white px-3 text-sm">
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 rounded-2xl border border-neutral-border bg-white px-3 text-sm">
            <option value="deadline">按截止日期</option>
            <option value="createdAt">按添加时间</option>
            <option value="name">按公司名</option>
          </select>
        </div>
        <Button onClick={() => { setEditing(undefined); setCompanyDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />添加公司</Button>
      </div>

      {list.length === 0 ? (
        <EmptyState text="还没有公司哦，点击右上角添加第一家心仪的公司吧 🌱" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((company) => {
            const s = statusMap[company.status]
            return (
              <Card key={company.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-cream/70 to-primary-mist/60" />
                  {/* v0.2.1: 编辑/删除收纳到 ... 菜单 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="rounded-lg p-1 hover:bg-primary-cream/25"><Ellipsis className="h-4 w-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-28 rounded-xl p-1">
                      <button type="button" className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-primary-cream/20" onClick={() => { setEditing(company); setCompanyDialogOpen(true) }}>编辑</button>
                      <button type="button" className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-primary-ash/20" onClick={() => setDeletingId(company.id)}>删除</button>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{company.name}</h3>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="sage">{company.industry}</Badge>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
                <p className="text-sm text-neutral-muted">截止日期：{company.deadline ?? '待更新'}</p>
                {/* v0.2.1: 主操作按钮改为 + 投递 */}
                <Button className="w-full" onClick={() => { setTargetCompanyId(company.id); setApplicationDialogOpen(true) }}>+ 投递</Button>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? '编辑公司' : '添加公司'}</DialogTitle></DialogHeader>
          <CompanyForm initial={editing} onSubmit={onSubmitCompany} onCancel={() => setCompanyDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>新建投递</DialogTitle></DialogHeader>
          <ApplicationForm
            fixedCompanyId={targetCompanyId ?? undefined}
            companies={companies}
            onSubmit={onSubmitApplication}
            onCancel={() => setApplicationDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="删除公司"
        description="删除后不可恢复，相关投递记录不会自动删除。"
        onConfirm={() => {
          if (!deletingId) return
          const name = companies.find((c) => c.id === deletingId)?.name ?? '公司'
          deleteCompany(deletingId)
          pushActivity(`删除公司：${name}`)
          syncFromOtherStores()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
