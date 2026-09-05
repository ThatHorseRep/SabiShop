import { describe, expect, it } from 'vitest'
import {
  IllegalTransitionError,
  canApprove,
  canCompleteSale,
  expectedCash,
  inventoryMovementQuantity,
  transition,
} from './stateMachines'

describe('canonical domain state machines', () => {
  it('requires confirmed payment and authority before sale completion', () => {
    expect(
      canCompleteSale({
        hasItems: true,
        hasConfirmedPayment: false,
        authorization: 'not_required',
      }),
    ).toBe(false)
    expect(
      canCompleteSale({
        hasItems: true,
        hasConfirmedPayment: true,
        authorization: 'approved',
      }),
    ).toBe(true)
  })

  it('does not allow completed sales to return to draft or be deleted', () => {
    expect(() => transition('sale', 'completed', 'complete')).toThrow(
      IllegalTransitionError,
    )
    expect(() => transition('sale', 'completed', 'begin_completion')).toThrow(
      IllegalTransitionError,
    )
  })

  it('requires a verified purchase and approval before applying a return', () => {
    expect(transition('return', 'requested', 'verify')).toBe('verified')
    expect(transition('return', 'verified', 'approve')).toBe('approved')
    expect(transition('return', 'approved', 'apply')).toBe('applied')
    expect(() => transition('return', 'requested', 'apply')).toThrow(
      IllegalTransitionError,
    )
  })

  it('keeps payment attempts distinct from confirmed success', () => {
    expect(transition('payment', 'initiated', 'start')).toBe('pending')
    expect(transition('payment', 'pending', 'fail')).toBe('failed')
    expect(() => transition('payment', 'pending', 'complete')).toThrow(
      IllegalTransitionError,
    )
  })

  it('enforces independent approval for consequential actions', () => {
    expect(canApprove('staff', 'manager', 'staff-1', 'manager-1')).toBe(true)
    expect(canApprove('manager', 'manager', 'manager-1', 'manager-1')).toBe(
      false,
    )
    expect(canApprove('staff', 'staff', 'staff-1', 'staff-2')).toBe(false)
  })

  it('preserves movement evidence and permits visible negative stock upstream', () => {
    expect(inventoryMovementQuantity(-3)).toBe(-3)
    expect(() => inventoryMovementQuantity(0)).toThrow()
    expect(() => inventoryMovementQuantity(1.5)).toThrow()
  })

  it('derives physical cash only from cash-affecting events', () => {
    expect(
      expectedCash({
        confirmedOpeningCash: 10_000,
        cashSales: 5_000,
        cashIn: 2_000,
        cashOut: 1_500,
        cashRefunds: 500,
      }),
    ).toBe(15_000)
  })

  it('keeps synchronization state separate and retryable', () => {
    expect(transition('sync', 'local_only', 'queue_sync')).toBe('pending_sync')
    expect(transition('sync', 'pending_sync', 'retry')).toBe('pending_sync')
    expect(transition('sync', 'pending_sync', 'accept')).toBe('accepted')
    expect(() => transition('sync', 'accepted', 'retry')).toThrow(
      IllegalTransitionError,
    )
  })
})
