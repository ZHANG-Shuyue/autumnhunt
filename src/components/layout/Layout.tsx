import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-bg font-sans text-neutral-text">
      <Sidebar />
      <main className="min-h-screen md:ml-64">
        <Header />
        <section className="px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
