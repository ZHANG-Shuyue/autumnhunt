import { syncPush } from './githubSync'
import { enqueue } from './offlineQueue'
import { useSyncStore } from '../store/useSyncStore'

let pushTimer: number | null = null

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function pushWithRetry() {
  if (!navigator.onLine) {
    enqueue()
    return
  }

  const syncStore = useSyncStore.getState()
  const backoffs = [1000, 3000, 9000]

  for (let i = 0; i < backoffs.length; i += 1) {
    if (i > 0) {
      syncStore.setStatus('retrying')
    }
    await syncPush()
    const status = useSyncStore.getState().status
    if (status === 'synced') {
      return
    }

    if (i < backoffs.length - 1) {
      syncStore.setStatus('retrying')
      await sleep(backoffs[i])
      continue
    }
  }

  enqueue()
}

export function schedulePush() {
  if (pushTimer) {
    window.clearTimeout(pushTimer)
  }

  pushTimer = window.setTimeout(() => {
    pushTimer = null
    void pushWithRetry()
  }, 10000)
}
