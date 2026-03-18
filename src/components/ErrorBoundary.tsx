import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import PageTitle from './atoms/PageTitle'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center"
      >
        <PageTitle>Something went wrong</PageTitle>
        <p className="text-text-secondary text-sm max-w-md">
          {this.state.error.message}
        </p>
        <button
          className="btn-primary"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </button>
      </div>
    )
  }
}
