import { addDays, eachDayOfInterval, format } from 'date-fns'
import type { CalendarEvent } from '../../types'
import { toISODate } from '../../utils/date'
import EventCard from './EventCard'

interface TimelineViewProps {
  events: CalendarEvent[]
  days?: number
  onSelectEvent?: (event: CalendarEvent) => void
}

export default function TimelineView({ events, days = 30, onSelectEvent }: TimelineViewProps) {
  const sections = eachDayOfInterval({ start: new Date(), end: addDays(new Date(), days) })

  return (
    <div className="space-y-4">
      {sections.map((day) => {
        const key = toISODate(day)
        const list = events
          .filter((event) => event.date === key)
          .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

        if (!list.length) return null
        return (
          <section key={key} className="rounded-2xl border border-neutral-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-text">{format(day, 'yyyy-MM-dd EEEE')}</h3>
            <div className="space-y-2">
              {list.map((event) => (
                <button key={event.id} type="button" className="block w-full text-left" onClick={() => onSelectEvent?.(event)}>
                  <EventCard event={event} />
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
