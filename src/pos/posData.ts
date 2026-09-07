import { CatalogPricing } from '../domain/catalogPricing'
import { CustomersCreditEngine } from '../domain/customersCredit'
import {
  InventoryEngine,
  quantity as inventoryQuantity,
} from '../domain/inventory'
import { SalesTransactionEngine } from '../domain/sales'
import { posBusiness } from './posSession'

/**
 * Reference operational data for the POS workspace. The engines are the
 * tested in-memory domain slices; durable persistence remains downstream
 * (Handoffs 06/07/09/10). Cost values exist only inside the engines and are
 * never exposed to the sales-facing UI.
 */
export type PosEngines = {
  pricing: CatalogPricing
  inventory: InventoryEngine
  customers: CustomersCreditEngine
  sales: SalesTransactionEngine
}

const naira = (amount: number) => amount * 100

type SeedProduct = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  aliases: readonly string[]
  modelOrPartNumber?: string
  sellingPriceKobo: number
  priceFloorKobo?: number
  stock: number
  unitCostKobo: number
}

const seedProducts: readonly SeedProduct[] = [
  {
    id: 'p-spark-plug',
    sku: 'PLUG-NGK-01',
    name: 'Spark Plug NGK',
    category: 'Engine parts',
    unit: 'each',
    aliases: ['plug'],
    modelOrPartNumber: 'NGK-BKR6E',
    sellingPriceKobo: naira(850),
    priceFloorKobo: naira(700),
    stock: 40,
    unitCostKobo: naira(520),
  },
  {
    id: 'p-engine-oil',
    sku: 'OIL-4L-SAE40',
    name: 'Engine Oil 4L SAE 40',
    category: 'Fluids',
    unit: 'bottle',
    aliases: ['oil', 'lubricant'],
    sellingPriceKobo: naira(12_500),
    priceFloorKobo: naira(11_000),
    stock: 15,
    unitCostKobo: naira(8_200),
  },
  {
    id: 'p-air-filter',
    sku: 'FLT-AIR-COR',
    name: 'Air Filter Toyota Corolla',
    category: 'Filters',
    unit: 'each',
    aliases: ['filter'],
    modelOrPartNumber: 'AF-283',
    sellingPriceKobo: naira(6_800),
    priceFloorKobo: naira(5_500),
    stock: 12,
    unitCostKobo: naira(4_100),
  },
  {
    id: 'p-brake-pads',
    sku: 'BRK-PAD-FRT',
    name: 'Brake Pads Front',
    category: 'Brakes',
    unit: 'set',
    aliases: ['brakes', 'pads'],
    sellingPriceKobo: naira(18_000),
    priceFloorKobo: naira(15_000),
    stock: 8,
    unitCostKobo: naira(11_500),
  },
  {
    id: 'p-battery',
    sku: 'BAT-12V-65',
    name: 'Car Battery 12V 65Ah',
    category: 'Electrical',
    unit: 'each',
    aliases: ['battery'],
    sellingPriceKobo: naira(95_000),
    priceFloorKobo: naira(85_000),
    stock: 5,
    unitCostKobo: naira(68_000),
  },
  {
    id: 'p-grease',
    sku: 'GRS-500G',
    name: 'Grease 500g',
    category: 'Fluids',
    unit: 'tin',
    aliases: ['grease'],
    sellingPriceKobo: naira(3_200),
    stock: 25,
    unitCostKobo: naira(2_100),
  },
  {
    id: 'p-headlamp-bulb',
    sku: 'BLB-HL-H4',
    name: 'Headlamp Bulb H4',
    category: 'Electrical',
    unit: 'each',
    aliases: ['bulb', 'headlamp'],
    sellingPriceKobo: naira(4_500),
    priceFloorKobo: naira(3_800),
    stock: 30,
    unitCostKobo: naira(2_900),
  },
  {
    id: 'p-wiper-blade',
    sku: 'WIP-BLD-22',
    name: 'Wiper Blade 22 inch',
    category: 'Body and glass',
    unit: 'each',
    aliases: ['wiper'],
    sellingPriceKobo: naira(5_200),
    priceFloorKobo: naira(4_200),
    stock: 18,
    unitCostKobo: naira(3_300),
  },
]

export function createPosEngines(): PosEngines {
  const pricing = new CatalogPricing({
    belowFloorMode: 'block_until_authorized',
    incentivePercentage: 0,
    minimumQualifyingCompletedSales: 0,
  })
  const inventory = new InventoryEngine()
  const customers = new CustomersCreditEngine()
  const sales = new SalesTransactionEngine(pricing, inventory, {
    'ussd-transfer': 'non_cash',
  })

  for (const product of seedProducts) {
    pricing.createProduct({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      aliases: [...product.aliases],
      modelOrPartNumber: product.modelOrPartNumber,
      sellingPriceKobo: product.sellingPriceKobo,
      priceFloorKobo: product.priceFloorKobo,
      active: true,
      availableForSale: true,
    })
    inventory.receive({
      businessId: posBusiness.id,
      productId: product.id,
      quantity: inventoryQuantity(product.stock),
      unitCost: BigInt(product.unitCostKobo),
      actorId: 'user-nkechi',
      reason: 'Opening stock',
      clientEventId: `seed-receipt-${product.id}`,
    })
  }

  pricing.createProduct({
    id: 'p-old-plug',
    sku: 'PLUG-OLD-99',
    name: 'Spark Plug (old model)',
    category: 'Engine parts',
    unit: 'each',
    aliases: [],
    sellingPriceKobo: naira(600),
    active: false,
    availableForSale: true,
  })

  customers.createCustomer({
    businessId: posBusiness.id,
    id: 'c-ada',
    name: 'Ada Obi',
    phone: '0803 111 2233',
    creditStatus: 'allowed',
    creditLimitMinor: BigInt(naira(150_000)),
    actorId: 'user-nkechi',
  })
  customers.createCustomer({
    businessId: posBusiness.id,
    id: 'c-emeka',
    name: 'Emeka Duru',
    phone: '0805 444 8899',
    creditStatus: 'allowed',
    creditLimitMinor: BigInt(naira(100_000)),
    actorId: 'user-nkechi',
  })
  customers.createCustomer({
    businessId: posBusiness.id,
    id: 'c-funke',
    name: 'Funke Adeyemi',
    phone: '0807 222 1144',
    creditStatus: 'restricted',
    actorId: 'user-nkechi',
  })
  customers.createCustomer({
    businessId: posBusiness.id,
    id: 'c-tunde',
    name: 'Tunde Bala',
    phone: '0810 999 3355',
    creditStatus: 'blocked',
    actorId: 'user-nkechi',
  })

  customers.recordCreditSale({
    businessId: posBusiness.id,
    customerId: 'c-emeka',
    debtId: 'debt-seed-emeka-1',
    saleId: 'sale-seed-emeka-1',
    amountMinor: BigInt(naira(60_000)),
    actorId: 'user-chidi',
    actorRole: 'staff',
    clientEventId: 'seed-credit-emeka-1',
    creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
  })

  return { pricing, inventory, customers, sales }
}
