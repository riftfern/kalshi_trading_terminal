/**
 * Find a market with orderbook data
 */

async function findOrderbook() {
  console.log('🔍 Finding markets with orderbook data\n');

  // Fetch markets
  const marketsRes = await fetch('http://localhost:3001/api/markets?limit=50');
  const marketsData = await marketsRes.json();
  const markets = marketsData.markets || [];

  console.log(`Found ${markets.length} markets\n`);

  for (const market of markets.slice(0, 10)) {
    try {
      const obRes = await fetch(`http://localhost:3001/api/markets/${market.ticker}/orderbook?depth=10`);
      const ob = await obRes.json();

      if (ob.bids?.length > 0 || ob.asks?.length > 0) {
        console.log(`✅ ${market.ticker}`);
        console.log(`   Title: ${market.title.substring(0, 80)}`);
        console.log(`   Bids: ${ob.bids.length} levels, Asks: ${ob.asks.length} levels`);
        console.log(`   Best Bid: ${ob.bestBid}¢, Best Ask: ${ob.bestAsk}¢`);
        console.log(`   Spread: ${ob.spread}¢, Mid: ${ob.midpoint}¢\n`);

        // Show reciprocal logic
        if (ob._raw) {
          console.log(`   Raw YES bids: ${ob._raw.yes?.length || 0}`);
          console.log(`   Raw NO bids: ${ob._raw.no?.length || 0}\n`);
        }

        return market.ticker;
      }
    } catch (e) {
      // Skip errors
    }
  }

  console.log('❌ No markets with orderbook data found in first 10 markets\n');
  return null;
}

findOrderbook().then(ticker => {
  if (ticker) {
    console.log(`\nUse this ticker for testing: ${ticker}`);
  }
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
