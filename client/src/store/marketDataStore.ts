import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Market, Event, Fill, Balance } from '@/types/market'
import type { RawOrderbook } from '@/types/orderbook'

interface MarketDataState {
  // Market data cache
  markets: Record<string, Market>
  events: Record<string, Event>
  orderbooks: Record<string, RawOrderbook>
  fills: Record<string, Fill[]>  // ticker -> fills[]

  // Account data
  balance: Balance | null

  // Connection state
  wsConnected: boolean
  apiConnected: boolean
  environment: string

  // Subscriptions (tickers subscribed for real-time updates)
  subscriptions: Set<string>

  // Loading states
  loadingMarkets: boolean
  loadingEvents: boolean

  // Actions - Market data
  setMarket: (ticker: string, market: Market) => void
  setMarkets: (markets: Market[]) => void
  setEvent: (eventTicker: string, event: Event) => void
  setEvents: (events: Event[]) => void
  setOrderbook: (ticker: string, orderbook: RawOrderbook) => void
  addFill: (fill: Fill) => void
  setFills: (ticker: string, fills: Fill[]) => void

  // Actions - Account
  setBalance: (balance: Balance) => void

  // Actions - Connection
  setWsConnected: (connected: boolean) => void
  setApiConnected: (connected: boolean) => void
  setEnvironment: (env: string) => void

  // Actions - Subscriptions
  subscribe: (ticker: string) => void
  unsubscribe: (ticker: string) => void

  // Actions - Loading
  setLoadingMarkets: (loading: boolean) => void
  setLoadingEvents: (loading: boolean) => void

  // Selectors (computed values)
  getMarket: (ticker: string) => Market | undefined
  getOrderbook: (ticker: string) => RawOrderbook | undefined
  getMarketsByCategory: () => Record<string, Market[]>
}

export const useMarketDataStore = create<MarketDataState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    markets: {},
    events: {},
    orderbooks: {},
    fills: {},
    balance: null,
    wsConnected: false,
    apiConnected: false,
    environment: 'unknown',
    subscriptions: new Set(),
    loadingMarkets: false,
    loadingEvents: false,

    // Market data actions
    setMarket: (ticker, market) => {
      set(state => ({
        markets: { ...state.markets, [ticker]: market },
      }))
    },

    setMarkets: (markets) => {
      set(state => ({
        markets: {
          ...state.markets,
          ...Object.fromEntries(markets.map(m => [m.ticker, m])),
        },
      }))
    },

    setEvent: (eventTicker, event) => {
      set(state => ({
        events: { ...state.events, [eventTicker]: event },
      }))
    },

    setEvents: (events) => {
      set(state => ({
        events: {
          ...state.events,
          ...Object.fromEntries(events.map(e => [e.event_ticker, e])),
        },
      }))
    },

    setOrderbook: (ticker, orderbook) => {
      set(state => ({
        orderbooks: { ...state.orderbooks, [ticker]: orderbook },
      }))
    },

    addFill: (fill) => {
      set(state => ({
        fills: {
          ...state.fills,
          [fill.ticker]: [fill, ...(state.fills[fill.ticker] || [])].slice(0, 100),
        },
      }))
    },

    setFills: (ticker, fills) => {
      set(state => ({
        fills: { ...state.fills, [ticker]: fills },
      }))
    },

    // Account actions
    setBalance: (balance) => set({ balance }),

    // Connection actions
    setWsConnected: (connected) => set({ wsConnected: connected }),
    setApiConnected: (connected) => set({ apiConnected: connected }),
    setEnvironment: (env) => set({ environment: env }),

    // Subscription actions
    subscribe: (ticker) => {
      set(state => ({
        subscriptions: new Set([...state.subscriptions, ticker]),
      }))
    },

    unsubscribe: (ticker) => {
      set(state => {
        const subs = new Set(state.subscriptions)
        subs.delete(ticker)
        return { subscriptions: subs }
      })
    },

    // Loading actions
    setLoadingMarkets: (loading) => set({ loadingMarkets: loading }),
    setLoadingEvents: (loading) => set({ loadingEvents: loading }),

    // Selectors
    getMarket: (ticker) => get().markets[ticker],
    getOrderbook: (ticker) => get().orderbooks[ticker],

    getMarketsByCategory: () => {
      const markets = Object.values(get().markets)
      const grouped: Record<string, Market[]> = {}

      markets.forEach(market => {
        const category = market.category || 'Other'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(market)
      })

      return grouped
    },
  }))
)
