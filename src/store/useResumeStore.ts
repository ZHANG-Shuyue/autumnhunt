import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { deleteResumeFile } from '../services/githubSync'
import { schedulePush } from '../services/syncDebouncer'
import type { Resume } from '../types'
import { nowIso } from '../utils/record'
import { useAuthStore } from './useAuthStore'

interface ResumeState {
  resumes: Resume[]
  addResume: (input: Omit<Resume, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Resume
  updateResume: (id: string, patch: Partial<Resume>) => void
  deleteResume: (id: string) => Promise<void>
  setActive: (id: string) => void
  replaceResumes: (resumes: Resume[]) => void
}

function markDirty() {
  schedulePush()
}

function getNextVersion(resumes: Resume[], category: string) {
  const maxVersion = resumes
    .filter((item) => item.category === category)
    .reduce((max, item) => Math.max(max, item.version), 0)
  return maxVersion + 1
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      addResume: (input) => {
        const version = getNextVersion(get().resumes, input.category)
        const created: Resume = {
          id: nanoid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
          version,
          ...input,
          name: input.name?.trim() ? input.name : `${input.category}版-v${version}`,
        }

        set((state) => ({ resumes: [created, ...state.resumes] }))
        markDirty()
        return created
      },
      updateResume: (id, patch) => {
        set((state) => ({
          resumes: state.resumes.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)),
        }))
        markDirty()
      },
      deleteResume: async (id) => {
        const target = get().resumes.find((item) => item.id === id)
        if (target?.source === 'pdf' && target.filePath) {
          const token = useAuthStore.getState().token
          if (token) {
            try {
              await deleteResumeFile(token, target.filePath)
            } catch {
              // 删除远端失败不阻止本地删除
            }
          }
        }

        set((state) => ({ resumes: state.resumes.filter((item) => item.id !== id) }))
        markDirty()
      },
      setActive: (id) => {
        const target = get().resumes.find((item) => item.id === id)
        if (!target) return

        set((state) => ({
          resumes: state.resumes.map((item) => {
            if (item.category !== target.category) return item
            return {
              ...item,
              isActive: item.id === id,
              updatedAt: nowIso(),
            }
          }),
        }))
        markDirty()
      },
      replaceResumes: (resumes) => {
        set({ resumes })
      },
    }),
    {
      name: STORE_KEYS.resumes,
      version: 1,
      partialize: (state) => ({ resumes: state.resumes }),
      migrate: (persisted) => {
        const state = persisted as { resumes?: Resume[] }
        return {
          resumes: state.resumes ?? [],
        }
      },
    },
  ),
)
