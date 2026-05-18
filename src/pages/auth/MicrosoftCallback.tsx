import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function MicrosoftCallback() {
  const [params] = useSearchParams()
  const code = params.get('code')
  const error = params.get('error')

  useEffect(() => {
    console.log('[MicrosoftCallback]', { code, error })
  }, [code, error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-cream/20 p-8 text-center">
      <h1 className="text-xl font-medium text-stone-700">Microsoft 授权回调</h1>
      <p className="mt-3 max-w-md text-sm text-stone-500">
        {error ? `授权失败：${error}` : code ? '授权成功（占位页面，等待 Worker 接入）' : '等待回调参数'}
      </p>
      <Link to="/settings" className="mt-6 rounded bg-stone-200 px-4 py-2 text-stone-700 hover:bg-stone-300">
        返回设置
      </Link>
    </div>
  )
}
