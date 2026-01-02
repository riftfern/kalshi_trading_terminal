import { useEffect, useState, useCallback } from 'react'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { formatPrice, formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Fill } from '@/types/market'

interface TradeHistoryWidgetProps {
  id: string
  ticker?: string
}

// Generate mock fills for demo
function generateMockFills(ticker: string, count: number = 20): Fill[] {
  const fills: Fill[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'yes' : 'no'
    const price = Math.floor(30 + Math.random() * 40)

    fills.push({
      ticker,
      trade_id: `trade-${i}-${Date.now()}`,
      price,
      count: Math.floor(1 + Math.random() * 50),
      side,
      action: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date(now - i * 30000 - Math.random() * 30000).toISOString(),
      is_taker: Math.random() > 0.5,
    })
  }

  return fills
}

export function TradeHistoryWidget({ id, ticker }: TradeHistoryWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const fills = useMarketDataStore(s => ticker ? s.fills[ticker] : undefined)
  const setFills = useMarketDataStore(s => s.setFills)
  const [isLoading, setIsLoading] = useState(false)

  const fetchFills = useCallback(async () => {
    if (!ticker) return

    setIsLoading(true)

    // In production, this would be an API call
    // For now, generate mock data
    setTimeout(() => {
      const mockFills = generateMockFills(ticker)
      setFills(ticker, mockFills)
      setIsLoading(false)
    }, 300)
  }, [ticker, setFills])

  useEffect(() => {
    fetchFills()
    // In production, this would be WebSocket subscription
    const interval = setInterval(fetchFills, 5000)
    return () => clearInterval(interval)
  }, [fetchFills])

  if (!ticker) {
    return (
      <BaseWidget
        id={id}
        title="Trade History"
        onRemove={() => removeWidget(id)}
      >
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          Select a market to view trades
        </div>
      </BaseWidget>
    )
  }

  return (
    <BaseWidget
      id={id}
      title="Trade History"
      ticker={ticker}
      onRemove={() => removeWidget(id)}
      onRefresh={fetchFills}
      isLoading={isLoading && !fills}
    >
      <div className="h-full overflow-y-auto font-mono text-xs">
        {/* Header */}
        <div className="flex justify-between px-1 pb-1 border-b border-slate-700 text-slate-500 sticky top-0 bg-slate-900">
          <span className="w-12">Price</span>
          <span className="w-10 text-right">Qty</span>
          <span className="w-8 text-center">Side</span>
          <span className="flex-1 text-right">Time</span>
        </div>

        {/* Trades */}
        {fills?.map((fill) => (
          <div
            key={fill.trade_id}
            className={cn(
              'flex justify-between px-1 py-0.5',
              'hover:bg-slate-800/50'
            )}
          >
            <span className={cn(
              'w-12',
              fill.side === 'yes' ? 'text-green-400' : 'text-red-400'
            )}>
              {formatPrice(fill.price)}
            </span>
            <span className="w-10 text-right text-slate-400">
              {fill.count}
            </span>
            <span className={cn(
              'w-8 text-center uppercase',
              fill.side === 'yes' ? 'text-green-400' : 'text-red-400'
            )}>
              {fill.side}
            </span>
            <span className="flex-1 text-right text-slate-600">
              {formatTime(fill.timestamp)}
            </span>
          </div>
        ))}

        {(!fills || fills.length === 0) && !isLoading && (
          <div className="text-center text-slate-500 py-4">
            No recent trades
          </div>
        )}
      </div>
    </BaseWidget>
  )
}
