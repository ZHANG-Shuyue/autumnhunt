import { Suspense, lazy, useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import DeviceFlowDialog from './components/auth/DeviceFlowDialog'
import WelcomeGate from './components/auth/WelcomeGate'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import { syncPull, syncPush } from './services/githubSync'
import { drain, setupOfflineQueue } from './services/offlineQueue'
import { useAuthStore } from './store/useAuthStore'
import { useCalendarStore } from './store/useCalendarStore'
import { useSyncStore } from './store/useSyncStore'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const Applications = lazy(() => import('./pages/Applications'))
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'))
const Interviews = lazy(() => import('./pages/Interviews'))
const Resumes = lazy(() => import('./pages/Resumes'))
const ResumeDetail = lazy(() => import('./pages/ResumeDetail'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hydrateSession = useAuthStore((s) => s.hydrateSession)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const setSyncStatus = useSyncStore((s) => s.setStatus)
  const welcomedRef = useRef<string | null>(null)

  useEffect(() => {
    syncFromOtherStores()
  }, [syncFromOtherStores])

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    setupOfflineQueue()
  }, [])

  useEffect(() => {
    if (!token) {
      setSyncStatus('offline')
      return
    }

    const needsPull =
      !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() > 5 * 60 * 1000

    if (needsPull) {
      void syncPull()
    }
  }, [lastSyncAt, setSyncStatus, token])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (welcomedRef.current === user.login) return
    welcomedRef.current = user.login
    toast.success(`欢迎，${user.name ?? user.login}！🌾`)
  }, [isAuthenticated, user])

  useEffect(() => {
    const onOnline = () => {
      if (!token) return
      void drain().then(() => syncPush())
      toast.success('网络已恢复，正在同步云端数据')
    }

    const onOffline = () => {
      toast('当前离线，修改会先保存在本地')
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [token])

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <>
          <WelcomeGate />
          <DeviceFlowDialog />
          <Toaster
            position="top-right"
            duration={3000}
            toastOptions={{
              style: {
                background: '#FAF7F2',
                color: '#5C5048',
                border: '1px solid #EDE6DB',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(92, 80, 72, 0.08)',
              },
            }}
          />
        </>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="animate-pulse text-stone-500">加载中…</div>
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/resumes/:id" element={<ResumeDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <DeviceFlowDialog />
        <Toaster
          position="top-right"
          duration={3000}
          toastOptions={{
            style: {
              background: '#FAF7F2',
              color: '#5C5048',
              border: '1px solid #EDE6DB',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(92, 80, 72, 0.08)',
            },
          }}
        />
      </>
    </ErrorBoundary>
  )
}

export default App
