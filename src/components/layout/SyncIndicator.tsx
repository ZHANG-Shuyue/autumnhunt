import { Loader2 } from 'lucide-react'
import { syncPull, syncPush } from '../../services/githubSync'
import { useSyncStore } from '../../store/useSyncStore'
import { formatExactTime, formatRelativeTime } from '../../lib/time'

export default function SyncIndicator() {
  const status = useSyncStore((s) => s.status)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)

  const onClick = async () => {
    if (status === 'conflict') {
      const overwrite = window.confirm('检测到云端冲突。确定覆盖云端？取消将进入拉取选项。')
      if (overwrite) {
        await syncPush({ force: true })
        return
      }

      const pullBack = window.confirm('确定拉取云端覆盖本地？点击取消则不做任何操作。')
      if (pullBack) {
        await syncPull()
      }
      return
    }

    if (status === 'error') {
      await syncPull()
      return
    }

    await syncPush()
  }

  const detailTime = formatExactTime(lastSyncAt)

  const view = (() => {
    switch (status) {
      case 'syncing':
        return {
          dot: <Loader2 className="h-3 w-3 animate-spin text-sky-400" />,
          text: '同步中…',
          title: '正在同步到 GitHub',
        }
      case 'synced':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-emerald-400" />,
          text: `已同步 · ${formatRelativeTime(lastSyncAt)}`,
          title: `已同步（${detailTime}）`,
        }
      case 'offline':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-stone-400" />,
          text: '未登录 GitHub',
          title: '未登录 GitHub',
        }
      case 'queued':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-amber-500" />,
          text: '离线，已暂存',
          title: '离线修改已进入队列',
        }
      case 'retrying':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-sky-400" />,
          text: '重试中…',
          title: '正在重试同步',
        }
      case 'conflict':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-amber-500" />,
          text: '云端有冲突，点击处理',
          title: '云端 SHA 冲突，点击处理',
        }
      case 'error':
        return {
          dot: <span className="h-2 w-2 rounded-full bg-rose-400" />,
          text: '同步失败',
          title: '同步失败，点击重试',
        }
      case 'idle':
      default:
        return {
          dot: <span className="h-2 w-2 rounded-full bg-stone-400" />,
          text: '未同步',
          title: '未同步',
        }
    }
  })()

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg px-2 py-1 text-xs text-stone-600 transition-colors hover:bg-primary-cream/25"
      title={view.title}
    >
      {view.dot}
      <span className="hidden md:inline">{view.text}</span>
    </button>
  )
}
