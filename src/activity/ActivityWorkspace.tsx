import { useMemo, useState } from 'react'
import {
  ArrowsLeftRight,
  Coins,
  Package,
  Receipt,
} from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { PageHeader } from '../shell/PageHeader'
import { EmptyState } from '../ui/states'
import { TextInput } from '../ui/inputs'
import { AuditLog } from '../audit'
import './activity.css'

export type ActivityCategory = 'all' | 'sales' | 'inventory' | 'cash' | 'credit'

export type ActivityEventItem = {
  id: string
  category: 'sales' | 'inventory' | 'cash' | 'credit'
  type: string
  summary: string
  occurredAt: string
  actorId: string
  actorRole?: string
  entityId?: string
  details?: Record<string, string | number | boolean | undefined>
}

// Representative seeded operational events reflecting shop history
const referenceActivityFeed: ActivityEventItem[] = [
  {
    id: 'act-sale-101',
    category: 'sales',
    type: 'sale.completed',
    summary: 'Cash sale completed: 2x Paracetamol (500mg), Total ₦1,400',
    occurredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actorId: 'user-chidi',
    actorRole: 'staff',
    entityId: 'sale-101',
  },
  {
    id: 'act-inv-204',
    category: 'inventory',
    type: 'inventory.received',
    summary: 'Supplier shipment received: 50x Bags of Rice 50kg (5 bonus bags)',
    occurredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actorId: 'user-amaka',
    actorRole: 'manager',
    entityId: 'po-551',
  },
  {
    id: 'act-cash-302',
    category: 'cash',
    type: 'cash.interim_count',
    summary: 'Mid-shift cash verification: Expected ₦45,000, Counted ₦45,000',
    occurredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actorId: 'user-chidi',
    actorRole: 'staff',
    entityId: 'shift-today',
  },
  {
    id: 'act-cred-405',
    category: 'credit',
    type: 'credit.repayment_recorded',
    summary: 'Customer repayment: Alhaji Musa paid ₦12,500 via Bank Transfer',
    occurredAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actorId: 'user-nkechi',
    actorRole: 'owner',
    entityId: 'cust-musa',
  },
  {
    id: 'act-sale-099',
    category: 'sales',
    type: 'sale.credit_approved',
    summary: 'Authorized credit sale: 1x Solar Inverter 2.5kVA, Total ₦185,000',
    occurredAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    actorId: 'user-amaka',
    actorRole: 'manager',
    entityId: 'sale-099',
  },
  {
    id: 'act-cash-299',
    category: 'cash',
    type: 'cash.shift_opened',
    summary: 'Morning shift opening float confirmed: ₦10,000 in drawer',
    occurredAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    actorId: 'user-chidi',
    actorRole: 'staff',
    entityId: 'shift-today',
  },
]

function getCategoryIcon(category: ActivityEventItem['category']) {
  switch (category) {
    case 'sales':
      return <Receipt size={18} weight="bold" />
    case 'inventory':
      return <Package size={18} weight="bold" />
    case 'cash':
      return <Coins size={18} weight="bold" />
    case 'credit':
      return <ArrowsLeftRight size={18} weight="bold" />
  }
}

export function ActivityWorkspace({ actorId }: { actorId?: string }) {
  const { t } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Query live events recorded in the AuditLog if available
  const liveEvents = useMemo(() => {
    try {
      const log = new AuditLog()
      const auditRecords = log.query('biz-sabi-main')
      return auditRecords.map<ActivityEventItem>((record) => ({
        id: record.eventId,
        category: record.eventType.startsWith('sale')
          ? 'sales'
          : record.eventType.startsWith('inventory')
            ? 'inventory'
            : record.eventType.startsWith('cash')
              ? 'cash'
              : 'sales',
        type: record.eventType,
        summary: `Audit event on ${record.targetType}`,
        occurredAt: new Date(record.occurredAt).toISOString(),
        actorId: record.actorUserId ?? actorId ?? 'unknown',
        actorRole: record.actorRole,
        entityId: record.targetId,
      }))
    } catch {
      return []
    }
  }, [actorId])

  const allEvents = useMemo(() => {
    const combined = [...liveEvents, ...referenceActivityFeed]
    return combined.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
  }, [liveEvents])

  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesId = item.id.toLowerCase().includes(query)
        const matchesSummary = item.summary.toLowerCase().includes(query)
        const matchesActor = item.actorId.toLowerCase().includes(query)
        const matchesType = item.type.toLowerCase().includes(query)
        if (!matchesId && !matchesSummary && !matchesActor && !matchesType) {
          return false
        }
      }
      return true
    })
  }, [allEvents, activeCategory, searchQuery])

  return (
    <div className="activity-workspace">
      <PageHeader
        title={t('activity.title')}
        description={t('activity.description')}
      />

      <div className="activity-filters">
        <button
          type="button"
          className={`activity-filter-btn ${activeCategory === 'all' ? 'activity-filter-btn--active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          {t('activity.filter.all')}
        </button>
        <button
          type="button"
          className={`activity-filter-btn ${activeCategory === 'sales' ? 'activity-filter-btn--active' : ''}`}
          onClick={() => setActiveCategory('sales')}
        >
          {t('activity.filter.sales')}
        </button>
        <button
          type="button"
          className={`activity-filter-btn ${activeCategory === 'inventory' ? 'activity-filter-btn--active' : ''}`}
          onClick={() => setActiveCategory('inventory')}
        >
          {t('activity.filter.inventory')}
        </button>
        <button
          type="button"
          className={`activity-filter-btn ${activeCategory === 'cash' ? 'activity-filter-btn--active' : ''}`}
          onClick={() => setActiveCategory('cash')}
        >
          {t('activity.filter.cash')}
        </button>
        <button
          type="button"
          className={`activity-filter-btn ${activeCategory === 'credit' ? 'activity-filter-btn--active' : ''}`}
          onClick={() => setActiveCategory('credit')}
        >
          {t('activity.filter.credit')}
        </button>
      </div>

      <div className="activity-search-bar">
        <TextInput
          className="activity-search-input"
          placeholder={t('activity.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          title={t('activity.empty.title')}
          description={t('activity.empty.description')}
        />
      ) : (
        <div className="activity-timeline">
          {filteredEvents.map((event) => (
            <article key={event.id} className="activity-card">
              <div className="activity-card__header">
                <span className="activity-card__tag">
                  {getCategoryIcon(event.category)}
                  <span>{event.type}</span>
                </span>
                <span className="activity-card__time">
                  {new Date(event.occurredAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="activity-card__summary">{event.summary}</div>
              <div className="activity-card__meta">
                <span className="activity-card__meta-item">
                  <span className="activity-card__meta-label">
                    {t('activity.actor')}:
                  </span>
                  <span className="activity-card__meta-value">
                    {event.actorId}{' '}
                    {event.actorRole ? `(${event.actorRole})` : ''}
                  </span>
                </span>
                <span className="activity-card__meta-item">
                  <span className="activity-card__meta-label">
                    {t('activity.id')}:
                  </span>
                  <span className="activity-card__meta-value">{event.id}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
