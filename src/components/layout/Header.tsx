import { ArrowLeft, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import SyncStatusIndicator from '../sync/SyncStatusIndicator'
import { useAuthStore } from '../../store/useAuthStore'

const titleMap: Record<string, string> = {
  '/': '概览看板',
  '/calendar': '日历',
  '/companies': '公司库',
  '/applications': '投递追踪',
  '/interviews': '面试记录',
  '/settings': '设置',
}

function getTitle(pathname: string) {
  if (titleMap[pathname]) return titleMap[pathname]
  if (pathname.startsWith('/companies/')) return '公司详情'
  if (pathname.startsWith('/applications/')) return '投递详情'
  return 'AutumnHunt'
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const title = getTitle(location.pathname)
  const isDetail = location.pathname.startsWith('/companies/') || location.pathname.startsWith('/applications/')

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-border bg-neutral-bg/85 px-8 backdrop-blur">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {isDetail && (
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-primary-cream/25" aria-label="返回">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-3xl font-semibold text-neutral-text">{title}</h2>
        </div>
        {isDetail && <p className="text-xs text-neutral-muted">AutumnHunt / {title}</p>}
      </div>
      <div className="flex items-center gap-3">
        <SyncStatusIndicator />
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.login} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-mist/60">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    </header>
  )
}
