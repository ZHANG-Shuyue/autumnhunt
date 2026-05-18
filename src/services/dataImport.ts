import { nanoid } from 'nanoid'
import type { Application, Company, Interview, Resume } from '../types'

type ImportSheetKey = 'applications' | 'companies' | 'interviews' | 'resumes'
export type ImportSelection = Record<ImportSheetKey, boolean>
export type ConflictStrategy = 'skip' | 'overwrite' | 'duplicate'

export interface ImportPreviewData {
  rows: {
    applications: ParsedApplicationRow[]
    companies: ParsedCompanyRow[]
    interviews: ParsedInterviewRow[]
    resumes: ParsedResumeRow[]
  }
  counts: Record<ImportSheetKey, number>
}

export interface ImportValidationError {
  sheet: string
  row: number
  reason: string
}

export interface ImportConflictSummary {
  total: number
  details: Record<ImportSheetKey, number>
}

export interface ImportApplyResult {
  success: number
  skipped: number
  failed: number
  nextCompanies: Company[]
  nextApplications: Application[]
  nextInterviews: Interview[]
  nextResumes: Resume[]
}

interface ParsedApplicationRow {
  row: number
  companyName: string
  position: string
  status: string
  appliedAt?: string
  writtenTestAt?: string
  resumeName?: string
  jobUrl?: string
  notes?: string
}

interface ParsedCompanyRow {
  row: number
  name: string
  industry?: string
  applyUrl?: string
  city?: string
  status?: string
  notes?: string
}

interface ParsedInterviewRow {
  row: number
  companyName: string
  position: string
  round?: string
  scheduledAt: string
  duration?: number
  format?: string
  result?: string
  feedback?: string
  notes?: string
}

interface ParsedResumeRow {
  row: number
  name: string
  category?: string
  source?: string
  isActive?: boolean
  notes?: string
}

interface CurrentData {
  companies: Company[]
  applications: Application[]
  interviews: Interview[]
  resumes: Resume[]
}

const EMPTY_SELECTION: ImportSelection = {
  applications: true,
  companies: true,
  interviews: true,
  resumes: true,
}

function safeDecode(value?: string) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function asText(value: unknown) {
  if (value == null) return ''
  return String(value).trim()
}

function normalizeDate(value?: string) {
  if (!value) return ''
  const raw = value.trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(raw)) return raw.replace(/\//g, '-')
  const normalized = raw.replace('T', ' ').replace(/\//g, '-')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toISOString().slice(0, 10)
}

function normalizeDateTime(value: string) {
  const raw = value.trim()
  if (!raw) return ''
  const normalized = raw.replace('T', ' ').replace(/\//g, '-')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return ''
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  const hour = `${parsed.getHours()}`.padStart(2, '0')
  const minute = `${parsed.getMinutes()}`.padStart(2, '0')
  return `${parsed.getFullYear()}-${month}-${day}T${hour}:${minute}`
}

function normalizeApplicationStatus(raw: string): Application['status'] {
  const value = raw.trim().toLowerCase()
  if (['已投递', 'applied'].includes(raw) || value === 'applied') return 'applied'
  if (['笔试中', 'written_test', 'written test'].includes(raw) || value === 'written_test') return 'written_test'
  if (['面试中', 'interviewing'].includes(raw) || value === 'interviewing') return 'interviewing'
  if (['offer'].includes(value) || raw === 'Offer') return 'offer'
  if (['已挂', 'rejected'].includes(raw) || value === 'rejected') return 'rejected'
  return 'applied'
}

function normalizeCompanyStatus(raw?: string): Company['status'] {
  if (!raw) return 'open'
  const value = raw.trim().toLowerCase()
  if (['开放中', 'open'].includes(raw) || value === 'open') return 'open'
  if (['即将开放', 'upcoming'].includes(raw) || value === 'upcoming') return 'upcoming'
  if (['已截止', 'closed'].includes(raw) || value === 'closed') return 'closed'
  return 'open'
}

function normalizeInterviewFormat(raw?: string): Interview['format'] | undefined {
  if (!raw) return undefined
  const value = raw.trim().toLowerCase()
  if (['现场', 'onsite'].includes(raw) || value === 'onsite') return 'onsite'
  if (['视频', 'video'].includes(raw) || value === 'video') return 'video'
  if (['电话', 'phone'].includes(raw) || value === 'phone') return 'phone'
  return undefined
}

function normalizeInterviewResult(raw?: string): Interview['result'] | undefined {
  if (!raw) return undefined
  const value = raw.trim().toLowerCase()
  if (['待定', 'pending'].includes(raw) || value === 'pending') return 'pending'
  if (['通过', 'pass'].includes(raw) || value === 'pass') return 'pass'
  if (['未通过', 'fail'].includes(raw) || value === 'fail') return 'fail'
  return undefined
}

function normalizeResumeSource(raw?: string): Resume['source'] {
  if (!raw) return 'link'
  const value = raw.trim().toLowerCase()
  if (value === 'pdf') return 'pdf'
  return 'link'
}

function findSheetName(keys: string[], names: string[]) {
  const found = names.find((name) => keys.includes(name))
  return found ?? null
}

function parseApplications(rows: Record<string, unknown>[]): ParsedApplicationRow[] {
  return rows
    .map((row, index) => ({
      row: index + 2,
      companyName: asText(row['公司名']),
      position: asText(row['岗位']),
      status: asText(row['状态']),
      appliedAt: asText(row['投递日期']),
      writtenTestAt: asText(row['笔试日期']),
      resumeName: asText(row['简历版本']),
      jobUrl: asText(row['投递链接']),
      notes: asText(row['备注']),
    }))
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
}

function parseCompanies(rows: Record<string, unknown>[]): ParsedCompanyRow[] {
  return rows
    .map((row, index) => ({
      row: index + 2,
      name: asText(row['公司名']),
      industry: asText(row['行业']),
      applyUrl: asText(row['官网']),
      city: asText(row['城市']),
      status: asText(row['状态']),
      notes: asText(row['备注']),
    }))
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
}

function parseInterviews(rows: Record<string, unknown>[]): ParsedInterviewRow[] {
  return rows
    .map((row, index) => ({
      row: index + 2,
      companyName: asText(row['公司']),
      position: asText(row['岗位']),
      round: asText(row['轮次']),
      scheduledAt: asText(row['面试时间']),
      duration: Number(asText(row['时长(分钟)'])) || undefined,
      format: asText(row['形式']),
      result: asText(row['状态']),
      feedback: asText(row['反馈']),
      notes: asText(row['备注']),
    }))
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
}

function parseResumes(rows: Record<string, unknown>[]): ParsedResumeRow[] {
  return rows
    .map((row, index) => {
      const activeRaw = asText(row['是否主推'])
      return {
        row: index + 2,
        name: asText(row['版本名']),
        category: asText(row['标签']),
        source: asText(row['类型']),
        isActive: ['是', 'true', 'TRUE', '1'].includes(activeRaw),
        notes: asText(row['备注']),
      }
    })
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
}

export async function parseImportFile(file: File): Promise<ImportPreviewData> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  let applicationsRows: ParsedApplicationRow[] = []
  let companiesRows: ParsedCompanyRow[] = []
  let interviewsRows: ParsedInterviewRow[] = []
  let resumesRows: ParsedResumeRow[] = []

  const appSheetName = findSheetName(['投递记录'], workbook.SheetNames)
  const companySheetName = findSheetName(['公司库'], workbook.SheetNames)
  const interviewSheetName = findSheetName(['面试记录'], workbook.SheetNames)
  const resumeSheetName = findSheetName(['简历清单'], workbook.SheetNames)

  if (appSheetName) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[appSheetName], { defval: '' })
    applicationsRows = parseApplications(rows)
  }
  if (companySheetName) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[companySheetName], { defval: '' })
    companiesRows = parseCompanies(rows)
  }
  if (interviewSheetName) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[interviewSheetName], { defval: '' })
    interviewsRows = parseInterviews(rows)
  }
  if (resumeSheetName) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[resumeSheetName], { defval: '' })
    resumesRows = parseResumes(rows)
  }

  if (!appSheetName && !companySheetName && !interviewSheetName && !resumeSheetName && workbook.SheetNames.length > 0) {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })
    const headers = Object.keys(rows[0] ?? {})

    if (headers.includes('公司名') && headers.includes('岗位')) {
      applicationsRows = parseApplications(rows)
    } else if (headers.includes('公司名') && headers.includes('行业')) {
      companiesRows = parseCompanies(rows)
    } else if (headers.includes('公司') && headers.includes('岗位') && headers.includes('面试时间')) {
      interviewsRows = parseInterviews(rows)
    } else if (headers.includes('版本名')) {
      resumesRows = parseResumes(rows)
    }
  }

  return {
    rows: {
      applications: applicationsRows,
      companies: companiesRows,
      interviews: interviewsRows,
      resumes: resumesRows,
    },
    counts: {
      applications: applicationsRows.length,
      companies: companiesRows.length,
      interviews: interviewsRows.length,
      resumes: resumesRows.length,
    },
  }
}

export function validateImportData(data: ImportPreviewData, selection: ImportSelection = EMPTY_SELECTION): ImportValidationError[] {
  const errors: ImportValidationError[] = []

  if (selection.applications) {
    data.rows.applications.forEach((row) => {
      if (!row.companyName || !row.position) {
        errors.push({ sheet: '投递记录', row: row.row, reason: '公司名和岗位为必填' })
      }
    })
  }

  if (selection.companies) {
    data.rows.companies.forEach((row) => {
      if (!row.name) {
        errors.push({ sheet: '公司库', row: row.row, reason: '公司名为必填' })
      }
    })
  }

  if (selection.interviews) {
    data.rows.interviews.forEach((row) => {
      if (!row.companyName || !row.position || !row.scheduledAt) {
        errors.push({ sheet: '面试记录', row: row.row, reason: '公司、岗位、面试时间为必填' })
      }
    })
  }

  if (selection.resumes) {
    data.rows.resumes.forEach((row) => {
      if (!row.name) {
        errors.push({ sheet: '简历清单', row: row.row, reason: '版本名为必填' })
      }
    })
  }

  return errors
}

export function detectImportConflicts(data: ImportPreviewData, current: CurrentData, selection: ImportSelection): ImportConflictSummary {
  const companyNameById = new Map(current.companies.map((item) => [item.id, item.name.toLowerCase()]))
  const existingAppKeys = new Set(
    current.applications.map((item) => `${companyNameById.get(item.companyId) ?? ''}__${item.position.trim().toLowerCase()}`),
  )
  const existingCompanyKeys = new Set(current.companies.map((item) => item.name.trim().toLowerCase()))
  const appById = new Map(current.applications.map((item) => [item.id, item]))
  const existingInterviewKeys = new Set(
    current.interviews.map((item) => {
      const app = appById.get(item.applicationId)
      const companyName = app ? companyNameById.get(app.companyId) ?? '' : ''
      const position = app?.position.trim().toLowerCase() ?? ''
      return `${companyName}__${position}__${item.scheduledAt.slice(0, 16)}`
    }),
  )
  const existingResumeKeys = new Set(current.resumes.map((item) => safeDecode(item.name).trim().toLowerCase()))

  const details = {
    applications: 0,
    companies: 0,
    interviews: 0,
    resumes: 0,
  }

  if (selection.applications) {
    data.rows.applications.forEach((row) => {
      const key = `${row.companyName.trim().toLowerCase()}__${row.position.trim().toLowerCase()}`
      if (existingAppKeys.has(key)) details.applications += 1
    })
  }

  if (selection.companies) {
    data.rows.companies.forEach((row) => {
      if (existingCompanyKeys.has(row.name.trim().toLowerCase())) details.companies += 1
    })
  }

  if (selection.interviews) {
    data.rows.interviews.forEach((row) => {
      const key = `${row.companyName.trim().toLowerCase()}__${row.position.trim().toLowerCase()}__${normalizeDateTime(row.scheduledAt)}`
      if (existingInterviewKeys.has(key)) details.interviews += 1
    })
  }

  if (selection.resumes) {
    data.rows.resumes.forEach((row) => {
      const key = row.name.trim().toLowerCase()
      if (existingResumeKeys.has(key)) details.resumes += 1
    })
  }

  const total = details.applications + details.companies + details.interviews + details.resumes
  return { total, details }
}

function createCompanyFromName(name: string): Company {
  const now = new Date().toISOString()
  return {
    id: nanoid(),
    name,
    industry: '其他',
    status: 'open',
    applyUrl: '',
    positions: [],
    source: 'Excel 导入',
    createdAt: now.slice(0, 10),
    updatedAt: now,
    researchNotes: '',
  }
}

function createResumeFromName(name: string): Resume {
  const now = new Date().toISOString()
  return {
    id: nanoid(),
    name: encodeURIComponent(name),
    category: '通用',
    version: 1,
    isActive: false,
    source: 'link',
    createdAt: now,
    updatedAt: now,
    notes: '',
  }
}

export function applyImportData(
  data: ImportPreviewData,
  current: CurrentData,
  selection: ImportSelection,
  strategy: ConflictStrategy,
): ImportApplyResult {
  const now = new Date().toISOString()
  const companies = [...current.companies]
  const applications = [...current.applications]
  const interviews = [...current.interviews]
  const resumes = [...current.resumes]

  const companyNameMap = new Map(companies.map((item) => [item.name.trim().toLowerCase(), item]))
  const resumeNameMap = new Map(resumes.map((item) => [safeDecode(item.name).trim().toLowerCase(), item]))

  let success = 0
  let skipped = 0
  let failed = 0

  const companyNameById = () => new Map(companies.map((item) => [item.id, item.name.trim().toLowerCase()]))

  const ensureCompany = (name: string) => {
    const key = name.trim().toLowerCase()
    if (!key) return null
    const existed = companyNameMap.get(key)
    if (existed) return existed
    const created = createCompanyFromName(name)
    companies.unshift(created)
    companyNameMap.set(key, created)
    return created
  }

  const ensureResume = (name: string) => {
    const key = name.trim().toLowerCase()
    if (!key) return undefined
    const existed = resumeNameMap.get(key)
    if (existed) return existed
    const created = createResumeFromName(name)
    resumes.unshift(created)
    resumeNameMap.set(key, created)
    return created
  }

  const findApplicationConflictIndex = (companyName: string, position: string) => {
    const lowerCompany = companyName.trim().toLowerCase()
    const lowerPosition = position.trim().toLowerCase()
    const companyNameLookup = companyNameById()

    return applications.findIndex((item) => {
      const name = companyNameLookup.get(item.companyId) ?? ''
      return name === lowerCompany && item.position.trim().toLowerCase() === lowerPosition
    })
  }

  if (selection.companies) {
    data.rows.companies.forEach((row) => {
      try {
        const key = row.name.trim().toLowerCase()
        const conflictIndex = companies.findIndex((item) => item.name.trim().toLowerCase() === key)
        const conflict = conflictIndex >= 0

        if (conflict && strategy === 'skip') {
          skipped += 1
          return
        }

        const nextPayload: Company = {
          id: conflict ? companies[conflictIndex].id : nanoid(),
          name: row.name,
          industry: row.industry || '其他',
          status: normalizeCompanyStatus(row.status),
          applyUrl: row.applyUrl || '',
          positions: conflict ? companies[conflictIndex].positions : [],
          source: conflict ? companies[conflictIndex].source : 'Excel 导入',
          createdAt: conflict ? companies[conflictIndex].createdAt : now.slice(0, 10),
          updatedAt: now,
          baseLocation: row.city || undefined,
          researchNotes: row.notes || undefined,
          deadline: conflict ? companies[conflictIndex].deadline : undefined,
          description: conflict ? companies[conflictIndex].description : undefined,
          contactInfo: conflict ? companies[conflictIndex].contactInfo : undefined,
          referralCode: conflict ? companies[conflictIndex].referralCode : undefined,
          salaryRange: conflict ? companies[conflictIndex].salaryRange : undefined,
          relatedLinks: conflict ? companies[conflictIndex].relatedLinks : undefined,
          attachments: conflict ? companies[conflictIndex].attachments : undefined,
          recruitingLinks: conflict ? companies[conflictIndex].recruitingLinks : undefined,
          logo: conflict ? companies[conflictIndex].logo : undefined,
        }

        if (conflict && strategy === 'overwrite') {
          companies[conflictIndex] = nextPayload
        } else {
          companies.unshift(nextPayload)
        }

        companyNameMap.set(key, conflict && strategy === 'overwrite' ? nextPayload : companies[0])
        success += 1
      } catch {
        failed += 1
      }
    })
  }

  if (selection.resumes) {
    data.rows.resumes.forEach((row) => {
      try {
        const key = row.name.trim().toLowerCase()
        const conflictIndex = resumes.findIndex((item) => safeDecode(item.name).trim().toLowerCase() === key)
        const conflict = conflictIndex >= 0

        if (conflict && strategy === 'skip') {
          skipped += 1
          return
        }

        const sameCategory = resumes.filter((item) => item.category === (row.category || '通用'))
        const maxVersion = sameCategory.reduce((max, item) => Math.max(max, item.version), 0)

        const nextResume: Resume = {
          id: conflict ? resumes[conflictIndex].id : nanoid(),
          name: encodeURIComponent(row.name),
          category: row.category || (conflict ? resumes[conflictIndex].category : '通用'),
          version: conflict ? resumes[conflictIndex].version : maxVersion + 1,
          isActive: row.isActive ?? (conflict ? resumes[conflictIndex].isActive : false),
          source: normalizeResumeSource(row.source),
          notes: row.notes || undefined,
          createdAt: conflict ? resumes[conflictIndex].createdAt : now,
          updatedAt: now,
          fileName: conflict ? resumes[conflictIndex].fileName : undefined,
          filePath: conflict ? resumes[conflictIndex].filePath : undefined,
          fileSize: conflict ? resumes[conflictIndex].fileSize : undefined,
          externalUrl: conflict ? resumes[conflictIndex].externalUrl : undefined,
        }

        if (conflict && strategy === 'overwrite') {
          resumes[conflictIndex] = nextResume
        } else {
          resumes.unshift(nextResume)
        }

        resumeNameMap.set(key, conflict && strategy === 'overwrite' ? nextResume : resumes[0])
        success += 1
      } catch {
        failed += 1
      }
    })
  }

  if (selection.applications) {
    data.rows.applications.forEach((row) => {
      try {
        const company = ensureCompany(row.companyName)
        if (!company) {
          failed += 1
          return
        }

        const conflictIndex = findApplicationConflictIndex(row.companyName, row.position)
        const conflict = conflictIndex >= 0
        if (conflict && strategy === 'skip') {
          skipped += 1
          return
        }

        const resume = row.resumeName ? ensureResume(row.resumeName) : undefined

        const nextApplication: Application = {
          id: conflict ? applications[conflictIndex].id : nanoid(),
          companyId: company.id,
          position: row.position,
          resumeId: resume?.id,
          status: normalizeApplicationStatus(row.status || '已投递'),
          appliedAt: normalizeDate(row.appliedAt) || now.slice(0, 10),
          notes: row.notes || undefined,
          writtenTestAt: normalizeDate(row.writtenTestAt) || undefined,
          jobUrl: row.jobUrl || undefined,
          preparationDocUrl: conflict ? applications[conflictIndex].preparationDocUrl : undefined,
          writtenTestResult: conflict ? applications[conflictIndex].writtenTestResult : 'pending',
          finalResult: conflict ? applications[conflictIndex].finalResult : 'pending',
          updatedAt: now,
        }

        if (conflict && strategy === 'overwrite') {
          applications[conflictIndex] = nextApplication
        } else {
          applications.unshift(nextApplication)
        }

        success += 1
      } catch {
        failed += 1
      }
    })
  }

  if (selection.interviews) {
    data.rows.interviews.forEach((row) => {
      try {
        const normalizedTime = normalizeDateTime(row.scheduledAt)
        if (!normalizedTime) {
          failed += 1
          return
        }

        const company = ensureCompany(row.companyName)
        if (!company) {
          failed += 1
          return
        }

        let targetApplication = applications.find(
          (item) => item.companyId === company.id && item.position.trim().toLowerCase() === row.position.trim().toLowerCase(),
        )
        if (!targetApplication) {
          targetApplication = {
            id: nanoid(),
            companyId: company.id,
            position: row.position,
            status: 'interviewing',
            appliedAt: now.slice(0, 10),
            updatedAt: now,
            finalResult: 'pending',
            writtenTestResult: 'pending',
          }
          applications.unshift(targetApplication)
        }

        const conflictIndex = interviews.findIndex((item) => {
          if (item.applicationId !== targetApplication?.id) return false
          return item.scheduledAt.slice(0, 16) === normalizedTime.slice(0, 16)
        })

        const conflict = conflictIndex >= 0
        if (conflict && strategy === 'skip') {
          skipped += 1
          return
        }

        const nextInterview: Interview = {
          id: conflict ? interviews[conflictIndex].id : nanoid(),
          applicationId: targetApplication.id,
          round: row.round || '一面',
          scheduledAt: normalizedTime,
          duration: row.duration,
          format: normalizeInterviewFormat(row.format),
          result: normalizeInterviewResult(row.result) ?? 'pending',
          selfReview: row.feedback || undefined,
          questions: row.notes || undefined,
          updatedAt: now,
          interviewer: conflict ? interviews[conflictIndex].interviewer : undefined,
          rating: conflict ? interviews[conflictIndex].rating : undefined,
          location: conflict ? interviews[conflictIndex].location : undefined,
        }

        if (conflict && strategy === 'overwrite') {
          interviews[conflictIndex] = nextInterview
        } else {
          interviews.unshift(nextInterview)
        }

        success += 1
      } catch {
        failed += 1
      }
    })
  }

  return {
    success,
    skipped,
    failed,
    nextCompanies: companies,
    nextApplications: applications,
    nextInterviews: interviews,
    nextResumes: resumes,
  }
}

export function createDefaultImportSelection(): ImportSelection {
  return { ...EMPTY_SELECTION }
}
