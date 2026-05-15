export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval: number
}

export interface DeviceTokenPending {
  error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | string
  error_description?: string
}

export interface DeviceTokenSuccess {
  access_token: string
  token_type: 'bearer' | string
  scope: string
}

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  email: string | null
}

export interface FileInfo {
  name: string
  path: string
  sha: string
  size: number
  type: string
}

export interface CloudDataEnvelope<T> {
  schemaVersion: number
  updatedAt: string
  deviceId: string
  data: T[]
}

export interface SyncLog {
  id: string
  time: string
  level: 'info' | 'success' | 'error'
  message: string
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

export interface SyncRuntimeStatus {
  enabled: boolean
  online: boolean
  pendingChanges: number
}
