import type { Interview } from '../types'

export const mockInterviews: Interview[] = [
  {
    id: 'i1',
    applicationId: 'a3',
    round: '二面',
    scheduledAt: '2026-05-18T14:00:00',
    selfReview: '交流顺畅，系统设计部分还需更结构化。',
    rating: 4,
    format: 'video',
    duration: 60,
  },
  {
    id: 'i2',
    applicationId: 'a3',
    round: '一面',
    scheduledAt: '2026-05-16T10:30:00',
    selfReview: '算法题发挥稳定。',
    rating: 3,
    format: 'video',
  },
  {
    id: 'i3',
    applicationId: 'a4',
    round: '终面',
    scheduledAt: '2026-05-10T09:30:00',
    selfReview: '整体反馈积极。',
    rating: 5,
    format: 'onsite',
  },
]
