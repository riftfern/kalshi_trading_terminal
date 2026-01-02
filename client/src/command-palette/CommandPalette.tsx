import { useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Fuse from 'fuse.js'
import { Search, LayoutGrid, BookOpen, TrendingUp, Eye, List, RotateCcw } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { cn } from '@/utils/cn'
import type { WidgetType } from '@/types/widget'
import type { Market } from '@/types/market'

interface CommandAction {
  id: string
  title: string
  subtitle?: string
  keywords?: string[]
  icon?: React.ReactNode
  type: 'spawn-widget' | 'action'
  widgetType?: WidgetType
  ticker?: string
  execute?: () => void
}

export function CommandPalette() {
  const isOpen = useWorkspaceStore(s => s.commandPaletteOpen)
  const setOpen = useWorkspaceStore(s => s.setCommandPaletteOpen)
  const addWidget = useWorkspaceStore(s => s.addWidget)
  const resetWorkspace = useWorkspaceStore(s => s.resetWorkspace)
  const loadPreset = useWorkspaceStore(s => s.loadPreset)
  const marketsMap = useMarketDataStore(s => s.markets)

  // Convert markets object to array - memoized to avoid infinite loop
  const markets = useMemo(() => Object.values(marketsMap), [marketsMap])

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build action list
  const actions = useMemo(() => getActions(markets, { resetWorkspace, loadPreset }), [markets, resetWorkspace, loadPreset])

  // Fuzzy search
  const fuse = useMemo(() => new Fuse(actions, {
    keys: ['title', 'subtitle', 'keywords'],
    threshold: 0.3,
    includeScore: true,
  }), [actions])

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show widget actions when empty
      return actions.filter(a => a.type === 'action' || !a.ticker).slice(0, 10)
    }
    return fuse.search(query).slice(0, 15).map(r => r.item)
  }, [query, fuse, actions])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Backtick to toggle (when not typing in an input)
      if (e.key === '`' && !isOpen) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setOpen(true)
        }
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const selectedItem = list.children[selectedIndex] as HTMLElement
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const action = results[selectedIndex]
      if (action) {
        executeAction(action)
      }
    }
  }

  const executeAction = (action: CommandAction) => {
    if (action.type === 'spawn-widget' && action.widgetType) {
      addWidget(action.widgetType, action.ticker)
    } else if (action.execute) {
      action.execute()
    }
    setOpen(false)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center pt-24 z-50"
      onClick={() => setOpen(false)}
    >
      <div
        className={cn(
          'w-full max-w-xl',
          'bg-slate-900 border border-slate-700 rounded-lg',
          'shadow-2xl overflow-hidden'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search markets, add widgets..."
            className={cn(
              'flex-1 bg-transparent',
              'text-lg font-mono text-slate-100',
              'outline-none placeholder:text-slate-500'
            )}
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {results.map((action, i) => (
            <div
              key={action.id}
              className={cn(
                'px-4 py-3 cursor-pointer',
                'flex items-center gap-3',
                i === selectedIndex ? 'bg-slate-800' : 'hover:bg-slate-800/50'
              )}
              onClick={() => executeAction(action)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className={cn(
                'w-8 h-8 rounded flex items-center justify-center',
                'text-sm',
                action.type === 'spawn-widget' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-slate-400'
              )}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 truncate">{action.title}</div>
                {action.subtitle && (
                  <div className="text-xs text-slate-500 truncate">{action.subtitle}</div>
                )}
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-500 flex gap-4">
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded">↵</kbd> select
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded">esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

function getActions(
  markets: Market[],
  { resetWorkspace, loadPreset }: {
    resetWorkspace: () => void
    loadPreset: (preset: 'trading' | 'research' | 'minimal') => void
  }
): CommandAction[] {
  const actions: CommandAction[] = [
    // Widget actions
    {
      id: 'add-market-selector',
      title: 'Add Market Selector',
      subtitle: 'Browse and search all markets',
      keywords: ['browse', 'search', 'find', 'markets'],
      icon: <LayoutGrid className="w-4 h-4" />,
      type: 'spawn-widget',
      widgetType: 'market-selector',
    },
    {
      id: 'add-watchlist',
      title: 'Add Watchlist',
      subtitle: 'Track favorite markets',
      keywords: ['favorites', 'track', 'watch'],
      icon: <List className="w-4 h-4" />,
      type: 'spawn-widget',
      widgetType: 'watchlist',
    },

    // Preset actions
    {
      id: 'preset-trading',
      title: 'Load Trading Layout',
      subtitle: 'Market selector, orderbook, chart, trade history',
      keywords: ['preset', 'layout', 'trading'],
      icon: <TrendingUp className="w-4 h-4" />,
      type: 'action',
      execute: () => loadPreset('trading'),
    },
    {
      id: 'preset-research',
      title: 'Load Research Layout',
      subtitle: 'Market selector, quote, chart',
      keywords: ['preset', 'layout', 'research'],
      icon: <Eye className="w-4 h-4" />,
      type: 'action',
      execute: () => loadPreset('research'),
    },
    {
      id: 'reset-workspace',
      title: 'Reset Workspace',
      subtitle: 'Clear all widgets',
      keywords: ['clear', 'reset', 'clean'],
      icon: <RotateCcw className="w-4 h-4" />,
      type: 'action',
      execute: resetWorkspace,
    },

    // Market-specific actions (from loaded markets)
    ...markets.slice(0, 100).flatMap((market): CommandAction[] => [
      {
        id: `orderbook-${market.ticker}`,
        title: `${market.ticker} Order Book`,
        subtitle: market.title,
        keywords: [market.ticker, 'orderbook', 'book', 'depth'],
        icon: <BookOpen className="w-4 h-4" />,
        type: 'spawn-widget',
        widgetType: 'orderbook',
        ticker: market.ticker,
      },
      {
        id: `chart-${market.ticker}`,
        title: `${market.ticker} Chart`,
        subtitle: market.title,
        keywords: [market.ticker, 'chart', 'price', 'graph'],
        icon: <TrendingUp className="w-4 h-4" />,
        type: 'spawn-widget',
        widgetType: 'chart',
        ticker: market.ticker,
      },
      {
        id: `quote-${market.ticker}`,
        title: `${market.ticker} Quote`,
        subtitle: market.title,
        keywords: [market.ticker, 'quote', 'price', 'details'],
        icon: <Eye className="w-4 h-4" />,
        type: 'spawn-widget',
        widgetType: 'quote',
        ticker: market.ticker,
      },
    ]),
  ]

  return actions
}
