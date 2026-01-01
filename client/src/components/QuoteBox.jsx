import { formatPrice, formatVolume, formatDateTime, formatSpread, formatPercent } from '../utils/format'

function QuoteBox({ market }) {
  if (!market) {
    return <div className="msg-error">Market not found</div>
  }

  const {
    ticker,
    title,
    yes_bid,
    yes_ask,
    last_price,
    previous_price,
    volume_24h,
    open_interest,
    status,
    close_time,
    expiration_time
  } = market

  const change = last_price != null && previous_price != null
    ? last_price - previous_price
    : null
  const changePercent = change != null && previous_price
    ? (change / previous_price) * 100
    : null

  return (
    <div className="quote-box">
      <div className="quote-header">
        <div>
          <div className="quote-ticker">{ticker}</div>
          <div className="quote-title">{title}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: status === 'open' || status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {status}
          </div>
        </div>
      </div>

      <div className="quote-row">
        <span className="quote-label">YES Price</span>
        <span className="quote-value" style={{ color: 'var(--accent-yellow)' }}>
          {formatPrice(last_price)}
        </span>
      </div>

      <div className="quote-row">
        <span className="quote-label">NO Price</span>
        <span className="quote-value">
          {formatPrice(100 - (last_price || 0))}
        </span>
      </div>

      <div className="quote-row">
        <span className="quote-label">24h Change</span>
        <span
          className="quote-value"
          style={{ color: change > 0 ? 'var(--accent-green)' : change < 0 ? 'var(--accent-red)' : 'inherit' }}
        >
          {change != null ? `${change > 0 ? '+' : ''}${formatPrice(change)} (${formatPercent(changePercent)})` : '-'}
        </span>
      </div>

      <div className="quote-row">
        <span className="quote-label">Bid / Ask</span>
        <span className="quote-value">
          <span style={{ color: 'var(--accent-green)' }}>{formatPrice(yes_bid)}</span>
          {' / '}
          <span style={{ color: 'var(--accent-red)' }}>{formatPrice(yes_ask)}</span>
        </span>
      </div>

      <div className="quote-row">
        <span className="quote-label">Spread</span>
        <span className="quote-value">{formatSpread(yes_bid, yes_ask)}</span>
      </div>

      <div className="quote-row">
        <span className="quote-label">24h Volume</span>
        <span className="quote-value">{formatVolume(volume_24h)}</span>
      </div>

      <div className="quote-row">
        <span className="quote-label">Open Interest</span>
        <span className="quote-value">{formatVolume(open_interest)}</span>
      </div>

      <div className="quote-row">
        <span className="quote-label">Expires</span>
        <span className="quote-value">{formatDateTime(close_time || expiration_time)}</span>
      </div>
    </div>
  )
}

export default QuoteBox
