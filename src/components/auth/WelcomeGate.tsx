import { Globe, Link as LinkIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthStore } from '../../store/useAuthStore'

export default function WelcomeGate() {
  const startDeviceFlow = useAuthStore((s) => s.startDeviceFlow)
  const deviceFlowState = useAuthStore((s) => s.deviceFlowState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg px-4">
      <div className="w-full max-w-[480px] rounded-3xl border border-neutral-border bg-white p-8 text-center shadow-soft">
        <div className="mb-3 text-5xl">🌾</div>
        <h1 className="font-serif text-4xl text-neutral-text">AutumnHunt</h1>
        <p className="mt-2 text-sm text-neutral-muted">你的秋招一站式管理工具</p>

        <div className="mt-6 grid gap-3 text-left text-sm text-neutral-muted sm:grid-cols-3 sm:text-center">
          <p>📋 集中管理所有公司和投递</p>
          <p>📅 一站式查看面试日程</p>
          <p>☁️ 数据云端同步永不丢失</p>
        </div>

        <Button
          size="lg"
          className="mt-6 h-12 w-full bg-primary-cream text-neutral-text"
          onClick={() => void startDeviceFlow()}
          disabled={deviceFlowState === 'requesting' || deviceFlowState === 'waiting'}
        >
          <Globe className="mr-2 h-4 w-4 text-black" /> 用 GitHub 登录
        </Button>

        <p className="mt-3 text-xs text-neutral-muted">我们仅访问你授权的私有仓库，数据归你所有</p>

        <a
          className="mt-5 inline-flex items-center gap-1 text-sm text-neutral-muted underline underline-offset-4 hover:text-neutral-text"
          href="https://github.com/ZHANG-Shuyue/autumnhunt"
          target="_blank"
          rel="noreferrer"
        >
          <LinkIcon className="h-4 w-4" /> 了解更多
        </a>
      </div>
    </div>
  )
}
