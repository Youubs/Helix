import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-xs text-[var(--text-tertiary)] bg-[var(--bg-app)] select-none">
          <p className="font-semibold text-[var(--diff-del-text)] mb-1">An error occurred rendering this section.</p>
          <p className="font-mono text-[10px] text-[var(--text-tertiary)] max-w-sm truncate mb-2">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded text-[11px] border border-[var(--border-default)] transition-colors shadow-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
