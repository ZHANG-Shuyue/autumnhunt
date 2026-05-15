import {
  CORS_PROXY,
  FALLBACK_CORS_PROXY,
  GITHUB_CLIENT_ID,
  GITHUB_SCOPES,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
} from '../config/github'
import type { DeviceCodeResponse, DeviceTokenPending, DeviceTokenSuccess } from '../types/github'

const DEVICE_CODE_ENDPOINT = 'https://github.com/login/device/code'
const ACCESS_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'

function buildProxyUrls(url: string) {
  return [`${CORS_PROXY}/${url}`, `${FALLBACK_CORS_PROXY}${encodeURIComponent(url)}`]
}

async function postDeviceEndpoint<T>(url: string, body: URLSearchParams): Promise<T> {
  const candidates = buildProxyUrls(url)
  let lastError: unknown = null

  for (const endpoint of candidates) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      if (!response.ok) {
        throw new Error(`GitHub Device Flow 请求失败(${response.status})`)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('GitHub Device Flow 请求失败')
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  return postDeviceEndpoint<DeviceCodeResponse>(
    DEVICE_CODE_ENDPOINT,
    new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: GITHUB_SCOPES,
    }),
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function pollForToken(deviceCode: string, interval = POLL_INTERVAL_MS): Promise<string> {
  const startedAt = Date.now()
  let pollInterval = interval

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const result = await postDeviceEndpoint<DeviceTokenSuccess | DeviceTokenPending>(
      ACCESS_TOKEN_ENDPOINT,
      new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    )

    if ('access_token' in result && result.access_token) {
      return result.access_token
    }

    if (!('error' in result)) {
      throw new Error('授权失败，请重试')
    }

    if (result.error === 'authorization_pending') {
      await sleep(pollInterval)
      continue
    }

    if (result.error === 'slow_down') {
      pollInterval += 5000
      await sleep(pollInterval)
      continue
    }

    if (result.error === 'expired_token') {
      throw new Error('验证码已过期，请重新生成')
    }

    if (result.error === 'access_denied') {
      throw new Error('授权被拒绝，请重试')
    }

    throw new Error(result.error_description ?? result.error ?? '授权失败，请重试')
  }

  throw new Error('授权超时，请重新发起登录')
}

export async function revokeToken(_token: string): Promise<void> {
  return Promise.resolve()
}
