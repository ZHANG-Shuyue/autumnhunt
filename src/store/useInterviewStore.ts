import { addDays, isAfter, parseISO } from 'date-fns'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockInterviews } from '../mock/interviews'
import type { Interview } from '../types'

interface InterviewState {
  interviews: Interview[]
  addInterview: (payload: Omit<Interview, 'id'>) => string
  updateInterview: (id: string, payload: Partial<Interview>) => void
  deleteInterview: (id: string) => void
  getById: (id: string) => Interview | undefined
  getByApplicationId: (applicationId: string) => Interview[]
  getUpcoming: (days: number) => Interview[]
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      interviews: mockInterviews,
      addInterview: (payload) => {
        const id = nanoid()
        set((state) => ({ interviews: [{ id, ...payload }, ...state.interviews] }))
        return id
      },
      updateInterview: (id, payload) =>
        set((state) => ({ interviews: state.interviews.map((item) => (item.id === id ? { ...item, ...payload } : item)) })),
      deleteInterview: (id) => set((state) => ({ interviews: state.interviews.filter((item) => item.id !== id) })),
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
      name: 'autumnhunt-interviews',
      version: 1,
      partialize: (state) => ({ interviews: state.interviews }),
    },
  ),
)
