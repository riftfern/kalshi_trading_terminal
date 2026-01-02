import { useEffect, useState, useCallback } from 'react'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { formatPrice, formatVolume, formatDate, formatChange } from '@/utils/format'
import { cn } from '@/utils/cn'

interface QuoteWidgetProps {
  id: string
  ticker?: string
}

export function QuoteWidget({ id, ticker }: QuoteWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const market = useMarketDataStore(s => ticker ? s.markets[ticker] : undefined)
  const setMarket = useMarketDataStore(s => s.setMarket)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMarket = useCallback(async () => {
    if (!ticker) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/markets/${ticker}`)
      if (!res.ok) throw new Error('Failed to fetch market')
      const data = await res.json()
      setMarket(ticker, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [ticker, setMarket])

  useEffect(() => {
    fetchMarket()
    const interval = setInterval(fetchMarket, 5000)
    return () => clearInterval(interval)
  }, [fetchMarket])

  if (!ticker) {
    return (
      <BaseWidget
        id={id}
        title="Quote"
        onRemove={() => removeWidget(id)}
      >
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          Select a market to view quote
        </div>
      </BaseWidget>
    )
  }

  const change = market ? formatChange(market.last_price, market.previous_price) : null

  return (
    <BaseWidget
      id={id}
      title="Quote"
      ticker={ticker}
      onRemove={() => removeWidget(id)}
      onRefresh={fetchMarket}
      isLoading={isLoading && !market}
      error={error}
    >
      {market && (
        <div className="font-mono text-xs space-y-2">
          {/* Title */}
          <div className="text-sm text-slate-300 border-b border-slate-700 pb-2">
            {market.title}
          </div>

          {/* Price section */}
          <div className="grid grid-cols-2 gap-2">
            <QuoteRow label="Last" value={formatPrice(market.last_price)} />
            <QuoteRow
              label="Change"
              value={change?.text || '-'}
              className={cn(
                change?.isPositive && 'text-green-400',
                change?.isNegative && 'text-red-400'
              )}
            />
          </div>

          {/* Bid/Ask */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-2">
            <QuoteRow
              label="Bid (YES)"
              value={formatPrice(market.yes_bid)}
              className="text-green-400"
            />
            <QuoteRow
              label="Ask (YES)"
              value={formatPrice(market.yes_ask)}
              className="text-red-400"
            />
          </div>

          {/* Volume & OI */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-2">
            <QuoteRow label="Volume 24h" value={formatVolume(market.volume_24h)} />
            <QuoteRow label="Open Interest" value={formatVolume(market.open_interest)} />
          </div>

          {/* Status & Expiry */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-2">
            <QuoteRow
              label="Status"
              value={market.status.toUpperCase()}
              className={cn(
                market.status === 'open' && 'text-green-400',
                market.status === 'closed' && 'text-red-400'
              )}
            />
            <QuoteRow label="Expires" value={formatDate(market.close_time)} />
          </div>
        </div>
      )}
    </BaseWidget>
  )
}

interface QuoteRowProps {
  label: string
  value: string
  className?: string
}

function QuoteRow({ label, value, className }: QuoteRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-bold', className)}>{value}</span>
    </div>
  )
}
