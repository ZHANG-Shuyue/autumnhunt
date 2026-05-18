import { AlertCircle, Check, Eye, EyeOff, Mail, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LLM_PRESETS } from '../../lib/llmPresets'
import { formatRelativeTime } from '../../lib/time'
import { testLLMConfig } from '../../services/llmClient'
import { useLLMConfigStore } from '../../store/useLLMConfigStore'
import type { LLMConfig } from '../../types'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'

interface TestState {
  loading: boolean
  ok?: boolean
  message?: string
}

function getStatusText(config?: LLMConfig) {
  if (!config) return '未配置 AI 模型，邮件解析等功能将不可用'
  const test = config.lastTestAt ? `${formatRelativeTime(config.lastTestAt)} ${config.lastTestOk ? '✓' : '✗'}` : '未测试'
  return `已配置 · ${config.model} · 上次测试 ${test}`
}

export default function LLMConfigCard() {
  const config = useLLMConfigStore((s) => s.config)
  const setConfig = useLLMConfigStore((s) => s.setConfig)
  const clearConfig = useLLMConfigStore((s) => s.clearConfig)
  const updateTestResult = useLLMConfigStore((s) => s.updateTestResult)

  const [open, setOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<TestState>({ loading: false })

  const [presetId, setPresetId] = useState(config?.presetId ?? 'custom')
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? '')
  const [model, setModel] = useState(config?.model ?? '')
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '')

  const selectedPreset = useMemo(
    () => LLM_PRESETS.find((item) => item.id === presetId) ?? LLM_PRESETS.find((item) => item.id === 'custom')!,
    [presetId],
  )

  const openDialog = () => {
    setPresetId(config?.presetId ?? 'custom')
    setBaseUrl(config?.baseUrl ?? '')
    setModel(config?.model ?? '')
    setApiKey(config?.apiKey ?? '')
    setTestState({ loading: false })
    setOpen(true)
  }

  const choosePreset = (id: string) => {
    const preset = LLM_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setPresetId(id)
    setBaseUrl(preset.baseUrl)
    setModel(preset.defaultModel)
  }

  const handleSave = () => {
    if (!baseUrl.trim() || !model.trim() || !apiKey.trim()) {
      toast.error('请完整填写 Base URL / Model / API Key')
      return
    }

    setConfig({
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
      presetId,
      savedAt: new Date().toISOString(),
      lastTestAt: config?.lastTestAt,
      lastTestOk: config?.lastTestOk,
      lastTestError: config?.lastTestError,
    })

    setOpen(false)
    toast.success('已保存')
  }

  const handleTest = async () => {
    if (!baseUrl.trim() || !model.trim() || !apiKey.trim()) {
      setTestState({ loading: false, ok: false, message: '请先填写完整配置' })
      return
    }

    const nextConfig: LLMConfig = {
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
      presetId,
      savedAt: config?.savedAt ?? new Date().toISOString(),
    }

    setTestState({ loading: true })
    const result = await testLLMConfig(nextConfig)
    if (result.ok) {
      setTestState({ loading: false, ok: true, message: `✓ 连接成功，模型回复：${result.reply}` })
      updateTestResult(true)
    } else {
      const msg = result.error ?? '测试失败'
      setTestState({ loading: false, ok: false, message: `✗ ${msg}` })
      updateTestResult(false, msg)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">AI 模型配置</h2>
        {config ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openDialog}>修改</Button>
            <Button size="sm" variant="ghost" onClick={() => clearConfig()}>移除</Button>
          </div>
        ) : (
          <Button size="sm" onClick={openDialog}>立即配置</Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-muted">
        <span className={`h-2 w-2 rounded-full ${config ? 'bg-emerald-400' : 'bg-amber-500'}`} />
        <span>{getStatusText(config)}</span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>配置 AI 模型</DialogTitle>
            <DialogDescription>使用你自己的 OpenAI 兼容 API Key</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {LLM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-xs ${presetId === preset.id ? 'border-stone-300 bg-stone-100 text-stone-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                  onClick={() => choosePreset(preset.id)}
                >
                  {preset.id === 'custom' ? '自定义' : preset.id === 'qwen' ? 'Qwen' : preset.id === 'deepseek' ? 'DeepSeek' : preset.id === 'moonshot' ? 'Moonshot' : preset.id === 'openai' ? 'OpenAI' : 'Claude'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-sm text-stone-600">Base URL</label>
                <Input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="OpenAI 兼容的 /v1 地址" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-600">Model</label>
                <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="如 qwen-turbo / gpt-4o-mini" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-600">API Key</label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-xxx"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label="切换 API Key 显示"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {selectedPreset.id !== 'custom' && selectedPreset.signupUrl && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                <p>
                  还没有 Key？
                  <a href={selectedPreset.signupUrl} target="_blank" rel="noreferrer" className="ml-1 underline underline-offset-2">
                    去 {selectedPreset.label} 注册 →
                  </a>
                </p>
                {selectedPreset.freeNote && <p className="mt-1">{selectedPreset.freeNote}</p>}
              </div>
            )}

            {selectedPreset.needsProxy && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700">
                ⚠️ Claude 浏览器直连可能受 CORS 限制，建议先用 Qwen/DeepSeek 测试，Claude 支持后续通过代理实现
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button variant="outline" onClick={() => void handleTest()} disabled={testState.loading}>
                {testState.loading ? '测试中...' : '测试连接'}
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>

            {testState.message && (
              <div className={`rounded-lg border p-2 text-xs ${testState.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                <span className="inline-flex items-center gap-1">
                  {testState.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {testState.message}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!config && (
        <div className="inline-flex items-center gap-2 text-xs text-stone-500">
          <AlertCircle className="h-3.5 w-3.5" />
          邮件解析、智能总结等功能依赖可用的 LLM 配置。
        </div>
      )}
      {config && (
        <div className="inline-flex items-center gap-2 text-xs text-stone-500">
          <Mail className="h-3.5 w-3.5" />
          Key 仅存本地浏览器，不会写入云同步。
        </div>
      )}
    </Card>
  )
}
