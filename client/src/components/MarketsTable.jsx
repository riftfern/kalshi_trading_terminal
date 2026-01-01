import { formatPrice, formatVolume, formatDate } from '../utils/format'

function MarketsTable({ markets }) {
  if (!markets || markets.length === 0) {
    return <div className="msg-warning">No markets to display</div>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Volume</th>
          <th>Expires</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody>
        {markets.map(market => (
          <tr key={market.ticker}>
            <td className="ticker">{market.ticker}</td>
            <td className="price-bid">{formatPrice(market.yes_bid)}</td>
            <td className="price-ask">{formatPrice(market.yes_ask)}</td>
            <td className="volume">{formatVolume(market.volume_24h)}</td>
            <td>{formatDate(market.close_time || market.expiration_time)}</td>
            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {market.title}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default MarketsTable
