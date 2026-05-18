import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LLMConfig } from '../types'

interface LLMConfigState {
  config?: LLMConfig
  setConfig: (cfg: LLMConfig) => void
  clearConfig: () => void
  updateTestResult: (ok: boolean, error?: string) => void
}

export const useLLMConfigStore = create<LLMConfigState>()(
  persist(
    (set) => ({
      config: undefined,
      setConfig: (cfg) => set({ config: cfg }),
      clearConfig: () => set({ config: undefined }),
      updateTestResult: (ok, error) =>
        set((s) => {
          if (!s.config) return s
          return {
            config: {
              ...s.config,
              lastTestAt: new Date().toISOString(),
              lastTestOk: ok,
              lastTestError: error,
            },
          }
        }),
    }),
    { name: 'autumnhunt-llm-config' },
  ),
)
