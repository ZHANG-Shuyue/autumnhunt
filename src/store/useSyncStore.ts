import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'queued' | 'retrying' | 'conflict' | 'error'

interface SyncStoreState {
  status: SyncStatus
  isSyncing: boolean
  lastSyncAt: string | null
  lastSha: string | null
  pendingSince: number | null
  errorMessage: string | null
  setStatus: (status: SyncStatus, errorMessage?: string | null) => void
  setLastSync: (sha: string | null, time: string) => void
  reset: () => void
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set) => ({
      status: 'idle',
      isSyncing: false,
      lastSyncAt: null,
      lastSha: null,
      pendingSince: null,
      errorMessage: null,
      setStatus: (status, errorMessage) =>
        set((state) => ({
          status,
          isSyncing: status === 'syncing' || status === 'retrying',
          pendingSince: status === 'queued' ? state.pendingSince ?? Date.now() : null,
          errorMessage: errorMessage ?? (status === 'error' || status === 'conflict' ? '同步异常，请稍后重试' : null),
        })),
      setLastSync: (sha, time) =>
        set({
          lastSha: sha,
          lastSyncAt: time,
        }),
      reset: () =>
        set({
          status: 'idle',
          isSyncing: false,
          lastSyncAt: null,
          lastSha: null,
          pendingSince: null,
          errorMessage: null,
        }),
    }),
    {
      name: 'autumnhunt-sync',
      version: 1,
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
        lastSha: state.lastSha,
      }),
    },
  ),
)
