import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockCompanies } from '../mock/companies'
import type { Company } from '../types'

interface CompanyState {
  companies: Company[]
  addCompany: (payload: Omit<Company, 'id' | 'createdAt'> & { createdAt?: string }) => string
  updateCompany: (id: string, payload: Partial<Company>) => void
  deleteCompany: (id: string) => void
  getCompanyById: (id: string) => Company | undefined
  searchCompanies: (keyword: string) => Company[]
  filterByIndustry: (industry: string) => Company[]
  filterByStatus: (status: Company['status'] | 'all') => Company[]
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: mockCompanies,
      addCompany: (payload) => {
        const id = nanoid()
        const company: Company = {
          id,
          createdAt: payload.createdAt ?? new Date().toISOString().slice(0, 10),
          ...payload,
          source: payload.source || '手动添加',
        }
        set((state) => ({ companies: [company, ...state.companies] }))
        return id
      },
      updateCompany: (id, payload) =>
        set((state) => ({ companies: state.companies.map((item) => (item.id === id ? { ...item, ...payload } : item)) })),
      deleteCompany: (id) => set((state) => ({ companies: state.companies.filter((item) => item.id !== id) })),
      getCompanyById: (id) => get().companies.find((item) => item.id === id),
      searchCompanies: (keyword) => {
        const k = keyword.trim().toLowerCase()
        if (!k) return get().companies
        return get().companies.filter((item) => item.name.toLowerCase().includes(k))
      },
      filterByIndustry: (industry) => (industry === 'all' ? get().companies : get().companies.filter((item) => item.industry === industry)),
      filterByStatus: (status) => (status === 'all' ? get().companies : get().companies.filter((item) => item.status === status)),
    }),
    {
      name: 'autumnhunt-companies',
      version: 1,
      partialize: (state) => ({ companies: state.companies }),
    },
  ),
)
