import { Link } from 'react-router-dom'
import type { Application, Resume } from '../../types'

interface ResumeConversionCardProps {
  resumes: Resume[]
  applications: Application[]
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function isInterviewStatus(status: string) {
  return [
    'interviewing',
    'offer',
    '一面',
    '二面',
    '三面',
    '终面',
    'HR面',
    'Offer',
  ].includes(status)
}

function isOfferStatus(status: string) {
  return ['offer', 'Offer'].includes(status)
}

export default function ResumeConversionCard({ resumes, applications }: ResumeConversionCardProps) {
  if (resumes.length === 0) {
    return (
      <div>
        <h4 className="mb-1 text-base font-semibold text-neutral-text">简历转化分析</h4>
        <p className="mb-3 text-xs text-stone-500">哪一版简历更受面试官青睐</p>
        <p className="text-sm text-stone-500">
          还没有简历记录，去{' '}
          <Link className="underline underline-offset-2" to="/resumes">
            简历库
          </Link>{' '}
          添加
        </p>
      </div>
    )
  }

  const rows = resumes
    .map((resume) => {
      const related = applications.filter((application) => application.resumeId === resume.id)
      const total = related.length
      const interviewed = related.filter((application) => isInterviewStatus(String(application.status))).length
      const offered = related.filter((application) => isOfferStatus(String(application.status))).length

      return {
        resume,
        total,
        interviewed,
        offered,
        interviewRate: total > 0 ? interviewed / total : 0,
        offerRate: total > 0 ? offered / total : 0,
      }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)

  if (rows.length === 0) {
    return (
      <div>
        <h4 className="mb-1 text-base font-semibold text-neutral-text">简历转化分析</h4>
        <p className="mb-3 text-xs text-stone-500">哪一版简历更受面试官青睐</p>
        <p className="text-sm text-stone-500">投递时关联简历版本，这里就能看到哪一版效果最好</p>
      </div>
    )
  }

  const candidates = rows.filter((row) => row.total >= 5)
  const bestId = candidates.length
    ? candidates.slice().sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total)[0]?.resume.id
    : null

  return (
    <div>
      <h4 className="mb-1 text-base font-semibold text-neutral-text">简历转化分析</h4>
      <p className="mb-3 text-xs text-stone-500">哪一版简历更受面试官青睐</p>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.resume.id} className="grid grid-cols-1 gap-2 rounded-xl border border-neutral-border bg-neutral-bg p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr] md:items-center md:gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-stone-700">
                {safeDecode(row.resume.name)} · v{row.resume.version}
              </p>
              {bestId === row.resume.id && (
                <span className="mt-1 inline-flex rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-600">✨ 最佳</span>
              )}
            </div>

            <div>
              <span className="inline-flex rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{row.resume.category}</span>
            </div>

            <div className="text-sm font-medium text-stone-700">投递 {row.total} 份</div>

            <div className="space-y-1">
              <p className="text-xs text-stone-500">面试率 {percent(row.interviewRate)}</p>
              <div className="h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full bg-stone-400/70" style={{ width: `${row.interviewRate * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-stone-500">Offer 率 {percent(row.offerRate)}</p>
              <div className="h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full bg-stone-400/70" style={{ width: `${row.offerRate * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
