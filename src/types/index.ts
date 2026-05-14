export interface Company {
  id: string
  name: string
  logo?: string
  industry: string
  status: 'open' | 'closed' | 'upcoming'
  applyUrl: string
  positions: string[]
  deadline?: string
  description?: string
  source: string
  createdAt: string
}

export interface Application {
  id: string
  companyId: string
  position: string
  resumeFile?: string
  status: 'applied' | 'written_test' | 'interviewing' | 'offer' | 'rejected'
  appliedAt: string
  notes?: string
}

export interface Interview {
  id: string
  applicationId: string
  round: string
  scheduledAt: string
  interviewer?: string
  questions?: string
  selfReview?: string
  rating?: number
}
