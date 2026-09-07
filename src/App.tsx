import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import type { SyncOperation } from './sync/offlineSync'
import { activateUpdate } from './pwa'
import { AppShell } from './shell/AppShell'
import { PageHeader } from './shell/PageHeader'
import { findDestination, navigationFor } from './shell/navigation'
import type { NavDestinationId } from './shell/navigation'
import { Alert } from './ui/Feedback'
import { Drawer } from './ui/Overlays'
import { Button } from './ui/Button'
import { Status } from './ui/Status'
import {
  AuthorizationRequiredState,
  EmptyState,
  OfflineState,
  SyncConflictState,
} from './ui/states'
import { AbandonSaleDialog } from './pos/PosDialogs'
import { PosScreen } from './pos/PosScreen'
import { createPosController, type PosController } from './pos/posController'
import {
  findActor,
  posActors,
  roleLabel,
  sessionForActor,
} from './pos/posSession'
import { InventoryWorkspace } from './inventory/InventoryWorkspace'

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
const actorStorageKey = 'sabi-shop:pos-actor'

function defaultActorId(): string {
  try {
    const stored = window.localStorage.getItem(actorStorageKey)
    if (stored && posActors.some((actor) => actor.id === stored)) return stored
  } catch {
    /* preference persistence is best-effort */
  }
  return posActors[0].id
}

function HomePage({
  online,
  pendingCount,
  storageUnavailable,
  update,
  onSell,
}: {
  online: boolean
  pendingCount: number
  storageUnavailable: boolean
  update: ServiceWorkerRegistration | null
  onSell: () => void
}) {
  return (
    <>
      <PageHeader
        title="Home"
        description="Daily overview, attention, and system state."
        actions={<Button onClick={onSell}>Start selling</Button>}
      />
      {!online && <OfflineState />}
      <section className="home-section" aria-labelledby="foundation-status">
        <h2 className="ui-text-h3" id="foundation-status">
          Foundation status
        </h2>
        <p className="ui-text-body ui-text-secondary">
          The application shell, design system, and POS selling workspace are in
          place. Further feature modules arrive behind explicit business and
          authorization boundaries.
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
        <AuthorizationRequiredState message="Selling currently runs on the reference session adapter. The authoritative provider will take over this boundary without changing the POS workflow." />
        <p className="ui-text-body-sm ui-text-secondary">
          Actions are authorized by active user, device, business membership,
          role, permission, operation state, and approval requirements on the
          service boundary.
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

function ModulePendingScreen({ area }: { area: NavDestinationId }) {
  const destination = findDestination(area)
  return (
    <>
      <PageHeader
        title={destination.label}
        description={destination.description}
      />
      <EmptyState
        title="Arrives in a later module"
        description="This area is specified in the corpus but its screen is built in a later module. Selling is available now from Sell."
      />
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
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)
  const [activeArea, setActiveArea] = useState<NavDestinationId>('home')
  const [actorId, setActorId] = useState(defaultActorId)
  const [posEpoch, setPosEpoch] = useState(0)
  const [abandonPromptOpen, setAbandonPromptOpen] = useState(false)
  const [saleState, setSaleState] = useState({
    dirty: false,
    itemCount: 0,
    totalKobo: 0,
  })
  const pendingNavigationRef = useRef<NavDestinationId | null>(null)

  const controllerRef = useRef<PosController | null>(null)
  if (!controllerRef.current) controllerRef.current = createPosController()
  const controller = controllerRef.current

  const session = useMemo(() => sessionForActor(findActor(actorId)), [actorId])
  const navigation = useMemo(
    () => navigationFor(session.permissions),
    [session],
  )

  const refreshOperations = useCallback(() => {
    setOperations(controller.listOperations())
  }, [controller])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onUpdate = (event: Event) =>
      setUpdate((event as CustomEvent<ServiceWorkerRegistration>).detail)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('sabi-shop:update', onUpdate)
    refreshOperations()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('sabi-shop:update', onUpdate)
    }
  }, [refreshOperations])

  useEffect(() => {
    try {
      window.localStorage.setItem(actorStorageKey, actorId)
    } catch {
      /* preference persistence is best-effort */
    }
  }, [actorId])

  const pending = operations.filter((operation) =>
    (pendingStates as readonly string[]).includes(operation.syncState),
  ).length
  const conflicts = operations.filter(
    (operation) => operation.syncState === 'CONFLICT',
  ).length
  const storageUnavailable = controller.storageUnavailable

  const handleNavigate = useCallback(
    (id: NavDestinationId) => {
      if (activeArea === 'sell' && id !== 'sell' && saleState.dirty) {
        pendingNavigationRef.current = id
        setAbandonPromptOpen(true)
        return
      }
      setActiveArea(id)
    },
    [activeArea, saleState.dirty],
  )

  return (
    <AppErrorBoundary>
      <AppShell
        navigation={navigation}
        activeArea={activeArea}
        onNavigate={handleNavigate}
        systemState={{
          online,
          pendingCount: pending,
          conflictCount: conflicts,
          storageUnavailable,
        }}
        onSystemStateActivate={() => setSystemPanelOpen(true)}
        attentionCount={conflicts}
        onAttentionActivate={() => setSystemPanelOpen(true)}
        businessName={session.businessName}
        user={{
          displayName: session.actor.displayName,
          roleLabel: roleLabel(session.actor.role),
        }}
      >
        {activeArea === 'sell' ? (
          <PosScreen
            key={posEpoch}
            controller={controller}
            session={session}
            online={online}
            onActorChange={setActorId}
            onOperationsChanged={refreshOperations}
            onSaleStateChange={setSaleState}
          />
        ) : activeArea === 'home' ? (
          <HomePage
            online={online}
            pendingCount={pending}
            storageUnavailable={storageUnavailable}
            update={update}
            onSell={() => setActiveArea('sell')}
          />
        ) : activeArea === 'products-inventory' ? (
          <InventoryWorkspace
            actorId={actorId}
            onActorChange={setActorId}
            online={online}
            pendingCount={pending}
            storageUnavailable={storageUnavailable}
          />
        ) : (
          <ModulePendingScreen area={activeArea} />
        )}
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
      <AbandonSaleDialog
        open={abandonPromptOpen}
        itemCount={saleState.itemCount}
        totalKobo={saleState.totalKobo}
        onContinue={() => {
          pendingNavigationRef.current = null
          setAbandonPromptOpen(false)
        }}
        onDiscard={() => {
          const target = pendingNavigationRef.current
          pendingNavigationRef.current = null
          setAbandonPromptOpen(false)
          setSaleState({ dirty: false, itemCount: 0, totalKobo: 0 })
          setPosEpoch((epoch) => epoch + 1)
          if (target) setActiveArea(target)
        }}
      />
    </AppErrorBoundary>
  )
}

export default App
