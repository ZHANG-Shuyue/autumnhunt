import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { mockApplications } from '../mock/applications'
import { queuePush } from '../services/syncBridge'
import type { Application } from '../types'
import { ensureUpdatedAtList, nowIso } from '../utils/record'
import { useSyncStore } from './useSyncStore'

interface ApplicationState {
  applications: Application[]
  addApplication: (payload: Omit<Application, 'id' | 'updatedAt'>) => string
  updateApplication: (id: string, payload: Partial<Application>) => void
  deleteApplication: (id: string) => void
  replaceApplications: (applications: Application[]) => void
  getByCompanyId: (companyId: string) => Application[]
  getByStatus: (status: Application['status']) => Application[]
  getById: (id: string) => Application | undefined
  getStatistics: () => { total: number; applied: number; interviewing: number; offer: number; rejected: number }
}

function markDirty() {
  useSyncStore.getState().markPendingChange()
  queuePush('applications')
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      applications: ensureUpdatedAtList(mockApplications),
      addApplication: (payload) => {
        const id = nanoid()
        set((state) => ({ applications: [{ id, updatedAt: nowIso(), ...payload }, ...state.applications] }))
        markDirty()
        return id
      },
      updateApplication: (id, payload) => {
        set((state) => ({
          applications: state.applications.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: nowIso() } : item)),
        }))
        markDirty()
      },
      deleteApplication: (id) => {
        set((state) => ({ applications: state.applications.filter((item) => item.id !== id) }))
        markDirty()
      },
      replaceApplications: (applications) => set({ applications: ensureUpdatedAtList(applications) }),
      getByCompanyId: (companyId) => get().applications.filter((item) => item.companyId === companyId),
      getByStatus: (status) => get().applications.filter((item) => item.status === status),
      getById: (id) => get().applications.find((item) => item.id === id),
      getStatistics: () => {
        const all = get().applications
        return {
          total: all.length,
          applied: all.filter((item) => item.status === 'applied').length,
          interviewing: all.filter((item) => item.status === 'interviewing').length,
          offer: all.filter((item) => item.finalResult === 'offer' || item.status === 'offer').length,
          rejected: all.filter((item) => item.finalResult === 'rejected' || item.status === 'rejected').length,
        }
      },
    }),
    {
      name: STORE_KEYS.applications,
      version: 2,
      partialize: (state) => ({ applications: state.applications }),
      migrate: (persisted) => {
        const state = persisted as { applications?: Application[] }
        return {
          applications: ensureUpdatedAtList(state.applications ?? mockApplications),
        }
      },
    },
  ),
)
