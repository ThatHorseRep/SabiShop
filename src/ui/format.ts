const nairaWholeFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 0,
})

/**
 * Formats an integer-kobo amount as naira. The domain engines keep money as
 * integer kobo using bigint; this display helper never reintroduces floats
 * into business calculations.
 */
export function formatKobo(amount: bigint | number): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(Math.round(amount))
  const negative = value < 0n
  const absolute = negative ? -value : value
  const whole = absolute / 100n
  const kobo = (absolute % 100n).toString().padStart(2, '0')
  const formatted = `${nairaWholeFormatter.format(Number(whole))}.${kobo}`
  return negative ? `-${formatted}` : formatted
}
