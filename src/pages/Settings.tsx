import JSZip from 'jszip'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { STORE_KEYS } from '../config/github'
import { pullAll, pushAll } from '../services/syncEngine'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useSyncStore } from '../store/useSyncStore'

const SHARE_LINK = 'https://你的用户名.github.io/autumnhunt'

function formatTime(time: string | null) {
  if (!time) return '—'
  return new Date(time).toLocaleString('zh-CN')
}

export default function Settings() {
  const [showLogs, setShowLogs] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const { user, dataRepo, logout } = useAuthStore((s) => ({
    user: s.user,
    dataRepo: s.dataRepo,
    logout: s.logout,
  }))
  const sync = useSyncStore((s) => s)
  const companies = useCompanyStore((s) => s.companies)
  const applications = useApplicationStore((s) => s.applications)
  const interviews = useInterviewStore((s) => s.interviews)
  const events = useCalendarStore((s) => s.events)
  const replaceCompanies = useCompanyStore((s) => s.replaceCompanies)
  const replaceApplications = useApplicationStore((s) => s.replaceApplications)
  const replaceInterviews = useInterviewStore((s) => s.replaceInterviews)
  const replaceEvents = useCalendarStore((s) => s.replaceEvents)

  const repoUrl = user ? `https://github.com/${user.login}/${dataRepo}` : '#'

  const doSyncNow = async () => {
    setSyncing(true)
    try {
      await pushAll()
      await pullAll()
      toast.success('同步完成')
    } catch {
      toast.error('同步失败，请稍后重试')
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
    toast.success('备份导入成功')
  }

  const clearLocalCache = () => {
    if (!window.confirm('仅清空本地缓存，不影响云端，确定继续吗？')) return
    localStorage.removeItem(STORE_KEYS.companies)
    localStorage.removeItem(STORE_KEYS.applications)
    localStorage.removeItem(STORE_KEYS.interviews)
    localStorage.removeItem(STORE_KEYS.calendar)
    toast.success('本地缓存已清空，请刷新页面')
  }

  const handleLogout = async () => {
    if (!window.confirm('确认退出登录？')) return
    await logout()
    toast.success('已退出登录')
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
        <h2 className="text-xl font-semibold">同步状态</h2>
        <p className="text-sm text-neutral-muted">上次拉取：{formatTime(sync.lastPullAt)}</p>
        <p className="text-sm text-neutral-muted">上次推送：{formatTime(sync.lastPushAt)}</p>
        <p className="text-sm text-neutral-muted">待同步变更：{sync.pendingChanges}</p>
        <div className="flex items-center gap-3">
          <label className="text-sm">自动同步</label>
          <input
            type="checkbox"
            checked={sync.autoSyncEnabled}
            onChange={(event) => sync.setAutoSyncEnabled(event.target.checked)}
            className="h-4 w-4"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void doSyncNow()} disabled={syncing}>立即同步</Button>
          <Button variant="ghost" onClick={() => setShowLogs((v) => !v)}>
            {showLogs ? '收起日志' : '同步日志'}
          </Button>
        </div>
        {showLogs && (
          <div className="max-h-56 space-y-1 overflow-auto rounded-xl border border-neutral-border bg-neutral-bg p-3 text-xs">
            {sync.syncLogs.length === 0 && <p className="text-neutral-muted">暂无日志</p>}
            {sync.syncLogs.map((log) => (
              <p key={log.id} className={log.level === 'error' ? 'text-primary-rose' : log.level === 'success' ? 'text-primary-sage' : 'text-neutral-muted'}>
                [{new Date(log.time).toLocaleTimeString('zh-CN')}] {log.message}
              </p>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">数据管理</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void exportBackup()}>导出 JSON 备份</Button>
          <label className="inline-flex cursor-pointer items-center rounded-2xl border border-primary-cream px-4 py-2 text-sm hover:bg-primary-cream/20">
            导入 JSON 备份
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importBackup(file)
                event.target.value = ''
              }}
            />
          </label>
          <Button variant="outline" onClick={clearLocalCache}>清空本地缓存</Button>
        </div>
        <p className="text-sm text-neutral-muted">
          数据统计：公司 {companies.length} / 投递 {applications.length} / 面试 {interviews.length} / 日历事件 {events.length}
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
    </div>
  )
}
