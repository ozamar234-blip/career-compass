import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-heebo font-bold text-xl text-text mb-2">משהו השתבש</h2>
            <p className="text-text-muted text-sm mb-6">
              {this.state.error?.message || 'אירעה שגיאה לא צפויה'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-heebo font-bold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              נסה שוב
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
