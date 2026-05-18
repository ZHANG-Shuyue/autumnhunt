import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-bg px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-card p-6 text-center shadow-soft">
            <h1 className="text-xl font-semibold text-neutral-text">页面出现异常</h1>
            <p className="mt-2 text-sm text-neutral-muted">抱歉，页面刚刚遇到问题。你可以返回首页或刷新页面后重试。</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-neutral-border px-4 text-sm text-neutral-text hover:bg-neutral-bg"
                onClick={() => {
                  window.location.href = '/'
                }}
              >
                返回首页
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary-cream px-4 text-sm text-neutral-text hover:bg-primary-cream/85"
                onClick={() => window.location.reload()}
              >
                刷新
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
