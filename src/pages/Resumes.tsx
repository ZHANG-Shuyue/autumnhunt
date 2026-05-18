import { Copy, Eye, FileText, Link as LinkIcon, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import FormDialogLayout from '../components/common/FormDialogLayout'
import ResumeForm, { type ResumeFormValues } from '../components/forms/ResumeForm'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { fetchResumeFile, uploadResumeFile } from '../services/githubSync'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useResumeStore } from '../store/useResumeStore'
import type { Resume, ResumeSource } from '../types'

function formatSize(size?: number) {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function openResumePreview(resume: Resume, token: string | null) {
  if (resume.source === 'link') {
    if (!resume.externalUrl) {
      toast.error('该简历未配置外链')
      return
    }
    window.open(resume.externalUrl, '_blank', 'noopener,noreferrer')
    return
  }

  if (!resume.filePath || !token) {
    toast.error('无法读取 PDF 文件')
    return
  }

  const blob = await fetchResumeFile(token, resume.filePath)
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}

export default function Resumes() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const resumes = useResumeStore((s) => s.resumes)
  const addResume = useResumeStore((s) => s.addResume)
  const updateResume = useResumeStore((s) => s.updateResume)
  const deleteResume = useResumeStore((s) => s.deleteResume)
  const setActive = useResumeStore((s) => s.setActive)
  const applications = useApplicationStore((s) => s.applications)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Resume | null>(null)
  const [copying, setCopying] = useState<Resume | null>(null)
  const [addSource, setAddSource] = useState<ResumeSource>('link')
  const [showControls, setShowControls] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const usageMap = useMemo(() => {
    const map = new Map<string, number>()
    applications.forEach((application) => {
      if (!application.resumeId) return
      map.set(application.resumeId, (map.get(application.resumeId) ?? 0) + 1)
    })
    return map
  }, [applications])

  const openAddDialog = () => {
    setEditing(null)
    setCopying(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (values: ResumeFormValues) => {
    setSubmitting(true)
    try {
      if (editing) {
        if (editing.source === 'pdf' && values.source === 'link' && editing.filePath && token) {
          // 转为外链时保留远端文件可后续清理，先仅更新元数据
        }

        if (values.source === 'pdf' && values.file && token) {
          const { filePath } = await uploadResumeFile(token, editing.id, values.file)
          updateResume(editing.id, {
            source: 'pdf',
            category: values.category,
            name: values.name ?? editing.name,
            notes: values.notes ?? editing.notes,
            externalUrl: undefined,
            filePath,
            fileName: encodeURIComponent(values.file.name),
            fileSize: values.file.size,
          })
        } else {
          updateResume(editing.id, {
            source: values.source,
            category: values.category,
            name: values.name ?? editing.name,
            notes: values.notes ?? editing.notes,
            externalUrl: values.source === 'link' ? values.externalUrl : undefined,
          })
        }

        if (values.isActive) {
          setActive(editing.id)
        }

        toast.success('简历已更新')
        setDialogOpen(false)
        return
      }

      const created = addResume({
        name: values.name ?? '',
        category: values.category,
        isActive: values.isActive,
        source: values.source,
        notes: values.notes,
        externalUrl: values.source === 'link' ? values.externalUrl : undefined,
        fileName: undefined,
        filePath: undefined,
        fileSize: undefined,
      })

      if (values.source === 'pdf' && values.file) {
        if (!token) {
          toast.error('请先登录 GitHub 后上传 PDF')
        } else {
          const { filePath } = await uploadResumeFile(token, created.id, values.file)
          updateResume(created.id, {
            filePath,
            fileName: encodeURIComponent(values.file.name),
            fileSize: values.file.size,
          })
        }
      }

      if (values.isActive) {
        setActive(created.id)
      }

      toast.success('简历已添加')
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold sm:text-2xl">简历</h2>
          <Button size="sm" variant="outline" className="md:hidden" onClick={() => setShowControls((v) => !v)}>
            筛选
          </Button>
        </div>
        <div className={`flex flex-col gap-2 md:flex-row md:items-center ${showControls ? 'flex' : 'hidden md:flex'}`}>
          <select
            value={addSource}
            onChange={(event) => setAddSource(event.target.value as ResumeSource)}
            className="h-10 rounded-xl border border-neutral-border bg-white px-3 text-sm"
          >
            <option value="link">添加外链</option>
            <option value="pdf">上传 PDF</option>
          </select>
          <Button onClick={openAddDialog} className="md:w-auto">
            <Plus className="mr-1 h-4 w-4" />添加简历
          </Button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <EmptyState text="还没有简历，点击右上角添加" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => {
            const used = usageMap.get(resume.id) ?? 0
            return (
              <Card key={resume.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      className="text-left text-base font-semibold text-neutral-text hover:underline sm:text-lg"
                      onClick={() => navigate(`/resumes/${resume.id}`)}
                    >
                      {safeDecode(resume.name)}
                    </button>
                    <p className="mt-1 text-xs text-neutral-muted">v{resume.version}</p>
                  </div>
                  {resume.isActive && <Badge variant="sage">主推</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-muted sm:text-sm">
                  <Badge variant="cream">{resume.category}</Badge>
                  <span className="inline-flex items-center gap-1">
                    {resume.source === 'pdf' ? <FileText className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                    {resume.source.toUpperCase()}
                  </span>
                  {resume.source === 'pdf' && <span>{formatSize(resume.fileSize)}</span>}
                </div>

                <p className="text-xs text-neutral-muted">已用于 {used} 次投递</p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void openResumePreview(resume, token)
                    }}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />预览
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCopying(resume)
                      setEditing(null)
                      setDialogOpen(true)
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />复制为新版
                  </Button>
                  {!resume.isActive && (
                    <Button size="sm" variant="outline" onClick={() => setActive(resume.id)}>
                      <Star className="mr-1 h-3.5 w-3.5" />设为主推
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(resume)
                      setCopying(null)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />编辑
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeletingId(resume.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />删除
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <FormDialogLayout
          title={editing ? '编辑简历' : copying ? '复制为新版' : '添加简历'}
          formId="resume-form"
          onCancel={() => setDialogOpen(false)}
          submitLabel={submitting ? '保存中...' : '保存'}
          maxWidthClass="sm:max-w-2xl"
        >
          <ResumeForm
            id="resume-form"
            defaultSource={addSource}
            resumes={resumes}
            initial={
              editing
                ? editing
                : copying
                  ? {
                      ...copying,
                      id: undefined,
                      name: '',
                      source: copying.source,
                    }
                  : undefined
            }
            onSubmit={handleSubmit}
          />
        </FormDialogLayout>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="删除简历"
        description="删除后不可恢复，确认删除吗？"
        onConfirm={() => {
          if (!deletingId) return
          void deleteResume(deletingId)
          toast.success('已删除')
          setDeletingId(null)
        }}
      />
    </div>
  )
}
