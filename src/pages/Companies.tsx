import { Copy, Ellipsis, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import CompanyForm from '../components/forms/CompanyForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import type { Company } from '../types'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { companySchema, type CompanyFormValues } from '../schemas/company.schema'

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
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)

  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt' | 'name'>('deadline')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Company | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const onSubmit = (values: CompanyFormValues) => {
    const parsed = companySchema.parse(values)
    if (editing) {
      updateCompany(editing.id, { ...parsed, deadline: parsed.deadline || undefined })
      toast.success('已更新')
    } else {
      addCompany({ ...parsed, deadline: parsed.deadline || undefined, attachments: [] })
      toast.success('已添加')
    }
    syncFromOtherStores()
    setDialogOpen(false)
    setEditing(undefined)
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
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />添加公司</Button>
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
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(company.name).then(() => toast.success('已复制公司名'))}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(company); setDialogOpen(true) }}><Ellipsis className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{company.name}</h3>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="sage">{company.industry}</Badge>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
                <p className="text-sm text-neutral-muted">截止日期：{company.deadline ?? '待更新'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setEditing(company); setDialogOpen(true) }}>编辑</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeletingId(company.id)}>删除</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? '编辑公司' : '添加公司'}</DialogTitle></DialogHeader>
          <CompanyForm initial={editing} onSubmit={onSubmit} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="删除公司"
        description="删除后不可恢复，相关投递记录不会自动删除。"
        onConfirm={() => {
          if (!deletingId) return
          deleteCompany(deletingId)
          syncFromOtherStores()
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
