import { Link } from 'react-router-dom'

export default function StartGoogle() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-cream/20 p-8 text-center">
      <h1 className="text-xl font-medium text-stone-700">Google 授权（即将上线）</h1>
      <p className="mt-3 max-w-md text-sm text-stone-500">
        我们会通过 Google OAuth 安全地获取你授权的 Gmail 只读权限，所有邮件解析在本地完成，不会上传任何邮件内容。
      </p>
      <Link to="/settings" className="mt-6 rounded bg-stone-200 px-4 py-2 text-stone-700 hover:bg-stone-300">
        返回设置
      </Link>
    </div>
  )
}
