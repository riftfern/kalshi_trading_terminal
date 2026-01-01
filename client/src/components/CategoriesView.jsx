function CategoriesView({ categories }) {
  if (!categories || Object.keys(categories).length === 0) {
    return <div className="msg-warning">No categories found</div>
  }

  return (
    <div>
      <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '16px' }}>
        KALSHI CATEGORIES
      </div>

      {Object.entries(categories).sort().map(([category, events]) => (
        <div key={category} className="category">
          <div className="category-name">
            {category} ({events.length} events)
          </div>
          {events.slice(0, 3).map(e => (
            <div key={e.event_ticker} className="category-item">
              {e.event_ticker} - {e.title}
            </div>
          ))}
          {events.length > 3 && (
            <div className="category-item" style={{ fontStyle: 'italic' }}>
              ... and {events.length - 3} more
            </div>
          )}
        </div>
      ))}

      <div style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '12px' }}>
        Use: events &lt;category&gt; to see all events in a category
      </div>
    </div>
  )
}

export default CategoriesView
