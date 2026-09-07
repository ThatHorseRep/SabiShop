import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { LocalStorageStore, type SyncOperation } from './sync/offlineSync'
import { activateUpdate } from './pwa'
import { AppShell } from './shell/AppShell'
import { PageHeader } from './shell/PageHeader'
import { navigationFor } from './shell/navigation'
import { Alert } from './ui/Feedback'
import { Drawer } from './ui/Overlays'
import { Button } from './ui/Button'
import { Status } from './ui/Status'
import {
  AuthorizationRequiredState,
  OfflineState,
  SyncConflictState,
} from './ui/states'

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
        <main className="app-workspace" role="alert">
          <section className="ui-state ui-state--danger">
            <h1 className="ui-state__title">Something went wrong</h1>
            <p className="ui-state__description">
              Reload the app and try again. Your data should not be treated as
              saved until the operation confirms.
            </p>
            <div className="ui-state__actions">
              <Button onClick={() => window.location.reload()}>
                Reload app
              </Button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

const pendingStates = ['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED'] as const

function HomePage({
  online,
  pendingCount,
  storageUnavailable,
  update,
}: {
  online: boolean
  pendingCount: number
  storageUnavailable: boolean
  update: ServiceWorkerRegistration | null
}) {
  return (
    <>
      <PageHeader
        title="Home"
        description="Daily overview, attention, and system state."
      />
      {!online && <OfflineState />}
      <section className="home-section" aria-labelledby="foundation-status">
        <h2 className="ui-text-h3" id="foundation-status">
          Foundation status
        </h2>
        <p className="ui-text-body ui-text-secondary">
          The application shell and design system are in place. Feature modules
          will be added behind explicit business and authorization boundaries.
        </p>
        <div className="home-statuses">
          <Status
            tone="success"
            label="Shell ready"
            description="Strict TypeScript checks and error recovery are active."
          />
          <Status
            tone="offline"
            label={
              pendingCount > 0
                ? `Sync pending · ${pendingCount}`
                : 'Nothing waiting to sync'
            }
            description={
              pendingCount > 0
                ? 'Recorded on this device.'
                : 'No local operations are waiting.'
            }
          />
        </div>
      </section>
      <section className="home-section" aria-labelledby="access-status">
        <h2 className="ui-text-h3" id="access-status">
          Identity and access
        </h2>
        <AuthorizationRequiredState />
        <p className="ui-text-body-sm ui-text-secondary">
          Actions will be authorized by active user, device, business
          membership, role, permission, operation state, and approval
          requirements on the service boundary.
        </p>
      </section>
      {update && (
        <Alert
          tone="info"
          title="Update available"
          action={
            <Button size="sm" onClick={() => activateUpdate(update)}>
              Update now
            </Button>
          }
        >
          A new version of Sabi Shop has been downloaded and is ready to use.
        </Alert>
      )}
      {storageUnavailable && (
        <Alert tone="warning" title="Sync storage unavailable">
          This browser is not saving local sync data. Work recorded here may not
          be recoverable after the app closes.
        </Alert>
      )}
    </>
  )
}

function SystemStatePanel({
  online,
  pendingCount,
  conflictCount,
  storageUnavailable,
}: {
  online: boolean
  pendingCount: number
  conflictCount: number
  storageUnavailable: boolean
}) {
  return (
    <div className="system-panel">
      {online ? (
        <Status tone="success" label="Online" description="Connected." />
      ) : (
        <OfflineState />
      )}
      {conflictCount > 0 && (
        <SyncConflictState description="One or more records changed in more than one place. An authorized person must review both versions before the accepted state is decided." />
      )}
      {pendingCount > 0 && (
        <Alert tone="pending" title={`Sync pending · ${pendingCount}`}>
          These operations were recorded on this device and will upload when
          synchronization is available.
        </Alert>
      )}
      {storageUnavailable && (
        <Alert tone="warning" title="Sync storage unavailable">
          This browser is not saving local sync data.
        </Alert>
      )}
      {online && pendingCount === 0 && conflictCount === 0 && (
        <p className="ui-text-body-sm ui-text-secondary">
          Everything recorded on this device is synchronized.
        </p>
      )}
    </div>
  )
}

function App() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null)
  const [operations, setOperations] = useState<SyncOperation[]>([])
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)

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
    (pendingStates as readonly string[]).includes(operation.syncState),
  ).length
  const conflicts = operations.filter(
    (operation) => operation.syncState === 'CONFLICT',
  ).length

  return (
    <AppErrorBoundary>
      <AppShell
        navigation={navigationFor(new Set())}
        activeArea="home"
        onNavigate={() => {
          /* only Home is visible before a session exists */
        }}
        systemState={{
          online,
          pendingCount: pending,
          conflictCount: conflicts,
          storageUnavailable,
        }}
        onSystemStateActivate={() => setSystemPanelOpen(true)}
        attentionCount={conflicts}
        onAttentionActivate={() => setSystemPanelOpen(true)}
        businessName={null}
        user={null}
      >
        <HomePage
          online={online}
          pendingCount={pending}
          storageUnavailable={storageUnavailable}
          update={update}
        />
      </AppShell>
      <Drawer
        open={systemPanelOpen}
        onClose={() => setSystemPanelOpen(false)}
        title="System state"
      >
        <SystemStatePanel
          online={online}
          pendingCount={pending}
          conflictCount={conflicts}
          storageUnavailable={storageUnavailable}
        />
      </Drawer>
    </AppErrorBoundary>
  )
}

export default App
