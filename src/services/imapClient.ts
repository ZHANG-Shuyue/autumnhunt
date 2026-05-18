import type { MailAccount } from '../types'

const WORKER_BASE = 'https://autumnhunt-proxy.sz125.workers.dev'

export interface ImapTestResult {
  ok: boolean
  recentCount?: number
  error?: string
}

export async function testMailAccount(acc: Pick<MailAccount, 'email' | 'appPassword' | 'imapHost' | 'imapPort'>): Promise<ImapTestResult> {
  try {
    const res = await fetch(`${WORKER_BASE}/imap/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: acc.email,
        password: acc.appPassword,
        host: acc.imapHost,
        port: acc.imapPort ?? 993,
      }),
    })
    const json = (await res.json()) as { ok?: boolean; recentCount?: number; error?: string }
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error ?? `HTTP ${res.status}` }
    }
    return { ok: true, recentCount: json.recentCount }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
