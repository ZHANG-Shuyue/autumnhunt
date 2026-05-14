import { format, isSameMonth } from 'date-fns'
import type { CalendarEvent } from '../../types'
import { monthMatrix, toISODate } from '../../utils/date'

interface MonthViewProps {
  cursor: Date
  events: CalendarEvent[]
  onSelectDate: (date: string) => void
  onSelectEvent: (event: CalendarEvent) => void
}

const tone: Record<string, string> = {
  cream: 'bg-primary-cream/80',
  mist: 'bg-primary-mist/80',
  rose: 'bg-primary-rose/80',
  sage: 'bg-primary-sage/80',
  ash: 'bg-primary-ash/80',
}

export default function MonthView({ cursor, events, onSelectDate, onSelectEvent }: MonthViewProps) {
  const rows = monthMatrix(cursor)
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-border bg-white">
      <div className="grid grid-cols-7 border-b border-neutral-border bg-primary-cream/20 text-center text-xs text-neutral-muted">
        {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
          <div key={w} className="py-2">周{w}</div>
        ))}
      </div>
      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-7 border-b border-neutral-border last:border-b-0">
          {row.map((day) => {
            const date = toISODate(day)
            const dayEvents = events.filter((item) => item.date === date)
            return (
              <button
                key={date}
                className="min-h-[120px] border-r border-neutral-border p-2 text-left last:border-r-0 hover:bg-primary-cream/10"
                onClick={() => onSelectDate(date)}
                type="button"
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${toISODate(new Date()) === date ? 'bg-primary-cream text-neutral-text' : 'text-neutral-muted'} ${!isSameMonth(day, cursor) ? 'opacity-40' : ''}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent(event)
                      }}
                      className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] text-neutral-text ${tone[event.color ?? 'cream']}`}
                    >
                      {event.time ? `${event.time} ` : ''}{event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[11px] text-neutral-muted">+{dayEvents.length - 3}</p>}
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
