import { formatPrice, formatVolume } from '../utils/format'

function OrderbookView({ orderbook, market }) {
  if (!orderbook) {
    return <div className="msg-error">Orderbook not available</div>
  }

  const { yes: bids = [], no: asks = [] } = orderbook

  // Find max quantity for bar scaling
  const allQtys = [...bids.map(([, q]) => q), ...asks.map(([, q]) => q)]
  const maxQty = Math.max(...allQtys, 1)

  // Calculate totals
  const totalBid = bids.reduce((sum, [, q]) => sum + q, 0)
  const totalAsk = asks.reduce((sum, [, q]) => sum + q, 0)

  return (
    <div>
      {market && (
        <div style={{ marginBottom: '12px', color: 'var(--accent-cyan)' }}>
          <strong>{market.ticker}</strong> ORDERBOOK
        </div>
      )}

      <div className="orderbook">
        {/* Bids */}
        <div className="orderbook-side orderbook-bids">
          <div className="orderbook-header">BIDS (YES)</div>
          {bids.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>No bids</div>
          ) : (
            bids.slice(0, 10).map(([price, qty], i) => (
              <div
                key={i}
                className="orderbook-row"
                style={{ '--depth': `${(qty / maxQty) * 100}%` }}
              >
                <span>{formatVolume(qty)}</span>
                <span style={{ color: 'var(--accent-green)' }}>{formatPrice(price)}</span>
              </div>
            ))
          )}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', fontSize: '11px' }}>
            Total: {formatVolume(totalBid)}
          </div>
        </div>

        {/* Asks (NO bids = YES asks) */}
        <div className="orderbook-side orderbook-asks">
          <div className="orderbook-header">ASKS (NO)</div>
          {asks.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>No asks</div>
          ) : (
            asks.slice(0, 10).map(([price, qty], i) => {
              const yesPrice = 100 - price
              return (
                <div
                  key={i}
                  className="orderbook-row"
                  style={{ '--depth': `${(qty / maxQty) * 100}%` }}
                >
                  <span style={{ color: 'var(--accent-red)' }}>{formatPrice(yesPrice)}</span>
                  <span>{formatVolume(qty)}</span>
                </div>
              )
            })
          )}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', fontSize: '11px', textAlign: 'right' }}>
            Total: {formatVolume(totalAsk)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderbookView
