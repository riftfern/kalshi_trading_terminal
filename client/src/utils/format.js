/**
 * Formatting utilities
 */

export function formatPrice(cents) {
  if (cents == null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

export function formatVolume(num) {
  if (num == null) return '-'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatPercent(value) {
  if (value == null) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatSpread(bid, ask) {
  if (bid == null || ask == null) return '-'
  const spread = ask - bid
  const midpoint = (ask + bid) / 2
  if (midpoint === 0) return '-'
  const pct = (spread / midpoint) * 100
  return `${formatPrice(spread)} (${pct.toFixed(1)}%)`
}
