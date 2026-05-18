import { ArrowLeft, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SyncIndicator from './SyncIndicator'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'

const titleMap: Record<string, string> = {
  '/': '概览看板',
  '/calendar': '日历',
  '/companies': '公司库',
  '/applications': '投递追踪',
  '/interviews': '面试记录',
  '/resumes': '简历',
  '/settings': '设置',
}

function getTitle(pathname: string) {
  if (titleMap[pathname]) return titleMap[pathname]
  if (pathname.startsWith('/companies/')) return '公司详情'
  if (pathname.startsWith('/applications/')) return '投递详情'
  if (pathname.startsWith('/resumes/')) return '简历详情'
  return 'AutumnHunt'
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const title = getTitle(location.pathname)
  const isDetail =
    location.pathname.startsWith('/companies/') ||
    location.pathname.startsWith('/applications/') ||
    location.pathname.startsWith('/resumes/')

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-border bg-neutral-bg/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-primary-cream/25 md:hidden"
          aria-label="打开菜单"
        >
          <Menu className="h-5 w-5" />
        </button>
        {isDetail && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-primary-cream/25 md:inline-flex"
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <p className="font-serif text-base text-neutral-text md:hidden">AutumnHunt 🌾</p>
        <div className="hidden space-y-1 md:block">
          <h2 className="truncate text-2xl font-semibold text-neutral-text">{title}</h2>
          {isDetail && <p className="text-xs text-neutral-muted">AutumnHunt / {title}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <SyncIndicator />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg px-1 hover:bg-primary-cream/25 md:px-2"
            aria-label="账户菜单"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.login} className="h-8 w-8 rounded-full object-cover md:h-9 md:w-9" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/60 md:h-9 md:w-9">
                <User className="h-4 w-4" />
              </div>
            )}
            <ChevronDown className="hidden h-4 w-4 text-neutral-muted md:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-32 rounded-lg border border-stone-200 bg-white shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                onClick={() => {
                  void logout()
                  setMenuOpen(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
