import { z } from 'zod'

export const applicationSchema = z.object({
  companyId: z.string().min(1, '请选择公司'),
  position: z.string().min(1, '请输入岗位'),
  appliedAt: z.string().min(1, '请选择投递日期'),
  status: z.enum(['applied', 'written_test', 'interviewing', 'offer', 'rejected']),
  resumeId: z.string().optional().or(z.literal('')),
  jobUrl: z.string().url('URL 格式错误').optional().or(z.literal('')),
  preparationDocUrl: z.string().url('URL 格式错误').optional().or(z.literal('')),
  writtenTestAt: z.string().optional().or(z.literal('')),
  writtenTestResult: z.enum(['pending', 'passed', 'failed']).optional(),
  finalResult: z.enum(['pending', 'offer', 'rejected', 'withdrawn']).optional(),
  notes: z.string().optional(),
})

export type ApplicationFormValues = z.infer<typeof applicationSchema>
