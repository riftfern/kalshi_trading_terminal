import { Activity, Command } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useMarketDataStore } from '@/store/marketDataStore'
import { cn } from '@/utils/cn'

export function Header() {
  const activeTicker = useWorkspaceStore(s => s.activeTicker)
  const toggleCommandPalette = useWorkspaceStore(s => s.toggleCommandPalette)
  const apiConnected = useMarketDataStore(s => s.apiConnected)
  const wsConnected = useMarketDataStore(s => s.wsConnected)
  const environment = useMarketDataStore(s => s.environment)

  return (
    <header className={cn(
      'flex items-center justify-between px-4 py-2',
      'bg-gradient-to-b from-slate-800 to-slate-900',
      'border-b border-cyan-500/30'
    )}>
      {/* Left: Logo and title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm tracking-wide text-slate-200">
            <span className="line-through text-slate-500 mr-1">GODEL</span> KALSHI TRADING TERMINAL
          </span>
        </div>

        {activeTicker && (
          <>
            <div className="w-px h-4 bg-slate-600" />
            <span className="text-sm font-mono text-cyan-400">
              {activeTicker}
            </span>
          </>
        )}
      </div>

      {/* Center: Command palette trigger */}
      <button
        onClick={toggleCommandPalette}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5',
          'bg-slate-800/50 hover:bg-slate-700/50',
          'border border-slate-600 rounded',
          'text-xs text-slate-400 hover:text-slate-300',
          'transition-colors'
        )}
      >
        <Command className="w-3 h-3" />
        <span>Search markets...</span>
        <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">
          `
        </kbd>
      </button>

      {/* Right: Status and controls */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs">
          <StatusDot connected={apiConnected} label="API" />
          <StatusDot connected={wsConnected} label="WS" />
          <span className="text-slate-500">
            {environment.toUpperCase()}
          </span>
        </div>

        {/* Current time */}
        <CurrentTime />
      </div>
    </header>
  )
}

interface StatusDotProps {
  connected: boolean
  label: string
}

function StatusDot({ connected, label }: StatusDotProps) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn(
        'w-2 h-2 rounded-full',
        connected ? 'bg-green-400' : 'bg-red-400'
      )} />
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

function CurrentTime() {
  // For simplicity, render static time
  // In production, use a state update every second
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <span className="font-mono text-xs text-slate-400">
      {timeStr}
    </span>
  )
}
