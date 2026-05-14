import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ApplicationDetail from './pages/ApplicationDetail'
import Applications from './pages/Applications'
import CalendarPage from './pages/Calendar'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import Settings from './pages/Settings'
import { useCalendarStore } from './store/useCalendarStore'

function App() {
  const syncFromOtherStores = useCalendarStore((s) => s.syncFromOtherStores)

  useEffect(() => {
    syncFromOtherStores()
  }, [syncFromOtherStores])

  return (
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
  )
}

export default App
