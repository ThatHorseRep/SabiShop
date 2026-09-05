import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

class AppErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error', { error, info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="shell" role="alert">
          <p className="eyebrow">Sabi Shop</p>
          <h1>Something went wrong</h1>
          <p>
            Reload the app and try again. Your data should not be treated as
            saved until the operation confirms.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <main className="shell">
        <header className="hero">
          <p className="eyebrow">Sabi Shop</p>
          <h1>Shop operations, ready for the workday.</h1>
          <p className="lede">
            The foundation is in place. Feature modules will be added behind
            explicit business and authorization boundaries.
          </p>
        </header>
        <section className="status-card" aria-labelledby="foundation-status">
          <h2 id="foundation-status">Foundation status</h2>
          <p>
            Application shell is running locally with strict TypeScript checks
            and a testable error boundary.
          </p>
          <span className="status" role="status">
            Ready for domain modules
          </span>
        </section>
      </main>
    </AppErrorBoundary>
  )
}

export default App
