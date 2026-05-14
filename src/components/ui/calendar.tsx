import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { cn } from '../../lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rounded-2xl bg-white p-2', className)}
      classNames={{
        day_button: 'h-9 w-9 rounded-lg text-sm hover:bg-primary-cream/30',
        selected: 'bg-primary-cream text-neutral-text',
        today: 'bg-primary-cream/40 text-neutral-text',
      } as never}
      {...props}
    />
  )
}
