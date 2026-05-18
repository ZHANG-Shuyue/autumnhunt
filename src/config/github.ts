export const GITHUB_CLIENT_ID = 'Ov23lihTe124binImx3m'
export const GITHUB_SCOPES = 'repo'
export const DEFAULT_DATA_REPO = 'autumnhunt-data'
export const CORS_PROXY = 'https://cors.isomorphic-git.org'
export const FALLBACK_CORS_PROXY = 'https://corsproxy.io/?url='
export const POLL_INTERVAL_MS = 5000
export const POLL_TIMEOUT_MS = 15 * 60 * 1000

export const DATA_FILES = {
  companies: 'companies.json',
  applications: 'applications.json',
  interviews: 'interviews.json',
  events: 'events.json',
} as const

export type SyncStoreKey = keyof typeof DATA_FILES

export const STORE_KEYS = {
  companies: 'autumnhunt-companies',
  applications: 'autumnhunt-applications',
  interviews: 'autumnhunt-interviews',
  resumes: 'autumnhunt-resumes',
  calendar: 'autumnhunt-calendar',
  auth: 'autumnhunt-auth',
  sync: 'autumnhunt-sync',
} as const
