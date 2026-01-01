import { useRef, useEffect, useState } from 'react'

function Terminal({ output, status, onCommand, onPrevious, onNext }) {
  const [input, setInput] = useState('')
  const contentRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [output])

  // Focus input on click anywhere
  const handleClick = () => {
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = onPrevious()
      if (prev !== null) setInput(prev)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = onNext()
      if (next !== null) setInput(next)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      onCommand('clear')
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return (
    <div className="terminal" onClick={handleClick}>
      {/* Header */}
      <div className="header">
        <div className="header-title">KALSHI TERMINAL v0.2.0</div>
        <div className="header-status">
          <div className="status-indicator">
            <div className={`status-dot ${status.connected ? '' : 'disconnected'}`} />
            <span>{status.connected ? `Connected (${status.environment})` : 'Disconnected'}</span>
          </div>
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Input */}
      <div className="input-area">
        <span className="input-prompt">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          autoFocus
        />
      </div>

      {/* Content */}
      <div className="content" ref={contentRef}>
        <div className="output">
          {output.map((line, i) => (
            <OutputLine key={i} {...line} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OutputLine({ type, text, component }) {
  // If a custom component is provided, render it
  if (component) {
    return <div className="output-line">{component}</div>
  }

  const className = `output-line ${type ? `msg-${type}` : ''}`

  return <div className={className}>{text}</div>
}

export default Terminal
