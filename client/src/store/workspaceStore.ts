import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WidgetType, WidgetInstance, WidgetConfig, WorkspaceLayouts, LayoutItem } from '@/types/widget'
import { DEFAULT_WIDGET_SIZES } from '@/types/widget'

interface WorkspaceState {
  // Widget instances
  widgets: WidgetInstance[]

  // Grid layout (react-grid-layout format)
  layouts: WorkspaceLayouts

  // Active ticker (for linked widgets)
  activeTicker: string | null

  // Command palette state
  commandPaletteOpen: boolean

  // Actions
  addWidget: (type: WidgetType, ticker?: string, config?: WidgetConfig) => string
  removeWidget: (id: string) => void
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void
  updateWidgetTicker: (id: string, ticker: string) => void
  updateLayouts: (layouts: WorkspaceLayouts) => void
  setActiveTicker: (ticker: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  resetWorkspace: () => void
  loadPreset: (preset: 'trading' | 'research' | 'minimal') => void
}

let widgetCounter = 0

function generateWidgetId(type: WidgetType): string {
  return `${type}-${++widgetCounter}-${Date.now()}`
}

function generateWidgetTitle(type: WidgetType, ticker?: string): string {
  const typeLabels: Record<WidgetType, string> = {
    'orderbook': 'Order Book',
    'chart': 'Chart',
    'trade-history': 'Trade History',
    'market-selector': 'Markets',
    'quote': 'Quote',
    'watchlist': 'Watchlist',
  }
  const label = typeLabels[type]
  return ticker ? `${label}: ${ticker}` : label
}

function findNextPosition(layouts: LayoutItem[], newWidth: number): { x: number; y: number } {
  if (layouts.length === 0) {
    return { x: 0, y: 0 }
  }

  // Find the bottom-most item to calculate next row position
  const maxY = Math.max(...layouts.map(l => l.y + l.h))

  // Try to find a gap in existing rows first
  for (let y = 0; y <= maxY; y++) {
    // Find items that occupy this row
    const itemsInRow = layouts.filter(l => l.y <= y && l.y + l.h > y)

    // Find occupied x positions in this row
    const occupiedRanges = itemsInRow.map(l => ({ start: l.x, end: l.x + l.w }))

    // Try each possible x position
    for (let x = 0; x <= 12 - newWidth; x++) {
      const fits = !occupiedRanges.some(range =>
        (x < range.end && x + newWidth > range.start)
      )
      if (fits) {
        return { x, y }
      }
    }
  }

  // No gap found, add to new row at the bottom
  return { x: 0, y: maxY }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      widgets: [],
      layouts: { lg: [], md: [], sm: [] },
      activeTicker: null,
      commandPaletteOpen: false,

      addWidget: (type, ticker, config = {}) => {
        const id = generateWidgetId(type)
        const title = generateWidgetTitle(type, ticker)
        const size = DEFAULT_WIDGET_SIZES[type]

        const widget: WidgetInstance = {
          id,
          type,
          ticker,
          title,
          config,
        }

        const position = findNextPosition(get().layouts.lg, size.w)

        const layoutItem: LayoutItem = {
          i: id,
          x: position.x,
          y: position.y,
          w: size.w,
          h: size.h,
          minW: size.minW,
          minH: size.minH,
        }

        set(state => ({
          widgets: [...state.widgets, widget],
          layouts: {
            lg: [...state.layouts.lg, layoutItem],
            md: [...state.layouts.md, { ...layoutItem, w: Math.min(size.w, 6) }],
            sm: [...state.layouts.sm, { ...layoutItem, w: 6, x: 0 }],
          },
        }))

        return id
      },

      removeWidget: (id) => {
        set(state => ({
          widgets: state.widgets.filter(w => w.id !== id),
          layouts: {
            lg: state.layouts.lg.filter(l => l.i !== id),
            md: state.layouts.md.filter(l => l.i !== id),
            sm: state.layouts.sm.filter(l => l.i !== id),
          },
        }))
      },

      updateWidgetConfig: (id, config) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, config: { ...w.config, ...config } } : w
          ),
        }))
      },

      updateWidgetTicker: (id, ticker) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id
              ? { ...w, ticker, title: generateWidgetTitle(w.type, ticker) }
              : w
          ),
        }))
      },

      updateLayouts: (layouts) => set({ layouts }),

      setActiveTicker: (ticker) => set({ activeTicker: ticker }),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleCommandPalette: () => set(state => ({
        commandPaletteOpen: !state.commandPaletteOpen
      })),

      resetWorkspace: () => set({
        widgets: [],
        layouts: { lg: [], md: [], sm: [] },
        activeTicker: null,
      }),

      loadPreset: (preset) => {
        const { resetWorkspace, addWidget } = get()
        resetWorkspace()

        const presetWidgets: Record<string, WidgetType[]> = {
          trading: ['market-selector', 'orderbook', 'chart', 'trade-history'],
          research: ['market-selector', 'quote', 'chart'],
          minimal: ['market-selector', 'orderbook'],
        }

        presetWidgets[preset].forEach(type => addWidget(type))
      },
    }),
    {
      name: 'godel-workspace',
      partialize: (state) => ({
        widgets: state.widgets,
        layouts: state.layouts,
        activeTicker: state.activeTicker,
      }),
    }
  )
)
