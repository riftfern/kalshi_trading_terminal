import { ReactNode } from 'react'
import { X, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'

interface BaseWidgetProps {
  id: string
  title: string
  ticker?: string
  children: ReactNode
  onRemove: () => void
  onMaximize?: () => void
  onRefresh?: () => void
  isMaximized?: boolean
  className?: string
  headerActions?: ReactNode
  isLoading?: boolean
  error?: string | null
}

export function BaseWidget({
  id: _id,
  title,
  ticker,
  children,
  onRemove,
  onMaximize,
  onRefresh,
  isMaximized,
  className,
  headerActions,
  isLoading,
  error,
}: BaseWidgetProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-slate-900 border border-slate-700 rounded',
        'overflow-hidden',
        className
      )}
    >
      {/* Header - drag handle */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2',
          'bg-slate-800 border-b border-slate-700',
          'widget-drag-handle'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-slate-400 truncate">{title}</span>
          {ticker && (
            <span className="text-xs font-bold text-cyan-400 shrink-0">{ticker}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {headerActions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn(
                'w-3 h-3 text-slate-400',
                isLoading && 'animate-spin'
              )} />
            </button>
          )}
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3 h-3 text-slate-400" />
              ) : (
                <Maximize2 className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-900/50 rounded transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading && !error ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400 text-sm text-center px-4">{error}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span className="text-xs">Loading...</span>
    </div>
  )
}
