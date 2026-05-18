import { type FormEvent, useMemo, useState } from 'react'
import type { Resume, ResumeSource } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

export interface ResumeFormValues {
  source: ResumeSource
  category: string
  name?: string
  notes?: string
  externalUrl?: string
  file?: File
  isActive: boolean
}

interface ResumeFormProps {
  id?: string
  initial?: Partial<Resume>
  resumes: Resume[]
  defaultSource?: ResumeSource
  onSubmit: (values: ResumeFormValues) => void | Promise<void>
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

export default function ResumeForm({ id = 'resume-form', initial, resumes, defaultSource = 'link', onSubmit }: ResumeFormProps) {
  const [source, setSource] = useState<ResumeSource>(initial?.source ?? defaultSource)
  const [category, setCategory] = useState(initial?.category ?? '通用')
  const [name, setName] = useState(initial?.name ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => [...new Set(resumes.map((item) => item.category))], [resumes])

  const nextVersion = useMemo(() => {
    const max = resumes.filter((item) => item.category === category).reduce((acc, cur) => Math.max(acc, cur.version), 0)
    return max + 1
  }, [category, resumes])

  const placeholderName = `${category || '通用'}版-v${nextVersion}`

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!category.trim()) {
      setError('请输入分类')
      return
    }

    if (source === 'link') {
      const url = normalizeUrl(externalUrl)
      if (!url) {
        setError('请填写外链地址')
        return
      }
      try {
        new URL(url)
      } catch {
        setError('外链地址格式错误')
        return
      }
    }

    if (source === 'pdf') {
      if (!file && !initial?.filePath) {
        setError('请选择 PDF 文件')
        return
      }
      if (file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          setError('仅支持 PDF 文件')
          return
        }
        if (file.size > MAX_FILE_SIZE) {
          setError('PDF 文件不能超过 5MB')
          return
        }
      }
    }

    await onSubmit({
      source,
      category: category.trim(),
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
      externalUrl: source === 'link' ? normalizeUrl(externalUrl) : undefined,
      file: source === 'pdf' ? file ?? undefined : undefined,
      isActive,
    })
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm">来源</label>
        <div className="inline-flex rounded-xl border border-neutral-border bg-white p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1 text-sm ${source === 'link' ? 'bg-primary-cream/45 text-neutral-text' : 'text-neutral-muted'}`}
            onClick={() => setSource('link')}
          >
            外链
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1 text-sm ${source === 'pdf' ? 'bg-primary-cream/45 text-neutral-text' : 'text-neutral-muted'}`}
            onClick={() => setSource('pdf')}
          >
            本地 PDF
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm">分类</label>
        <Input value={category} onChange={(event) => setCategory(event.target.value)} list="resume-category-options" />
        <datalist id="resume-category-options">
          {categories.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-sm">名称</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholderName} />
      </div>

      {source === 'link' ? (
        <div>
          <label className="mb-1 block text-sm">外链地址</label>
          <Input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm">上传 PDF</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null
              setFile(next)
            }}
          />
          {(file || initial?.fileName) && (
            <p className="mt-2 text-xs text-neutral-muted">
              {file ? `${file.name} · ${formatFileSize(file.size)}` : `${initial?.fileName} · ${formatFileSize(initial?.fileSize ?? 0)}`}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm">备注</label>
        <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-neutral-muted">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4" />
        设为该分类主推版本
      </label>

      {error && <p className="text-sm text-primary-rose">{error}</p>}

      <div className="hidden">
        <Button type="submit">提交</Button>
      </div>
    </form>
  )
}
