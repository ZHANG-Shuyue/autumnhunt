import { addDays, isAfter, parseISO } from 'date-fns'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { celebrate } from '../lib/celebrate'
import { mockInterviews } from '../mock/interviews'
import { schedulePush } from '../services/syncDebouncer'
import type { Interview } from '../types'
import { ensureUpdatedAtList, nowIso } from '../utils/record'

interface InterviewState {
  interviews: Interview[]
  addInterview: (payload: Omit<Interview, 'id' | 'updatedAt'>) => string
  updateInterview: (id: string, payload: Partial<Interview>) => void
  deleteInterview: (id: string) => void
  replaceInterviews: (interviews: Interview[]) => void
  getById: (id: string) => Interview | undefined
  getByApplicationId: (applicationId: string) => Interview[]
  getUpcoming: (days: number) => Interview[]
}

function markDirty() {
  schedulePush()
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      interviews: ensureUpdatedAtList(mockInterviews),
      addInterview: (payload) => {
        const id = nanoid()
        set((state) => ({ interviews: [{ id, updatedAt: nowIso(), ...payload }, ...state.interviews] }))
        markDirty()
        return id
      },
      updateInterview: (id, payload) => {
        const prev = get().interviews.find((item) => item.id === id)

        set((state) => ({
          interviews: state.interviews.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: nowIso() } : item)),
        }))
        markDirty()

        const next = get().interviews.find((item) => item.id === id)
        if (prev?.result !== 'pass' && next?.result === 'pass') {
          celebrate('pass')
        }
      },
      deleteInterview: (id) => {
        set((state) => ({ interviews: state.interviews.filter((item) => item.id !== id) }))
        markDirty()
      },
      replaceInterviews: (interviews) => set({ interviews: ensureUpdatedAtList(interviews) }),
      getById: (id) => get().interviews.find((item) => item.id === id),
      getByApplicationId: (applicationId) => get().interviews.filter((item) => item.applicationId === applicationId),
      getUpcoming: (days) => {
        const now = new Date()
        const end = addDays(now, days)
        return get().interviews.filter((item) => {
          const d = parseISO(item.scheduledAt)
          return isAfter(d, now) && d <= end
        })
      },
    }),
    {
      name: STORE_KEYS.interviews,
      version: 2,
      partialize: (state) => ({ interviews: state.interviews }),
      migrate: (persisted) => {
        const state = persisted as { interviews?: Interview[] }
        return {
          interviews: ensureUpdatedAtList(state.interviews ?? mockInterviews),
        }
      },
    },
  ),
)
