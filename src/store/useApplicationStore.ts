import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockApplications } from '../mock/applications'
import type { Application } from '../types'

interface ApplicationState {
  applications: Application[]
  addApplication: (payload: Omit<Application, 'id'>) => string
  updateApplication: (id: string, payload: Partial<Application>) => void
  deleteApplication: (id: string) => void
  getByCompanyId: (companyId: string) => Application[]
  getByStatus: (status: Application['status']) => Application[]
  getById: (id: string) => Application | undefined
  getStatistics: () => { total: number; applied: number; interviewing: number; offer: number; rejected: number }
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      applications: mockApplications,
      addApplication: (payload) => {
        const id = nanoid()
        set((state) => ({ applications: [{ id, ...payload }, ...state.applications] }))
        return id
      },
      updateApplication: (id, payload) =>
        set((state) => ({ applications: state.applications.map((item) => (item.id === id ? { ...item, ...payload } : item)) })),
      deleteApplication: (id) => set((state) => ({ applications: state.applications.filter((item) => item.id !== id) })),
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
      name: 'autumnhunt-applications',
      version: 1,
      partialize: (state) => ({ applications: state.applications }),
    },
  ),
)
