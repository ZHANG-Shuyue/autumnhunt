import { CheckCircle2, Copy, ExternalLink, Loader2, LockKeyhole, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { useAuthStore } from '../../store/useAuthStore'

export default function DeviceFlowDialog() {
  const deviceFlowState = useAuthStore((s) => s.deviceFlowState)
  const currentUserCode = useAuthStore((s) => s.currentUserCode)
  const currentVerificationUri = useAuthStore((s) => s.currentVerificationUri)
  const expiresAt = useAuthStore((s) => s.expiresAt)
  const hasOpenedVerificationPage = useAuthStore((s) => s.hasOpenedVerificationPage)
  const deviceFlowError = useAuthStore((s) => s.deviceFlowError)
  const cancelDeviceFlow = useAuthStore((s) => s.cancelDeviceFlow)
  const startDeviceFlow = useAuthStore((s) => s.startDeviceFlow)
  const markVerificationOpened = useAuthStore((s) => s.markVerificationOpened)
  const clearDeviceFlowError = useAuthStore((s) => s.clearDeviceFlowError)

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (deviceFlowState !== 'waiting') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [deviceFlowState])

  const visible = deviceFlowState !== 'idle'
  const remaining = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(expiresAt - now, 0)
  }, [expiresAt, now])

  if (!visible) return null

  const remainingMinutes = Math.floor(remaining / 60_000)
  const remainingSeconds = Math.floor((remaining % 60_000) / 1000)
  const total = expiresAt ? Math.max(expiresAt - (expiresAt - 15 * 60 * 1000), 1) : 1
  const progress = Math.max(Math.min((remaining / total) * 100, 100), 0)

  const copyCode = async () => {
    if (!currentUserCode) return
    await navigator.clipboard.writeText(currentUserCode)
    toast.success('验证码已复制')
  }

  const openVerification = () => {
    if (!currentVerificationUri) return
    window.open(currentVerificationUri, '_blank', 'noopener,noreferrer')
    markVerificationOpened()
  }

  const isError = deviceFlowState === 'error'
  const isSuccess = deviceFlowState === 'success'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-border bg-neutral-bg p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-neutral-text">
          <LockKeyhole className="h-5 w-5 text-primary-sage" />
          <h3 className="text-xl font-semibold">连接你的 GitHub 账号</h3>
        </div>

        {isError ? (
          <div className="space-y-4">
            <p className="text-sm text-primary-rose">{deviceFlowError ?? '授权失败，请重试'}</p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  clearDeviceFlowError()
                  void startDeviceFlow()
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重试
              </Button>
              <Button variant="outline" onClick={cancelDeviceFlow}>取消</Button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-3 text-sm text-neutral-muted">
            <p className="flex items-center gap-2 text-primary-sage">
              <CheckCircle2 className="h-4 w-4" />
              授权成功！正在初始化你的数据...
            </p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <p className="text-neutral-muted">请按以下步骤完成授权：</p>

            <div>
              <p className="mb-2">1️⃣ 复制下方验证码</p>
              <div className="flex items-center justify-between rounded-2xl border border-primary-cream bg-primary-cream/25 p-3">
                <code className="text-3xl tracking-[0.18em]">{currentUserCode ?? '---- ----'}</code>
                <Button variant="ghost" onClick={() => void copyCode()}>
                  <Copy className="mr-1 h-4 w-4" /> 一键复制
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2">2️⃣ 打开 GitHub 授权页</p>
              <Button onClick={openVerification}>
                {hasOpenedVerificationPage ? '已打开 ↗' : '打开 github.com/login/device ↗'} <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p>3️⃣ 粘贴验证码并授权</p>

            <div className="rounded-2xl border border-neutral-border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-primary-sage">
                <Loader2 className="h-4 w-4 animate-spin" /> 正在等待你的授权...
              </p>
              <p className="mb-2 text-neutral-muted">验证码 15 分钟内有效</p>
              <p className="mb-2 text-xs text-neutral-muted">
                剩余 {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
              </p>
              <div className="h-2 rounded-full bg-primary-ash/25">
                <div className="h-2 rounded-full bg-primary-sage transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <Button variant="outline" onClick={cancelDeviceFlow}>取消</Button>
          </div>
        )}
      </div>
    </div>
  )
}
