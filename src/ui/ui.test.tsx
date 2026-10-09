// @ts-expect-error node:fs is available in vitest environment
import fs from 'node:fs'
// @ts-expect-error node:path is available in vitest environment
import path from 'node:path'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { CurrencyInput, Field, SearchInput, TextInput } from './inputs'
import { DataTable } from './Table'
import { DataList, ListItem } from './List'
import { Badge, Status } from './Status'
import { Alert, ToastStack } from './Feedback'
import { useToasts } from './useToasts'
import { Dialog, Drawer } from './Overlays'
import { ConfirmationPanel } from './Confirmation'
import { Progress } from './Loading'
import {
  AuthorizationRequiredState,
  CancelledState,
  CompletedState,
  CorrectionRequiredState,
  EmptyState,
  ErrorState,
  OfflineState,
  PermissionDeniedState,
  RejectedState,
  SyncConflictState,
  SyncPendingState,
} from './states'
import { Money } from './Money'
import { formatKobo } from './format'

describe('Button', () => {
  it('renders its label and variant class', () => {
    render(<Button variant="secondary">Save customer</Button>)
    const button = screen.getByRole('button', { name: 'Save customer' })
    expect(button).toHaveClass('ui-button--secondary')
  })

  it('blocks interaction and announces processing while loading', () => {
    render(<Button loading>Complete sale</Button>)
    const button = screen.getByRole('button', { name: /complete sale/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Field and inputs', () => {
  it('associates labels, hints, and errors with the control', () => {
    render(
      <Field
        label="Quantity"
        hint="Use the units the shop sells in."
        error="Quantity is required."
      >
        {({ id, describedBy, invalid }) => (
          <TextInput id={id} aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>,
    )
    const input = screen.getByLabelText('Quantity')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('error'),
    )
    expect(screen.getByText('Quantity is required.')).toBeInTheDocument()
  })

  it('shows explicit naira context on currency input', () => {
    render(<CurrencyInput aria-label="Amount paid" />)
    expect(screen.getByLabelText('Amount paid')).toBeInTheDocument()
    expect(screen.getByText('₦')).toBeInTheDocument()
  })

  it('renders a search input', () => {
    render(<SearchInput aria-label="Find product" />)
    expect(screen.getByLabelText('Find product')).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  const rows = [
    { id: 'S-1', customer: 'Chinedu Okafor', total: '₦85,000.00' },
    { id: 'S-2', customer: 'Amina Yusuf', total: '₦12,500.00' },
  ]
  const columns = [
    {
      key: 'id',
      header: 'Sale',
      mono: true,
      render: (r: (typeof rows)[number]) => r.id,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r: (typeof rows)[number]) => r.customer,
    },
    {
      key: 'total',
      header: 'Total',
      numeric: true,
      render: (r: (typeof rows)[number]) => r.total,
    },
  ]

  it('renders rows with numeric alignment and mono identifiers', () => {
    render(<DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />)
    expect(screen.getByText('Chinedu Okafor')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveClass(
      'numeric',
    )
  })

  it('shows the caller-provided empty state', () => {
    render(
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            title="No sales yet"
            description="Sales will appear here."
          />
        }
      />,
    )
    expect(screen.getByText('No sales yet')).toBeInTheDocument()
  })
})

describe('List', () => {
  it('renders compact record rows', () => {
    render(
      <DataList>
        <ListItem
          title="Amina Yusuf"
          meta="0803 555 0142"
          trailing={<Badge tone="pending">Awaiting approval</Badge>}
        />
      </DataList>,
    )
    expect(screen.getByText('Amina Yusuf')).toBeInTheDocument()
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument()
  })
})

describe('Status system', () => {
  it('renders label and description accessibly', () => {
    render(
      <Status
        tone="success"
        label="Completed"
        description="Payment confirmed"
      />,
    )
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Completed')
    expect(status).toHaveTextContent('Payment confirmed')
  })
})

describe('Alert', () => {
  it('uses alert semantics for danger content', () => {
    render(
      <Alert tone="danger" title="Payment not confirmed">
        The transfer could not be confirmed, so this sale has not been completed
        using that payment.
      </Alert>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Payment not confirmed')
  })
})

describe('Overlays', () => {
  it('renders a dialog only while open', () => {
    const { rerender } = render(
      <Dialog open={false} onClose={() => {}} title="Approve return">
        body
      </Dialog>,
    )
    expect(screen.queryByText('Approve return')).toBeNull()
    rerender(
      <Dialog open onClose={() => {}} title="Approve return">
        body
      </Dialog>,
    )
    expect(screen.getByText('Approve return')).toBeInTheDocument()
  })

  it('closes a dismissable drawer from its close control', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Drawer open onClose={onClose} title="Record history">
        body
      </Drawer>,
    )
    await user.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a dialog with native open state and ui-dialog class', () => {
    render(
      <Dialog open onClose={() => {}} title="Approve return">
        body
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Approve return' })
    expect(dialog).toHaveClass('ui-dialog')
    expect(dialog).toHaveAttribute('open')
  })

  it('renders a drawer with native open state and ui-drawer class', () => {
    render(
      <Drawer open onClose={() => {}} title="Record history">
        body
      </Drawer>,
    )
    const drawer = screen.getByRole('dialog', { name: 'Record history' })
    expect(drawer).toHaveClass('ui-drawer')
    expect(drawer).toHaveAttribute('open')
  })
})

describe('ConfirmationPanel', () => {
  it('shows effects and requires a reason before confirming', async () => {
    const user = userEvent.setup()
    function ConfirmationHarness() {
      const [reason, setReason] = useState('')
      return (
        <ConfirmationPanel
          action="Correct the payment amount for this sale."
          record="Sale S-1042 · total ₦85,000.00"
          effects={[
            'Payment record is corrected',
            'Cash reconciliation updates',
          ]}
          authorizationNote="Manager approval is recorded with the correction."
          reasonLabel="Reason for correction"
          reasonValue={reason}
          onReasonChange={setReason}
          confirmLabel="Confirm correction"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )
    }
    render(<ConfirmationHarness />)
    const confirm = screen.getByRole('button', {
      name: /confirm correction/i,
    })
    expect(confirm).toBeDisabled()
    await user.type(
      screen.getByLabelText('Reason for correction'),
      'Wrong amount entered',
    )
    expect(confirm).toBeEnabled()
  })
})

describe('State surfaces', () => {
  it('covers the canonical operational state vocabulary', () => {
    render(
      <div>
        <OfflineState />
        <SyncPendingState />
        <SyncConflictState />
        <CorrectionRequiredState description="The counted stock does not match the recorded stock." />
        <RejectedState />
        <CompletedState />
        <CancelledState />
        <ErrorState description="We could not load this record." />
        <PermissionDeniedState />
        <AuthorizationRequiredState />
      </div>,
    )
    for (const label of [
      'Offline',
      'Recorded · Waiting to sync',
      'Two versions need review',
      'Correction needed',
      'Rejected',
      'Completed',
      'Cancelled',
      'Something went wrong',
      'Permission denied',
      'Approval needed',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})

describe('Money', () => {
  it('formats integer kobo as naira', () => {
    expect(formatKobo(125000n)).toBe('1,250.00')
    expect(formatKobo(5n)).toBe('0.05')
    expect(formatKobo(0n)).toBe('0.00')
    expect(formatKobo(-250n)).toBe('-2.50')
    expect(formatKobo(123456789n)).toBe('1,234,567.89')
  })

  it('renders explicit currency context', () => {
    render(<Money amountKobo={125000n} />)
    expect(screen.getByText('₦1,250.00')).toBeInTheDocument()
  })
})

describe('Progress', () => {
  it('exposes progress semantics', () => {
    render(<Progress value={40} label="Uploading sync batch" />)
    const progress = screen.getByRole('progressbar', {
      name: 'Uploading sync batch',
    })
    expect(progress).toHaveAttribute('aria-valuenow', '40')
  })
})

describe('Toasts', () => {
  it('renders pushed toasts and supports dismissal', async () => {
    function ToastHarness() {
      const { toasts, push, dismiss } = useToasts()
      return (
        <div>
          <button
            type="button"
            onClick={() => push({ tone: 'success', title: 'Customer saved' })}
          >
            Save
          </button>
          <ToastStack toasts={toasts} onDismiss={dismiss} />
        </div>
      )
    }
    const user = userEvent.setup()
    render(<ToastHarness />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Customer saved')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    )
    expect(screen.queryByText('Customer saved')).toBeNull()
  })
})

describe('Motion and Transitions Design System', () => {
  const cwd =
    (globalThis as unknown as { process?: { cwd?: () => string } }).process?.cwd?.() ?? ''
  const tokensCss = fs.readFileSync(
    path.resolve(cwd, 'src/ui/tokens.css'),
    'utf-8',
  )
  const componentsCss = fs.readFileSync(
    path.resolve(cwd, 'src/ui/components.css'),
    'utf-8',
  )
  const baseCss = fs.readFileSync(
    path.resolve(cwd, 'src/ui/base.css'),
    'utf-8',
  )
  const posCss = fs.readFileSync(
    path.resolve(cwd, 'src/pos/pos.css'),
    'utf-8',
  )
  const exceptionsCss = fs.readFileSync(
    path.resolve(cwd, 'src/exceptions/exceptions.css'),
    'utf-8',
  )
  const customersCss = fs.readFileSync(
    path.resolve(cwd, 'src/customers/customers.css'),
    'utf-8',
  )

  it('defines transitions-dev motion tokens compliant with C03', () => {
    expect(tokensCss).toContain('--modal-open-dur: 200ms;')
    expect(tokensCss).toContain('--panel-open-dur: 320ms;')
    expect(tokensCss).toContain('--dropdown-open-dur: 140ms;')
    expect(tokensCss).toContain('--badge-pop-dur: 140ms;')
    expect(tokensCss).toContain('--ease-smooth-out:')
    expect(tokensCss).toContain('--ease-bounce:')
  })

  it('declares entrance animations for dialog and drawer overlays', () => {
    expect(componentsCss).toContain('dialog.ui-dialog[open]')
    expect(componentsCss).toContain(
      'animation: ui-dialog-in var(--modal-open-dur)',
    )
    expect(componentsCss).toContain('@keyframes ui-dialog-in')
    expect(componentsCss).toContain('dialog.ui-drawer[open]')
    expect(componentsCss).toContain(
      'animation: ui-drawer-in var(--panel-open-dur)',
    )
    expect(componentsCss).toContain('@keyframes ui-drawer-in')
    expect(componentsCss).toContain('@keyframes ui-drawer-in-mobile')
  })

  it('enforces strict prefers-reduced-motion overrides to suppress decorative motion', () => {
    expect(baseCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(baseCss).toContain('animation-duration: 0.01ms !important;')
    expect(componentsCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(componentsCss).toContain('dialog.ui-dialog[open]')
    expect(componentsCss).toContain('animation: none !important;')
    expect(componentsCss).toContain('transition: none !important;')
  })

  it('provides card resize and error shake utility classes', () => {
    expect(componentsCss).toContain('.t-resize')
    expect(componentsCss).toContain('.ui-card--expandable')
    expect(componentsCss).toContain('.ui-error-shake')
    expect(componentsCss).toContain('@keyframes ui-error-shake')
  })

  it('ensures input groups have visible focus indicators', () => {
    expect(componentsCss).toContain('.ui-input-group:focus-within')
    expect(componentsCss).toContain(
      'outline: var(--focus-outline) solid var(--focus-color);',
    )
  })

  it('enforces coarse pointer touch target expansion for buttons and inputs', () => {
    expect(componentsCss).toContain('@media (pointer: coarse)')
    expect(componentsCss).toContain('min-height: var(--touch-target);')

    expect(posCss).toContain('@media (pointer: coarse)')
    expect(posCss).toContain('.pos-line__qty .ui-icon-button')
    expect(posCss).toContain('.pos-line__price')

    expect(exceptionsCss).toContain('@media (pointer: coarse)')
    expect(exceptionsCss).toContain('.exceptions-qty-input')
    expect(exceptionsCss).toContain('min-height: var(--touch-target);')

    expect(customersCss).toContain('@media (pointer: coarse)')
    expect(customersCss).toContain('.customers-allocation-input')
    expect(customersCss).toContain('min-height: var(--touch-target);')
  })
})
