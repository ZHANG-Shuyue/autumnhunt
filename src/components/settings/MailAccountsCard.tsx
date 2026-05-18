import { Inbox, Mail, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '../../lib/time'
import { useLLMConfigStore } from '../../store/useLLMConfigStore'
import { useMailAccountStore } from '../../store/useMailAccountStore'
import type { MailAccount, MailAccountStatus, MailProvider } from '../../types'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

function statusBadge(status: MailAccountStatus) {
  if (status === 'connected') return { text: '已连接', cls: 'bg-emerald-100 text-emerald-700' }
  if (status === 'syncing') return { text: '同步中…', cls: 'bg-sky-100 text-sky-700' }
  if (status === 'expired') return { text: '需重新授权', cls: 'bg-amber-100 text-amber-700' }
  return { text: '同步出错', cls: 'bg-rose-100 text-rose-700' }
}

function providerLabel(provider: MailProvider) {
  return provider === 'gmail' ? 'Gmail' : 'Outlook'
}

function ProviderIcon({ provider }: { provider: MailProvider }) {
  if (provider === 'gmail') return <Mail className="h-4 w-4 text-stone-600" />
  return <Inbox className="h-4 w-4 text-stone-600" />
}

export default function MailAccountsCard() {
  const navigate = useNavigate()
  const config = useLLMConfigStore((s) => s.config)
  const accounts = useMailAccountStore((s) => s.accounts)
  const updateAccount = useMailAccountStore((s) => s.updateAccount)
  const removeAccount = useMailAccountStore((s) => s.removeAccount)

  const [open, setOpen] = useState(false)

  const missingLlm = !config || !config.apiKey?.trim()

  const handleSync = (account: MailAccount) => {
    updateAccount(account.id, { status: 'syncing' })

    window.setTimeout(() => {
      updateAccount(account.id, {
        status: 'connected',
        lastSyncAt: new Date().toISOString(),
        lastSyncCount: Math.floor(Math.random() * 3) + 1,
        errorMessage: undefined,
      })
    }, 2000)
  }

  const goProvider = (provider: MailProvider) => {
    setOpen(false)
    if (provider === 'gmail') {
      navigate('/auth/google/start')
      return
    }
    navigate('/auth/microsoft/start')
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">邮箱管理</h2>
        <p className="text-sm text-neutral-muted">自动从邮件解析面试 / 笔试 / 测评，写入日历。每天自动扫描一次</p>
      </div>

      {missingLlm && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          请先配置 AI 模型才能使用邮件解析功能
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> 添加邮箱
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-neutral-border bg-neutral-bg px-4 py-8 text-center text-sm text-neutral-muted">
          还没绑定邮箱，添加后我们会每天自动帮你扫描求职邮件
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const badge = statusBadge(account.status)
            return (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-border bg-white px-3 py-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <ProviderIcon provider={account.provider} />
                    <p className="truncate text-sm font-medium text-neutral-text">{account.email}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${badge.cls}`}>
                      {account.status === 'syncing' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
                      {badge.text}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {account.displayName ? `${account.displayName} · ` : ''}
                    {providerLabel(account.provider)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {account.lastSyncAt
                      ? `最近同步：${formatRelativeTime(account.lastSyncAt)} · 新增 ${account.lastSyncCount ?? 0} 条`
                      : '尚未同步'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" disabled={missingLlm || account.status === 'syncing'} onClick={() => handleSync(account)}>
                    立即同步
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeAccount(account.id)}>
                    移除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择邮箱服务商</DialogTitle>
            <DialogDescription>后续会跳转到对应 OAuth 授权页（当前为占位）</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => goProvider('gmail')}>
              <Mail className="mr-2 h-4 w-4" /> Gmail
            </Button>
            <Button variant="outline" onClick={() => goProvider('outlook')}>
              <Inbox className="mr-2 h-4 w-4" /> Outlook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
