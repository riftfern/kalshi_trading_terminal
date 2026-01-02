import type { RawOrderbook, NormalizedOrderbook, OrderbookLevel } from '@/types/orderbook'

/**
 * Normalize Kalshi's reciprocal orderbook format.
 *
 * Kalshi returns:
 * - `yes`: Array of [price, qty] for YES bids
 * - `no`: Array of [price, qty] for NO bids
 *
 * In prediction markets: YES price + NO price = 100 cents
 * Therefore: YES Ask = 100 - NO Bid
 *
 * We convert this to standard orderbook format:
 * - bids: YES bid prices (what you can sell YES for)
 * - asks: Derived ask prices (what you must pay to buy YES)
 */
export function normalizeOrderbook(raw: RawOrderbook): NormalizedOrderbook {
  // Guard against undefined/null data
  const yesData = raw?.yes ?? []
  const noData = raw?.no ?? []

  // YES bids are already in correct format, sort descending by price
  const bids: OrderbookLevel[] = [...yesData]
    .sort((a, b) => b[0] - a[0])

  // Convert NO bids to YES asks: askPrice = 100 - noBidPrice
  // Sort ascending by price (lowest ask first)
  const asks: OrderbookLevel[] = noData
    .map(([noPrice, qty]): OrderbookLevel => [100 - noPrice, qty])
    .sort((a, b) => a[0] - b[0])

  // Calculate spread and midpoint
  const bestBid = bids[0]?.[0] ?? null
  const bestAsk = asks[0]?.[0] ?? null

  let spread = 0
  let midpoint = 50 // Default to 50% if no data

  if (bestBid !== null && bestAsk !== null) {
    spread = bestAsk - bestBid
    midpoint = (bestBid + bestAsk) / 2
  } else if (bestBid !== null) {
    midpoint = bestBid
  } else if (bestAsk !== null) {
    midpoint = bestAsk
  }

  return {
    bids,
    asks,
    spread,
    midpoint,
    bestBid,
    bestAsk,
  }
}

/**
 * Calculate the total quantity at each price level
 */
export function aggregateOrderbook(
  orderbook: NormalizedOrderbook,
  depth: number = 10
): {
  bids: OrderbookLevel[]
  asks: OrderbookLevel[]
  totalBidQty: number
  totalAskQty: number
  maxQty: number
} {
  const bids = orderbook.bids.slice(0, depth)
  const asks = orderbook.asks.slice(0, depth)

  const totalBidQty = bids.reduce((sum, [, qty]) => sum + qty, 0)
  const totalAskQty = asks.reduce((sum, [, qty]) => sum + qty, 0)

  const allQtys = [...bids.map(([, q]) => q), ...asks.map(([, q]) => q)]
  const maxQty = Math.max(...allQtys, 1)

  return {
    bids,
    asks,
    totalBidQty,
    totalAskQty,
    maxQty,
  }
}

/**
 * Calculate implied probability from price in cents
 */
export function priceToProb(cents: number): number {
  return cents / 100
}

/**
 * Calculate expected value
 */
export function expectedValue(prob: number, payout: number, cost: number): number {
  return prob * payout - cost
}

/**
 * Calculate NO price from YES price
 */
export function yesToNo(yesCents: number): number {
  return 100 - yesCents
}

/**
 * Calculate YES price from NO price
 */
export function noToYes(noCents: number): number {
  return 100 - noCents
}
