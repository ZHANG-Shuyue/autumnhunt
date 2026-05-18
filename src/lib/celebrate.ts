import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useSyncStore } from '../store/useSyncStore'

type CelebrateType = 'offer' | 'pass' | 'milestone'

function runFor(ms: number, options: confetti.Options) {
  const end = Date.now() + ms
  const timer = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(timer)
      return
    }
    confetti({
      ...options,
      particleCount: 30,
      spread: 70,
      origin: { y: 0.7 },
    })
  }, 220)
}

export function celebrate(type: CelebrateType, message?: string) {
  if (useSyncStore.getState().isSyncing) return

  if (type === 'offer') {
    toast.success('🎉 恭喜拿到 Offer!')
    runFor(3000, { colors: ['#E8D5B7', '#DCCDB2', '#CDB890', '#A8B5A0'] })
    return
  }

  if (type === 'pass') {
    toast.success('✨ 面试通过!干得漂亮')
    runFor(2000, { colors: ['#A8B5A0', '#BFD0B7', '#E8D5B7'] })
    return
  }

  toast.success(message ? `🌟 ${message}` : '🌟 已经投递 N 家了,坚持就是胜利')
  runFor(4000, { colors: ['#E8D5B7', '#B8C5D6', '#D4B5B0', '#A8B5A0', '#C5BDB5'] })
}
