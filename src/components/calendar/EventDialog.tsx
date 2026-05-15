import { toast } from 'sonner'
import type { EventFormValues } from '../../schemas/event.schema'
import type { CalendarEvent } from '../../types'
import FormDialogLayout from '../common/FormDialogLayout'
import EventForm from '../forms/EventForm'
import { Dialog } from '../ui/dialog'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CalendarEvent
  onSave: (values: EventFormValues) => void
}

export default function EventDialog({ open, onOpenChange, initial, onSave }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={initial ? '编辑事件' : '新建事件'}
        formId="event-form"
        onCancel={() => onOpenChange(false)}
        maxWidthClass="sm:max-w-2xl"
      >
        <EventForm
          id="event-form"
          initial={initial}
          onSubmit={(values) => {
            onSave(values)
            toast.success(initial ? '已更新' : '已添加')
            onOpenChange(false)
          }}
        />
      </FormDialogLayout>
    </Dialog>
  )
}
