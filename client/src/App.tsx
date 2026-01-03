import { useEffect, useState } from 'react'
// Note: Legacy React imports - vanilla.html is the primary entry point
// import { Header } from '@/components/Header'
// import { GridLayout } from '@/layout/GridLayout'
// import { CommandPalette } from '@/command-palette/CommandPalette'
import { useMarketDataStore } from '@/store/marketDataStore'

function App() {
  const [error, setError] = useState<string | null>(null)
  const setMarkets = useMarketDataStore(s => s.setMarkets)
  const setApiConnected = useMarketDataStore(s => s.setApiConnected)
  const setEnvironment = useMarketDataStore(s => s.setEnvironment)

  // Check API health and load initial data
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()

        setApiConnected(data.kalshi === 'connected')
        setEnvironment(data.environment || 'unknown')
      } catch {
        setApiConnected(false)
        setEnvironment('unknown')
      }
    }

    const loadMarkets = async () => {
      try {
        const res = await fetch('/api/markets/all')
        const data = await res.json()
        setMarkets(data.markets || [])
      } catch (err) {
        console.error('Failed to load markets:', err)
      }
    }

    checkHealth()
    loadMarkets()

    const healthInterval = setInterval(checkHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [setMarkets, setApiConnected, setEnvironment])

  // Global error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignore ResizeObserver loop errors - they're benign
      if (event.message?.includes('ResizeObserver')) {
        event.preventDefault()
        return
      }
      setError(event.message)
      console.error('Global error:', event.error)
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-red-400 p-8">
        <div className="text-center">
          <h1 className="text-xl mb-4">Error</h1>
          <pre className="text-sm text-left bg-slate-800 p-4 rounded">{error}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-300 font-mono">
      <div className="text-center max-w-md p-8">
        <h1 className="text-2xl mb-4 text-cyan-400">Kalshi Trading Terminal</h1>
        <p className="text-sm text-slate-400 mb-6">
          This React version is deprecated. Please use the vanilla TypeScript version instead.
        </p>
        <a
          href="/vanilla.html"
          className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
        >
          Open Vanilla Terminal →
        </a>
      </div>
    </div>
  )
}

export default App
