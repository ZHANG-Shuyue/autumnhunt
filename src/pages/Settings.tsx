import JSZip from 'jszip'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import LLMConfigCard from '../components/settings/LLMConfigCard'
import MailAccountsCard from '../components/settings/MailAccountsCard'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { STORE_KEYS } from '../config/github'
import { formatExactTime, formatRelativeTime } from '../lib/time'
import {
  applyImportData,
  createDefaultImportSelection,
  detectImportConflicts,
  parseImportFile,
  type ConflictStrategy,
  type ImportPreviewData,
  type ImportSelection,
  type ImportValidationError,
  validateImportData,
} from '../services/dataImport'
import { downloadImportTemplate, exportAllXlsx, type TemplateType } from '../services/dataExport'
import { syncPull, syncPush } from '../services/githubSync'
import { schedulePush } from '../services/syncDebouncer'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useResumeStore } from '../store/useResumeStore'
import { useSyncStore } from '../store/useSyncStore'

const SHARE_LINK = 'https://你的用户名.github.io/autumnhunt'

const SHEET_LABELS: Record<keyof ImportSelection, string> = {
  applications: '投递记录',
  companies: '公司库',
  interviews: '面试记录',
  resumes: '简历清单',
}

function formatTime(time: string | null) {
  if (!time) return '—'
  return new Date(time).toLocaleString('zh-CN')
}

export default function Settings() {
  const [showLogs, setShowLogs] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [excelExporting, setExcelExporting] = useState(false)
  const [excelImporting, setExcelImporting] = useState(false)
  const [templateDownloading, setTemplateDownloading] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null)
  const [importSelection, setImportSelection] = useState<ImportSelection>(createDefaultImportSelection())

  const [validationOpen, setValidationOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([])

  const [conflictOpen, setConflictOpen] = useState(false)
  const [conflictCount, setConflictCount] = useState(0)

  const [templateOpen, setTemplateOpen] = useState(false)

  const jsonInputRef = useRef<HTMLInputElement | null>(null)
  const excelInputRef = useRef<HTMLInputElement | null>(null)

  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const dataRepo = useAuthStore((s) => s.dataRepo)
  const logout = useAuthStore((s) => s.logout)
  const syncStatus = useSyncStore((s) => s.status)
  const syncLastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const syncErrorMessage = useSyncStore((s) => s.errorMessage)
  const resetSync = useSyncStore((s) => s.reset)
  const companies = useCompanyStore((s) => s.companies)
  const applications = useApplicationStore((s) => s.applications)
  const interviews = useInterviewStore((s) => s.interviews)
  const resumes = useResumeStore((s) => s.resumes)
  const events = useCalendarStore((s) => s.events)
  const replaceCompanies = useCompanyStore((s) => s.replaceCompanies)
  const replaceApplications = useApplicationStore((s) => s.replaceApplications)
  const replaceInterviews = useInterviewStore((s) => s.replaceInterviews)
  const replaceResumes = useResumeStore((s) => s.replaceResumes)
  const replaceEvents = useCalendarStore((s) => s.replaceEvents)

  const repoUrl = user ? `https://github.com/${user.login}/${dataRepo}` : '#'

  const doSyncNow = async () => {
    setSyncing(true)
    try {
      await syncPush()
      toast.success('推送完成')
    } catch {
      toast.error('推送失败，请稍后重试')
    } finally {
      setSyncing(false)
    }
  }

  const doPullNow = async () => {
    setSyncing(true)
    try {
      await syncPull()
      toast.success('拉取完成')
    } catch {
      toast.error('拉取失败，请稍后重试')
    } finally {
      setSyncing(false)
    }
  }

  const exportBackup = async () => {
    const zip = new JSZip()
    zip.file('companies.json', JSON.stringify(companies, null, 2))
    zip.file('applications.json', JSON.stringify(applications, null, 2))
    zip.file('interviews.json', JSON.stringify(interviews, null, 2))
    zip.file('events.json', JSON.stringify(events, null, 2))
    zip.file(
      'meta.json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          version: '0.3.0',
        },
        null,
        2,
      ),
    )

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `autumnhunt-backup-${new Date().toISOString().slice(0, 10)}.zip`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('备份导出成功')
  }

  const importBackup = async (file: File) => {
    if (!window.confirm('导入会覆盖本地缓存，是否继续？')) return

    const zip = await JSZip.loadAsync(file)
    const [companiesJson, applicationsJson, interviewsJson, eventsJson] = await Promise.all([
      zip.file('companies.json')?.async('string'),
      zip.file('applications.json')?.async('string'),
      zip.file('interviews.json')?.async('string'),
      zip.file('events.json')?.async('string'),
    ])

    if (!companiesJson || !applicationsJson || !interviewsJson || !eventsJson) {
      toast.error('备份文件格式不正确')
      return
    }

    replaceCompanies(JSON.parse(companiesJson))
    replaceApplications(JSON.parse(applicationsJson))
    replaceInterviews(JSON.parse(interviewsJson))
    replaceEvents(JSON.parse(eventsJson))
    schedulePush()
    toast.success('备份导入成功')
  }

  const handleImportExcelFile = async (file: File) => {
    setExcelImporting(true)
    try {
      const parsed = await parseImportFile(file)
      setPreviewData(parsed)
      setImportSelection(createDefaultImportSelection())
      setPreviewOpen(true)
    } catch {
      toast.error('解析文件失败，请检查文件格式')
    } finally {
      setExcelImporting(false)
    }
  }

  const executeImport = async (strategy: ConflictStrategy) => {
    if (!previewData) return

    setExcelImporting(true)
    try {
      const result = applyImportData(
        previewData,
        { companies, applications, interviews, resumes },
        importSelection,
        strategy,
      )

      replaceCompanies(result.nextCompanies)
      replaceApplications(result.nextApplications)
      replaceInterviews(result.nextInterviews)
      replaceResumes(result.nextResumes)
      schedulePush()

      toast.success(`成功 ${result.success} 条 / 跳过 ${result.skipped} 条 / 失败 ${result.failed} 条`)
      setPreviewOpen(false)
      setConflictOpen(false)
      setPreviewData(null)
    } catch {
      toast.error('导入失败，请稍后重试')
    } finally {
      setExcelImporting(false)
    }
  }

  const handlePreviewContinue = () => {
    if (!previewData) return

    const errors = validateImportData(previewData, importSelection)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setValidationOpen(true)
      return
    }

    const conflictSummary = detectImportConflicts(previewData, { companies, applications, interviews, resumes }, importSelection)

    if (conflictSummary.total > 0) {
      setConflictCount(conflictSummary.total)
      setConflictOpen(true)
      return
    }

    void executeImport('skip')
  }

  const clearLocalCache = () => {
    if (!window.confirm('仅清空本地缓存，不影响云端，确定继续吗？')) return
    localStorage.removeItem(STORE_KEYS.companies)
    localStorage.removeItem(STORE_KEYS.applications)
    localStorage.removeItem(STORE_KEYS.interviews)
    localStorage.removeItem(STORE_KEYS.resumes)
    localStorage.removeItem(STORE_KEYS.calendar)
    toast.success('本地缓存已清空，请刷新页面')
  }

  const handleLogout = async () => {
    if (!window.confirm('确认退出登录？')) return
    await logout()
    resetSync()
    toast.success('已退出登录')
  }

  const handleDownloadTemplate = async (type: TemplateType) => {
    setTemplateDownloading(true)
    try {
      await downloadImportTemplate(type)
      toast.success('模板已下载')
      setTemplateOpen(false)
    } catch {
      toast.error('模板下载失败，请稍后重试')
    } finally {
      setTemplateDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">账号</h2>
        <div className="flex items-center gap-3">
          {user?.avatar_url && <img src={user.avatar_url} alt={user.login} className="h-10 w-10 rounded-full" />}
          <div>
            <p className="font-medium">{user?.name ?? user?.login}</p>
            <p className="text-sm text-neutral-muted">{user?.email ?? `${user?.login}@users.noreply.github.com`}</p>
          </div>
        </div>
        <a href={repoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-sage underline underline-offset-4">
          数据仓库：{repoUrl}
        </a>
        <Button variant="outline" onClick={() => void handleLogout()}>
          退出登录
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">云同步</h2>
        <p className="text-sm text-neutral-muted">GitHub 账户：{token ? `已登录（${user?.login ?? '未知用户'}）` : '未登录'}</p>
        <p className="text-sm text-neutral-muted">当前状态：{syncStatus}</p>
        <p className="text-sm text-neutral-muted">上次同步：{formatRelativeTime(syncLastSyncAt)}</p>
        <p className="text-xs text-neutral-muted">同步时间：{formatExactTime(syncLastSyncAt)}</p>
        {syncErrorMessage && <p className="text-sm text-primary-rose">错误信息：{syncErrorMessage}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void doPullNow()} disabled={syncing}>
            立即拉取
          </Button>
          <Button onClick={() => void doSyncNow()} disabled={syncing}>
            立即推送
          </Button>
          <Button variant="outline" onClick={() => void handleLogout()}>
            退出登录
          </Button>
          <Button variant="ghost" onClick={() => setShowLogs((v) => !v)}>
            {showLogs ? '收起详情' : '查看详情'}
          </Button>
        </div>
        {showLogs && (
          <div className="rounded-xl border border-neutral-border bg-neutral-bg p-3 text-xs text-neutral-muted">
            <p>仓库：{repoUrl}</p>
            <p>同步状态：{syncStatus}</p>
            <p>最近同步：{formatTime(syncLastSyncAt)}</p>
          </div>
        )}
      </Card>

      <LLMConfigCard />
      <MailAccountsCard />

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">数据管理</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void exportBackup()}>导出 JSON 备份</Button>
          <Button variant="outline" onClick={() => jsonInputRef.current?.click()} disabled={excelImporting}>
            导入 JSON 备份
          </Button>
          <Button variant="outline" onClick={clearLocalCache}>清空本地缓存</Button>
          <Button onClick={() => void (async () => {
            setExcelExporting(true)
            try {
              await exportAllXlsx()
              toast.success('Excel 导出成功')
            } catch {
              toast.error('Excel 导出失败')
            } finally {
              setExcelExporting(false)
            }
          })()} disabled={excelExporting}>
            {excelExporting ? '处理中...' : '导出 Excel'}
          </Button>
          <Button variant="outline" onClick={() => excelInputRef.current?.click()} disabled={excelImporting}>
            {excelImporting ? '处理中...' : '导入 Excel'}
          </Button>
          <Button variant="outline" onClick={() => setTemplateOpen(true)} disabled={templateDownloading}>
            {templateDownloading ? '处理中...' : '下载导入模板'}
          </Button>
        </div>

        <input
          ref={jsonInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importBackup(file)
            event.target.value = ''
          }}
        />
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleImportExcelFile(file)
            event.target.value = ''
          }}
        />

        <p className="text-sm text-neutral-muted">
          数据统计：公司 {companies.length} / 投递 {applications.length} / 面试 {interviews.length} / 简历 {resumes.length} / 日历事件 {events.length}
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">分享 ⭐</h2>
        <p className="text-sm text-neutral-muted">喜欢 AutumnHunt？分享给同样在准备秋招的朋友 💝</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(SHARE_LINK)
              toast.success('网站链接已复制')
            }}
          >
            复制网站链接
          </Button>
          <QRCodeSVG value={SHARE_LINK} size={96} bgColor="#FAF7F2" fgColor="#5C5048" />
        </div>
        <a href="https://github.com/ZHANG-Shuyue/autumnhunt" target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
          项目源码
        </a>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-semibold">关于</h2>
        <p className="text-sm text-neutral-muted">v0.3.0</p>
        <p className="text-sm text-neutral-muted">更新日志：Phase 3 - GitHub Device Flow + 云端同步</p>
        <a href="https://github.com/ZHANG-Shuyue/autumnhunt/issues" target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
          GitHub Issues 反馈
        </a>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入预览</DialogTitle>
            <DialogDescription>请选择要导入的 Sheet</DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-3 text-sm text-neutral-text">
              {Object.entries(previewData.counts).map(([key, count]) => {
                const sheetKey = key as keyof ImportSelection
                return (
                  <label key={key} className="flex items-center justify-between rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2">
                    <span>{SHEET_LABELS[sheetKey]} {count} 行</span>
                    <input
                      type="checkbox"
                      checked={importSelection[sheetKey]}
                      onChange={(event) => {
                        setImportSelection((prev) => ({ ...prev, [sheetKey]: event.target.checked }))
                      }}
                    />
                  </label>
                )
              })}
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>取消</Button>
            <Button onClick={handlePreviewContinue} disabled={excelImporting}>{excelImporting ? '处理中...' : '继续'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>字段校验失败</DialogTitle>
            <DialogDescription>请先修复以下问题后再导入</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-neutral-border bg-neutral-bg p-3 text-xs text-neutral-text">
            {validationErrors.map((item, index) => (
              <p key={`${item.sheet}-${item.row}-${index}`}>{item.sheet} 第 {item.row} 行：{item.reason}</p>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setValidationOpen(false)}>我知道了</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发现 {conflictCount} 条重复记录</DialogTitle>
            <DialogDescription>请选择冲突处理方式</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => void executeImport('skip')} disabled={excelImporting}>跳过重复（推荐）</Button>
            <Button variant="outline" onClick={() => void executeImport('overwrite')} disabled={excelImporting}>覆盖已有</Button>
            <Button variant="outline" onClick={() => void executeImport('duplicate')} disabled={excelImporting}>全部新增（不去重）</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>下载导入模板</DialogTitle>
            <DialogDescription>请选择一个模板类型</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => void handleDownloadTemplate('applications')} disabled={templateDownloading}>投递记录模板</Button>
            <Button variant="outline" onClick={() => void handleDownloadTemplate('companies')} disabled={templateDownloading}>公司库模板</Button>
            <Button variant="outline" onClick={() => void handleDownloadTemplate('interviews')} disabled={templateDownloading}>面试模板</Button>
            <Button variant="outline" onClick={() => void handleDownloadTemplate('resumes')} disabled={templateDownloading}>简历模板</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
