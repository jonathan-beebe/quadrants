import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import PageTitle from './atoms/PageTitle'
import Button from './atoms/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
      // h-svh rather than h-full: this fallback renders in two places — inside
      // <main>, and at the root wrapping <App> (main.tsx), where #root has no
      // definite height for a percentage to resolve against. svh is correct in
      // both, and matches the shell so the in-<main> case adds no scroll
      // (BUG-017).
      <div role="alert" className="flex flex-col items-center justify-center h-svh gap-4 p-8 text-center">
        <PageTitle>Something went wrong</PageTitle>
        <p className="text-text-secondary text-sm max-w-md">{this.state.error.message}</p>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </div>
    )
  }
}
