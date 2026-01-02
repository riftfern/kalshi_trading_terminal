import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WidgetFactory } from '@/widgets'
import type { WorkspaceLayouts } from '@/types/widget'

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 }
const COLS = { lg: 12, md: 8, sm: 6 }
const ROW_HEIGHT = 40  // Smaller row height for laptops
const MARGIN: [number, number] = [6, 6]
const CONTAINER_PADDING: [number, number] = [12, 12]

export function GridLayout() {
  const widgets = useWorkspaceStore(s => s.widgets)
  const layouts = useWorkspaceStore(s => s.layouts)
  const updateLayouts = useWorkspaceStore(s => s.updateLayouts)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  // Measure container width
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(container)
    setWidth(container.clientWidth)

    return () => observer.disconnect()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback(
    (_currentLayout: any, allLayouts: any) => {
      const converted: WorkspaceLayouts = {
        lg: allLayouts.lg || [],
        md: allLayouts.md || [],
        sm: allLayouts.sm || [],
      }
      updateLayouts(converted)
    },
    [updateLayouts]
  )

  const widgetElements = useMemo(() => {
    return widgets.map(widget => (
      <div key={widget.id} className="overflow-hidden">
        <WidgetFactory widget={widget} />
      </div>
    ))
  }, [widgets])

  if (widgets.length === 0) {
    return <EmptyState />
  }

  // Cast ResponsiveGridLayout to any to avoid complex type issues
  const RGL = ResponsiveGridLayout as any

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto">
      <RGL
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={CONTAINER_PADDING}
        width={width}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        isResizable
        isDraggable
        useCSSTransforms
      >
        {widgetElements}
      </RGL>
    </div>
  )
}

function EmptyState() {
  const setCommandPaletteOpen = useWorkspaceStore(s => s.setCommandPaletteOpen)
  const loadPreset = useWorkspaceStore(s => s.loadPreset)

  return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <div className="text-center max-w-md">
        <h2 className="text-lg text-slate-300 mb-2">
          Welcome to <span className="line-through text-slate-500">Godel</span> Kalshi Trading Terminal
        </h2>
        <p className="text-sm mb-6">
          A modular trading dashboard for Kalshi prediction markets
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
          >
            Press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-cyan-400 mx-1 font-mono">`</kbd> to add widgets
          </button>

          <div className="text-xs text-slate-600 mt-2">Or start with a preset:</div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => loadPreset('trading')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 transition-colors"
            >
              Trading
            </button>
            <button
              onClick={() => loadPreset('research')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 transition-colors"
            >
              Research
            </button>
            <button
              onClick={() => loadPreset('minimal')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 transition-colors"
            >
              Minimal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
