import { Octokit } from '@octokit/rest'
import type { FileInfo, GitHubUser } from '../types/github'

let octokit: Octokit | null = null
let currentLogin: string | null = null

function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function initOctokit(token: string) {
  octokit = new Octokit({ auth: token })
  currentLogin = null
  return octokit
}

function getClient() {
  if (!octokit) {
    throw new Error('GitHub 客户端未初始化，请先登录')
  }
  return octokit
}

async function getOwner() {
  if (currentLogin) return currentLogin
  const user = await getCurrentUser()
  currentLogin = user.login
  return currentLogin
}

export async function getCurrentUser(): Promise<GitHubUser> {
  const client = getClient()
  const { data } = await client.users.getAuthenticated()
  return {
    id: data.id,
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
    email: data.email,
  }
}

export async function ensureDataRepo(repoName: string): Promise<{ created: boolean }> {
  const client = getClient()
  const owner = await getOwner()

  try {
    await client.repos.get({ owner, repo: repoName })
    return { created: false }
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error && (error as { status?: number }).status === 404) {
      await client.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        auto_init: true,
        description: 'AutumnHunt personal data storage',
      })
      return { created: true }
    }
    throw error
  }
}

export async function readJsonFile<T>(repoName: string, path: string): Promise<{ data: T; sha: string }> {
  const client = getClient()
  const owner = await getOwner()

  const { data } = await client.repos.getContent({
    owner,
    repo: repoName,
    path,
  })

  if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
    throw new Error(`文件读取失败: ${path}`)
  }

  const raw = decodeBase64(data.content.replace(/\n/g, ''))
  return {
    data: JSON.parse(raw) as T,
    sha: data.sha,
  }
}

export async function writeJsonFile<T>(
  repoName: string,
  path: string,
  data: T,
  sha?: string,
  message = `chore(sync): update ${path}`,
): Promise<{ sha: string }> {
  const client = getClient()
  const owner = await getOwner()

  const encoded = encodeBase64(JSON.stringify(data, null, 2))

  const response = await client.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path,
    message,
    content: encoded,
    sha,
  })

  return {
    sha: response.data.content?.sha ?? '',
  }
}

export async function listFiles(repoName: string): Promise<FileInfo[]> {
  const client = getClient()
  const owner = await getOwner()
  const { data } = await client.repos.getContent({
    owner,
    repo: repoName,
    path: '',
  })

  if (!Array.isArray(data)) return []

  return data.map((item) => ({
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    type: item.type,
  }))
}
