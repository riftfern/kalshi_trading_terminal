// Kalshi orderbook level format: [price_cents, quantity]
export type OrderbookLevel = [number, number]

// Raw orderbook from Kalshi API
export interface RawOrderbook {
  yes: OrderbookLevel[]
  no: OrderbookLevel[]
}

// Normalized orderbook for display
// Kalshi quirk: They only return bids for YES and NO
// To show asks for YES, we compute: 100 - NO bid price
export interface NormalizedOrderbook {
  bids: OrderbookLevel[]   // YES bids, sorted descending by price
  asks: OrderbookLevel[]   // Derived from NO bids: price = 100 - noBidPrice
  spread: number           // Best ask - best bid (in cents)
  midpoint: number         // (best bid + best ask) / 2
  bestBid: number | null
  bestAsk: number | null
}

// Orderbook update from WebSocket
export interface OrderbookUpdate {
  ticker: string
  orderbook: RawOrderbook
  timestamp: number
}
