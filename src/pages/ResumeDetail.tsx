import { ArrowLeft, Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { fetchResumeFile } from '../services/githubSync'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useResumeStore } from '../store/useResumeStore'

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function ResumeDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const resume = useResumeStore((s) => s.resumes.find((item) => item.id === id))
  const applications = useApplicationStore((s) => s.applications)
  const companies = useCompanyStore((s) => s.companies)

  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    let revoked = false
    let urlForCleanup: string | null = null
    if (!resume || resume.source !== 'pdf' || !resume.filePath || !token) return

    void fetchResumeFile(token, resume.filePath)
      .then((blob) => {
        if (revoked) return
        const url = URL.createObjectURL(blob)
        urlForCleanup = url
        setBlobUrl(url)
      })
      .catch(() => {
        toast.error('PDF 加载失败')
      })

    return () => {
      revoked = true
      if (urlForCleanup) URL.revokeObjectURL(urlForCleanup)
    }
  }, [resume, token])

  const relatedApplications = useMemo(
    () => applications.filter((application) => application.resumeId === id),
    [applications, id],
  )

  if (!resume) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />返回
        </Button>
        <p className="text-sm text-neutral-muted">未找到该简历</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />返回
      </Button>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{safeDecode(resume.name)}</h2>
          {resume.isActive && <Badge variant="sage">主推</Badge>}
        </div>
        <p className="text-sm text-neutral-muted">分类：{resume.category} · 版本：v{resume.version}</p>
        <p className="text-sm text-neutral-muted">来源：{resume.source.toUpperCase()}</p>
        {resume.notes && <p className="text-sm text-neutral-muted">备注：{resume.notes}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">预览</h3>
        {resume.source === 'link' ? (
          <Button onClick={() => window.open(resume.externalUrl, '_blank', 'noopener,noreferrer')}>
            <Eye className="mr-2 h-4 w-4" />打开外链
          </Button>
        ) : blobUrl ? (
          <iframe src={blobUrl} className="h-[70vh] w-full rounded-xl border border-neutral-border" title="Resume PDF" />
        ) : (
          <p className="text-sm text-neutral-muted">正在加载 PDF...</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">关联投递</h3>
        <div className="space-y-2">
          {relatedApplications.length === 0 && <p className="text-sm text-neutral-muted">暂未关联投递</p>}
          {relatedApplications.map((application) => {
            const company = companies.find((item) => item.id === application.companyId)
            return (
              <button
                key={application.id}
                type="button"
                className="block w-full rounded-xl border border-neutral-border p-3 text-left hover:bg-primary-cream/15"
                onClick={() => navigate(`/applications/${application.id}`)}
              >
                <p className="font-medium text-neutral-text">{company?.name ?? '未知公司'} · {application.position}</p>
                <p className="mt-1 text-xs text-neutral-muted">投递于 {application.appliedAt}</p>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
