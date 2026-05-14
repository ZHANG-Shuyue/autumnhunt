import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export const toISODate = (date: Date) => format(date, 'yyyy-MM-dd')
export const toISODateTime = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss")
export const formatDate = (value?: string, pattern = 'yyyy-MM-dd') => {
  if (!value) return '-'
  return format(parseISO(value), pattern)
}

export const monthMatrix = (cursor: Date) => {
  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const start = startOfWeek(monthStart, { weekStartsOn: 1 })
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  const rows: Date[][] = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}

export const isSameDate = (a: string, b: string) => isSameDay(parseISO(a), parseISO(b))
export const isTodayISO = (date: string) => isToday(parseISO(date))
export const shiftMonth = (date: Date, step: number) => addMonths(date, step)
export const upcomingRange = (days: number) => ({ start: new Date(), end: addDays(new Date(), days) })
