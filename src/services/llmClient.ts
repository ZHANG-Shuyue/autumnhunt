import type { LLMConfig } from '../types'

const cleanBase = (base: string) => base.replace(/\/$/, '')

export async function testLLMConfig(cfg: LLMConfig): Promise<{ ok: boolean; reply?: string; error?: string }> {
  try {
    const res = await fetch(`${cleanBase(cfg.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: '说"pong"两个字' }],
        max_tokens: 20,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const json = await res.json()
    const reply = json?.choices?.[0]?.message?.content ?? '(no content)'
    return { ok: true, reply }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function callLLM(
  cfg: LLMConfig,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  opts?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<string> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.maxTokens ?? 1024,
  }

  if (opts?.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${cleanBase(cfg.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  return json?.choices?.[0]?.message?.content ?? ''
}
