/**
 * Command handlers for the terminal
 */

import { formatPrice, formatVolume, formatDate } from '../utils/format'
import MarketsTable from '../components/MarketsTable'
import QuoteBox from '../components/QuoteBox'
import OrderbookView from '../components/OrderbookView'
import CategoriesView from '../components/CategoriesView'

const commands = {
  help: helpCommand,
  markets: marketsCommand,
  m: marketsCommand,
  search: searchCommand,
  s: searchCommand,
  quote: quoteCommand,
  q: quoteCommand,
  book: bookCommand,
  b: bookCommand,
  categories: categoriesCommand,
  cat: categoriesCommand,
  events: eventsCommand,
  e: eventsCommand,
  status: statusCommand,
  clear: clearCommand,
  quit: quitCommand,
  exit: quitCommand
}

export async function executeCommand(cmd, args, ctx) {
  const handler = commands[cmd]

  if (!handler) {
    ctx.addOutput([
      { type: 'error', text: `Unknown command: ${cmd}` },
      { type: 'muted', text: "Type 'help' for available commands." }
    ])
    return
  }

  await handler(args, ctx)
}

async function helpCommand(args, { addOutput }) {
  addOutput([
    { type: 'info', text: '\nKALSHI TERMINAL - Command Reference\n' },
    { type: 'warning', text: 'Navigation & Discovery' },
    { type: 'default', text: '  markets [filter]      List active markets (alias: m)' },
    { type: 'default', text: '  search <query>        Search markets by keyword (alias: s)' },
    { type: 'default', text: '  quote <ticker>        Show detailed quote (alias: q)' },
    { type: 'default', text: '  book <ticker>         Show orderbook depth (alias: b)' },
    { type: 'default', text: '  categories            List all categories (alias: cat)' },
    { type: 'default', text: '  events <category>     List events in category (alias: e)\n' },
    { type: 'warning', text: 'System' },
    { type: 'default', text: '  status                Show API connection status' },
    { type: 'default', text: '  clear                 Clear the screen' },
    { type: 'default', text: '  help                  Show this help\n' },
    { type: 'warning', text: 'Examples' },
    { type: 'muted', text: '  markets               List all open markets' },
    { type: 'muted', text: '  markets climate       Filter markets by keyword' },
    { type: 'muted', text: '  search bitcoin        Search for bitcoin markets' },
    { type: 'muted', text: '  q KXWARMING-50        Quote for specific market' },
    { type: 'muted', text: '  b KXWARMING-50        Orderbook for market\n' }
  ])
}

async function marketsCommand(args, { addOutput }) {
  addOutput([{ type: 'info', text: 'Fetching markets...' }])

  try {
    const res = await fetch('/api/markets/all')
    const data = await res.json()

    if (data.error) throw new Error(data.error)

    let markets = data.markets || []

    // Filter if args provided
    if (args.length > 0) {
      const filter = args.join(' ').toLowerCase()
      markets = markets.filter(m =>
        m.ticker.toLowerCase().includes(filter) ||
        (m.title && m.title.toLowerCase().includes(filter))
      )
    }

    if (markets.length === 0) {
      addOutput([{ type: 'warning', text: 'No markets found' }])
      return
    }

    // Sort by volume and take top 50
    markets.sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0))
    const displayMarkets = markets.slice(0, 50)

    addOutput([
      { type: 'info', text: `\n${args.length ? `MARKETS: "${args.join(' ').toUpperCase()}"` : 'ACTIVE MARKETS'} (${markets.length} found)\n` },
      { component: <MarketsTable markets={displayMarkets} /> }
    ])

    if (markets.length > 50) {
      addOutput([{ type: 'muted', text: `\nShowing top 50 of ${markets.length} by volume` }])
    }

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function searchCommand(args, { addOutput }) {
  if (args.length === 0) {
    addOutput([{ type: 'warning', text: 'Usage: search <query>' }])
    return
  }

  const query = args.join(' ')
  addOutput([{ type: 'info', text: `Searching for "${query}"...` }])

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()

    if (data.error) throw new Error(data.error)

    const markets = data.markets || []

    if (markets.length === 0) {
      addOutput([{ type: 'warning', text: `No markets found for "${query}"` }])
      return
    }

    markets.sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0))

    addOutput([
      { type: 'info', text: `\nSEARCH: "${query}" (${markets.length} results)\n` },
      { component: <MarketsTable markets={markets.slice(0, 50)} /> }
    ])

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function quoteCommand(args, { addOutput }) {
  if (args.length === 0) {
    addOutput([{ type: 'warning', text: 'Usage: quote <ticker>' }])
    return
  }

  const ticker = args[0].toUpperCase()
  addOutput([{ type: 'info', text: `Fetching quote for ${ticker}...` }])

  try {
    const res = await fetch(`/api/markets/${ticker}`)
    const market = await res.json()

    if (market.error) throw new Error(market.error)

    addOutput([{ component: <QuoteBox market={market} /> }])

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function bookCommand(args, { addOutput }) {
  if (args.length === 0) {
    addOutput([{ type: 'warning', text: 'Usage: book <ticker>' }])
    return
  }

  const ticker = args[0].toUpperCase()
  addOutput([{ type: 'info', text: `Fetching orderbook for ${ticker}...` }])

  try {
    const [marketRes, bookRes] = await Promise.all([
      fetch(`/api/markets/${ticker}`),
      fetch(`/api/markets/${ticker}/orderbook?depth=10`)
    ])

    const market = await marketRes.json()
    const orderbook = await bookRes.json()

    if (orderbook.error) throw new Error(orderbook.error)

    addOutput([{ component: <OrderbookView orderbook={orderbook} market={market} /> }])

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function categoriesCommand(args, { addOutput }) {
  addOutput([{ type: 'info', text: 'Fetching categories...' }])

  try {
    const res = await fetch('/api/events?limit=200')
    const data = await res.json()

    if (data.error) throw new Error(data.error)

    const events = data.events || []

    // Group by category
    const categories = {}
    events.forEach(e => {
      const cat = e.category || 'Other'
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(e)
    })

    addOutput([{ component: <CategoriesView categories={categories} /> }])

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function eventsCommand(args, { addOutput }) {
  if (args.length === 0) {
    return categoriesCommand(args, { addOutput })
  }

  const categoryQuery = args.join(' ').toLowerCase()
  addOutput([{ type: 'info', text: `Fetching events for "${categoryQuery}"...` }])

  try {
    const res = await fetch('/api/events?limit=200')
    const data = await res.json()

    if (data.error) throw new Error(data.error)

    const events = (data.events || []).filter(e =>
      (e.category || '').toLowerCase().includes(categoryQuery)
    )

    if (events.length === 0) {
      addOutput([
        { type: 'warning', text: `No events found for "${categoryQuery}"` },
        { type: 'muted', text: "Use 'categories' to see available categories" }
      ])
      return
    }

    addOutput([
      { type: 'info', text: `\n${events[0].category.toUpperCase()} EVENTS (${events.length})\n` }
    ])

    events.forEach(e => {
      addOutput([
        { type: 'default', text: `  ${e.event_ticker}` },
        { type: 'muted', text: `    ${e.title}` }
      ])
    })

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

async function statusCommand(args, { addOutput }) {
  try {
    const res = await fetch('/api/status')
    const data = await res.json()

    addOutput([
      { type: 'info', text: '\nConnection Status\n' },
      { type: 'default', text: `  Status:      ${data.connected ? 'Connected' : 'Disconnected'}` },
      { type: 'default', text: `  Environment: ${data.environment}` },
      { type: 'default', text: `  Endpoint:    ${data.baseUrl}` }
    ])

    if (data.balance) {
      addOutput([
        { type: 'info', text: '\nAccount\n' },
        { type: 'default', text: `  Balance:     $${(data.balance.balance / 100).toFixed(2)}` }
      ])
    }

  } catch (err) {
    addOutput([{ type: 'error', text: `Error: ${err.message}` }])
  }
}

function clearCommand(args, { clearOutput }) {
  clearOutput()
}

function quitCommand(args, { addOutput }) {
  addOutput([{ type: 'muted', text: 'Close this browser tab to exit.' }])
}
