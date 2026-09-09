import { useEffect, useRef, useState } from 'react'
import {
  InventoryPurchasingController,
  inventoryActors,
  type InventoryActorId,
  type EventSourceView,
  type ReceiveInput,
  type ReplacementInput,
  type SupplierReturnInput,
} from './inventoryController'
import { formatMoney, formatQuantity } from './inventoryFormat'
import { OverviewSection } from './OverviewSection'
import { ProductSection } from './ProductSection'
import { StockSection } from './StockSection'
import { PurchasingSection } from './PurchasingSection'
import { HistorySection } from './HistorySection'
import { StatusChip } from './InventoryShared'
import './inventory.css'

type WorkspaceTab = 'overview' | 'products' | 'stock' | 'purchasing' | 'history'

type Feedback = {
  tone: 'success' | 'error'
  title: string
  message: string
}

type InventoryWorkspaceProps = {
  actorId: InventoryActorId
  onActorChange: (actorId: InventoryActorId) => void
  online: boolean
  pendingCount: number
  storageUnavailable: boolean
}

export function InventoryWorkspace({
  actorId,
  onActorChange,
  online,
  pendingCount,
  storageUnavailable,
}: InventoryWorkspaceProps) {
  const controllerRef = useRef<InventoryPurchasingController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new InventoryPurchasingController()
  }
  const controller = controllerRef.current
  const [, setVersion] = useState(0)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')
  const [selectedProductId, setSelectedProductId] = useState('prod-rice')
  const [focusPurchaseId, setFocusPurchaseId] = useState<string | null>(null)
  const [focusReturnId, setFocusReturnId] = useState<string | null>(null)
  const [historySource, setHistorySource] = useState<EventSourceView | null>(
    null,
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const snapshot = controller.snapshot()

  useEffect(() => {
    controller.setActor(actorId)
    setFeedback(null)
    setVersion((current) => current + 1)
  }, [actorId, controller])

  const refresh = () => setVersion((current) => current + 1)

  const openSource = (source: EventSourceView) => {
    setHistorySource(source)
    setActiveTab('history')
  }

  const runAction = async (
    title: string,
    action: () => Promise<string>,
  ): Promise<boolean> => {
    try {
      const message = await action()
      setFeedback({ tone: 'success', title, message })
      refresh()
      return true
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: `${title} did not complete`,
        message:
          error instanceof Error
            ? error.message
            : 'The operation failed before any business effect was confirmed.',
      })
      refresh()
      return false
    }
  }

  const canManagePurchasing =
    controller.can('supplier:manage') || controller.can('purchase:record')
  const tabs: [WorkspaceTab, string][] = [
    ['overview', 'Overview'],
    ['products', 'Products'],
    ['stock', 'Stock & investigation'],
    ...(canManagePurchasing
      ? ([['purchasing', 'Purchasing']] as [WorkspaceTab, string][])
      : []),
    ['history', 'History'],
  ]

  return (
    <section className="inventory-app" aria-labelledby="inventory-title">
      <header className="inventory-header">
        <div>
          <h1 id="inventory-title">Products &amp; Stock</h1>
          <p>
            Search products, understand stock, receive supplier stock, and trace
            every level to its source movement and correction.
          </p>
        </div>
        <div className="inventory-session">
          <label htmlFor="inventory-actor">Reference session</label>
          <select
            id="inventory-actor"
            className="inventory-select"
            value={actorId}
            onChange={(event) => {
              const nextActor = event.target.value as InventoryActorId
              controller.setActor(nextActor)
              onActorChange(nextActor)
              setFeedback(null)
              if (
                nextActor === 'staff' &&
                (activeTab === 'purchasing' || focusPurchaseId || focusReturnId)
              ) {
                setActiveTab('products')
                setFocusPurchaseId(null)
                setFocusReturnId(null)
              }
              refresh()
            }}
          >
            {inventoryActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.displayName} · {actor.role}
              </option>
            ))}
          </select>
          <p className="inventory-session-help">
            Reference adapter for this slice. The authoritative provider will
            replace it without changing the workflow. Navigation visibility is
            never authorization.
          </p>
        </div>
      </header>

      <div className="inventory-chip-row">
        <StatusChip
          tone={online ? 'success' : 'warning'}
          label={online ? 'Online' : 'Offline'}
        />
        <StatusChip
          tone={pendingCount > 0 ? 'warning' : 'neutral'}
          label={
            pendingCount > 0
              ? `Sync pending · ${pendingCount}`
              : 'Nothing waiting to sync'
          }
        />
        <StatusChip
          tone={storageUnavailable ? 'danger' : 'neutral'}
          label={
            storageUnavailable
              ? 'Local storage unavailable'
              : `Authorization decisions · ${snapshot.auditEventCount}`
          }
        />
        {snapshot.actor.role === 'staff' && (
          <StatusChip tone="neutral" label="Cost information hidden" />
        )}
      </div>

      {feedback && (
        <div
          className={`inventory-feedback ${feedback.tone}`}
          role="status"
          aria-live="polite"
        >
          <strong>{feedback.title}</strong>
          <p>{feedback.message}</p>
        </div>
      )}

      <div
        className="inventory-tabs"
        role="tablist"
        aria-label="Inventory areas"
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className="inventory-tab"
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewSection
          snapshot={snapshot}
          controller={controller}
          online={online}
          pendingCount={pendingCount}
          storageUnavailable={storageUnavailable}
          onOpenProduct={(productId) => {
            setSelectedProductId(productId)
            setActiveTab('products')
          }}
          onOpenSource={openSource}
          onOpenInvestigation={(productId) => {
            setSelectedProductId(productId)
            setActiveTab('stock')
          }}
          onOpenPurchase={(purchaseId) => {
            setFocusPurchaseId(purchaseId)
            setFocusReturnId(null)
            setActiveTab('purchasing')
          }}
          onOpenSupplierReturn={(returnId) => {
            setFocusReturnId(returnId)
            setFocusPurchaseId(null)
            setActiveTab('purchasing')
          }}
        />
      )}

      {activeTab === 'products' && (
        <ProductSection
          snapshot={snapshot}
          controller={controller}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          onOpenSource={openSource}
          onInvestigate={(productId) => {
            setSelectedProductId(productId)
            setActiveTab('stock')
          }}
          onOpenPurchase={(purchaseId) => {
            setFocusPurchaseId(purchaseId)
            setFocusReturnId(null)
            setActiveTab('purchasing')
          }}
        />
      )}

      {activeTab === 'stock' && (
        <StockSection
          snapshot={snapshot}
          controller={controller}
          selectedProductId={selectedProductId}
          online={online}
          onSelectProduct={setSelectedProductId}
          onOpenSource={openSource}
          onRecordCount={async (input) =>
            runAction('Stock count recorded', async () => {
              const investigation = await controller.recordStockCount(
                input,
                !online,
              )
              return `Investigation ${investigation.id} preserves system ${formatQuantity(
                investigation.systemQuantity,
              )}, physical ${formatQuantity(investigation.physicalQuantity)}, and variance ${formatQuantity(
                investigation.variance,
              )}. No stock was overwritten.`
            })
          }
          onApplyCorrection={async (investigationId, reason) =>
            runAction('Stock correction applied', async () => {
              const event = await controller.applyStockCorrection(
                investigationId,
                reason,
                !online,
              )
              return `Movement ${event.id} was appended with reason “${reason}”. The count and investigation remain part of history.`
            })
          }
        />
      )}

      {activeTab === 'purchasing' && canManagePurchasing && (
        <PurchasingSection
          snapshot={snapshot}
          controller={controller}
          online={online}
          focusPurchaseId={focusPurchaseId}
          focusReturnId={focusReturnId}
          onCreateSupplier={async (input) =>
            runAction('Supplier record created', async () => {
              const supplier = await controller.createSupplier(input, !online)
              return `${supplier.name} is available for receiving and supplier history.`
            })
          }
          onReceive={async (input: ReceiveInput) =>
            runAction('Receipt recorded', async () => {
              const result = await controller.receivePurchase(input, !online)
              const payable =
                result.purchase.total - (result.payment?.amount ?? 0n)
              return `Purchase ${result.purchase.id} recorded physical receipt. Stock increased and supplier payable is now ${formatMoney(
                payable,
              )}.`
            })
          }
          onRecordPayment={async (input) =>
            runAction('Supplier payment recorded', async () => {
              const payment = await controller.recordPayment(input, !online)
              return `Payment ${payment.id} was recorded as ${payment.state.replace(
                '_',
                ' ',
              )}.`
            })
          }
          onRequestReturn={async (input: SupplierReturnInput) =>
            runAction('Supplier return requested', async () => {
              const supplierReturn = await controller.requestSupplierReturn(
                input,
                !online,
              )
              return `Return ${supplierReturn.id} is linked to purchase ${supplierReturn.purchaseId}. Verification is required before approval.`
            })
          }
          onAdvanceReturn={async (returnId, action) =>
            runAction('Supplier return updated', async () => {
              const supplierReturn = await controller.advanceSupplierReturn(
                returnId,
                action,
                !online,
              )
              if (supplierReturn.state === 'applied')
                return `Return ${supplierReturn.id} is applied. Payable reduction ${formatMoney(
                  supplierReturn.unpaidPayableReduction,
                )}; supplier credit ${formatMoney(
                  supplierReturn.supplierCredit,
                )}. Stock movement is linked to the original receipt.`
              return `Return ${supplierReturn.id} is now ${supplierReturn.state}.`
            })
          }
          onRecordReplacement={async (input: ReplacementInput) =>
            runAction('Replacement receipt recorded', async () => {
              const supplierReturn = await controller.recordReplacement(
                input,
                !online,
              )
              return `Replacement stock was recorded as separate receipt movements on return ${supplierReturn.id}. The original return remains visible.`
            })
          }
          onSettleReturn={async (input) =>
            runAction('Supplier settlement recorded', async () => {
              const settlement = await controller.settleSupplierReturn(
                input,
                !online,
              )
              return `Settlement ${settlement.id} is ${settlement.state.replace(
                '_',
                ' ',
              )}. Only confirmed success changes the supplier balance.`
            })
          }
        />
      )}

      {activeTab === 'history' && (
        <HistorySection
          snapshot={snapshot}
          controller={controller}
          selectedProductId={selectedProductId}
          focusSource={historySource}
          onSelectSource={setHistorySource}
        />
      )}
    </section>
  )
}
