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
import { LanguageProvider, useLanguage } from './language'
import type { SyncOperation } from './sync/offlineSync'
import { activateUpdate } from './pwa'
import { AppShell } from './shell/AppShell'
import { PageHeader } from './shell/PageHeader'
import {
  useDestinationCopy,
  useNavigationFor,
  type NavDestinationId,
} from './shell/navigation'
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
import { CustomerCreditWorkspace } from './customers/CustomerCreditWorkspace'
import { ExceptionsWorkspace } from './exceptions/ExceptionsWorkspace'
import { ManagementWorkspace } from './management/ManagementWorkspace'
import { StaffWorkspace } from './staff/StaffWorkspace'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

function AppErrorState() {
  const { t } = useLanguage()
  return (
    <main className="app-workspace" role="alert">
      <section className="ui-state ui-state--danger">
        <h1 className="ui-state__title">{t('error.unhandled.title')}</h1>
        <p className="ui-state__description">
          {t('error.unhandled.description')}
        </p>
        <div className="ui-state__actions">
          <Button onClick={() => window.location.reload()}>
            {t('common.reload')}
          </Button>
        </div>
      </section>
    </main>
  )
}

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
      return <AppErrorState />
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
  onOpenManagement,
}: {
  online: boolean
  pendingCount: number
  storageUnavailable: boolean
  update: ServiceWorkerRegistration | null
  onSell: () => void
  onOpenManagement?: () => void
}) {
  const { t } = useLanguage()
  return (
    <>
      <PageHeader
        title={t('home.title')}
        description={t('home.description')}
        actions={
          <>
            {onOpenManagement && (
              <Button variant="secondary" onClick={onOpenManagement}>
                {t('home.openManagement')}
              </Button>
            )}
            <Button onClick={onSell}>{t('home.startSelling')}</Button>
          </>
        }
      />
      {!online && <OfflineState />}
      <section className="home-section" aria-labelledby="foundation-status">
        <h2 className="ui-text-h3" id="foundation-status">
          {t('home.foundationStatus')}
        </h2>
        <p className="ui-text-body ui-text-secondary">
          {t('home.foundationDescription')}
        </p>
        <div className="home-statuses">
          <Status
            tone="success"
            label={t('home.shellReady')}
            description={t('home.shellReadyDescription')}
          />
          <Status
            tone="offline"
            label={
              pendingCount > 0
                ? t('home.syncPendingCount', { count: pendingCount })
                : t('home.nothingWaiting')
            }
            description={
              pendingCount > 0
                ? t('home.recordedOnDevice')
                : t('home.noLocalOperations')
            }
          />
        </div>
      </section>
      <section className="home-section" aria-labelledby="access-status">
        <h2 className="ui-text-h3" id="access-status">
          {t('home.identityAndAccess')}
        </h2>
        <AuthorizationRequiredState message={t('home.referenceSession')} />
        <p className="ui-text-body-sm ui-text-secondary">
          {t('home.authorizationBoundary')}
        </p>
      </section>
      {update && (
        <Alert
          tone="info"
          title={t('home.updateAvailable')}
          action={
            <Button size="sm" onClick={() => activateUpdate(update)}>
              {t('home.updateNow')}
            </Button>
          }
        >
          {t('home.updateDescription')}
        </Alert>
      )}
      {storageUnavailable && (
        <Alert tone="warning" title={t('home.storageUnavailable')}>
          {t('home.storageUnavailableDescription')}
        </Alert>
      )}
    </>
  )
}

function ModulePendingScreen({ area }: { area: NavDestinationId }) {
  const { t } = useLanguage()
  const destination = useDestinationCopy(area)
  return (
    <>
      <PageHeader
        title={destination.label}
        description={destination.description}
      />
      <EmptyState
        title={t('home.arrivesLaterTitle')}
        description={t('home.arrivesLaterDescription')}
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
  const { t } = useLanguage()
  return (
    <div className="system-panel">
      {online ? (
        <Status
          tone="success"
          label={t('system.online')}
          description={t('system.connected')}
        />
      ) : (
        <OfflineState />
      )}
      {conflictCount > 0 && (
        <SyncConflictState description={t('system.conflictDescription')} />
      )}
      {pendingCount > 0 && (
        <Alert
          tone="pending"
          title={t('sync.pendingCount', { count: pendingCount })}
        >
          {t('system.pendingDescription')}
        </Alert>
      )}
      {storageUnavailable && (
        <Alert tone="warning" title={t('system.storageUnavailable')}>
          {t('home.storageUnavailableDescription')}
        </Alert>
      )}
      {online && pendingCount === 0 && conflictCount === 0 && (
        <p className="ui-text-body-sm ui-text-secondary">
          {t('system.allSynchronized')}
        </p>
      )}
    </div>
  )
}

function AppContent() {
  const { t } = useLanguage()
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
  const navigation = useNavigationFor(session.permissions)

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
          session.actor.role === 'staff' ? (
            <StaffWorkspace
              actorId={actorId}
              onActorChange={setActorId}
              onOpenArea={(area) => setActiveArea(area)}
              online={online}
              pendingCount={pending}
              conflictCount={conflicts}
              storageUnavailable={storageUnavailable}
              update={update}
              onOpenSystemState={() => setSystemPanelOpen(true)}
            />
          ) : (
            <HomePage
              online={online}
              pendingCount={pending}
              storageUnavailable={storageUnavailable}
              update={update}
              onSell={() => setActiveArea('sell')}
              onOpenManagement={
                session.permissions.has('audit:read')
                  ? () => setActiveArea('management')
                  : undefined
              }
            />
          )
        ) : activeArea === 'products-inventory' ? (
          <InventoryWorkspace
            actorId={actorId}
            onActorChange={setActorId}
            online={online}
            pendingCount={pending}
            storageUnavailable={storageUnavailable}
          />
        ) : activeArea === 'customers-credit' ? (
          <CustomerCreditWorkspace
            actorId={actorId}
            onActorChange={setActorId}
            online={online}
          />
        ) : activeArea === 'money' ? (
          <ExceptionsWorkspace actorId={actorId} onActorChange={setActorId} />
        ) : activeArea === 'management' ? (
          <ManagementWorkspace
            actorId={actorId}
            onActorChange={setActorId}
            onOpenArea={setActiveArea}
          />
        ) : (
          <ModulePendingScreen area={activeArea} />
        )}
      </AppShell>
      <Drawer
        open={systemPanelOpen}
        onClose={() => setSystemPanelOpen(false)}
        title={t('system.state')}
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

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
