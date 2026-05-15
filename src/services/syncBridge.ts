import type { SyncStoreKey } from '../config/github'

export function queuePush(storeKey: SyncStoreKey) {
  void import('./syncEngine').then((mod) => {
    mod.pushOne(storeKey)
  })
}
