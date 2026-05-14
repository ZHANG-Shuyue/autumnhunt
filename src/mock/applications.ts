import type { Application } from '../types'

export const mockApplications: Application[] = [
  { id: 'a1', companyId: '1', position: '前端开发工程师', status: 'applied', appliedAt: '2026-05-01' },
  { id: 'a2', companyId: '2', position: '后端开发工程师', status: 'applied', appliedAt: '2026-05-02' },
  { id: 'a3', companyId: '3', position: '算法工程师', status: 'written_test', appliedAt: '2026-05-03' },
  { id: 'a4', companyId: '4', position: 'Java 工程师', status: 'written_test', appliedAt: '2026-05-04' },
  { id: 'a5', companyId: '5', position: '推荐算法工程师', status: 'interviewing', appliedAt: '2026-05-05' },
  { id: 'a6', companyId: '7', position: '游戏引擎工程师', status: 'interviewing', appliedAt: '2026-05-06' },
  { id: 'a7', companyId: '8', position: '软件开发工程师', status: 'offer', appliedAt: '2026-05-02' },
  { id: 'a8', companyId: '9', position: '视觉算法工程师', status: 'offer', appliedAt: '2026-05-01' },
  { id: 'a9', companyId: '10', position: '数据分析师', status: 'rejected', appliedAt: '2026-04-28' },
  { id: 'a10', companyId: '11', position: '图形开发工程师', status: 'rejected', appliedAt: '2026-04-27' },
]
