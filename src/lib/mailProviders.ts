export interface MailProviderConfig {
  id: 'gmail' | 'outlook' | 'qq' | '163' | 'icloud' | 'custom'
  label: string
  imapHost: string
  imapPort: number
  guideUrl: string
  guideTitle: string
  guideSteps: string[]
  emailHint?: string
}

export const MAIL_PROVIDERS: MailProviderConfig[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    guideUrl: 'https://myaccount.google.com/apppasswords',
    guideTitle: 'Gmail 应用专用密码',
    guideSteps: [
      '确保已开启两步验证(必须):https://myaccount.google.com/security',
      '访问 https://myaccount.google.com/apppasswords',
      '应用名输入 AutumnHunt,点击「创建」',
      '复制弹窗显示的 16 位密码(无空格)粘贴到下方',
    ],
    emailHint: 'xxx@gmail.com',
  },
  {
    id: 'outlook',
    label: 'Outlook / Hotmail',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    guideUrl: 'https://account.microsoft.com/security',
    guideTitle: 'Outlook 应用密码',
    guideSteps: [
      '访问 https://account.microsoft.com/security',
      '点击「高级安全选项」',
      '在「应用密码」区域点击「创建新的应用密码」',
      '复制生成的密码粘贴到下方',
    ],
    emailHint: 'xxx@outlook.com / xxx@hotmail.com',
  },
  {
    id: 'qq',
    label: 'QQ 邮箱',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    guideUrl: 'https://mail.qq.com/cgi-bin/frame_html?sid=&r=&url=/cgi-bin/setting4',
    guideTitle: 'QQ 邮箱授权码',
    guideSteps: [
      '登录 QQ 邮箱网页版 → 设置 → 账户',
      '找到「IMAP/SMTP 服务」,点击「开启」(可能需要短信验证)',
      '获取的 16 位授权码即是这里要填的「应用密码」',
    ],
    emailHint: 'xxx@qq.com',
  },
  {
    id: '163',
    label: '163 / 126 邮箱',
    imapHost: 'imap.163.com',
    imapPort: 993,
    guideUrl: 'https://mail.163.com/',
    guideTitle: '163 邮箱授权码',
    guideSteps: [
      '登录 163 邮箱网页版 → 设置 → POP3/SMTP/IMAP',
      '开启 IMAP/SMTP 服务',
      '设置授权码并复制下来粘贴到下方',
    ],
    emailHint: 'xxx@163.com / xxx@126.com',
  },
  {
    id: 'icloud',
    label: 'iCloud',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    guideUrl: 'https://appleid.apple.com/account/manage',
    guideTitle: 'iCloud 应用专用密码',
    guideSteps: [
      '访问 https://appleid.apple.com/account/manage',
      '登录 → 登录与安全 → 应用专用密码',
      '点击「生成密码」,标签写 AutumnHunt',
      '复制生成的密码粘贴到下方',
    ],
    emailHint: 'xxx@icloud.com / xxx@me.com',
  },
  {
    id: 'custom',
    label: '自定义(其他 IMAP 服务)',
    imapHost: '',
    imapPort: 993,
    guideUrl: '',
    guideTitle: '',
    guideSteps: [],
  },
]

export function getProviderByEmail(email: string): MailProviderConfig['id'] {
  const lower = email.toLowerCase()
  if (lower.endsWith('@gmail.com')) return 'gmail'
  if (lower.endsWith('@outlook.com') || lower.endsWith('@hotmail.com') || lower.endsWith('@live.com')) return 'outlook'
  if (lower.endsWith('@qq.com')) return 'qq'
  if (lower.endsWith('@163.com') || lower.endsWith('@126.com')) return '163'
  if (lower.endsWith('@icloud.com') || lower.endsWith('@me.com')) return 'icloud'
  return 'custom'
}
