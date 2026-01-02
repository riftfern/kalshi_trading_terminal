import { useEffect, useRef, useState } from 'react'
import { createChart, LineSeries, type UTCTimestamp } from 'lightweight-charts'
import { BaseWidget } from '../BaseWidget'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { cn } from '@/utils/cn'

interface ChartWidgetProps {
  id: string
  ticker?: string
}

interface ChartDataPoint {
  time: UTCTimestamp
  value: number
}

// Generate mock price history for demo
function generateMockHistory(): ChartDataPoint[] {
  const now = Math.floor(Date.now() / 1000)
  const data: ChartDataPoint[] = []
  let price = 50 + Math.random() * 30

  for (let i = 24 * 12; i >= 0; i--) {
    const time = (now - i * 5 * 60) as UTCTimestamp
    price = Math.max(5, Math.min(95, price + (Math.random() - 0.5) * 5))
    data.push({ time, value: price })
  }

  return data
}

export function ChartWidget({ id, ticker }: ChartWidgetProps) {
  const removeWidget = useWorkspaceStore(s => s.removeWidget)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W'>('1D')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !ticker) return

    const container = chartContainerRef.current

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#888888',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      rightPriceScale: {
        borderColor: '#333333',
      },
      timeScale: {
        borderColor: '#333333',
        timeVisible: true,
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#00d4ff',
      lineWidth: 2,
    })

    setIsLoading(true)
    setTimeout(() => {
      const data = generateMockHistory()
      lineSeries.setData(data)
      chart.timeScale().fitContent()
      setIsLoading(false)
    }, 300)

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [ticker, timeframe])

  if (!ticker) {
    return (
      <BaseWidget
        id={id}
        title="Chart"
        onRemove={() => removeWidget(id)}
      >
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          Select a market to view chart
        </div>
      </BaseWidget>
    )
  }

  return (
    <BaseWidget
      id={id}
      title="Chart"
      ticker={ticker}
      onRemove={() => removeWidget(id)}
      isLoading={isLoading}
      headerActions={
        <div className="flex gap-1 mr-2">
          {(['1H', '1D', '1W'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-1.5 py-0.5 text-xs rounded transition-colors',
                timeframe === tf
                  ? 'bg-cyan-900/50 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      }
    >
      <div ref={chartContainerRef} className="w-full h-full" />
    </BaseWidget>
  )
}
