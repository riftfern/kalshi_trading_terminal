export type WidgetType =
  | 'orderbook'
  | 'chart'
  | 'trade-history'
  | 'market-selector'
  | 'quote'
  | 'watchlist'

export interface WidgetConfig {
  // Orderbook specific
  depth?: number

  // Chart specific
  timeframe?: '1H' | '1D' | '1W' | '1M'
  chartType?: 'line' | 'candle'

  // Watchlist specific
  tickers?: string[]
}

export interface WidgetInstance {
  id: string
  type: WidgetType
  ticker?: string       // For market-specific widgets
  title: string
  config: WidgetConfig
}

// Layout item for react-grid-layout
export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export interface WorkspaceLayouts {
  lg: LayoutItem[]
  md: LayoutItem[]
  sm: LayoutItem[]
}

export interface LayoutPreset {
  name: string
  widgets: Omit<WidgetInstance, 'id'>[]
  layouts: WorkspaceLayouts
}

// Default sizes for each widget type (optimized for laptop screens)
export const DEFAULT_WIDGET_SIZES: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  'orderbook': { w: 3, h: 5, minW: 2, minH: 3 },
  'chart': { w: 5, h: 4, minW: 3, minH: 3 },
  'trade-history': { w: 3, h: 4, minW: 2, minH: 3 },
  'market-selector': { w: 3, h: 6, minW: 2, minH: 3 },
  'quote': { w: 3, h: 4, minW: 2, minH: 3 },
  'watchlist': { w: 3, h: 5, minW: 2, minH: 3 },
}
