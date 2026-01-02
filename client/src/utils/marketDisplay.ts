/**
 * Utilities for parsing and formatting Kalshi market data
 * to match the display style of Kalshi's trading console
 */

import type { Market } from '@/types/market'

// Known category prefixes in Kalshi tickers
const CATEGORY_PREFIXES: Record<string, string> = {
  'KXNFL': 'NFL',
  'KXNBA': 'NBA',
  'KXMLB': 'MLB',
  'KXNHL': 'NHL',
  'KXSOCCER': 'Soccer',
  'KXCRYPTO': 'Crypto',
  'KXBTC': 'Bitcoin',
  'KXETH': 'Ethereum',
  'KXSTOCK': 'Stocks',
  'KXSPY': 'S&P 500',
  'KXNDX': 'Nasdaq',
  'KXWEATHER': 'Weather',
  'KXTEMP': 'Temperature',
  'KXPOLITICS': 'Politics',
  'KXELECTION': 'Election',
  'KXFED': 'Fed',
  'KXINFL': 'Inflation',
  'KXGDP': 'GDP',
  'KXECON': 'Economy',
  'KXMVE': 'Multi-Event',
}

// Sport stat types (for future use in parsing)
// const STAT_TYPES: Record<string, string> = {
//   'PTS': 'Points', 'REB': 'Rebounds', 'AST': 'Assists',
//   'TD': 'Touchdowns', 'PASSYDS': 'Pass Yards', 'RECYDS': 'Rec Yards',
// }

/**
 * Extract category from ticker
 */
export function getMarketCategory(ticker: string): string {
  for (const [prefix, category] of Object.entries(CATEGORY_PREFIXES)) {
    if (ticker.startsWith(prefix)) {
      return category
    }
  }
  return 'Other'
}

/**
 * Parse date from ticker (format: 26JAN03 = Jan 3, 2026)
 */
export function parseDateFromTicker(ticker: string): string | null {
  const dateMatch = ticker.match(/(\d{2})([A-Z]{3})(\d{2})/)
  if (!dateMatch) return null

  const [, , month, day] = dateMatch
  const months: Record<string, string> = {
    'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr',
    'MAY': 'May', 'JUN': 'Jun', 'JUL': 'Jul', 'AUG': 'Aug',
    'SEP': 'Sep', 'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec'
  }

  return `${months[month]} ${parseInt(day)}`
}

/**
 * Format a short display name for the market
 */
export function getShortName(market: Market): string {
  const { title } = market

  // For sports prop bets, try to extract player name and stat
  const playerMatch = title.match(/^(?:yes |no )?([A-Za-z\s\.'-]+?)(?::\s*|\s+)(\d+\+?)/)
  if (playerMatch) {
    const [, name, threshold] = playerMatch
    // Clean up the name
    const cleanName = name.trim().replace(/^(yes|no)\s+/i, '')
    return `${cleanName} ${threshold}`
  }

  // For spread/total bets
  if (title.includes('wins by over') || title.includes('wins by under')) {
    const teamMatch = title.match(/(?:yes |no )?([A-Za-z\s]+) wins by (?:over|under) ([\d.]+)/)
    if (teamMatch) {
      return `${teamMatch[1]} ${teamMatch[2]}`
    }
  }

  // For over/under total points
  if (title.includes('points scored')) {
    const totalMatch = title.match(/(?:Over|Under) ([\d.]+) points/)
    if (totalMatch) {
      return `Total ${totalMatch[1]}`
    }
  }

  // Fallback: use first 30 chars of title
  if (title.length > 35) {
    return title.slice(0, 32) + '...'
  }

  return title
}

/**
 * Get a formatted display object for a market
 */
export function formatMarketDisplay(market: Market): {
  category: string
  shortName: string
  fullTitle: string
  date: string | null
  ticker: string
} {
  return {
    category: getMarketCategory(market.ticker),
    shortName: getShortName(market),
    fullTitle: market.title,
    date: parseDateFromTicker(market.ticker),
    ticker: market.ticker,
  }
}

/**
 * Format ticker for display (shorten long tickers)
 */
export function formatTicker(ticker: string): string {
  // Remove common prefixes for display
  let display = ticker

  // Shorten very long tickers
  if (display.length > 25) {
    // Try to extract the meaningful part
    const parts = display.split('-')
    if (parts.length >= 2) {
      // Keep first part and last part
      display = `${parts[0]}...${parts[parts.length - 1].slice(-8)}`
    } else {
      display = display.slice(0, 22) + '...'
    }
  }

  return display
}

/**
 * Group markets by event for better organization
 */
export function groupMarketsByEvent(markets: Market[]): Map<string, Market[]> {
  const groups = new Map<string, Market[]>()

  for (const market of markets) {
    const eventKey = market.event_ticker || 'other'
    const existing = groups.get(eventKey) || []
    existing.push(market)
    groups.set(eventKey, existing)
  }

  return groups
}
