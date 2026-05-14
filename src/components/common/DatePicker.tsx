import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

interface DatePickerProps {
  value?: string
  onChange: (value?: string) => void
  placeholder?: string
}

// v0.2.1: 全局统一日期选择器（Popover + Calendar）
export default function DatePicker({ value, onChange, placeholder = '请选择日期' }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start rounded-xl font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(parseISO(value), 'yyyy-MM-dd') : <span className="text-neutral-muted">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-xl p-0">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
        />
      </PopoverContent>
    </Popover>
  )
}
