import { buildLocalPayload, pullData, pushData } from './githubSync'
import { useAuthStore } from '../store/useAuthStore'
import { useSyncStore } from '../store/useSyncStore'

const QUEUE_KEY = 'autumnhunt-sync-queue'
const TYPE_PUSH = 'push' as const

type QueueItem = {
  type: typeof TYPE_PUSH
  timestamp: number
}

let listenersBound = false
let draining = false

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && item.type === TYPE_PUSH && typeof item.timestamp === 'number') as QueueItem[]
  } catch {
    return []
  }
}

function writeQueue(queue: QueueItem[]) {
  if (!queue.length) {
    localStorage.removeItem(QUEUE_KEY)
    return
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueue() {
  const queue = readQueue()
  if (!queue.some((item) => item.type === TYPE_PUSH)) {
    queue.push({ type: TYPE_PUSH, timestamp: Date.now() })
    writeQueue(queue)
  }
  useSyncStore.getState().setStatus('queued')
}

export async function drain() {
  if (draining) return
  if (!navigator.onLine) return

  const queue = readQueue()
  if (!queue.length) return

  draining = true
  useSyncStore.getState().setStatus('syncing')
  try {
    await autoMergePush()
    writeQueue([])
    useSyncStore.getState().setStatus('idle')
  } catch (error) {
    console.error('[offlineQueue] drain failed', error)
    useSyncStore.getState().setStatus('queued')
  } finally {
    draining = false
  }
}

export function setupOfflineQueue() {
  if (listenersBound) return
  listenersBound = true

  window.addEventListener('online', () => {
    void drain()
  })

  window.addEventListener('offline', () => {
    useSyncStore.getState().setStatus('queued')
  })
}

async function autoMergePush() {
  const token = useAuthStore.getState().token
  if (!token) throw new Error('未登录 GitHub')

  const { sha: latestSha } = await pullData(token)
  const localPayload = buildLocalPayload()

  const { sha } = await pushData(token, localPayload, latestSha)
  useSyncStore.getState().setLastSync(sha, new Date().toISOString())
  useSyncStore.getState().setStatus('synced')
}
