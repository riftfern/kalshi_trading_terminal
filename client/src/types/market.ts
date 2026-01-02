export interface Market {
  ticker: string
  title: string
  subtitle?: string
  status: 'open' | 'closed' | 'settled'
  yes_bid: number | null
  yes_ask: number | null
  no_bid: number | null
  no_ask: number | null
  last_price: number | null
  previous_price: number | null
  previous_yes_bid: number | null
  previous_yes_ask: number | null
  volume: number
  volume_24h: number
  open_interest: number
  close_time: string | null
  expiration_time: string | null
  result?: 'yes' | 'no' | null
  series_ticker?: string
  event_ticker?: string
  category?: string
}

export interface Event {
  event_ticker: string
  title: string
  subtitle?: string
  category: string
  series_ticker?: string
  mutually_exclusive: boolean
  markets?: Market[]
}

export interface Series {
  series_ticker: string
  title: string
  category?: string
  events?: Event[]
}

export interface Fill {
  ticker: string
  trade_id: string
  price: number
  count: number
  side: 'yes' | 'no'
  action: 'buy' | 'sell'
  timestamp: string
  is_taker: boolean
}

export interface Position {
  ticker: string
  market_exposure: number
  resting_orders_count: number
  total_traded: number
  realized_pnl: number
}

export interface Balance {
  balance: number
  portfolio_value?: number
}

export interface HealthStatus {
  status: string
  kalshi: 'connected' | 'disconnected'
  environment: string
}
