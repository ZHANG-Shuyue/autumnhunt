import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import type { SyncLog, SyncStatus } from '../types/github'

interface SyncStoreState {
  syncStatus: SyncStatus
  lastPullAt: string | null
  lastPushAt: string | null
  pendingChanges: number
  error: string | null
  autoSyncEnabled: boolean
  syncLogs: SyncLog[]
  setStatus: (status: SyncStatus) => void
  setError: (error: string | null) => void
  setLastPullAt: (time: string) => void
  setLastPushAt: (time: string) => void
  setAutoSyncEnabled: (enabled: boolean) => void
  markPendingChange: (count?: number) => void
  clearPendingChanges: () => void
  addLog: (message: string, level?: SyncLog['level']) => void
  reset: () => void
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set) => ({
      syncStatus: 'idle',
      lastPullAt: null,
      lastPushAt: null,
      pendingChanges: 0,
      error: null,
      autoSyncEnabled: true,
      syncLogs: [],
      setStatus: (syncStatus) => set({ syncStatus }),
      setError: (error) => set({ error, syncStatus: error ? 'error' : 'idle' }),
      setLastPullAt: (lastPullAt) => set({ lastPullAt }),
      setLastPushAt: (lastPushAt) => set({ lastPushAt }),
      setAutoSyncEnabled: (autoSyncEnabled) => set({ autoSyncEnabled }),
      markPendingChange: (count = 1) => set((state) => ({ pendingChanges: state.pendingChanges + count })),
      clearPendingChanges: () => set({ pendingChanges: 0 }),
      addLog: (message, level = 'info') =>
        set((state) => ({
          syncLogs: [{ id: nanoid(), level, message, time: new Date().toISOString() }, ...state.syncLogs].slice(0, 50),
        })),
      reset: () =>
        set({
          syncStatus: 'idle',
          lastPullAt: null,
          lastPushAt: null,
          pendingChanges: 0,
          error: null,
          syncLogs: [],
          autoSyncEnabled: true,
        }),
    }),
    {
      name: STORE_KEYS.sync,
      version: 1,
      partialize: (state) => ({
        lastPullAt: state.lastPullAt,
        lastPushAt: state.lastPushAt,
        pendingChanges: state.pendingChanges,
        autoSyncEnabled: state.autoSyncEnabled,
        syncLogs: state.syncLogs,
      }),
    },
  ),
)
