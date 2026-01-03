/**
 * Reciprocal Orderbook Transformer
 *
 * Kalshi's orderbook format only provides YES and NO bids.
 * This transformer "hydrates" the orderbook by calculating the missing Ask side
 * using the reciprocal relationship: YES price + NO price = 100 cents
 *
 * Input (Kalshi API):
 *   - yes: [[price, qty], ...] - YES bids
 *   - no: [[price, qty], ...] - NO bids
 *
 * Output (Hydrated):
 *   - bids: [[price, qty], ...] - YES bids (sorted descending)
 *   - asks: [[price, qty], ...] - YES asks derived from NO bids (sorted ascending)
 *   - spread: number
 *   - midpoint: number
 *   - bestBid: number | null
 *   - bestAsk: number | null
 */

/**
 * Transform raw Kalshi orderbook to standard format with hydrated asks
 * @param {Object} rawOrderbook - Raw Kalshi orderbook {yes, no, yes_dollars, no_dollars}
 * @returns {Object} Hydrated orderbook with bids, asks, spread, midpoint
 */
export function transformOrderbook(rawOrderbook) {
  // Guard against null/undefined data
  const yesData = rawOrderbook?.yes ?? [];
  const noData = rawOrderbook?.no ?? [];

  // YES bids are already in correct format, sort descending by price
  const bids = [...yesData].sort((a, b) => b[0] - a[0]);

  // Convert NO bids to YES asks using reciprocal formula:
  // YES Ask Price = 100 - NO Bid Price
  // Sort ascending by price (lowest ask first)
  const asks = noData
    .map(([noPrice, qty]) => [100 - noPrice, qty])
    .sort((a, b) => a[0] - b[0]);

  // Calculate spread and midpoint
  const bestBid = bids[0]?.[0] ?? null;
  const bestAsk = asks[0]?.[0] ?? null;

  let spread = 0;
  let midpoint = 50; // Default to 50% if no data

  if (bestBid !== null && bestAsk !== null) {
    spread = bestAsk - bestBid;
    midpoint = (bestBid + bestAsk) / 2;
  } else if (bestBid !== null) {
    midpoint = bestBid;
  } else if (bestAsk !== null) {
    midpoint = bestAsk;
  }

  return {
    bids,
    asks,
    spread,
    midpoint,
    bestBid,
    bestAsk,
    // Include original data for reference
    _raw: {
      yes: yesData,
      no: noData,
    },
  };
}

/**
 * Calculate total quantity at each price level
 * @param {Object} orderbook - Transformed orderbook
 * @param {number} depth - Number of levels to return
 * @returns {Object} Aggregated orderbook data
 */
export function aggregateOrderbook(orderbook, depth = 10) {
  const bids = orderbook.bids.slice(0, depth);
  const asks = orderbook.asks.slice(0, depth);

  const totalBidQty = bids.reduce((sum, [, qty]) => sum + qty, 0);
  const totalAskQty = asks.reduce((sum, [, qty]) => sum + qty, 0);

  const allQtys = [...bids.map(([, q]) => q), ...asks.map(([, q]) => q)];
  const maxQty = Math.max(...allQtys, 1);

  return {
    bids,
    asks,
    totalBidQty,
    totalAskQty,
    maxQty,
    spread: orderbook.spread,
    midpoint: orderbook.midpoint,
    bestBid: orderbook.bestBid,
    bestAsk: orderbook.bestAsk,
  };
}

/**
 * Calculate implied probability from price in cents
 * @param {number} cents - Price in cents
 * @returns {number} Probability (0-1)
 */
export function priceToProb(cents) {
  return cents / 100;
}

/**
 * Calculate NO price from YES price
 * @param {number} yesCents - YES price in cents
 * @returns {number} NO price in cents
 */
export function yesToNo(yesCents) {
  return 100 - yesCents;
}

/**
 * Calculate YES price from NO price
 * @param {number} noCents - NO price in cents
 * @returns {number} YES price in cents
 */
export function noToYes(noCents) {
  return 100 - noCents;
}
