import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_DATA_REPO, POLL_INTERVAL_MS, STORE_KEYS } from '../config/github'
import { pollForToken, requestDeviceCode, revokeToken } from '../services/githubAuth'
import { ensureDataRepo, getCurrentUser, initOctokit } from '../services/github'
import { disableAutoSync, enableAutoSync, pullAll } from '../services/syncEngine'
import type { GitHubUser } from '../types/github'
import { decryptToken, encryptToken } from '../utils/tokenVault'
import { useSyncStore } from './useSyncStore'

let cancelFlowFlag = false

interface AuthStoreState {
  token: string | null
  encryptedToken: string | null
  user: GitHubUser | null
  dataRepo: string
  isAuthenticated: boolean
  deviceFlowState: 'idle' | 'requesting' | 'waiting' | 'success' | 'error'
  currentUserCode: string | null
  currentVerificationUri: string | null
  expiresAt: number | null
  deviceFlowError: string | null
  hasOpenedVerificationPage: boolean
  startDeviceFlow: () => Promise<void>
  cancelDeviceFlow: () => void
  clearDeviceFlowError: () => void
  markVerificationOpened: () => void
  logout: () => Promise<void>
  hydrateSession: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      token: null,
      encryptedToken: null,
      user: null,
      dataRepo: DEFAULT_DATA_REPO,
      isAuthenticated: false,
      deviceFlowState: 'idle',
      currentUserCode: null,
      currentVerificationUri: null,
      expiresAt: null,
      deviceFlowError: null,
      hasOpenedVerificationPage: false,
      clearDeviceFlowError: () => set({ deviceFlowError: null, deviceFlowState: 'idle' }),
      markVerificationOpened: () => set({ hasOpenedVerificationPage: true }),
      hydrateSession: async () => {
        const encryptedToken = get().encryptedToken
        if (!encryptedToken) return
        const token = await decryptToken(encryptedToken)
        if (!token) return

        try {
          initOctokit(token)
          const user = await getCurrentUser()
          set({ token, user, isAuthenticated: true })
          await ensureDataRepo(get().dataRepo)
          await pullAll()
          enableAutoSync()
        } catch {
          set({ token: null, encryptedToken: null, user: null, isAuthenticated: false })
        }
      },
      startDeviceFlow: async () => {
        cancelFlowFlag = false
        const syncStore = useSyncStore.getState()
        set({
          deviceFlowState: 'requesting',
          deviceFlowError: null,
          hasOpenedVerificationPage: false,
          currentUserCode: null,
          currentVerificationUri: null,
          expiresAt: null,
        })

        try {
          const code = await requestDeviceCode()
          if (cancelFlowFlag) return

          set({
            deviceFlowState: 'waiting',
            currentUserCode: code.user_code,
            currentVerificationUri: code.verification_uri,
            expiresAt: Date.now() + code.expires_in * 1000,
          })

          const token = await pollForToken(code.device_code, (code.interval || POLL_INTERVAL_MS / 1000) * 1000)
          if (cancelFlowFlag) return

          const encryptedToken = await encryptToken(token)
          initOctokit(token)
          const user = await getCurrentUser()
          set({
            token,
            encryptedToken,
            user,
            isAuthenticated: true,
            deviceFlowState: 'success',
          })

          await ensureDataRepo(get().dataRepo)
          await pullAll()
          enableAutoSync()

          syncStore.addLog('登录成功，已完成云端初始化', 'success')
          setTimeout(() => {
            const state = get()
            if (state.deviceFlowState === 'success') {
              set({
                deviceFlowState: 'idle',
                currentUserCode: null,
                currentVerificationUri: null,
                expiresAt: null,
                hasOpenedVerificationPage: false,
              })
            }
          }, 900)
        } catch (error) {
          const message = error instanceof Error ? error.message : '登录失败，请稍后重试'
          useSyncStore.getState().addLog(`登录失败：${message}`, 'error')
          set({
            deviceFlowState: 'error',
            deviceFlowError: message,
          })
        }
      },
      cancelDeviceFlow: () => {
        cancelFlowFlag = true
        set({
          deviceFlowState: 'idle',
          currentUserCode: null,
          currentVerificationUri: null,
          expiresAt: null,
          deviceFlowError: null,
          hasOpenedVerificationPage: false,
        })
      },
      logout: async () => {
        cancelFlowFlag = true
        const token = get().token
        if (token) {
          await revokeToken(token)
        }
        disableAutoSync()
        useSyncStore.getState().reset()
        set({
          token: null,
          encryptedToken: null,
          user: null,
          isAuthenticated: false,
          deviceFlowState: 'idle',
          currentUserCode: null,
          currentVerificationUri: null,
          expiresAt: null,
          deviceFlowError: null,
          hasOpenedVerificationPage: false,
        })
      },
    }),
    {
      name: STORE_KEYS.auth,
      version: 1,
      partialize: (state) => ({
        encryptedToken: state.encryptedToken,
        user: state.user,
        dataRepo: state.dataRepo,
      }),
    },
  ),
)
