import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(1, '请输入事件标题'),
  type: z.string().min(1, '请输入事件类型'),
  color: z.enum(['cream', 'mist', 'rose', 'sage', 'ash']).default('cream'),
  date: z.string().min(1, '请选择日期'),
  time: z.string().optional(),
  endTime: z.string().optional(),
  description: z.string().optional(),
  linkedKind: z.enum(['company', 'application', 'interview']).optional().or(z.literal('')),
  linkedId: z.string().optional(),
})

export type EventFormValues = z.infer<typeof eventSchema>
