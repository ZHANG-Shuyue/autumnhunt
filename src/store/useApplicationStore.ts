import { create } from 'zustand'
import type { Application } from '../types'

interface ApplicationState {
  applications: Application[]
  setApplications: (applications: Application[]) => void
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  applications: [],
  setApplications: (applications) => set({ applications }),
}))
