import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_KEYS } from '../config/github'
import { mockCompanies } from '../mock/companies'
import { schedulePush } from '../services/syncDebouncer'
import type { Company, RecruitingLink } from '../types'
import { ensureUpdatedAtList, nowIso } from '../utils/record'

interface CompanyState {
  companies: Company[]
  addCompany: (payload: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string }) => string
  updateCompany: (id: string, payload: Partial<Company>) => void
  deleteCompany: (id: string) => void
  addRecruitingLink: (companyId: string, link: Omit<RecruitingLink, 'id' | 'createdAt'>) => void
  updateRecruitingLink: (companyId: string, linkId: string, patch: Partial<Omit<RecruitingLink, 'id' | 'createdAt'>>) => void
  deleteRecruitingLink: (companyId: string, linkId: string) => void
  replaceCompanies: (companies: Company[]) => void
  getCompanyById: (id: string) => Company | undefined
  searchCompanies: (keyword: string) => Company[]
  filterByIndustry: (industry: string) => Company[]
  filterByStatus: (status: Company['status'] | 'all') => Company[]
}

function markDirty() {
  schedulePush()
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
      addRecruitingLink: (companyId, link) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            const next: RecruitingLink = {
              id: nanoid(),
              createdAt: nowIso(),
              ...link,
            }
            return {
              ...company,
              updatedAt: nowIso(),
              recruitingLinks: [next, ...(company.recruitingLinks ?? [])],
            }
          }),
        }))
        markDirty()
      },
      updateRecruitingLink: (companyId, linkId, patch) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            return {
              ...company,
              updatedAt: nowIso(),
              recruitingLinks: (company.recruitingLinks ?? []).map((link) =>
                link.id === linkId
                  ? {
                      ...link,
                      ...patch,
                    }
                  : link,
              ),
            }
          }),
        }))
        markDirty()
      },
      deleteRecruitingLink: (companyId, linkId) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            return {
              ...company,
              updatedAt: nowIso(),
              recruitingLinks: (company.recruitingLinks ?? []).filter((link) => link.id !== linkId),
            }
          }),
        }))
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
