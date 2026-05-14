import InterviewCard from '../components/common/InterviewCard'
import { mockApplications } from '../mock/applications'
import { mockCompanies } from '../mock/companies'
import { mockInterviews } from '../mock/interviews'

export default function Interviews() {
  return (
    <div className="space-y-4">
      {mockInterviews.map((interview, index) => {
        const app = mockApplications.find((item) => item.id === interview.applicationId)
        const company = mockCompanies.find((item) => item.id === app?.companyId)
        const title = `${company?.name ?? '未知公司'} · ${interview.round}`
        return (
          <div key={interview.id} className="flex gap-4">
            <div className="flex flex-col items-center pt-4">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-mist" />
              {index !== mockInterviews.length - 1 && <span className="mt-1 h-full w-px bg-neutral-border" />}
            </div>
            <div className="flex-1">
              <InterviewCard
                title={title}
                time={interview.scheduledAt}
                summary={interview.selfReview ?? '暂无总结'}
                rating={interview.rating ?? 0}
                to={`/applications/${interview.applicationId}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
