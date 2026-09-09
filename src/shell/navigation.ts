import {
  ChartLine,
  Clock,
  Gear,
  House,
  Package,
  Storefront,
  Truck,
  Users,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'
import { useMemo } from 'react'
import type { Permission } from '../auth/types'
import { useLanguage, type MessageKey, type Translate } from '../language'

export type NavDestinationId =
  | 'home'
  | 'sell'
  | 'products-inventory'
  | 'customers-credit'
  | 'suppliers-purchasing'
  | 'money'
  | 'activity'
  | 'management'
  | 'settings'

export type NavGroupId = 'work' | 'money' | 'activity' | 'management' | 'system'

export type NavDestination = {
  id: NavDestinationId
  label: string
  description: string
  icon: Icon
  group?: NavGroupId
  /**
   * Minimum permission required for the destination to be visible. Visibility
   * is presentation only; authorization is enforced at operation boundaries
   * (C04 section 15).
   */
  requiredPermission?: Permission
}

/**
 * The C01/C04 navigation model. Order within groups follows C04 section 6.
 */
export const navigationModel: readonly NavDestination[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Daily overview, attention, and system state.',
    icon: House,
  },
  {
    id: 'sell',
    label: 'Sell',
    description: 'Record sales and confirmed payments.',
    icon: Storefront,
    group: 'work',
    requiredPermission: 'sale:create',
  },
  {
    id: 'products-inventory',
    label: 'Products & Stock',
    description: 'Products, stock, and movements.',
    icon: Package,
    group: 'work',
    requiredPermission: 'business:work',
  },
  {
    id: 'customers-credit',
    label: 'Customers & Credit',
    description: 'Customers, credit, and repayments.',
    icon: Users,
    group: 'work',
    requiredPermission: 'business:work',
  },
  {
    id: 'suppliers-purchasing',
    label: 'Suppliers & Purchasing',
    description: 'Suppliers, purchases, and receiving.',
    icon: Truck,
    group: 'work',
    requiredPermission: 'supplier:manage',
  },
  {
    id: 'money',
    label: 'Money',
    description: 'Cash, reconciliation, and exception review.',
    icon: Wallet,
    group: 'money',
    // Staff need this area to request returns, record cash events, and enter
    // physical counts; management controls official figures, confirmation,
    // closure, and resolution (B05 sections 3, 22, 28).
    requiredPermission: 'business:work',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Chronological business activity.',
    icon: Clock,
    group: 'activity',
    requiredPermission: 'business:work',
  },
  {
    id: 'management',
    label: 'Management',
    description: 'Performance, review, and audit.',
    icon: ChartLine,
    group: 'management',
    requiredPermission: 'audit:read',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Business configuration.',
    icon: Gear,
    group: 'system',
    requiredPermission: 'business:work',
  },
]

export const navGroupLabels: Record<NavGroupId, string> = {
  work: 'Work',
  money: 'Money',
  activity: 'Activity',
  management: 'Management',
  system: 'System',
}

export type NavigationView = {
  home: NavDestination | null
  groups: ReadonlyArray<{
    group: NavGroupId
    destinations: readonly NavDestination[]
  }>
}

const navTitleKeys = {
  home: 'nav.home',
  sell: 'nav.sell',
  'products-inventory': 'nav.productsInventory',
  'customers-credit': 'nav.customersCredit',
  'suppliers-purchasing': 'nav.suppliersPurchasing',
  money: 'nav.money',
  activity: 'nav.activity',
  management: 'nav.management',
  settings: 'nav.settings',
} as const satisfies Record<NavDestinationId, MessageKey>

const navDescriptionKeys = {
  home: 'nav.homeDescription',
  sell: 'nav.sellDescription',
  'products-inventory': 'nav.productsInventoryDescription',
  'customers-credit': 'nav.customersCreditDescription',
  'suppliers-purchasing': 'nav.suppliersPurchasingDescription',
  money: 'nav.moneyDescription',
  activity: 'nav.activityDescription',
  management: 'nav.managementDescription',
  settings: 'nav.settingsDescription',
} as const satisfies Record<NavDestinationId, MessageKey>

export const navGroupTranslationKeys = {
  work: 'nav.groupWork',
  money: 'nav.groupMoney',
  activity: 'nav.groupActivity',
  management: 'nav.groupManagement',
  system: 'nav.groupSystem',
} as const satisfies Record<NavGroupId, MessageKey>

/**
 * Filters the navigation model to destinations the current permission set
 * may see. Inaccessible management areas are hidden rather than shown as
 * disabled clutter (C04 sections 13-14).
 */
export function navigationFor(
  permissions: ReadonlySet<Permission>,
): NavigationView {
  const visible = navigationModel.filter(
    (destination) =>
      !destination.requiredPermission ||
      permissions.has(destination.requiredPermission),
  )
  const home = visible.find((destination) => destination.id === 'home') ?? null
  const groupOrder: NavGroupId[] = [
    'work',
    'money',
    'activity',
    'management',
    'system',
  ]
  const groups = groupOrder
    .map((group) => ({
      group,
      destinations: visible.filter(
        (destination) => destination.group === group,
      ),
    }))
    .filter((entry) => entry.destinations.length > 0)
  return { home, groups }
}

function localizeNavigationView(
  view: NavigationView,
  t: Translate,
): NavigationView {
  const home = view.home
    ? {
        ...view.home,
        label: t(navTitleKeys[view.home.id]),
        description: t(navDescriptionKeys[view.home.id]),
      }
    : null
  return {
    home,
    groups: view.groups.map((group) => ({
      group: group.group,
      destinations: group.destinations.map((destination) => ({
        ...destination,
        label: t(navTitleKeys[destination.id]),
        description: t(navDescriptionKeys[destination.id]),
      })),
    })),
  }
}

export function useNavigationFor(
  permissions: ReadonlySet<Permission>,
): NavigationView {
  const { t } = useLanguage()
  return useMemo(
    () => localizeNavigationView(navigationFor(permissions), t),
    [permissions, t],
  )
}

export function useDestinationCopy(id: NavDestinationId): {
  label: string
  description: string
} {
  const { t } = useLanguage()
  return useMemo(
    () => ({
      label: t(navTitleKeys[id]),
      description: t(navDescriptionKeys[id]),
    }),
    [id, t],
  )
}

export function findDestination(id: NavDestinationId): NavDestination {
  const destination = navigationModel.find((entry) => entry.id === id)
  if (!destination) throw new Error(`Unknown navigation destination: ${id}`)
  return destination
}
