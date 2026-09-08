import { useEffect, useRef, useState } from 'react'
import { activateUpdate } from '../pwa'
import { Alert, Button, Status } from '../ui'
import { PermissionDeniedState } from '../ui/states'
import {
  StaffController,
  staffActors,
  type StaffActorId,
  type StaffWorkArea,
} from './staffController'
import {
  ActivitySection,
  AttentionSection,
  CustomersSection,
  MoneySection,
  MySalesSection,
  PerformanceSection,
  StockSection,
  TodaySection,
} from './StaffSections'
import { StateChip } from './StaffShared'
import './staff.css'

/**
 * The C01 Staff Home surface: normal work first — selling, cash, stock,
 * customers, personal performance where permitted, actionable exceptions,
 * and honest sync state. It is read-only; mutations happen in the owning
 * workspaces with authorization and history (C01 sections 5.1, 16.1, 26).
 */
export function StaffWorkspace({
  actorId,
  onActorChange,
  onOpenArea,
  online,
  pendingCount,
  conflictCount,
  storageUnavailable,
  update,
  onOpenSystemState,
}: {
  actorId: StaffActorId
  onActorChange: (actorId: StaffActorId) => void
  /** Moves the user to the workspace that owns the work. */
  onOpenArea: (area: StaffWorkArea) => void
  online: boolean
  pendingCount: number
  conflictCount: number
  storageUnavailable: boolean
  update: ServiceWorkerRegistration | null
  onOpenSystemState: () => void
}) {
  const controllerRef = useRef<StaffController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new StaffController()
    controllerRef.current.setActor(actorId)
  }
  const controller = controllerRef.current
  const [, setVersion] = useState(0)

  useEffect(() => {
    controller.setActor(actorId)
    setVersion((current) => current + 1)
  }, [actorId, controller])

  const snapshot = controller.snapshot()

  const openArea = (area: StaffWorkArea) => onOpenArea(area)

  return (
    <section className="staff-app" aria-labelledby="staff-home-title">
      <div className="staff-header">
        <div>
          <h1 id="staff-home-title">Home</h1>
          <p>
            {snapshot.actor.displayName.split(' ')[0]}, here is your work today
            at {snapshot.businessName}: selling, cash, stock, customers, and
            anything that needs your action. Nothing on this page edits a
            record.
          </p>
        </div>
        <div className="staff-session">
          <label htmlFor="staff-actor">Reference session</label>
          <select
            id="staff-actor"
            value={actorId}
            onChange={(event) =>
              onActorChange(event.target.value as StaffActorId)
            }
          >
            {staffActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.displayName} — {actor.role}
              </option>
            ))}
          </select>
          <p className="staff-session-help">
            The staff dashboard is the staff Home surface. Management sessions
            use the Management destination for business analysis.
          </p>
        </div>
      </div>

      {!snapshot.permissions.includes('business:work') ? (
        <PermissionDeniedState message="Sign in with a staff membership in this business to see your work today." />
      ) : (
        <>
          <section className="staff-sync" aria-labelledby="staff-sync-title">
            <div className="staff-sync__head">
              <h2 id="staff-sync-title">Sync and device</h2>
              <Button variant="ghost" onClick={onOpenSystemState}>
                Open system state
              </Button>
            </div>
            <div className="staff-sync__statuses">
              {online ? (
                <Status
                  tone="success"
                  label="Online"
                  description="Connected."
                />
              ) : (
                <Status
                  tone="offline"
                  label="Offline"
                  description="Selling, repayments, and cash records keep working. They are saved on this device first."
                />
              )}
              {pendingCount > 0 && (
                <Status
                  tone="pending"
                  label={`Sync pending · ${pendingCount}`}
                  description="Recorded on this device; uploads when synchronization is available."
                />
              )}
              {conflictCount > 0 && (
                <Status
                  tone="conflict"
                  label={`Sync conflict · ${conflictCount}`}
                  description="A record changed in more than one place. Management reviews both versions; your local work is preserved."
                />
              )}
              {online && pendingCount === 0 && conflictCount === 0 && (
                <Status
                  tone="neutral"
                  label="Nothing waiting to sync"
                  description="Everything recorded on this device is synchronized."
                />
              )}
            </div>
            <p className="ui-text-caption ui-text-secondary">
              Offline is a mode of operation, not a failure. Authorization rules
              do not change when the connection does.
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
              A new version of Sabi Shop has been downloaded and is ready to
              use.
            </Alert>
          )}
          {storageUnavailable && (
            <Alert tone="warning" title="Sync storage unavailable">
              This browser is not saving local sync data. Work recorded here may
              not be recoverable after the app closes.
            </Alert>
          )}

          <div className="staff-grid">
            <div className="staff-grid__main">
              <TodaySection snapshot={snapshot} onOpenArea={openArea} />
              <MySalesSection snapshot={snapshot} />
              <MoneySection snapshot={snapshot} onOpenArea={openArea} />
            </div>
            <div className="staff-grid__side">
              <AttentionSection
                items={snapshot.attention}
                onOpenArea={openArea}
              />
              <PerformanceSection snapshot={snapshot} />
              <StockSection
                products={snapshot.stock.products}
                attentionCount={snapshot.stock.attentionCount}
                search={(query) => controller.searchProducts(query)}
                onOpenArea={openArea}
              />
              <CustomersSection snapshot={snapshot} onOpenArea={openArea} />
              <ActivitySection activity={snapshot.activity} />
            </div>
          </div>
        </>
      )}

      <footer className="staff-footer">
        <p className="ui-text-caption ui-text-secondary">
          <StateChip tone="info" label="Read-only surface" /> This dashboard
          never edits business records. Sales, cash movements, counting,
          returns, and corrections happen in their owning workspaces with
          authorization, reasons, and preserved history.
        </p>
      </footer>
    </section>
  )
}
