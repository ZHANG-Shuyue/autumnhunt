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
      {/* v0.2.1: 全局 toast 奶油系样式 */}
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
    </div>
  )
}
