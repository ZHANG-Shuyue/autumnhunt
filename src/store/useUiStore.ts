import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  applicationsFilter: {
    companyId: string | null
    statuses: string[]
    resumeId: string | null
    keyword: string
  }
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setApplicationsFilter: (patch: Partial<UiState['applicationsFilter']>) => void
  resetApplicationsFilter: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  applicationsFilter: {
    companyId: null,
    statuses: [],
    resumeId: null,
    keyword: '',
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setApplicationsFilter: (patch) =>
    set((state) => ({
      applicationsFilter: {
        ...state.applicationsFilter,
        ...patch,
      },
    })),
  resetApplicationsFilter: () =>
    set({
      applicationsFilter: {
        companyId: null,
        statuses: [],
        resumeId: null,
        keyword: '',
      },
    }),
}))
