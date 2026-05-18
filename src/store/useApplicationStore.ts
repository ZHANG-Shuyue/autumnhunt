import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { celebrate } from '../lib/celebrate'
import { mockApplications } from '../mock/applications'
import { schedulePush } from '../services/syncDebouncer'
import type { Application } from '../types'
import { ensureUpdatedAtList, nowIso } from '../utils/record'
import { useResumeStore } from './useResumeStore'

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

const MILESTONES = [10, 30, 50, 100]
const MILESTONE_KEY = 'autumnhunt-celebrated-milestones'
let rehydrateMigrationDone = false

function markDirty() {
  schedulePush()
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function migrateLegacyResumeVersion(applications: Application[]) {
  const resumes = useResumeStore.getState().resumes
  let changed = false

  const migrated = applications.map((application) => {
    const legacy = application as Application & { resumeVersion?: string; resumeFile?: string }
    const legacyName = legacy.resumeVersion?.trim() || legacy.resumeFile?.trim()
    const next: Application & { resumeVersion?: string; resumeFile?: string } = { ...legacy }

    if (legacyName && !next.resumeId) {
      const normalized = legacyName.toLowerCase()
      const matched = resumes.find((resume) => {
        const name = safeDecode(resume.name).toLowerCase()
        return name.includes(normalized) || normalized.includes(name)
      })
      if (matched) {
        next.resumeId = matched.id
        changed = true
      }
    }

    if ('resumeVersion' in next) {
      delete next.resumeVersion
      changed = true
    }

    if ('resumeFile' in next) {
      delete next.resumeFile
      changed = true
    }

    return next
  })

  if (changed) {
    schedulePush()
  }
  return changed ? (migrated as Application[]) : applications
}

function maybeCelebrateMilestone(count: number) {
  if (!MILESTONES.includes(count)) return

  const raw = localStorage.getItem(MILESTONE_KEY)
  const done = raw ? new Set<number>(JSON.parse(raw) as number[]) : new Set<number>()
  if (done.has(count)) return

  celebrate('milestone', `已经投递 ${count} 家了`)
  done.add(count)
  localStorage.setItem(MILESTONE_KEY, JSON.stringify([...done]))
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      applications: migrateLegacyResumeVersion(ensureUpdatedAtList(mockApplications)),
      addApplication: (payload) => {
        const id = nanoid()
        set((state) => ({ applications: [{ id, updatedAt: nowIso(), ...payload }, ...state.applications] }))
        markDirty()
        maybeCelebrateMilestone(get().applications.length)
        return id
      },
      updateApplication: (id, payload) => {
        const prev = get().applications.find((item) => item.id === id)

        set((state) => ({
          applications: state.applications.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: nowIso() } : item)),
        }))
        markDirty()

        const next = get().applications.find((item) => item.id === id)
        const prevOffer = prev?.finalResult === 'offer' || prev?.status === 'offer'
        const nextOffer = next?.finalResult === 'offer' || next?.status === 'offer'
        if (!prevOffer && nextOffer) {
          celebrate('offer')
        }

        maybeCelebrateMilestone(get().applications.length)
      },
      deleteApplication: (id) => {
        set((state) => ({ applications: state.applications.filter((item) => item.id !== id) }))
        markDirty()
      },
      replaceApplications: (applications) => set({ applications: migrateLegacyResumeVersion(ensureUpdatedAtList(applications)) }),
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
      onRehydrateStorage: () => (state) => {
        if (!state?.applications || rehydrateMigrationDone) return
        rehydrateMigrationDone = true
        const migrated = migrateLegacyResumeVersion(state.applications)
        if (migrated !== state.applications) {
          state.replaceApplications(migrated)
        }
      },
      migrate: (persisted) => {
        const state = persisted as { applications?: Application[] }
        return {
          applications: migrateLegacyResumeVersion(ensureUpdatedAtList(state.applications ?? mockApplications)),
        }
      },
    },
  ),
)
