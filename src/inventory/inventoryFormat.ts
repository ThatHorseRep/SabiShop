const QUANTITY_SCALE = 1000n
const MONEY_SCALE = 100n

export const parseQuantityInput = (value: string): bigint | null => {
  const normalized = value.trim()
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * QUANTITY_SCALE + BigInt(fraction.padEnd(3, '0'))
}

export const parseMoneyInput = (value: string): bigint | null => {
  const normalized = value.trim().replace(/^₦/, '').replace(/,/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * MONEY_SCALE + BigInt(fraction.padEnd(2, '0'))
}

export const formatQuantity = (value: bigint): string => {
  const sign = value < 0n ? '-' : ''
  const absolute = value < 0n ? -value : value
  const whole = absolute / QUANTITY_SCALE
  const fraction = (absolute % QUANTITY_SCALE).toString().padStart(3, '0')
  const trimmed = fraction.replace(/0+$/, '')
  return `${sign}${whole.toString()}${trimmed ? `.${trimmed}` : ''}`
}

export const formatSignedQuantity = (value: bigint): string =>
  value > 0n ? `+${formatQuantity(value)}` : formatQuantity(value)

export const formatMoney = (value: bigint | number): string => {
  const kobo = BigInt(value)
  const sign = kobo < 0n ? '-' : ''
  const absolute = kobo < 0n ? -kobo : kobo
  const naira = absolute / MONEY_SCALE
  const remainder = (absolute % MONEY_SCALE).toString().padStart(2, '0')
  return `${sign}₦${naira.toLocaleString('en-NG')}.${remainder}`
}

export const formatDateTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
