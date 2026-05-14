import { create } from 'zustand'
import type { Company } from '../types'

interface CompanyState {
  companies: Company[]
  setCompanies: (companies: Company[]) => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  setCompanies: (companies) => set({ companies }),
}))
