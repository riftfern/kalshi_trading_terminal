/**
 * Market Heat Calculation
 * Scores markets based on trading activity
 */

import type { Market } from '../types/market';

/**
 * Calculate market "heat" score based on volume and open interest
 * @param market - Market data
 * @returns Heat score (higher = more active)
 */
export function calculateMarketHeat(market: Market): number {
  const volume = market.volume_24h || market.volume || 0;
  const openInterest = market.open_interest || 0;

  // Weight: 70% volume, 30% open interest
  const score = (volume * 0.7) + (openInterest * 0.3);

  return score;
}

/**
 * Check if a market has sufficient liquidity
 * @param market - Market data
 * @param minDepth - Minimum total orderbook depth (default 100 contracts)
 * @returns True if market meets liquidity threshold
 */
export function isLiquidMarket(market: Market, minDepth: number = 100): boolean {
  // Use liquidity field as a proxy for orderbook depth (in cents)
  const totalDepth = market.liquidity || 0;

  return totalDepth >= minDepth;
}

/**
 * Sort markets by heat score (descending)
 * @param markets - Array of markets
 * @returns Sorted array (hottest first)
 */
export function sortByHeat(markets: Market[]): Market[] {
  return [...markets].sort((a, b) => {
    const heatA = calculateMarketHeat(a);
    const heatB = calculateMarketHeat(b);
    return heatB - heatA; // Descending
  });
}
