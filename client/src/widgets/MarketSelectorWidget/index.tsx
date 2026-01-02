import { useEffect, useState, useMemo } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { formatPrice, formatVolume } from '@/utils/format'
import { cn } from '@/utils/cn'
import { getShortName, getMarketCategory, formatTicker } from '@/utils/marketDisplay'
import type { Market } from '@/types/market'

interface MarketSelectorWidgetProps {
  id: string
}

export function MarketSelectorWidget({ id }: MarketSelectorWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const addWidget = useWorkspaceStore(s => s.addWidget)
  const setActiveTicker = useWorkspaceStore(s => s.setActiveTicker)
  const markets = useMarketDataStore(s => s.markets)
  const setMarkets = useMarketDataStore(s => s.setMarkets)

  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/markets/all')
        if (!res.ok) throw new Error('Failed to fetch markets')
        const data = await res.json()
        setMarkets(data.markets || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (Object.keys(markets).length === 0) {
      fetchMarkets()
    }
  }, [markets, setMarkets])

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    const allMarkets = Object.values(markets)
    const searchLower = search.toLowerCase()

    return allMarkets
      .filter(m =>
        m.ticker.toLowerCase().includes(searchLower) ||
        m.title.toLowerCase().includes(searchLower) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0))
      .slice(0, 50)
  }, [markets, search])

  const handleSelectMarket = (market: Market) => {
    setActiveTicker(market.ticker)
  }

  const handleOpenOrderbook = (market: Market) => {
    addWidget('orderbook', market.ticker)
  }

  const handleOpenChart = (market: Market) => {
    addWidget('chart', market.ticker)
  }

  return (
    <BaseWidget
      id={id}
      title="Markets"
      onRemove={() => removeWidget(id)}
      isLoading={isLoading}
      error={error}
    >
      <div className="flex flex-col h-full">
        {/* Search input */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search markets..."
            className={cn(
              'w-full pl-7 pr-2 py-1.5',
              'bg-slate-800 border border-slate-700 rounded',
              'text-xs text-slate-300 placeholder:text-slate-600',
              'outline-none focus:border-cyan-500/50'
            )}
          />
        </div>

        {/* Market list */}
        <div className="flex-1 overflow-y-auto -mx-2">
          {filteredMarkets.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-4">
              {search ? 'No markets found' : 'Loading markets...'}
            </div>
          ) : (
            filteredMarkets.map(market => (
              <MarketRow
                key={market.ticker}
                market={market}
                onSelect={() => handleSelectMarket(market)}
                onOpenOrderbook={() => handleOpenOrderbook(market)}
                onOpenChart={() => handleOpenChart(market)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-600 pt-1 border-t border-slate-700 mt-1">
          {filteredMarkets.length} markets
        </div>
      </div>
    </BaseWidget>
  )
}

interface MarketRowProps {
  market: Market
  onSelect: () => void
  onOpenOrderbook: () => void
  onOpenChart: () => void
}

function MarketRow({ market, onSelect, onOpenOrderbook, onOpenChart }: MarketRowProps) {
  const [showActions, setShowActions] = useState(false)
  const category = getMarketCategory(market.ticker)
  const shortName = getShortName(market)
  const displayTicker = formatTicker(market.ticker)

  return (
    <div
      className={cn(
        'px-2 py-1.5 cursor-pointer',
        'hover:bg-slate-800/50 transition-colors',
        'border-b border-slate-800'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Category badge and price */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1 py-0.5 rounded bg-slate-700 text-slate-400">
              {category}
            </span>
            <span className="text-xs font-bold text-green-400">
              {formatPrice(market.yes_bid)}
            </span>
            <span className="text-[10px] text-slate-600">
              {formatPrice(market.yes_ask)}
            </span>
          </div>
          {/* Short readable name */}
          <div className="text-xs text-slate-200 truncate mt-0.5">
            {shortName}
          </div>
          {/* Ticker */}
          <div className="text-[10px] text-cyan-400/60 truncate">
            {displayTicker}
          </div>
        </div>

        {showActions ? (
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onOpenOrderbook}
              className="px-1.5 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 rounded"
              title="Open Orderbook"
            >
              Book
            </button>
            <button
              onClick={onOpenChart}
              className="px-1.5 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 rounded"
              title="Open Chart"
            >
              <TrendingUp className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-600 shrink-0">
            {formatVolume(market.volume_24h)}
          </div>
        )}
      </div>
    </div>
  )
}
