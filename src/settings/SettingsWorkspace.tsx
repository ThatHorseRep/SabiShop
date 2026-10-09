import { useState } from 'react'
import {
  Cpu,
  Globe,
  Receipt,
  Storefront,
  User,
} from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { PageHeader } from '../shell/PageHeader'
import { Button } from '../ui/Button'
import { findActor, posActors } from '../pos/posSession'
import './settings.css'

export type SettingsWorkspaceProps = {
  actorId?: string
  online?: boolean
  pendingCount?: number
  conflictCount?: number
  onCheckUpdate?: () => void
}

export function SettingsWorkspace({
  actorId = 'user-chidi',
  online = true,
  pendingCount = 0,
  conflictCount = 0,
  onCheckUpdate,
}: SettingsWorkspaceProps) {
  const { t } = useLanguage()
  const activeActor = findActor(actorId) ?? posActors[0]
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null)

  const handleUpdateCheck = () => {
    if (onCheckUpdate) {
      onCheckUpdate()
    } else {
      setUpdateFeedback(
        'Sabi Shop is running the latest verified release (v0.1.0).',
      )
      setTimeout(() => setUpdateFeedback(null), 4000)
    }
  }

  return (
    <div className="settings-workspace">
      <PageHeader
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <div className="settings-grid">
        {/* Business Profile */}
        <div className="settings-card">
          <div className="settings-card__header">
            <Storefront size={22} weight="bold" />
            <h2 className="settings-card__title">
              {t('settings.business.title')}
            </h2>
          </div>
          <div className="settings-card__content">
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.business.name')}
              </span>
              <span className="settings-row__value">Nkechi Hardware</span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.business.currency')}
              </span>
              <span className="settings-row__value">
                Nigerian Naira (₦ NGN)
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.business.status')}
              </span>
              <span className="settings-badge settings-badge--success">
                {t('settings.business.statusActive')}
              </span>
            </div>
          </div>
        </div>

        {/* Tax & VAT Rules */}
        <div className="settings-card">
          <div className="settings-card__header">
            <Receipt size={22} weight="bold" />
            <h2 className="settings-card__title">{t('settings.tax.title')}</h2>
          </div>
          <div className="settings-card__content">
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.tax.mode')}
              </span>
              <span className="settings-row__value">
                {t('settings.tax.modeInclusive')}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.tax.rate')}
              </span>
              <span className="settings-row__value">7.5% (750 bps)</span>
            </div>
          </div>
        </div>

        {/* Active User Session & Role */}
        <div className="settings-card">
          <div className="settings-card__header">
            <User size={22} weight="bold" />
            <h2 className="settings-card__title">{t('settings.user.title')}</h2>
          </div>
          <div className="settings-card__content">
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.user.name')}
              </span>
              <span className="settings-row__value">
                {activeActor.displayName}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.user.role')}
              </span>
              <span className="settings-badge settings-badge--info">
                {activeActor.role.toUpperCase()}
              </span>
            </div>
            <div
              className="settings-row__label"
              style={{ marginTop: 'var(--space-8)' }}
            >
              {t('settings.user.permissions')}:
            </div>
            <div className="settings-permissions-list">
              <span className="settings-permission-tag">business:work</span>
              <span className="settings-permission-tag">sale:create</span>
              <span className="settings-permission-tag">payment:record</span>
              <span className="settings-permission-tag">repayment:record</span>
              {activeActor.role === 'owner' ||
              activeActor.role === 'manager' ? (
                <>
                  <span className="settings-permission-tag">
                    credit:approve
                  </span>
                  <span className="settings-permission-tag">
                    inventory:adjust
                  </span>
                  <span className="settings-permission-tag">
                    cash:reconcile
                  </span>
                  <span className="settings-permission-tag">audit:read</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Device & Offline Sync Health */}
        <div className="settings-card">
          <div className="settings-card__header">
            <Cpu size={22} weight="bold" />
            <h2 className="settings-card__title">
              {t('settings.device.title')}
            </h2>
          </div>
          <div className="settings-card__content">
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.device.connectivity')}
              </span>
              <span className="settings-row__value">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.device.pending')}
              </span>
              <span className="settings-row__value settings-row__value--mono">
                {pendingCount}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.device.conflicts')}
              </span>
              <span className="settings-row__value settings-row__value--mono">
                {conflictCount}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">
                {t('settings.device.storage')}
              </span>
              <span className="settings-badge settings-badge--success">
                {t('settings.device.storageHealthy')}
              </span>
            </div>
            <div style={{ marginTop: 'var(--space-8)' }}>
              <Button variant="secondary" onClick={handleUpdateCheck}>
                {t('settings.device.updateCheck')}
              </Button>
              {updateFeedback && (
                <p
                  className="ui-text-caption"
                  style={{
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--space-6)',
                  }}
                >
                  {updateFeedback}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Language & Regional Settings */}
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="settings-card__header">
            <Globe size={22} weight="bold" />
            <h2 className="settings-card__title">{t('settings.lang.title')}</h2>
          </div>
          <div className="settings-card__content">
            <div className="settings-row">
              <span className="settings-row__label">
                {t('common.language')}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
