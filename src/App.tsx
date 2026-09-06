import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { AuthorizationRequiredState } from './auth/AuthStates'
import { LocalStorageStore, type SyncOperation } from './sync/offlineSync'
import { activateUpdate } from './pwa'

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
  const [online, setOnline] = useState(() => navigator.onLine)
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null)
  const [operations, setOperations] = useState<SyncOperation[]>([])
  const [storageUnavailable, setStorageUnavailable] = useState(false)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onUpdate = (event: Event) =>
      setUpdate((event as CustomEvent<ServiceWorkerRegistration>).detail)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('sabi-shop:update', onUpdate)
    try {
      setOperations(new LocalStorageStore(window.localStorage).load())
    } catch {
      setStorageUnavailable(true)
    }
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('sabi-shop:update', onUpdate)
    }
  }, [])

  const pending = operations.filter((operation) =>
    ['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED', 'CONFLICT'].includes(
      operation.syncState,
    ),
  ).length

  return (
    <AppErrorBoundary>
      <main className="shell">
        <div className="connection-bar" role="status" aria-live="polite">
          <span
            className={online ? 'connection-dot online' : 'connection-dot'}
            aria-hidden="true"
          />
          {online ? 'Online' : 'Offline — local work remains available'}
          <span className="sync-status">
            {storageUnavailable
              ? 'Sync storage unavailable'
              : `${pending} sync item${pending === 1 ? '' : 's'} pending`}
          </span>
          {update && (
            <button
              type="button"
              className="update-button"
              onClick={() => activateUpdate(update)}
            >
              Update available
            </button>
          )}
        </div>
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
        <section className="status-card" aria-labelledby="authorization-status">
          <h2 id="authorization-status">Identity and access</h2>
          <AuthorizationRequiredState />
          <p>
            Actions will be authorized by active user, device, business
            membership, role, permission, operation state, and approval
            requirements on the service boundary.
          </p>
        </section>
      </main>
    </AppErrorBoundary>
  )
}

export default App
