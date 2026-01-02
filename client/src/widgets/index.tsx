import type { WidgetInstance } from '@/types/widget'
import { OrderBookWidget } from './OrderBookWidget'
import { MarketSelectorWidget } from './MarketSelectorWidget'
import { QuoteWidget } from './QuoteWidget'
import { ChartWidget } from './ChartWidget'
import { TradeHistoryWidget } from './TradeHistoryWidget'
import { WatchlistWidget } from './WatchlistWidget'

interface WidgetFactoryProps {
  widget: WidgetInstance
}

export function WidgetFactory({ widget }: WidgetFactoryProps) {
  const { id, type, ticker } = widget

  switch (type) {
    case 'orderbook':
      return <OrderBookWidget id={id} ticker={ticker} />
    case 'market-selector':
      return <MarketSelectorWidget id={id} />
    case 'quote':
      return <QuoteWidget id={id} ticker={ticker} />
    case 'chart':
      return <ChartWidget id={id} ticker={ticker} />
    case 'trade-history':
      return <TradeHistoryWidget id={id} ticker={ticker} />
    case 'watchlist':
      return <WatchlistWidget id={id} />
    default:
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          Unknown widget type: {type}
        </div>
      )
  }
}

export { BaseWidget } from './BaseWidget'
