import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

interface DatePickerProps {
  value?: string
  onChange: (value?: string) => void
  placeholder?: string
}

export default function DatePicker({ value, onChange, placeholder = '请选择日期' }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(parseISO(value), 'yyyy-MM-dd') : <span className="text-neutral-muted">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
        />
      </PopoverContent>
    </Popover>
  )
}
