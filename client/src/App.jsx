import { useState, useEffect, useRef, useCallback } from 'react'
import Terminal from './components/Terminal'
import { executeCommand } from './commands/index.jsx'

function App() {
  const [output, setOutput] = useState([])
  const [status, setStatus] = useState({ connected: false, environment: 'unknown' })
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Check API status on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setStatus({
          connected: data.kalshi === 'connected',
          environment: data.environment
        })
        // Show welcome message
        addOutput([
          { type: 'info', text: 'Welcome to KalshiTerminal' },
          { type: 'muted', text: 'A Bloomberg-style terminal for Kalshi prediction markets.\n' },
          { type: 'default', text: "Type 'help' for available commands" },
          { type: 'default', text: "Type 'markets' to browse active markets\n" },
          data.kalshi === 'connected'
            ? { type: 'success', text: `Connected to Kalshi (${data.environment})` }
            : { type: 'error', text: 'Not connected to Kalshi API' }
        ])
      })
      .catch(() => {
        setStatus({ connected: false, environment: 'unknown' })
        addOutput([
          { type: 'error', text: 'Failed to connect to backend server' },
          { type: 'muted', text: 'Make sure the server is running: cd server && npm start' }
        ])
      })
  }, [])

  const addOutput = useCallback((lines) => {
    setOutput(prev => [...prev, ...lines])
  }, [])

  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  const handleCommand = useCallback(async (input) => {
    const trimmed = input.trim()
    if (!trimmed) return

    // Add to history
    setHistory(prev => [trimmed, ...prev.slice(0, 99)])
    setHistoryIndex(-1)

    // Echo command
    addOutput([{ type: 'command', text: `> ${trimmed}` }])

    // Parse and execute
    const [cmd, ...args] = trimmed.split(/\s+/)

    try {
      await executeCommand(cmd.toLowerCase(), args, { addOutput, clearOutput, setStatus })
    } catch (err) {
      addOutput([{ type: 'error', text: `Error: ${err.message}` }])
    }
  }, [addOutput, clearOutput])

  const getPreviousCommand = useCallback(() => {
    if (history.length === 0) return null
    const newIndex = Math.min(historyIndex + 1, history.length - 1)
    setHistoryIndex(newIndex)
    return history[newIndex]
  }, [history, historyIndex])

  const getNextCommand = useCallback(() => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1)
      return ''
    }
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    return history[newIndex]
  }, [history, historyIndex])

  return (
    <Terminal
      output={output}
      status={status}
      onCommand={handleCommand}
      onPrevious={getPreviousCommand}
      onNext={getNextCommand}
    />
  )
}

export default App
