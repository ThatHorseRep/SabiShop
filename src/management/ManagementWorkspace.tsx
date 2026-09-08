import { useEffect, useRef, useState } from 'react'
import { PermissionDeniedState } from '../ui/states'
import {
  ManagementController,
  managementActors,
  managementPeriodIds,
  type ManagementActorId,
  type ManagementPeriodId,
  type ResolutionArea,
} from './managementController'
import { OverviewSection } from './OverviewSection'
import { SalesSection } from './SalesSection'
import { MoneySection } from './MoneySection'
import { InventorySection } from './InventorySection'
import { CreditSuppliersSection } from './CreditSuppliersSection'
import { StaffSection } from './StaffSection'
import './management.css'

type WorkspaceTabId =
  'overview' | 'sales' | 'money' | 'inventory' | 'credit-suppliers' | 'staff'

type WorkspaceTab = {
  id: WorkspaceTabId
  label: string
}

const tabs: WorkspaceTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'money', label: 'Money & expenses' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'credit-suppliers', label: 'Credit & suppliers' },
  { id: 'staff', label: 'Staff & incentives' },
]

/**
 * The C01 Management destination: a decision surface over canonical
 * reporting and the verified domain engines. It is read-only by design —
 * investigation happens here, correction and resolution happen in the
 * owning workspaces (C01 sections 12, 25; C02 journeys 25, 31).
 */
export function ManagementWorkspace({
  actorId,
  onActorChange,
  onOpenArea,
}: {
  actorId: ManagementActorId
  onActorChange: (actorId: ManagementActorId) => void
  /**
   * Moves the user to the workspace that owns the correction/resolution.
   * The app shell supplies the navigation; the dashboard never mutates
   * business records.
   */
  onOpenArea?: (area: ResolutionArea) => void
}) {
  const controllerRef = useRef<ManagementController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new ManagementController()
    controllerRef.current.setActor(actorId)
  }
  const controller = controllerRef.current
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview')
  const [periodId, setPeriodId] = useState<ManagementPeriodId>('24h')
  const [, setVersion] = useState(0)

  useEffect(() => {
    controller.setActor(actorId)
    setVersion((current) => current + 1)
  }, [actorId, controller])

  const snapshot = controller.snapshot(periodId)

  const openArea = (area: ResolutionArea) => onOpenArea?.(area)

  const attentionCount = snapshot.attention.length
  const tabLabel = (tab: WorkspaceTab): string =>
    tab.id === 'overview' && attentionCount > 0
      ? `${tab.label} · ${attentionCount}`
      : tab.label

  return (
    <section className="management-app" aria-labelledby="management-title">
      <header className="management-header">
        <div>
          <h1 id="management-title">Management</h1>
          <p>
            Business decisions, not decoration: canonical performance, attention
            that needs a decision, and every number linked back to the records
            that explain it. Nothing is recalculated here.
          </p>
        </div>
        <div className="management-session">
          <label htmlFor="management-actor">Reference session</label>
          <select
            id="management-actor"
            value={actorId}
            onChange={(event) =>
              onActorChange(event.target.value as ManagementActorId)
            }
          >
            {managementActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.displayName} — {actor.role}
              </option>
            ))}
          </select>
          <p className="management-session-help">
            Management visibility requires the audit-read permission. Staff
            never see this area or its financial analysis.
          </p>
        </div>
      </header>

      {!snapshot.canView ? (
        <PermissionDeniedState message="Management dashboards are restricted to Manager and Owner roles with audit-read permission. Sign in with a management role to see business performance." />
      ) : (
        <>
          <div className="management-controls">
            <div className="management-period">
              <label htmlFor="management-period">Period</label>
              <select
                id="management-period"
                value={periodId}
                onChange={(event) =>
                  setPeriodId(event.target.value as ManagementPeriodId)
                }
              >
                {managementPeriodIds.map((id) => (
                  <option key={id} value={id}>
                    {periodLabel(id)}
                  </option>
                ))}
              </select>
            </div>
            <p className="management-period-note">
              {snapshot.period.description} Event-time basis{' '}
              {snapshot.period.from.slice(0, 10)} →{' '}
              {snapshot.period.to.slice(0, 10)}.
            </p>
          </div>

          <div
            className="management-tabs"
            role="tablist"
            aria-label="Management workspaces"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className="management-tab"
                onClick={() => setActiveTab(tab.id)}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            aria-label={
              tabs.find((tab) => tab.id === activeTab)?.label ?? 'Management'
            }
          >
            {activeTab === 'overview' && (
              <OverviewSection
                snapshot={snapshot}
                onOpenArea={openArea}
                onOpenTab={setActiveTab}
              />
            )}
            {activeTab === 'sales' && <SalesSection snapshot={snapshot} />}
            {activeTab === 'money' && (
              <MoneySection snapshot={snapshot} onOpenArea={openArea} />
            )}
            {activeTab === 'inventory' && (
              <InventorySection snapshot={snapshot} onOpenArea={openArea} />
            )}
            {activeTab === 'credit-suppliers' && (
              <CreditSuppliersSection
                snapshot={snapshot}
                onOpenArea={openArea}
              />
            )}
            {activeTab === 'staff' && <StaffSection snapshot={snapshot} />}
          </div>
        </>
      )}

      <footer className="management-footer">
        <p className="ui-text-caption ui-text-secondary">
          This dashboard is a read-only projection of accepted business events.
          Corrections, returns, reconciliation, and other resolutions are
          recorded in their owning workspaces with authorization, reasons, and
          history — never here.
        </p>
      </footer>
    </section>
  )
}

function periodLabel(id: ManagementPeriodId): string {
  switch (id) {
    case '24h':
      return 'Last 24 hours'
    case '7d':
      return 'Last 7 days'
    case '30d':
      return 'Last 30 days'
  }
}
