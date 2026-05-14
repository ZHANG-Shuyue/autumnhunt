export interface ActivityItem {
  id: string
  message: string
  createdAt: string
}

const KEY = 'autumnhunt-activity-log'

// v0.2.1: 轻量活动日志（不改核心数据模型）
export function pushActivity(message: string) {
  const current = readActivities()
  const next: ActivityItem[] = [{ id: crypto.randomUUID(), message, createdAt: new Date().toISOString() }, ...current].slice(0, 50)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function readActivities(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as ActivityItem[]
  } catch {
    return []
  }
}
