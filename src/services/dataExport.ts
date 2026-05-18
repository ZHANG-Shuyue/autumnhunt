import { useApplicationStore } from '../store/useApplicationStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useResumeStore } from '../store/useResumeStore'

type TemplateType = 'applications' | 'companies' | 'interviews' | 'resumes'

const applicationStatusLabel: Record<string, string> = {
  applied: '已投递',
  written_test: '笔试中',
  interviewing: '面试中',
  offer: 'Offer',
  rejected: '已挂',
}

const companyStatusLabel: Record<string, string> = {
  open: '开放中',
  upcoming: '即将开放',
  closed: '已截止',
}

const interviewFormatLabel: Record<string, string> = {
  onsite: '现场',
  video: '视频',
  phone: '电话',
}

const interviewResultLabel: Record<string, string> = {
  pending: '待定',
  pass: '通过',
  fail: '未通过',
}

function safeDecode(value?: string) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function toDateLabel(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

function toDateTimeLabel(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const hour = `${d.getHours()}`.padStart(2, '0')
  const minute = `${d.getMinutes()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day} ${hour}:${minute}`
}

export async function exportAllXlsx() {
  const XLSX = await import('xlsx')
  const { companies } = useCompanyStore.getState()
  const { applications } = useApplicationStore.getState()
  const { interviews } = useInterviewStore.getState()
  const { resumes } = useResumeStore.getState()

  const companyMap = new Map(companies.map((item) => [item.id, item]))
  const resumeMap = new Map(resumes.map((item) => [item.id, item]))
  const appMap = new Map(applications.map((item) => [item.id, item]))

  const appSheet = applications.map((app) => {
    const company = companyMap.get(app.companyId)
    const latestInterview = interviews
      .filter((item) => item.applicationId === app.id)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0]

    return {
      公司名: company?.name ?? '',
      岗位: app.position,
      状态: applicationStatusLabel[app.status] ?? app.status,
      投递日期: toDateLabel(app.appliedAt),
      笔试日期: toDateLabel(app.writtenTestAt),
      最近面试: latestInterview ? `${latestInterview.round} ${toDateTimeLabel(latestInterview.scheduledAt)}` : '',
      简历版本: app.resumeId ? safeDecode(resumeMap.get(app.resumeId)?.name) : '',
      投递链接: app.jobUrl ?? '',
      备注: app.notes ?? '',
    }
  })

  const companySheet = companies.map((company) => ({
    公司名: company.name,
    行业: company.industry,
    官网: company.applyUrl,
    城市: company.baseLocation ?? '',
    状态: companyStatusLabel[company.status] ?? company.status,
    投递数: applications.filter((item) => item.companyId === company.id).length,
    备注: company.researchNotes ?? '',
  }))

  const interviewSheet = interviews.map((interview) => {
    const app = appMap.get(interview.applicationId)
    const company = app ? companyMap.get(app.companyId) : undefined
    return {
      公司: company?.name ?? '',
      岗位: app?.position ?? '',
      轮次: interview.round,
      面试时间: toDateTimeLabel(interview.scheduledAt),
      '时长(分钟)': interview.duration ?? '',
      形式: interview.format ? interviewFormatLabel[interview.format] ?? interview.format : '',
      状态: interview.result ? interviewResultLabel[interview.result] ?? interview.result : '',
      反馈: interview.selfReview ?? '',
      备注: interview.questions ?? '',
    }
  })

  const resumeSheet = resumes.map((resume) => ({
    版本名: safeDecode(resume.name),
    标签: resume.category,
    类型: resume.source,
    投递次数: applications.filter((item) => item.resumeId === resume.id).length,
    是否主推: resume.isActive ? '是' : '否',
    备注: resume.notes ?? '',
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(appSheet), '投递记录')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(companySheet), '公司库')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(interviewSheet), '面试记录')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumeSheet), '简历清单')

  const filename = `autumnhunt-backup-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

export async function downloadImportTemplate(type: TemplateType) {
  const XLSX = await import('xlsx')

  const templateData: Record<TemplateType, { sheetName: string; header: string[]; sample: string[]; note?: string[] }> = {
    applications: {
      sheetName: '投递记录',
      header: ['公司名', '岗位', '状态', '投递日期', '笔试日期', '最近面试', '简历版本', '投递链接', '备注'],
      sample: ['字节跳动', '前端开发工程师', '已投递', '2026-05-18', '', '', '通用版-v1', 'https://jobs.example.com/123', '示例备注'],
      note: ['状态可选：已投递 / 笔试中 / 面试中 / Offer / 已挂'],
    },
    companies: {
      sheetName: '公司库',
      header: ['公司名', '行业', '官网', '城市', '状态', '投递数', '备注'],
      sample: ['字节跳动', '互联网', 'https://jobs.bytedance.com', '北京', '开放中', '2', '示例备注'],
    },
    interviews: {
      sheetName: '面试记录',
      header: ['公司', '岗位', '轮次', '面试时间', '时长(分钟)', '形式', '状态', '反馈', '备注'],
      sample: ['字节跳动', '前端开发工程师', '一面', '2026-05-20 14:00', '45', '视频', '待定', '表达清晰', '示例备注'],
    },
    resumes: {
      sheetName: '简历清单',
      header: ['版本名', '标签', '类型', '投递次数', '是否主推', '备注'],
      sample: ['通用版-v1', '通用', 'link', '0', '是', '示例备注'],
    },
  }

  const config = templateData[type]
  const rows: Record<string, string>[] = [
    Object.fromEntries(config.header.map((key) => [key, key])),
    Object.fromEntries(config.header.map((key, index) => [key, config.sample[index] ?? ''])),
  ]
  if (config.note) {
    rows.push(Object.fromEntries(config.header.map((key, index) => [key, config.note?.[index] ?? ''])))
  }

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows, { skipHeader: true })
  XLSX.utils.book_append_sheet(workbook, sheet, config.sheetName)

  const filename = `autumnhunt-template-${type}.xlsx`
  XLSX.writeFile(workbook, filename)
}

export type { TemplateType }
