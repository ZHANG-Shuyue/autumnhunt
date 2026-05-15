import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { mockCompanies } from '../mock/companies'
import { queuePush } from '../services/syncBridge'
import type { Company } from '../types'
import { ensureUpdatedAtList, nowIso } from '../utils/record'
import { useSyncStore } from './useSyncStore'

interface CompanyState {
  companies: Company[]
  addCompany: (payload: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string }) => string
  updateCompany: (id: string, payload: Partial<Company>) => void
  deleteCompany: (id: string) => void
  replaceCompanies: (companies: Company[]) => void
  getCompanyById: (id: string) => Company | undefined
  searchCompanies: (keyword: string) => Company[]
  filterByIndustry: (industry: string) => Company[]
  filterByStatus: (status: Company['status'] | 'all') => Company[]
}

function markDirty() {
  useSyncStore.getState().markPendingChange()
  queuePush('companies')
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: ensureUpdatedAtList(mockCompanies),
      addCompany: (payload) => {
        const id = nanoid()
        const company: Company = {
          id,
          createdAt: payload.createdAt ?? new Date().toISOString().slice(0, 10),
          updatedAt: nowIso(),
          ...payload,
          source: payload.source || '手动添加',
        }
        set((state) => ({ companies: [company, ...state.companies] }))
        markDirty()
        return id
      },
      updateCompany: (id, payload) => {
        set((state) => ({
          companies: state.companies.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: nowIso() } : item)),
        }))
        markDirty()
      },
      deleteCompany: (id) => {
        set((state) => ({ companies: state.companies.filter((item) => item.id !== id) }))
        markDirty()
      },
      replaceCompanies: (companies) => {
        set({ companies: ensureUpdatedAtList(companies) })
      },
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
      name: STORE_KEYS.companies,
      version: 2,
      partialize: (state) => ({ companies: state.companies }),
      migrate: (persisted) => {
        const state = persisted as { companies?: Company[] }
        return {
          companies: ensureUpdatedAtList(state.companies ?? mockCompanies),
        }
      },
    },
  ),
)
