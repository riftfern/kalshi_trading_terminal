/**
 * Formatting utilities for the Godel Terminal
 */

/**
 * Format cents to dollar string (e.g., 4250 -> "$42.50")
 */
export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Format cents to cents string without dollar sign (e.g., 42 -> "42¢")
 */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '-'
  return `${cents}¢`
}

/**
 * Format large numbers with K/M suffix (e.g., 1500000 -> "1.5M")
 */
export function formatVolume(num: number | null | undefined): string {
  if (num == null) return '-'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

/**
 * Format date to short string (e.g., "Jan 1, 2025")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format date and time (e.g., "Jan 1, 3:45 PM")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Format time only (e.g., "3:45:23 PM")
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format percentage with sign (e.g., 5.2 -> "+5.2%", -3.1 -> "-3.1%")
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Calculate and format price change
 */
export function formatChange(
  current: number | null | undefined,
  previous: number | null | undefined
): { text: string; isPositive: boolean; isNegative: boolean } {
  if (current == null || previous == null || previous === 0) {
    return { text: '-', isPositive: false, isNegative: false }
  }

  const change = current - previous
  const pctChange = (change / previous) * 100

  const sign = change >= 0 ? '+' : ''
  const text = `${sign}${(change / 100).toFixed(2)} (${sign}${pctChange.toFixed(1)}%)`

  return {
    text,
    isPositive: change > 0,
    isNegative: change < 0,
  }
}

/**
 * Format bid/ask spread
 */
export function formatSpread(
  bid: number | null | undefined,
  ask: number | null | undefined
): string {
  if (bid == null || ask == null) return '-'
  const spread = ask - bid
  const midpoint = (ask + bid) / 2
  if (midpoint === 0) return '-'
  const pct = (spread / midpoint) * 100
  return `${formatPrice(spread)} (${pct.toFixed(1)}%)`
}

/**
 * Format probability from price (cents to %)
 */
export function formatProbability(cents: number | null | undefined): string {
  if (cents == null) return '-'
  return `${cents}%`
}

/**
 * Format quantity with commas
 */
export function formatQuantity(num: number | null | undefined): string {
  if (num == null) return '-'
  return num.toLocaleString()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
