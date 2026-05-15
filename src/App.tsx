import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import DeviceFlowDialog from './components/auth/DeviceFlowDialog'
import WelcomeGate from './components/auth/WelcomeGate'
import Layout from './components/layout/Layout'
import { pullAll, pushAll } from './services/syncEngine'
import ApplicationDetail from './pages/ApplicationDetail'
import Applications from './pages/Applications'
import CalendarPage from './pages/Calendar'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import Settings from './pages/Settings'
import { useAuthStore } from './store/useAuthStore'
import { useCalendarStore } from './store/useCalendarStore'
import { useSyncStore } from './store/useSyncStore'

function App() {
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)
  const { isAuthenticated, user, hydrateSession } = useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    hydrateSession: s.hydrateSession,
  }))
  const pendingChanges = useSyncStore((s) => s.pendingChanges)
  const welcomedRef = useRef<string | null>(null)

  useEffect(() => {
    syncFromOtherStores()
  }, [syncFromOtherStores])

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (welcomedRef.current === user.login) return
    welcomedRef.current = user.login
    toast.success(`欢迎，${user.name ?? user.login}！🌾`)
  }, [isAuthenticated, user])

  useEffect(() => {
    const onOnline = () => {
      if (!isAuthenticated) return
      if (pendingChanges > 0) {
        void pushAll().then(() => {
          toast.success(`网络已恢复，${pendingChanges} 条修改已同步`)
        })
        return
      }
      void pullAll()
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
  }, [isAuthenticated, pendingChanges])

  if (!isAuthenticated) {
    return (
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
    )
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
  )
}

export default App
