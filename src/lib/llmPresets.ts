export interface LLMPreset {
  id: string
  label: string
  baseUrl: string
  defaultModel: string
  signupUrl: string
  freeNote?: string
  needsProxy?: boolean
}

export const LLM_PRESETS: LLMPreset[] = [
  {
    id: 'qwen',
    label: '通义千问 Qwen（国内，免费额度大）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    signupUrl: 'https://dashscope.console.aliyun.com/',
    freeNote: '注册阿里云 → 开通 DashScope → 创建 API-KEY，每月 100 万 tokens 免费',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek（性价比极高）',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    signupUrl: 'https://platform.deepseek.com/api_keys',
    freeNote: '注册即送少量额度，按 token 计费，价格极低',
  },
  {
    id: 'moonshot',
    label: 'Moonshot Kimi（国内）',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    signupUrl: 'https://platform.moonshot.cn/console/api-keys',
    freeNote: '注册即送 15 元额度',
  },
  {
    id: 'openai',
    label: 'OpenAI（需海外网络）',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    signupUrl: 'https://platform.openai.com/api-keys',
    freeNote: '需绑卡，gpt-4o-mini 价格便宜',
  },
  {
    id: 'anthropic',
    label: 'Claude（需海外网络）',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-latest',
    signupUrl: 'https://console.anthropic.com/settings/keys',
    freeNote: '使用 Anthropic 官方 OpenAI 兼容端点',
    needsProxy: true,
  },
  {
    id: 'custom',
    label: '自定义（其他 OpenAI 兼容服务）',
    baseUrl: '',
    defaultModel: '',
    signupUrl: '',
    freeNote: '任何兼容 OpenAI /v1/chat/completions 协议的服务，例如 Groq / SiliconFlow / 本地 ollama',
  },
]
