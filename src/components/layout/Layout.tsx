import { Toaster } from 'sonner'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-bg font-sans text-neutral-text">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <Header />
        <section className="p-8">
          <Outlet />
        </section>
      </main>
      <Toaster position="top-right" richColors={false} />
    </div>
  )
}
