import type { Interview } from '../types'

export const mockInterviews: Interview[] = [
  {
    id: 'i1',
    applicationId: 'a5',
    round: '二面',
    scheduledAt: '2026-05-18 14:00',
    selfReview: '面试官关注项目性能优化细节，整体交流顺畅，需补充系统设计表达。',
    rating: 4,
  },
  {
    id: 'i2',
    applicationId: 'a6',
    round: '一面',
    scheduledAt: '2026-05-16 10:30',
    selfReview: '算法题发挥稳定，但对图形渲染管线解释不够深入。',
    rating: 3,
  },
  {
    id: 'i3',
    applicationId: 'a3',
    round: 'HR 面',
    scheduledAt: '2026-05-12 16:00',
    selfReview: '沟通氛围轻松，行为面回答基本完整。',
    rating: 4,
  },
  {
    id: 'i4',
    applicationId: 'a7',
    round: '终面',
    scheduledAt: '2026-05-10 09:30',
    selfReview: '关注长期职业规划，回答较真诚，反馈积极。',
    rating: 5,
  },
  {
    id: 'i5',
    applicationId: 'a10',
    round: '二面',
    scheduledAt: '2026-05-06 15:00',
    selfReview: '项目深挖环节细节准备不足，后续需加强复盘模板。',
    rating: 2,
  },
  {
    id: 'i6',
    applicationId: 'a9',
    round: '一面',
    scheduledAt: '2026-05-04 11:00',
    selfReview: '数据建模问题回答偏保守，案例积累需扩充。',
    rating: 3,
  },
]
