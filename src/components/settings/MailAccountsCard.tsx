import { Eye, EyeOff, Inbox, Mail, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { formatRelativeTime } from '../../lib/time'
import { MAIL_PROVIDERS, getProviderByEmail } from '../../lib/mailProviders'
import { testMailAccount } from '../../services/imapClient'
import { useLLMConfigStore } from '../../store/useLLMConfigStore'
import { useMailAccountStore } from '../../store/useMailAccountStore'
import type { MailAccount, MailAccountStatus, MailProvider } from '../../types'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'

interface TestState {
  loading: boolean
  ok?: boolean
  message?: string
}

function statusBadge(status: MailAccountStatus) {
  if (status === 'connected') return { text: '已连接', cls: 'bg-emerald-100 text-emerald-700' }
  if (status === 'syncing') return { text: '同步中…', cls: 'bg-sky-100 text-sky-700' }
  if (status === 'auth_failed') return { text: '认证失败', cls: 'bg-amber-100 text-amber-700' }
  if (status === 'never_synced') return { text: '未同步', cls: 'bg-stone-100 text-stone-600' }
  return { text: '同步出错', cls: 'bg-rose-100 text-rose-700' }
}

function providerLabel(provider: MailProvider) {
  const found = MAIL_PROVIDERS.find((item) => item.id === provider)
  return found?.label ?? provider
}

function ProviderIcon({ provider }: { provider: MailProvider }) {
  if (provider === 'gmail') return <Mail className="h-4 w-4 text-stone-600" />
  return <Inbox className="h-4 w-4 text-stone-600" />
}

export default function MailAccountsCard() {
  const config = useLLMConfigStore((s) => s.config)
  const accounts = useMailAccountStore((s) => s.accounts)
  const addAccount = useMailAccountStore((s) => s.addAccount)
  const updateAccount = useMailAccountStore((s) => s.updateAccount)
  const removeAccount = useMailAccountStore((s) => s.removeAccount)

  const [open, setOpen] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testState, setTestState] = useState<TestState>({ loading: false })

  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [providerId, setProviderId] = useState<MailProvider>('custom')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState<number>(993)

  const missingLlm = !config || !config.apiKey?.trim()

  const provider = useMemo(() => MAIL_PROVIDERS.find((item) => item.id === providerId) ?? MAIL_PROVIDERS[MAIL_PROVIDERS.length - 1], [providerId])

  const resetForm = () => {
    setEmail('')
    setAppPassword('')
    setProviderId('custom')
    setImapHost('')
    setImapPort(993)
    setShowGuide(false)
    setShowPassword(false)
    setTestState({ loading: false })
  }

  const openDialog = () => {
    resetForm()
    setOpen(true)
  }

  const detectByEmail = (nextEmail: string) => {
    const matchedProvider = getProviderByEmail(nextEmail)
    const matchedConfig = MAIL_PROVIDERS.find((item) => item.id === matchedProvider)
    setProviderId(matchedProvider)
    setImapHost(matchedConfig?.imapHost ?? '')
    setImapPort(matchedConfig?.imapPort ?? 993)
  }

  const getDraftAccount = (): MailAccount | null => {
    if (!email.trim() || !appPassword.trim()) return null

    const host = providerId === 'custom' ? imapHost.trim() : provider.imapHost
    const port = providerId === 'custom' ? imapPort : provider.imapPort

    if (!host) return null

    return {
      id: nanoid(),
      provider: providerId,
      email: email.trim(),
      appPassword: appPassword.trim(),
      imapHost: host,
      imapPort: port,
      connectedAt: new Date().toISOString(),
      status: 'never_synced',
    }
  }

  const handleTest = async () => {
    const draft = getDraftAccount()
    if (!draft) {
      setTestState({ loading: false, ok: false, message: '请先完整填写邮箱、应用密码和 IMAP 信息' })
      return
    }

    setTestState({ loading: true })
    const result = await testMailAccount(draft)
    if (result.ok) {
      setTestState({ loading: false, ok: true, message: `✓ 连接成功,共找到 ${result.recentCount ?? 0} 封最近邮件` })
    } else {
      setTestState({ loading: false, ok: false, message: `✗ ${result.error ?? '连接失败'}` })
    }
  }

  const handleSave = () => {
    const draft = getDraftAccount()
    if (!draft) {
      setTestState({ loading: false, ok: false, message: '请先完整填写邮箱、应用密码和 IMAP 信息' })
      return
    }

    addAccount(draft)
    setOpen(false)
    resetForm()
  }

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

  const handleRemove = (account: MailAccount) => {
    const ok = window.confirm(`确定移除 ${account.email}？移除后需要重新生成应用密码再添加。`)
    if (!ok) return
    removeAccount(account.id)
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
        <Button size="sm" onClick={openDialog}>
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
                  <p className="text-xs text-stone-500">{providerLabel(account.provider)}</p>
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
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(account)}>
                    移除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加邮箱</DialogTitle>
            <DialogDescription>使用邮箱账号 + 应用专用密码连接 IMAP</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-stone-600">邮箱地址</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={(event) => detectByEmail(event.target.value)}
                placeholder={provider.emailHint ?? 'your@email.com'}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-stone-600">应用专用密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={appPassword}
                  onChange={(event) => setAppPassword(event.target.value)}
                  placeholder="请输入应用专用密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="切换应用密码显示"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
              <p>📧 已识别为 {provider.label}</p>
              <button
                type="button"
                className="mt-2 text-xs text-stone-700 underline underline-offset-2"
                onClick={() => setShowGuide((v) => !v)}
              >
                不知道怎么获取应用密码?
              </button>

              {showGuide && provider.guideSteps.length > 0 && (
                <div className="mt-2 space-y-2 rounded-md border border-stone-200 bg-white p-2 text-xs">
                  <p className="font-medium text-stone-700">{provider.guideTitle}</p>
                  <ol className="list-decimal space-y-1 pl-4 text-stone-600">
                    {provider.guideSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {provider.guideUrl && (
                    <a href={provider.guideUrl} target="_blank" rel="noreferrer" className="inline-block text-stone-700 underline underline-offset-2">
                      打开教程页
                    </a>
                  )}
                </div>
              )}
            </div>

            {providerId === 'custom' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-stone-600">IMAP Host</label>
                  <Input value={imapHost} onChange={(event) => setImapHost(event.target.value)} placeholder="imap.example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-stone-600">IMAP Port</label>
                  <Input
                    type="number"
                    value={imapPort}
                    onChange={(event) => setImapPort(Number(event.target.value) || 993)}
                    placeholder="993"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button variant="outline" onClick={() => void handleTest()} disabled={testState.loading}>
                {testState.loading ? '测试中...' : '测试连接'}
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>

            {testState.message && (
              <div className={`rounded-lg border p-2 text-xs ${testState.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {testState.message}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
