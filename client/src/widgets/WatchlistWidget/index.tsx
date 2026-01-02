import { useState } from 'react'
import { Plus, X, TrendingUp } from 'lucide-react'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { formatPrice, formatChange } from '@/utils/format'
import { cn } from '@/utils/cn'

interface WatchlistWidgetProps {
  id: string
}

// Persist watchlist to localStorage
const WATCHLIST_KEY = 'godel-watchlist'

function loadWatchlist(): string[] {
  try {
    const saved = localStorage.getItem(WATCHLIST_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveWatchlist(tickers: string[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers))
}

export function WatchlistWidget({ id }: WatchlistWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const addWidget = useWorkspaceStore(s => s.addWidget)
  const setActiveTicker = useWorkspaceStore(s => s.setActiveTicker)
  const markets = useMarketDataStore(s => s.markets)

  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist)
  const [addMode, setAddMode] = useState(false)
  const [newTicker, setNewTicker] = useState('')

  const handleAdd = () => {
    const ticker = newTicker.trim().toUpperCase()
    if (ticker && !watchlist.includes(ticker)) {
      const updated = [...watchlist, ticker]
      setWatchlist(updated)
      saveWatchlist(updated)
    }
    setNewTicker('')
    setAddMode(false)
  }

  const handleRemove = (ticker: string) => {
    const updated = watchlist.filter(t => t !== ticker)
    setWatchlist(updated)
    saveWatchlist(updated)
  }

  const handleSelect = (ticker: string) => {
    setActiveTicker(ticker)
  }

  const handleOpenChart = (ticker: string) => {
    addWidget('chart', ticker)
  }

  return (
    <BaseWidget
      id={id}
      title="Watchlist"
      onRemove={() => removeWidget(id)}
      headerActions={
        <button
          onClick={() => setAddMode(true)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          title="Add ticker"
        >
          <Plus className="w-3 h-3 text-slate-400" />
        </button>
      }
    >
      <div className="h-full flex flex-col font-mono text-xs">
        {/* Add ticker input */}
        {addMode && (
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              value={newTicker}
              onChange={e => setNewTicker(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setAddMode(false)
              }}
              placeholder="Enter ticker..."
              autoFocus
              className={cn(
                'flex-1 px-2 py-1',
                'bg-slate-800 border border-slate-700 rounded',
                'text-slate-300 placeholder:text-slate-600',
                'outline-none focus:border-cyan-500/50'
              )}
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1 bg-cyan-900/50 text-cyan-400 rounded hover:bg-cyan-800/50"
            >
              Add
            </button>
          </div>
        )}

        {/* Watchlist items */}
        <div className="flex-1 overflow-y-auto -mx-2">
          {watchlist.length === 0 ? (
            <div className="text-center text-slate-500 py-4">
              <p>No tickers in watchlist</p>
              <p className="text-xs mt-1">Click + to add</p>
            </div>
          ) : (
            watchlist.map(ticker => {
              const market = markets[ticker]
              const change = market
                ? formatChange(market.last_price, market.previous_price)
                : null

              return (
                <div
                  key={ticker}
                  className={cn(
                    'flex items-center justify-between px-2 py-1.5',
                    'hover:bg-slate-800/50 cursor-pointer',
                    'border-b border-slate-800'
                  )}
                  onClick={() => handleSelect(ticker)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{ticker}</span>
                    {market && (
                      <span className={cn(
                        change?.isPositive && 'text-green-400',
                        change?.isNegative && 'text-red-400',
                        !change?.isPositive && !change?.isNegative && 'text-slate-400'
                      )}>
                        {formatPrice(market.last_price)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleOpenChart(ticker)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Open chart"
                    >
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleRemove(ticker)
                      }}
                      className="p-1 hover:bg-red-900/50 rounded"
                      title="Remove"
                    >
                      <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </BaseWidget>
  )
}
