import { toast } from 'sonner'
import type { EventFormValues } from '../../schemas/event.schema'
import type { CalendarEvent } from '../../types'
import EventForm from '../forms/EventForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CalendarEvent
  onSave: (values: EventFormValues) => void
}

export default function EventDialog({ open, onOpenChange, initial, onSave }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? '编辑事件' : '新建事件'}</DialogTitle>
        </DialogHeader>
        <EventForm
          initial={initial}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSave(values)
            toast.success(initial ? '已更新' : '已添加')
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
