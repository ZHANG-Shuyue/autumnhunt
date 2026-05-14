import { useLocation } from 'react-router-dom'

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
  const title = getTitle(location.pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-border bg-neutral-bg/85 px-8 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-neutral-text">{title}</h2>
        <p className="text-xs text-neutral-muted">AutumnHunt / {title}</p>
      </div>
      <div className="h-9 w-9 rounded-full bg-primary-mist/60" />
    </header>
  )
}
