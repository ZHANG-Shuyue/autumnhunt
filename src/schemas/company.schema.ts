import { z } from 'zod'

export const companySchema = z.object({
  name: z.string().min(1, '请输入公司名称'),
  industry: z.string().min(1, '请选择或输入行业'),
  status: z.enum(['open', 'closed', 'upcoming']),
  applyUrl: z.string().url('请输入合法 URL'),
  positions: z.array(z.string()).default([]),
  deadline: z.string().optional().or(z.literal('')),
  baseLocation: z.string().optional(),
  salaryRange: z.string().optional(),
  referralCode: z.string().optional(),
  contactInfo: z.string().optional(),
  description: z.string().optional(),
  researchNotes: z.string().optional(),
  source: z.string().min(1).default('手动添加'),
  relatedLinks: z.array(z.object({ title: z.string().min(1, '标题必填'), url: z.string().url('链接格式错误') })).default([]),
})

export type CompanyFormValues = z.infer<typeof companySchema>
