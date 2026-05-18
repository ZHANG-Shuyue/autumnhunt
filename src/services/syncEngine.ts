import type { SyncStoreKey } from '../config/github'
import type { SyncRuntimeStatus } from '../types/github'
import { syncPull, syncPush } from './githubSync'
import { schedulePush } from './syncDebouncer'

export function resolveConflict<T extends { id: string; updatedAt?: string }>(local: T[], remote: T[]) {
  const merged = new Map<string, T>()

  local.forEach((item) => merged.set(item.id, item))
  remote.forEach((item) => {
    const current = merged.get(item.id)
    if (!current) {
      merged.set(item.id, item)
      return
    }

    const localTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0
    const remoteTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0
    if (remoteTime >= localTime) {
      merged.set(item.id, item)
    }
  })

  return [...merged.values()]
}

export async function pullAll(): Promise<void> {
  await syncPull()
}

export async function pushAll(): Promise<void> {
  await syncPush()
}

export async function pushOne(_storeKey: SyncStoreKey): Promise<void> {
  schedulePush()
}

export function enableAutoSync(): void {
  // Phase 3a 使用 schedulePush 的统一防抖，不需要额外开关
}

export function disableAutoSync(): void {
  // Phase 3a 使用 schedulePush 的统一防抖，不需要额外开关
}

export function getSyncStatus(): SyncRuntimeStatus {
  return {
    enabled: true,
    online: navigator.onLine,
    pendingChanges: 0,
  }
}
