import { useEffect, useCallback, useState } from 'react'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { formatPrice, formatVolume } from '@/utils/format'
import { normalizeOrderbook, aggregateOrderbook } from '@/utils/kalshiOrderbook'

interface OrderBookWidgetProps {
  id: string
  ticker?: string
}

export function OrderBookWidget({ id, ticker }: OrderBookWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const orderbook = useMarketDataStore(s => ticker ? s.orderbooks[ticker] : undefined)
  const setOrderbook = useMarketDataStore(s => s.setOrderbook)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderbook = useCallback(async () => {
    if (!ticker) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/markets/${ticker}/orderbook?depth=10`)
      if (!res.ok) throw new Error('Failed to fetch orderbook')
      const data = await res.json()
      setOrderbook(ticker, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [ticker, setOrderbook])

  useEffect(() => {
    fetchOrderbook()
    // Poll every 2 seconds
    const interval = setInterval(fetchOrderbook, 2000)
    return () => clearInterval(interval)
  }, [fetchOrderbook])

  if (!ticker) {
    return (
      <BaseWidget
        id={id}
        title="Order Book"
        onRemove={() => removeWidget(id)}
      >
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          Select a market to view orderbook
        </div>
      </BaseWidget>
    )
  }

  const normalized = orderbook ? normalizeOrderbook(orderbook) : null
  const aggregated = normalized ? aggregateOrderbook(normalized, 10) : null

  return (
    <BaseWidget
      id={id}
      title="Order Book"
      ticker={ticker}
      onRemove={() => removeWidget(id)}
      onRefresh={fetchOrderbook}
      isLoading={isLoading && !orderbook}
      error={error}
    >
      {aggregated && (
        <div className="flex flex-col h-full font-mono text-xs">
          {/* Header row */}
          <div className="flex border-b border-slate-700 pb-1 mb-1">
            <div className="flex-1 text-center text-green-400 font-bold">BIDS (YES)</div>
            <div className="flex-1 text-center text-red-400 font-bold">ASKS</div>
          </div>

          {/* Orderbook levels */}
          <div className="flex flex-1 gap-2 overflow-hidden">
            {/* Bids */}
            <div className="flex-1 flex flex-col">
              {aggregated.bids.length === 0 ? (
                <div className="text-slate-500 text-center py-2">No bids</div>
              ) : (
                aggregated.bids.map(([price, qty], i) => (
                  <div
                    key={i}
                    className="flex justify-between px-2 py-0.5 relative"
                  >
                    <div
                      className="absolute inset-0 bg-green-900/30"
                      style={{ width: `${(qty / aggregated.maxQty) * 100}%` }}
                    />
                    <span className="relative z-10">{formatVolume(qty)}</span>
                    <span className="relative z-10 text-green-400">{formatPrice(price)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Asks */}
            <div className="flex-1 flex flex-col">
              {aggregated.asks.length === 0 ? (
                <div className="text-slate-500 text-center py-2">No asks</div>
              ) : (
                aggregated.asks.map(([price, qty], i) => (
                  <div
                    key={i}
                    className="flex justify-between px-2 py-0.5 relative"
                  >
                    <div
                      className="absolute inset-0 right-0 left-auto bg-red-900/30"
                      style={{ width: `${(qty / aggregated.maxQty) * 100}%` }}
                    />
                    <span className="relative z-10 text-red-400">{formatPrice(price)}</span>
                    <span className="relative z-10">{formatVolume(qty)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer with spread info */}
          <div className="border-t border-slate-700 pt-1 mt-1 text-slate-500 flex justify-between">
            <span>Spread: {normalized ? formatPrice(normalized.spread) : '-'}</span>
            <span>Mid: {normalized ? formatPrice(normalized.midpoint) : '-'}</span>
          </div>
        </div>
      )}
    </BaseWidget>
  )
}
