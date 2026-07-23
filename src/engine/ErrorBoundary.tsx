import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050508',
            color: '#e5e5e0',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            padding: '32px',
            textAlign: 'center',
            zIndex: 10000,
          }}
        >
          <div>
            <div style={{ marginBottom: '12px', opacity: 0.6 }}>
              Something went wrong while rendering the scene.
            </div>
            <div
              style={{
                color: '#ef4444',
                fontSize: '12px',
                maxWidth: '600px',
                overflowWrap: 'break-word',
              }}
            >
              {this.state.error?.message ?? 'Unknown error'}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
