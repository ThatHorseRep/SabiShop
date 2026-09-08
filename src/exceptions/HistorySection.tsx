import { useMemo, useState } from 'react'
import { EmptyState, Select } from '../ui'
import type { ExceptionsSnapshot } from './exceptionsController'
import type { HistoryEventKind } from './exceptionsController'
import { Panel, TimelineEntry, TimelineList } from './ExceptionsShared'

const kindOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All events' },
  { value: 'sale', label: 'Sales' },
  { value: 'sale_return', label: 'Sale returns' },
  { value: 'correction', label: 'Corrections' },
  { value: 'reversal', label: 'Reversals' },
  { value: 'supplier_return', label: 'Supplier returns' },
  { value: 'cash', label: 'Cash & reconciliation' },
  { value: 'authorization', label: 'Authorization decisions' },
]

const kindLabels: Record<HistoryEventKind, string> = {
  sale: 'Sale',
  sale_return: 'Sale return',
  correction: 'Correction',
  reversal: 'Reversal',
  supplier_return: 'Supplier return',
  cash: 'Cash',
  authorization: 'Authorization',
}

export function HistorySection({ snapshot }: { snapshot: ExceptionsSnapshot }) {
  const [kind, setKind] = useState('all')
  const [targetId, setTargetId] = useState('')

  const filtered = useMemo(() => {
    return snapshot.history.filter((event) => {
      if (kind !== 'all' && event.kind !== kind) return false
      if (targetId && event.targetId !== targetId) return false
      return true
    })
  }, [snapshot.history, kind, targetId])

  const targets = useMemo(() => {
    const ids = new Set(
      snapshot.history
        .map((event) => event.targetId)
        .filter((id): id is string => Boolean(id)),
    )
    return [...ids].sort()
  }, [snapshot.history])

  return (
    <div className="exceptions-section">
      <Panel
        title="Investigation & history"
        description="Human-readable audit history across sales, returns, corrections, reversals, supplier returns, cash, and authorization decisions. Current accepted state and historical events stay distinct."
        actions={
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            options={kindOptions}
            aria-label="Filter history by kind"
          />
        }
      >
        <div className="exceptions-search-row">
          <Select
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            options={targets.map((id) => ({
              value: id,
              label: `Record ${id}`,
            }))}
            placeholder="All records"
            aria-label="Filter history by record"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="No history for this filter"
            description="Change the filters to see other events. Historical evidence is never removed by corrections."
          />
        ) : (
          <TimelineList
            entries={filtered.map((event) => (
              <TimelineEntry
                key={event.id}
                at={event.at}
                title={`${event.title} · ${kindLabels[event.kind]}`}
                actor={`${event.actorId} (${event.actorRole})`}
                reason={event.reason}
                detail={event.detail}
              />
            ))}
          />
        )}
        <p className="ui-text-caption ui-text-secondary">
          {snapshot.auditEventCount} audit events preserved. Corrections,
          returns, reversals, and reconciliations append evidence; they never
          overwrite or delete it.
        </p>
      </Panel>
    </div>
  )
}
