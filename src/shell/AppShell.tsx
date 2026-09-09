import { useEffect, useState, type ReactNode } from 'react'
import { DotsThree } from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { Drawer } from '../ui/Overlays'
import {
  AttentionIndicator,
  SystemStateIndicator,
  UserMenu,
  type ShellSystemState,
  type ShellUser,
} from './indicators'
import {
  navGroupTranslationKeys,
  type NavDestination,
  type NavDestinationId,
  type NavigationView,
} from './navigation'

const collapseStorageKey = 'sabi-shop:nav-collapsed'

type AppShellProps = {
  navigation: NavigationView
  activeArea: NavDestinationId
  onNavigate: (id: NavDestinationId) => void
  systemState: ShellSystemState
  onSystemStateActivate?: () => void
  attentionCount?: number
  onAttentionActivate?: () => void
  businessName?: string | null
  user: ShellUser | null
  onSignOut?: () => void
  children: ReactNode
}

function NavButton({
  destination,
  active,
  collapsed,
  onNavigate,
}: {
  destination: NavDestination
  active: boolean
  collapsed: boolean
  onNavigate: (id: NavDestinationId) => void
}) {
  const Icon = destination.icon
  return (
    <button
      type="button"
      className={
        active ? 'app-nav__item app-nav__item--active' : 'app-nav__item'
      }
      aria-current={active ? 'page' : undefined}
      title={collapsed ? destination.label : undefined}
      onClick={() => onNavigate(destination.id)}
    >
      <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
      <span
        className={
          collapsed ? 'app-nav__label visually-hidden' : 'app-nav__label'
        }
      >
        {destination.label}
      </span>
    </button>
  )
}

/**
 * Adaptive hybrid application shell (C04-DEC-01): persistent primary
 * navigation on larger screens, compact navigation on smaller screens, with
 * Sell immediately reachable wherever it is visible. Navigation visibility is
 * presentation only and never an authorization mechanism.
 */
export function AppShell({
  navigation,
  activeArea,
  onNavigate,
  systemState,
  onSystemStateActivate,
  attentionCount = 0,
  onAttentionActivate,
  businessName,
  user,
  onSignOut,
  children,
}: AppShellProps) {
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(collapseStorageKey) === 'true'
    } catch {
      return false
    }
  })
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(collapseStorageKey, String(collapsed))
    } catch {
      /* preference persistence is best-effort */
    }
  }, [collapsed])

  const home = navigation.home
  const bottomDestinations = navigation.groups
    .flatMap((group) => group.destinations)
    .filter(
      (destination) =>
        destination.id === 'sell' || destination.id === 'activity',
    )
  const moreDestinations = navigation.groups
    .flatMap((group) => group.destinations)
    .filter(
      (destination) =>
        destination.id !== 'sell' && destination.id !== 'activity',
    )

  const navigate = (id: NavDestinationId) => {
    setMoreOpen(false)
    onNavigate(id)
  }

  return (
    <div className="app-shell">
      <a className="app-skip-link" href="#main-content">
        {t('shell.skipToContent')}
      </a>
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__name">Sabi Shop</span>
          {businessName && (
            <span className="app-header__business">{businessName}</span>
          )}
        </div>
        <div className="app-header__meta">
          <AttentionIndicator
            count={attentionCount}
            onActivate={onAttentionActivate}
          />
          <SystemStateIndicator
            state={systemState}
            onActivate={onSystemStateActivate}
          />
          <LanguageSwitcher />
          <UserMenu user={user} onSignOut={onSignOut} />
        </div>
      </header>
      <div className="app-body">
        <nav
          className="app-nav"
          aria-label={t('shell.primary')}
          data-collapsed={collapsed}
        >
          <div className="app-nav__scroll">
            {home && (
              <NavButton
                destination={home}
                active={activeArea === home.id}
                collapsed={collapsed}
                onNavigate={navigate}
              />
            )}
            {navigation.groups.map((group) => (
              <div className="app-nav__group" key={group.group}>
                <span className="app-nav__group-label">
                  {t(navGroupTranslationKeys[group.group])}
                </span>
                {group.destinations.map((destination) => (
                  <NavButton
                    key={destination.id}
                    destination={destination}
                    active={activeArea === destination.id}
                    collapsed={collapsed}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="app-nav__collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
          >
            {collapsed ? '»' : '«'}
            <span className={collapsed ? 'visually-hidden' : undefined}>
              {t('shell.collapseNavigation')}
            </span>
          </button>
        </nav>
        <main className="app-workspace" id="main-content">
          {children}
        </main>
      </div>
      {bottomDestinations.length > 0 && (
        <nav className="app-bottom-nav" aria-label={t('shell.primaryMobile')}>
          {home && (
            <button
              type="button"
              className={
                activeArea === home.id
                  ? 'app-bottom-nav__item app-bottom-nav__item--active'
                  : 'app-bottom-nav__item'
              }
              aria-current={activeArea === home.id ? 'page' : undefined}
              onClick={() => navigate(home.id)}
            >
              <home.icon
                size={22}
                weight={activeArea === home.id ? 'fill' : 'regular'}
                aria-hidden="true"
              />
              <span>{home.label}</span>
            </button>
          )}
          {bottomDestinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              className={
                activeArea === destination.id
                  ? 'app-bottom-nav__item app-bottom-nav__item--active'
                  : 'app-bottom-nav__item'
              }
              aria-current={activeArea === destination.id ? 'page' : undefined}
              onClick={() => navigate(destination.id)}
            >
              <destination.icon
                size={22}
                weight={activeArea === destination.id ? 'fill' : 'regular'}
                aria-hidden="true"
              />
              <span>{destination.label}</span>
            </button>
          ))}
          {moreDestinations.length > 0 && (
            <button
              type="button"
              className="app-bottom-nav__item"
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
            >
              <DotsThree size={22} weight="bold" aria-hidden="true" />
              <span>{t('shell.more')}</span>
            </button>
          )}
        </nav>
      )}
      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={t('shell.more')}
      >
        <div className="app-more">
          {navigation.groups
            .filter((group) =>
              group.destinations.some((destination) =>
                moreDestinations.includes(destination),
              ),
            )
            .map((group) => (
              <div className="app-more__group" key={group.group}>
                <span className="app-more__group-label">
                  {t(navGroupTranslationKeys[group.group])}
                </span>
                {group.destinations
                  .filter((destination) =>
                    moreDestinations.includes(destination),
                  )
                  .map((destination) => (
                    <NavButton
                      key={destination.id}
                      destination={destination}
                      active={activeArea === destination.id}
                      collapsed={false}
                      onNavigate={navigate}
                    />
                  ))}
              </div>
            ))}
        </div>
      </Drawer>
    </div>
  )
}
