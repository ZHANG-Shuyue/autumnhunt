import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MailAccount } from '../types'

interface MailAccountState {
  accounts: MailAccount[]
  addAccount: (acc: MailAccount) => void
  updateAccount: (id: string, patch: Partial<MailAccount>) => void
  removeAccount: (id: string) => void
}

export const useMailAccountStore = create<MailAccountState>()(
  persist(
    (set) => ({
      accounts: [],
      addAccount: (acc) => set((s) => ({ accounts: [...s.accounts, acc] })),
      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
    }),
    { name: 'autumnhunt-mail-accounts' },
  ),
)
