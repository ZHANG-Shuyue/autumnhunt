import { z } from 'zod'

export const interviewSchema = z.object({
  applicationId: z.string().min(1, '请选择投递记录'),
  round: z.string().min(1, '请输入面试轮次'),
  scheduledAt: z.string().min(1, '请选择时间'),
  duration: z.coerce.number().optional(),
  format: z.enum(['onsite', 'video', 'phone']).optional(),
  location: z.string().optional(),
  interviewer: z.string().optional(),
  questions: z.string().optional(),
  selfReview: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
})

export type InterviewFormValues = z.infer<typeof interviewSchema>
