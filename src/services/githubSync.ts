import { Octokit } from '@octokit/rest'
import type { Application, CloudPayload, Company, Interview, Resume } from '../types'
import { useApplicationStore } from '../store/useApplicationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCompanyStore } from '../store/useCompanyStore'
import { useInterviewStore } from '../store/useInterviewStore'
import { useResumeStore } from '../store/useResumeStore'
import { useSyncStore } from '../store/useSyncStore'

const DATA_REPO = 'autumnhunt-data'
const DATA_PATH = 'data.json'

export class SyncConflictError extends Error {
  constructor(message = '云端数据发生冲突，请先处理后再同步') {
    super(message)
    this.name = 'SyncConflictError'
  }
}

function buildClient(token: string) {
  return new Octokit({ auth: token })
}

function encodeBase64(text: string) {
  return btoa(unescape(encodeURIComponent(text)))
}

function decodeBase64(text: string) {
  return decodeURIComponent(escape(atob(text)))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    let chunkBinary = ''
    chunk.forEach((byte) => {
      chunkBinary += String.fromCharCode(byte)
    })
    binary += chunkBinary
  }

  return btoa(binary)
}

function base64ToBlob(base64: string, type: string) {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new Blob([bytes], { type })
}

function getDeviceName() {
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser'

  const os = /Mac OS X/.test(ua)
    ? 'macOS'
    : /Windows/.test(ua)
      ? 'Windows'
      : /Linux/.test(ua)
        ? 'Linux'
        : /Android/.test(ua)
          ? 'Android'
          : /iPhone|iPad|iPod/.test(ua)
            ? 'iOS'
            : 'Unknown OS'

  return `${browser} on ${os}`
}

function buildCommitMessage() {
  return `chore: sync from ${getDeviceName()} at ${new Date().toISOString()}`
}

function buildPayload(
  companies: Company[],
  applications: Application[],
  interviews: Interview[],
  resumes: Resume[],
): CloudPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    device: getDeviceName(),
    companies,
    applications,
    interviews,
    resumes,
  }
}

export function buildLocalPayload(): CloudPayload {
  return buildPayload(
    useCompanyStore.getState().companies,
    useApplicationStore.getState().applications,
    useInterviewStore.getState().interviews,
    useResumeStore.getState().resumes,
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return fallback
}

export async function ensureRepo(token: string): Promise<{ owner: string; repo: string }> {
  const client = buildClient(token)
  const {
    data: { login },
  } = await client.users.getAuthenticated()

  try {
    await client.repos.get({ owner: login, repo: DATA_REPO })
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error && (error as { status?: number }).status === 404) {
      await client.repos.createForAuthenticatedUser({
        name: DATA_REPO,
        private: true,
        auto_init: true,
        description: 'AutumnHunt cloud data',
      })
    } else {
      throw error
    }
  }

  return { owner: login, repo: DATA_REPO }
}

export async function pullData(token: string): Promise<{ data: CloudPayload | null; sha: string | null }> {
  const client = buildClient(token)
  const { owner, repo } = await ensureRepo(token)

  try {
    const response = await client.repos.getContent({ owner, repo, path: DATA_PATH })
    const content = response.data

    if (Array.isArray(content) || content.type !== 'file' || !('content' in content)) {
      throw new Error('云端数据格式异常')
    }

    const json = decodeBase64(content.content.replace(/\n/g, ''))
    const parsed = JSON.parse(json) as Partial<CloudPayload>
    return {
      data: {
        version: 1,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
        device: parsed.device ?? 'Unknown Device',
        companies: parsed.companies ?? [],
        applications: parsed.applications ?? [],
        interviews: parsed.interviews ?? [],
        resumes: parsed.resumes ?? [],
      },
      sha: content.sha,
    }
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error && (error as { status?: number }).status === 404) {
      return { data: null, sha: null }
    }
    throw error
  }
}

export async function pushData(token: string, payload: CloudPayload, prevSha: string | null): Promise<{ sha: string }> {
  const client = buildClient(token)
  const { owner, repo } = await ensureRepo(token)

  try {
    const response = await client.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: DATA_PATH,
      message: buildCommitMessage(),
      content: encodeBase64(JSON.stringify(payload, null, 2)),
      sha: prevSha ?? undefined,
    })

    return {
      sha: response.data.content?.sha ?? '',
    }
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error) {
      const status = (error as { status?: number }).status
      if (status === 409 || status === 422) {
        throw new SyncConflictError()
      }
    }
    throw error
  }
}

export async function uploadResumeFile(token: string, id: string, file: File): Promise<{ filePath: string }> {
  const client = buildClient(token)
  const { owner, repo } = await ensureRepo(token)
  const filePath = `resumes/${id}.pdf`

  const buffer = await file.arrayBuffer()
  const content = arrayBufferToBase64(buffer)

  await client.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: `chore: upload resume ${id}`,
    content,
  })

  return { filePath }
}

export async function fetchResumeFile(token: string, filePath: string): Promise<Blob> {
  const client = buildClient(token)
  const { owner, repo } = await ensureRepo(token)

  const response = await client.repos.getContent({ owner, repo, path: filePath })
  const content = response.data

  if (Array.isArray(content) || content.type !== 'file' || !('content' in content)) {
    throw new Error('简历文件不存在')
  }

  return base64ToBlob(content.content.replace(/\n/g, ''), 'application/pdf')
}

export async function deleteResumeFile(token: string, filePath: string): Promise<void> {
  const client = buildClient(token)
  const { owner, repo } = await ensureRepo(token)

  try {
    const response = await client.repos.getContent({ owner, repo, path: filePath })
    const content = response.data
    if (Array.isArray(content) || content.type !== 'file') return

    await client.repos.deleteFile({
      owner,
      repo,
      path: filePath,
      message: `chore: delete resume ${encodeURIComponent(filePath)}`,
      sha: content.sha,
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error && (error as { status?: number }).status === 404) {
      return
    }
    throw error
  }
}

export async function syncPull(): Promise<void> {
  const syncStore = useSyncStore.getState()
  const token = useAuthStore.getState().token

  if (!token) {
    syncStore.setStatus('offline')
    return
  }

  syncStore.setStatus('syncing')

  try {
    await ensureRepo(token)
    const { data, sha } = await pullData(token)

    if (!data) {
      await syncPush()
      return
    }

    useCompanyStore.getState().replaceCompanies(data.companies)
    useApplicationStore.getState().replaceApplications(data.applications)
    useInterviewStore.getState().replaceInterviews(data.interviews)
    useResumeStore.getState().replaceResumes(data.resumes ?? [])

    syncStore.setLastSync(sha, new Date().toISOString())
    syncStore.setStatus('synced')
  } catch (error) {
    syncStore.setStatus('error', getErrorMessage(error, '拉取失败'))
  }
}

export async function syncPush(options?: { force?: boolean; throwOnError?: boolean }): Promise<void> {
  const syncStore = useSyncStore.getState()
  const token = useAuthStore.getState().token

  if (!token) {
    syncStore.setStatus('offline')
    return
  }

  syncStore.setStatus('syncing')

  try {
    await ensureRepo(token)

    const payload = buildLocalPayload()

    const { sha } = await pushData(token, payload, options?.force ? null : syncStore.lastSha)
    syncStore.setLastSync(sha, new Date().toISOString())
    syncStore.setStatus('synced')
  } catch (error) {
    if (error instanceof SyncConflictError) {
      syncStore.setStatus('conflict', error.message)
      if (options?.throwOnError) throw error
      return
    }

    syncStore.setStatus('error', getErrorMessage(error, '推送失败'))
    if (options?.throwOnError) throw error
  }
}
