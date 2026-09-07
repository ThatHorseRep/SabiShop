import { useEffect, useState } from 'react'
import {
  formatDateTime,
  formatMoney,
  formatQuantity,
  parseMoneyInput,
  parseQuantityInput,
} from './inventoryFormat'
import type {
  InventoryPurchasingController,
  InventorySnapshot,
  ReceiveInput,
  ReplacementInput,
  SupplierReturnInput,
} from './inventoryController'
import { Field, Panel, StateMessage, StatusChip } from './InventoryShared'

type ReceivingLineDraft = {
  key: string
  productId: string
  paidQuantity: string
  bonusQuantity: string
  unitCost: string
  discount: string
  condition: 'sellable' | 'held'
}

type ReturnLineDraft = {
  key: string
  productId: string
  quantity: string
}

type ReplacementLineDraft = {
  key: string
  productId: string
  quantity: string
  unitCost: string
}

type PurchasingSectionProps = {
  snapshot: InventorySnapshot
  controller: InventoryPurchasingController
  online: boolean
  focusPurchaseId: string | null
  focusReturnId: string | null
  onCreateSupplier: (input: {
    name: string
    phone?: string
    address?: string
    notes?: string
  }) => Promise<boolean>
  onReceive: (input: ReceiveInput) => Promise<boolean>
  onRecordPayment: (input: {
    purchaseId: string
    amount: bigint
    method: string
    reference: string | null
  }) => Promise<boolean>
  onRequestReturn: (input: SupplierReturnInput) => Promise<boolean>
  onAdvanceReturn: (
    returnId: string,
    action: 'verify' | 'approve' | 'apply',
  ) => Promise<boolean>
  onRecordReplacement: (input: ReplacementInput) => Promise<boolean>
  onSettleReturn: (input: {
    returnId: string
    amount: bigint
    method: string
    reference: string | null
    successful: boolean
  }) => Promise<boolean>
}

let draftKey = 0
const nextDraftKey = () => {
  draftKey += 1
  return `line-${draftKey}`
}

export function PurchasingSection({
  snapshot,
  controller,
  online,
  focusPurchaseId,
  focusReturnId,
  onCreateSupplier,
  onReceive,
  onRecordPayment,
  onRequestReturn,
  onAdvanceReturn,
  onRecordReplacement,
  onSettleReturn,
}: PurchasingSectionProps) {
  const [subtab, setSubtab] = useState<
    'suppliers' | 'receiving' | 'purchases' | 'returns'
  >(focusReturnId ? 'returns' : focusPurchaseId ? 'purchases' : 'suppliers')
  const [supplierName, setSupplierName] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [supplierNotes, setSupplierNotes] = useState('')
  const [receivingSupplierId, setReceivingSupplierId] = useState('')
  const [receivingLines, setReceivingLines] = useState<ReceivingLineDraft[]>([])
  const [paymentAmount, setPaymentAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(
    focusPurchaseId ?? snapshot.purchases[0]?.purchase.id ?? '',
  )
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState('')
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('transfer')
  const [purchasePaymentReference, setPurchasePaymentReference] = useState('')
  const [returnPurchaseId, setReturnPurchaseId] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [returnCondition, setReturnCondition] = useState<'sellable' | 'held'>(
    'held',
  )
  const [returnLines, setReturnLines] = useState<ReturnLineDraft[]>([])
  const [selectedReturnId, setSelectedReturnId] = useState(
    focusReturnId ?? snapshot.supplierReturns[0]?.supplierReturn.id ?? '',
  )
  const [replacementLines, setReplacementLines] = useState<
    ReplacementLineDraft[]
  >([])
  const [settlementAmount, setSettlementAmount] = useState('')
  const [settlementMethod, setSettlementMethod] = useState('transfer')
  const [settlementReference, setSettlementReference] = useState('')
  const [settlementSuccessful, setSettlementSuccessful] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (focusPurchaseId) {
      setSelectedPurchaseId(focusPurchaseId)
      setSubtab('purchases')
    }
  }, [focusPurchaseId])

  useEffect(() => {
    if (focusReturnId) {
      setSelectedReturnId(focusReturnId)
      setSubtab('returns')
    }
  }, [focusReturnId])

  useEffect(() => {
    if (!receivingSupplierId && snapshot.suppliers[0])
      setReceivingSupplierId(snapshot.suppliers[0].supplier.id)
    if (receivingLines.length === 0 && snapshot.products[0])
      setReceivingLines([
        {
          key: nextDraftKey(),
          productId: snapshot.products[0].product.id,
          paidQuantity: '',
          bonusQuantity: '0',
          unitCost: '',
          discount: '0',
          condition: 'sellable',
        },
      ])
  }, [
    receivingLines.length,
    receivingSupplierId,
    snapshot.products,
    snapshot.suppliers,
  ])

  const selectedPurchase = snapshot.purchases.find(
    (purchase) => purchase.purchase.id === selectedPurchaseId,
  )
  const selectedReturn = snapshot.supplierReturns.find(
    (returnView) => returnView.supplierReturn.id === selectedReturnId,
  )

  const receivingParsed = receivingLines.map((line) => ({
    line,
    paid: parseQuantityInput(line.paidQuantity),
    bonus: parseQuantityInput(line.bonusQuantity),
    unitCost: parseMoneyInput(line.unitCost),
    discount: parseMoneyInput(line.discount),
  }))
  const receivingTotal = receivingParsed.reduce((total, parsed) => {
    if (
      parsed.paid === null ||
      parsed.bonus === null ||
      parsed.unitCost === null ||
      parsed.discount === null
    )
      return total
    const paidCost = (parsed.paid * parsed.unitCost) / 1000n
    return total + paidCost - parsed.discount
  }, 0n)
  const paymentKobo = parseMoneyInput(paymentAmount) ?? 0n

  const submitReceiving = async () => {
    if (!receivingSupplierId) {
      setFormError('Choose the supplier that delivered the goods.')
      return
    }
    if (receivingParsed.length === 0) {
      setFormError('Add at least one received product.')
      return
    }
    if (
      receivingParsed.some(
        (parsed) =>
          parsed.paid === null ||
          parsed.bonus === null ||
          parsed.unitCost === null ||
          parsed.discount === null,
      )
    ) {
      setFormError('Check quantities, costs, and discounts before recording.')
      return
    }
    if (paymentKobo > receivingTotal) {
      setFormError(
        'Payment cannot exceed the acquisition value in this V1 flow.',
      )
      return
    }
    setFormError(null)
    const succeeded = await onReceive({
      supplierId: receivingSupplierId,
      lines: receivingParsed.map((parsed) => ({
        productId: parsed.line.productId,
        paidQuantity: parsed.paid!,
        bonusQuantity: parsed.bonus!,
        unitCost: parsed.unitCost!,
        discount: parsed.discount!,
        condition: parsed.line.condition,
      })),
      paymentAmount: paymentKobo,
      paymentMethod,
      paymentReference: paymentReference.trim() || null,
    })
    if (succeeded) {
      setReceivingLines((lines) =>
        lines.map((line) => ({
          ...line,
          paidQuantity: '',
          bonusQuantity: '0',
          unitCost: '',
          discount: '0',
        })),
      )
      setPaymentAmount('0')
      setPaymentReference('')
    }
  }

  return (
    <div className="inventory-section">
      <div
        className="inventory-subtabs"
        role="tablist"
        aria-label="Purchasing work"
      >
        {(
          [
            ['suppliers', 'Supplier records'],
            ['receiving', 'Receiving'],
            ['purchases', 'Purchases & payments'],
            ['returns', 'Supplier returns'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={subtab === id}
            className="inventory-tab"
            onClick={() => setSubtab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {!online && (
        <StateMessage tone="warning" title="Offline purchasing boundary">
          Receiving, supplier payments, returns, replacements, and settlements
          are visible offline, but the current authorization policy does not
          grant these management mutations while offline.
        </StateMessage>
      )}

      {subtab === 'suppliers' && (
        <div className="inventory-grid two">
          <Panel
            title="Supplier records"
            description="Management-owned relationships with live payable state."
          >
            <ul className="inventory-list">
              {snapshot.suppliers.map((supplier) => (
                <li
                  key={supplier.supplier.id}
                  className="inventory-timeline-item"
                >
                  <div className="inventory-panel-header">
                    <div>
                      <strong>{supplier.supplier.name}</strong>
                      <p className="inventory-row-subtitle">
                        {supplier.supplier.phone ?? 'No phone'} ·{' '}
                        {supplier.supplier.address ?? 'No address'}
                      </p>
                    </div>
                    <StatusChip
                      tone={supplier.outstanding > 0n ? 'warning' : 'success'}
                      label={
                        supplier.outstanding > 0n
                          ? `Payable ${formatMoney(supplier.outstanding)}`
                          : 'No payable'
                      }
                    />
                  </div>
                  <p className="inventory-row-subtitle">
                    {supplier.purchaseCount} purchase
                    {supplier.purchaseCount === 1 ? '' : 's'} ·{' '}
                    {supplier.productIds.length} product
                    {supplier.productIds.length === 1 ? '' : 's'} supplied
                  </p>
                  {supplier.supplier.notes && (
                    <p className="inventory-row-subtitle">
                      {supplier.supplier.notes}
                    </p>
                  )}
                </li>
              ))}
              {snapshot.suppliers.length === 0 && (
                <li className="inventory-state-message info">
                  <h3>No supplier records</h3>
                  <p>Create a supplier before recording received goods.</p>
                </li>
              )}
            </ul>
          </Panel>

          <Panel
            title="Create supplier record"
            description="Current supplier information never rewrites historical purchases."
          >
            <form
              className="inventory-form"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!supplierName.trim()) {
                  setFormError('Supplier name is required.')
                  return
                }
                const succeeded = await onCreateSupplier({
                  name: supplierName.trim(),
                  phone: supplierPhone.trim() || undefined,
                  address: supplierAddress.trim() || undefined,
                  notes: supplierNotes.trim() || undefined,
                })
                if (succeeded) {
                  setSupplierName('')
                  setSupplierPhone('')
                  setSupplierAddress('')
                  setSupplierNotes('')
                }
              }}
            >
              <Field label="Supplier name">
                <input
                  className="inventory-input"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                />
              </Field>
              <div className="inventory-form-row">
                <Field label="Phone">
                  <input
                    className="inventory-input"
                    value={supplierPhone}
                    onChange={(event) => setSupplierPhone(event.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className="inventory-input"
                    value={supplierAddress}
                    onChange={(event) => setSupplierAddress(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  className="inventory-textarea"
                  rows={3}
                  value={supplierNotes}
                  onChange={(event) => setSupplierNotes(event.target.value)}
                />
              </Field>
              <button type="submit" className="inventory-button">
                Create supplier record
              </button>
            </form>
          </Panel>
        </div>
      )}

      {subtab === 'receiving' && (
        <div className="inventory-grid">
          <Panel
            title="Record received goods"
            description="Inventory increases only when physical receipt is recorded."
          >
            <form
              className="inventory-form"
              onSubmit={(event) => {
                event.preventDefault()
                void submitReceiving()
              }}
            >
              <Field label="Supplier">
                <select
                  className="inventory-select"
                  value={receivingSupplierId}
                  onChange={(event) =>
                    setReceivingSupplierId(event.target.value)
                  }
                >
                  {snapshot.suppliers.map((supplier) => (
                    <option
                      key={supplier.supplier.id}
                      value={supplier.supplier.id}
                    >
                      {supplier.supplier.name}
                    </option>
                  ))}
                </select>
              </Field>

              {receivingLines.map((line, index) => {
                const parsed = receivingParsed[index]
                const preview =
                  parsed.paid !== null &&
                  parsed.bonus !== null &&
                  parsed.unitCost !== null &&
                  parsed.discount !== null
                    ? controller.effectiveCostPreview({
                        productId: line.productId,
                        paidQuantity: parsed.paid,
                        bonusQuantity: parsed.bonus,
                        unitCost: parsed.unitCost,
                        discount: parsed.discount,
                        condition: line.condition,
                      })
                    : null
                return (
                  <fieldset key={line.key} className="inventory-panel">
                    <legend>Received product {index + 1}</legend>
                    <div className="inventory-form-row">
                      <Field label="Product">
                        <select
                          className="inventory-select"
                          value={line.productId}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      productId: event.target.value,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        >
                          {snapshot.products.map((product) => (
                            <option
                              key={product.product.id}
                              value={product.product.id}
                            >
                              {product.product.name} · {product.product.sku}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Paid quantity">
                        <input
                          className="inventory-input"
                          inputMode="decimal"
                          value={line.paidQuantity}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      paidQuantity: event.target.value,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field
                        label="Bonus/free quantity"
                        help="Cost is allocated across total received quantity."
                      >
                        <input
                          className="inventory-input"
                          inputMode="decimal"
                          value={line.bonusQuantity}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      bonusQuantity: event.target.value,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                    <div className="inventory-form-row">
                      <Field label="Unit acquisition cost (₦)">
                        <input
                          className="inventory-input"
                          inputMode="decimal"
                          value={line.unitCost}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      unitCost: event.target.value,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Supplier discount (₦)">
                        <input
                          className="inventory-input"
                          inputMode="decimal"
                          value={line.discount}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      discount: event.target.value,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Stock condition">
                        <select
                          className="inventory-select"
                          value={line.condition}
                          onChange={(event) =>
                            setReceivingLines((lines) =>
                              lines.map((candidate) =>
                                candidate.key === line.key
                                  ? {
                                      ...candidate,
                                      condition: event.target.value as
                                        'sellable' | 'held',
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        >
                          <option value="sellable">Sellable</option>
                          <option value="held">Held / damaged</option>
                        </select>
                      </Field>
                    </div>
                    {preview && (
                      <div className="inventory-summary">
                        <div className="inventory-summary-row">
                          <span>Total quantity received</span>
                          <strong>
                            {formatQuantity(preview.totalQuantity)}
                          </strong>
                        </div>
                        <div className="inventory-summary-row">
                          <span>Effective unit cost</span>
                          <strong>
                            {formatMoney(preview.effectiveUnitCost)}
                          </strong>
                        </div>
                        <div className="inventory-summary-row">
                          <span>Acquisition value</span>
                          <strong>{formatMoney(preview.lineTotal)}</strong>
                        </div>
                      </div>
                    )}
                    <div className="inventory-actions">
                      <button
                        type="button"
                        className="inventory-button secondary small"
                        onClick={() =>
                          setReceivingLines((lines) => [
                            ...lines,
                            {
                              key: nextDraftKey(),
                              productId: snapshot.products[0]?.product.id ?? '',
                              paidQuantity: '',
                              bonusQuantity: '0',
                              unitCost: '',
                              discount: '0',
                              condition: 'sellable',
                            },
                          ])
                        }
                      >
                        Add product
                      </button>
                      {receivingLines.length > 1 && (
                        <button
                          type="button"
                          className="inventory-button danger small"
                          onClick={() =>
                            setReceivingLines((lines) =>
                              lines.filter(
                                (candidate) => candidate.key !== line.key,
                              ),
                            )
                          }
                        >
                          Remove product
                        </button>
                      )}
                    </div>
                  </fieldset>
                )
              })}

              <div className="inventory-form-row">
                <Field label="Amount paid now (₦)">
                  <input
                    className="inventory-input"
                    inputMode="decimal"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                  />
                </Field>
                <Field label="Payment method">
                  <select
                    className="inventory-select"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="transfer">Transfer</option>
                    <option value="pos">POS/card</option>
                  </select>
                </Field>
                <Field label="Payment reference">
                  <input
                    className="inventory-input"
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="inventory-summary">
                <div className="inventory-summary-row">
                  <span>Total acquisition value</span>
                  <strong>{formatMoney(receivingTotal)}</strong>
                </div>
                <div className="inventory-summary-row">
                  <span>Amount paid</span>
                  <strong>{formatMoney(paymentKobo)}</strong>
                </div>
                <div className="inventory-summary-row">
                  <span>Supplier payable created</span>
                  <strong>{formatMoney(receivingTotal - paymentKobo)}</strong>
                </div>
              </div>
              {formError && (
                <p className="inventory-field-error">{formError}</p>
              )}
              <button type="submit" className="inventory-button">
                Record receipt
              </button>
            </form>
          </Panel>
        </div>
      )}

      {subtab === 'purchases' && (
        <div className="inventory-split">
          <Panel
            title="Purchase and payment history"
            description="Receipt, liability, and each payment remain separate source records."
          >
            <ul className="inventory-list">
              {snapshot.purchases.map((purchase) => (
                <li
                  key={purchase.purchase.id}
                  className="inventory-timeline-item"
                >
                  <div className="inventory-panel-header">
                    <div>
                      <strong>{purchase.purchase.id}</strong>
                      <p className="inventory-row-subtitle">
                        {purchase.supplier?.name ?? 'Unknown supplier'} ·{' '}
                        {formatDateTime(purchase.purchase.receivedAt)}
                      </p>
                    </div>
                    <StatusChip
                      tone={purchase.outstanding === 0n ? 'success' : 'warning'}
                      label={
                        purchase.outstanding === 0n
                          ? 'Settled'
                          : `Payable ${formatMoney(purchase.outstanding)}`
                      }
                    />
                  </div>
                  <ul className="inventory-list">
                    {purchase.purchase.lines.map((line) => {
                      const product = snapshot.products.find(
                        (candidate) => candidate.product.id === line.productId,
                      )
                      return (
                        <li
                          key={line.receiptEventId}
                          className="inventory-row-subtitle"
                        >
                          {product?.product.name ?? line.productId} · received{' '}
                          {formatQuantity(line.quantity)}{' '}
                          {product?.product.unit} · {formatMoney(line.unitCost)}{' '}
                          per unit · movement {line.receiptEventId}
                        </li>
                      )
                    })}
                  </ul>
                  {purchase.payments.length > 0 && (
                    <div className="inventory-summary">
                      {purchase.payments.map((payment) => (
                        <div key={payment.id} className="inventory-summary-row">
                          <span>
                            {payment.method}
                            {payment.reference ? ` · ${payment.reference}` : ''}
                          </span>
                          <strong>{formatMoney(payment.amount)}</strong>
                        </div>
                      ))}
                      <div className="inventory-summary-row">
                        <span>Total paid</span>
                        <strong>{formatMoney(purchase.paid)}</strong>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Record supplier payment"
            description="Only a confirmed successful payment changes the payable."
          >
            <form
              className="inventory-form"
              onSubmit={async (event) => {
                event.preventDefault()
                const amount = parseMoneyInput(purchasePaymentAmount)
                if (!selectedPurchase) {
                  setFormError('Choose a purchase.')
                  return
                }
                if (amount === null || amount <= 0n) {
                  setFormError('Enter the successful payment amount.')
                  return
                }
                if (amount > selectedPurchase.outstanding) {
                  setFormError(
                    'This V1 payment flow cannot exceed the remaining payable.',
                  )
                  return
                }
                setFormError(null)
                const succeeded = await onRecordPayment({
                  purchaseId: selectedPurchase.purchase.id,
                  amount,
                  method: purchasePaymentMethod,
                  reference: purchasePaymentReference.trim() || null,
                })
                if (succeeded) {
                  setPurchasePaymentAmount('')
                  setPurchasePaymentReference('')
                }
              }}
            >
              <Field label="Purchase">
                <select
                  className="inventory-select"
                  value={selectedPurchaseId}
                  onChange={(event) =>
                    setSelectedPurchaseId(event.target.value)
                  }
                >
                  {snapshot.purchases.map((purchase) => (
                    <option
                      key={purchase.purchase.id}
                      value={purchase.purchase.id}
                    >
                      {purchase.purchase.id} · payable{' '}
                      {formatMoney(purchase.outstanding)}
                    </option>
                  ))}
                </select>
              </Field>
              {selectedPurchase && (
                <div className="inventory-summary">
                  <div className="inventory-summary-row">
                    <span>Acquisition value</span>
                    <strong>
                      {formatMoney(selectedPurchase.purchase.total)}
                    </strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Already paid</span>
                    <strong>{formatMoney(selectedPurchase.paid)}</strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Remaining payable</span>
                    <strong>{formatMoney(selectedPurchase.outstanding)}</strong>
                  </div>
                </div>
              )}
              <div className="inventory-form-row">
                <Field label="Successful amount (₦)">
                  <input
                    className="inventory-input"
                    inputMode="decimal"
                    value={purchasePaymentAmount}
                    onChange={(event) =>
                      setPurchasePaymentAmount(event.target.value)
                    }
                  />
                </Field>
                <Field label="Method">
                  <select
                    className="inventory-select"
                    value={purchasePaymentMethod}
                    onChange={(event) =>
                      setPurchasePaymentMethod(event.target.value)
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="transfer">Transfer</option>
                    <option value="pos">POS/card</option>
                  </select>
                </Field>
              </div>
              <Field label="Reference">
                <input
                  className="inventory-input"
                  value={purchasePaymentReference}
                  onChange={(event) =>
                    setPurchasePaymentReference(event.target.value)
                  }
                  placeholder="Transfer or receipt reference"
                />
              </Field>
              {formError && (
                <p className="inventory-field-error">{formError}</p>
              )}
              <button type="submit" className="inventory-button">
                Record supplier payment
              </button>
            </form>
          </Panel>
        </div>
      )}

      {subtab === 'returns' && (
        <div className="inventory-grid">
          <Panel
            title="Request supplier return"
            description="Goods received and goods later returned remain separate linked events."
          >
            <form
              className="inventory-form"
              onSubmit={async (event) => {
                event.preventDefault()
                const purchase = snapshot.purchases.find(
                  (candidate) => candidate.purchase.id === returnPurchaseId,
                )
                const lines = returnLines
                  .map((line) => ({
                    productId: line.productId,
                    quantity: parseQuantityInput(line.quantity),
                  }))
                  .filter((line) => line.quantity !== null)
                if (!purchase) {
                  setFormError('Choose the original purchase.')
                  return
                }
                if (lines.length === 0 || lines.length !== returnLines.length) {
                  setFormError(
                    'Enter a valid return quantity for each product.',
                  )
                  return
                }
                if (!returnReason.trim()) {
                  setFormError('A return reason is required.')
                  return
                }
                setFormError(null)
                const succeeded = await onRequestReturn({
                  purchaseId: purchase.purchase.id,
                  reason: returnReason.trim(),
                  condition: returnCondition,
                  lines: lines.map((line) => ({
                    productId: line.productId,
                    quantity: line.quantity!,
                  })),
                })
                if (succeeded) {
                  setReturnReason('')
                  setReturnLines([])
                }
              }}
            >
              <div className="inventory-form-row">
                <Field label="Original purchase">
                  <select
                    className="inventory-select"
                    value={returnPurchaseId}
                    onChange={(event) =>
                      setReturnPurchaseId(event.target.value)
                    }
                  >
                    <option value="">Choose purchase</option>
                    {snapshot.purchases.map((purchase) => (
                      <option
                        key={purchase.purchase.id}
                        value={purchase.purchase.id}
                      >
                        {purchase.purchase.id} · {purchase.supplier?.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Returned stock condition">
                  <select
                    className="inventory-select"
                    value={returnCondition}
                    onChange={(event) =>
                      setReturnCondition(
                        event.target.value as 'sellable' | 'held',
                      )
                    }
                  >
                    <option value="sellable">Sellable</option>
                    <option value="held">Held / damaged</option>
                  </select>
                </Field>
              </div>
              {returnLines.map((line, index) => {
                const purchase = snapshot.purchases.find(
                  (candidate) => candidate.purchase.id === returnPurchaseId,
                )
                const sourceLine = purchase?.purchase.lines.find(
                  (candidate) => candidate.productId === line.productId,
                )
                return (
                  <div key={line.key} className="inventory-form-row">
                    <Field label={`Product ${index + 1}`}>
                      <select
                        className="inventory-select"
                        value={line.productId}
                        onChange={(event) =>
                          setReturnLines((lines) =>
                            lines.map((candidate) =>
                              candidate.key === line.key
                                ? {
                                    ...candidate,
                                    productId: event.target.value,
                                  }
                                : candidate,
                            ),
                          )
                        }
                      >
                        {(purchase?.purchase.lines ?? []).map((candidate) => {
                          const product = snapshot.products.find(
                            (item) => item.product.id === candidate.productId,
                          )
                          return (
                            <option
                              key={candidate.productId}
                              value={candidate.productId}
                            >
                              {product?.product.name ?? candidate.productId}
                            </option>
                          )
                        })}
                      </select>
                    </Field>
                    <Field
                      label="Return quantity"
                      help={
                        sourceLine
                          ? `Received ${formatQuantity(sourceLine.quantity)}`
                          : 'Choose the original purchase first'
                      }
                    >
                      <input
                        className="inventory-input"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) =>
                          setReturnLines((lines) =>
                            lines.map((candidate) =>
                              candidate.key === line.key
                                ? { ...candidate, quantity: event.target.value }
                                : candidate,
                            ),
                          )
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      className="inventory-button danger small"
                      onClick={() =>
                        setReturnLines((lines) =>
                          lines.filter(
                            (candidate) => candidate.key !== line.key,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
              <div className="inventory-actions">
                <button
                  type="button"
                  className="inventory-button secondary small"
                  onClick={() => {
                    const purchase = snapshot.purchases.find(
                      (candidate) => candidate.purchase.id === returnPurchaseId,
                    )
                    setReturnLines((lines) => [
                      ...lines,
                      {
                        key: nextDraftKey(),
                        productId: purchase?.purchase.lines[0]?.productId ?? '',
                        quantity: '',
                      },
                    ])
                  }}
                >
                  Add return line
                </button>
              </div>
              <Field label="Reason">
                <input
                  className="inventory-input"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  placeholder="Why are these goods going back to the supplier?"
                />
              </Field>
              {formError && (
                <p className="inventory-field-error">{formError}</p>
              )}
              <button type="submit" className="inventory-button">
                Request supplier return
              </button>
            </form>
          </Panel>

          <Panel
            title="Supplier return workflow"
            description="Requested → verified → approved → applied → settled. Replacement and settlement are separate."
          >
            <Field label="Supplier return">
              <select
                className="inventory-select"
                value={selectedReturnId}
                onChange={(event) => setSelectedReturnId(event.target.value)}
              >
                {snapshot.supplierReturns.map((returnView) => (
                  <option
                    key={returnView.supplierReturn.id}
                    value={returnView.supplierReturn.id}
                  >
                    {returnView.supplierReturn.id} ·{' '}
                    {returnView.supplierReturn.state}
                  </option>
                ))}
              </select>
            </Field>

            {selectedReturn && (
              <div className="inventory-grid">
                <div className="inventory-summary">
                  <div className="inventory-summary-row">
                    <span>Supplier</span>
                    <strong>{selectedReturn.supplier?.name}</strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Original purchase</span>
                    <strong>{selectedReturn.supplierReturn.purchaseId}</strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Return value</span>
                    <strong>
                      {formatMoney(selectedReturn.supplierReturn.value)}
                    </strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>State</span>
                    <strong>
                      {selectedReturn.supplierReturn.state.replace('_', ' ')}
                    </strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Paid before return</span>
                    <strong>
                      {selectedReturn.supplierReturn.paidBeforeReturn
                        ? 'Yes'
                        : 'No'}
                    </strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Payable reduction</span>
                    <strong>
                      {formatMoney(
                        selectedReturn.supplierReturn.unpaidPayableReduction,
                      )}
                    </strong>
                  </div>
                  <div className="inventory-summary-row">
                    <span>Supplier credit / receivable</span>
                    <strong>
                      {formatMoney(
                        selectedReturn.supplierReturn.supplierCredit,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="inventory-actions">
                  {selectedReturn.supplierReturn.state === 'requested' && (
                    <button
                      type="button"
                      className="inventory-button secondary"
                      onClick={() =>
                        void onAdvanceReturn(
                          selectedReturn.supplierReturn.id,
                          'verify',
                        )
                      }
                    >
                      Verify return
                    </button>
                  )}
                  {selectedReturn.supplierReturn.state === 'verified' && (
                    <button
                      type="button"
                      className="inventory-button secondary"
                      onClick={() =>
                        void onAdvanceReturn(
                          selectedReturn.supplierReturn.id,
                          'approve',
                        )
                      }
                    >
                      Approve return
                    </button>
                  )}
                  {selectedReturn.supplierReturn.state === 'approved' && (
                    <button
                      type="button"
                      className="inventory-button"
                      onClick={() =>
                        void onAdvanceReturn(
                          selectedReturn.supplierReturn.id,
                          'apply',
                        )
                      }
                    >
                      Apply return and stock movement
                    </button>
                  )}
                </div>

                {selectedReturn.supplierReturn.state === 'applied' && (
                  <div className="inventory-grid two">
                    <form
                      className="inventory-form"
                      onSubmit={async (event) => {
                        event.preventDefault()
                        const lines = replacementLines
                          .map((line) => ({
                            productId: line.productId,
                            quantity: parseQuantityInput(line.quantity),
                            unitCost: parseMoneyInput(line.unitCost),
                          }))
                          .filter(
                            (line) =>
                              line.quantity !== null && line.unitCost !== null,
                          )
                        if (lines.length === 0) {
                          setFormError('Enter replacement quantity and cost.')
                          return
                        }
                        setFormError(null)
                        const succeeded = await onRecordReplacement({
                          returnId: selectedReturn.supplierReturn.id,
                          lines: lines.map((line) => ({
                            productId: line.productId,
                            quantity: line.quantity!,
                            unitCost: line.unitCost!,
                          })),
                        })
                        if (succeeded) setReplacementLines([])
                      }}
                    >
                      <h3>Record replacement goods</h3>
                      {replacementLines.map((line, index) => (
                        <div key={line.key} className="inventory-form-row">
                          <Field label={`Product ${index + 1}`}>
                            <select
                              className="inventory-select"
                              value={line.productId}
                              onChange={(event) =>
                                setReplacementLines((lines) =>
                                  lines.map((candidate) =>
                                    candidate.key === line.key
                                      ? {
                                          ...candidate,
                                          productId: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                            >
                              {snapshot.products.map((product) => (
                                <option
                                  key={product.product.id}
                                  value={product.product.id}
                                >
                                  {product.product.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Quantity">
                            <input
                              className="inventory-input"
                              inputMode="decimal"
                              value={line.quantity}
                              onChange={(event) =>
                                setReplacementLines((lines) =>
                                  lines.map((candidate) =>
                                    candidate.key === line.key
                                      ? {
                                          ...candidate,
                                          quantity: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                            />
                          </Field>
                          <Field label="Unit cost (₦)">
                            <input
                              className="inventory-input"
                              inputMode="decimal"
                              value={line.unitCost}
                              onChange={(event) =>
                                setReplacementLines((lines) =>
                                  lines.map((candidate) =>
                                    candidate.key === line.key
                                      ? {
                                          ...candidate,
                                          unitCost: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                            />
                          </Field>
                        </div>
                      ))}
                      <div className="inventory-actions">
                        <button
                          type="button"
                          className="inventory-button secondary small"
                          onClick={() =>
                            setReplacementLines((lines) => [
                              ...lines,
                              {
                                key: nextDraftKey(),
                                productId:
                                  selectedReturn.supplierReturn.lines[0]
                                    ?.productId ??
                                  snapshot.products[0]?.product.id ??
                                  '',
                                quantity: '',
                                unitCost: '',
                              },
                            ])
                          }
                        >
                          Add replacement line
                        </button>
                        <button type="submit" className="inventory-button">
                          Record replacement receipt
                        </button>
                      </div>
                    </form>

                    <form
                      className="inventory-form"
                      onSubmit={async (event) => {
                        event.preventDefault()
                        const amount = parseMoneyInput(settlementAmount)
                        if (amount === null || amount <= 0n) {
                          setFormError('Enter the settlement amount.')
                          return
                        }
                        setFormError(null)
                        const succeeded = await onSettleReturn({
                          returnId: selectedReturn.supplierReturn.id,
                          amount,
                          method: settlementMethod,
                          reference: settlementReference.trim() || null,
                          successful: settlementSuccessful,
                        })
                        if (succeeded) {
                          setSettlementAmount('')
                          setSettlementReference('')
                        }
                      }}
                    >
                      <h3>Settle supplier credit</h3>
                      <div className="inventory-form-row">
                        <Field label="Amount (₦)">
                          <input
                            className="inventory-input"
                            inputMode="decimal"
                            value={settlementAmount}
                            onChange={(event) =>
                              setSettlementAmount(event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Method">
                          <select
                            className="inventory-select"
                            value={settlementMethod}
                            onChange={(event) =>
                              setSettlementMethod(event.target.value)
                            }
                          >
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="credit_note">Credit note</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="Reference">
                        <input
                          className="inventory-input"
                          value={settlementReference}
                          onChange={(event) =>
                            setSettlementReference(event.target.value)
                          }
                        />
                      </Field>
                      <label className="inventory-checkbox">
                        <input
                          type="checkbox"
                          checked={settlementSuccessful}
                          onChange={(event) =>
                            setSettlementSuccessful(event.target.checked)
                          }
                        />
                        Settlement was confirmed successful
                      </label>
                      <button type="submit" className="inventory-button">
                        Record settlement outcome
                      </button>
                    </form>
                  </div>
                )}

                {selectedReturn.replacementEvents.length > 0 && (
                  <div className="inventory-summary">
                    <strong>Replacement receipts</strong>
                    {selectedReturn.replacementEvents.map((event) => (
                      <div key={event.id} className="inventory-summary-row">
                        <span>Movement {event.id}</span>
                        <strong>{formatQuantity(event.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {selectedReturn.settlements.length > 0 && (
                  <div className="inventory-summary">
                    <strong>Settlement history</strong>
                    {selectedReturn.settlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="inventory-summary-row"
                      >
                        <span>
                          {settlement.method} · {settlement.state}
                        </span>
                        <strong>{formatMoney(settlement.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
