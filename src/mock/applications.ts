import type { Application } from '../types'

export const mockApplications: Application[] = [
  {
    id: 'a1',
    companyId: '1',
    position: '前端开发工程师',
    status: 'applied',
    appliedAt: '2026-05-01',
    finalResult: 'pending',
    writtenTestResult: 'pending',
  },
  {
    id: 'a2',
    companyId: '2',
    position: '后端开发工程师',
    status: 'written_test',
    appliedAt: '2026-05-02',
    writtenTestAt: '2026-05-16',
    writtenTestResult: 'pending',
    finalResult: 'pending',
  },
  {
    id: 'a3',
    companyId: '5',
    position: '推荐算法工程师',
    status: 'interviewing',
    appliedAt: '2026-05-05',
    finalResult: 'pending',
  },
  {
    id: 'a4',
    companyId: '8',
    position: '软件开发工程师',
    status: 'offer',
    appliedAt: '2026-05-02',
    finalResult: 'offer',
  },
  {
    id: 'a5',
    companyId: '6',
    position: '测试开发工程师',
    status: 'rejected',
    appliedAt: '2026-04-28',
    finalResult: 'rejected',
  },
]
