import { Building2, Globe, LayoutDashboard, MessageSquare, Send, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companies', label: '公司库', icon: Building2 },
  { to: '/applications', label: '投递追踪', icon: Send },
  { to: '/interviews', label: '面试记录', icon: MessageSquare },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-neutral-border bg-[linear-gradient(rgba(232,213,183,0.3),rgba(232,213,183,0.3)),#FAF7F2] p-4">
      <div className="mb-8 px-2 py-4">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-text">AutumnHunt 🌾</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-muted transition-colors hover:bg-primary-cream/25 hover:text-neutral-text',
                  isActive && 'bg-primary-cream/35 text-neutral-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-2 h-8 w-1 rounded-r bg-primary-cream" />}
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-neutral-border px-2 pt-4 text-sm text-neutral-muted">
        <p>v0.1</p>
        <a href="#" className="inline-flex items-center gap-2 hover:text-neutral-text">
          <Globe className="h-4 w-4" /> GitHub
        </a>
      </div>
    </aside>
  )
}
