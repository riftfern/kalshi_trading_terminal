/**
 * Test OrderBook with a market that has liquidity
 */
import puppeteer from 'puppeteer-core';

const TICKER_WITH_LIQUIDITY = 'KXMVESPORTSMULTIGAMEEXTENDED-S2025B68844DC239-5D188D810F1';

async function testOrderBookWithLiquidity() {
  console.log('🧪 Testing OrderBook with market that has liquidity\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Clear workspace
  console.log('🔧 Clearing workspace and adding OrderBook widget...');
  await page.evaluate(() => window.__workspaceStore.setState({ widgets: [] }));

  // Add orderbook with ticker that has liquidity
  await page.evaluate((ticker) => {
    window.__addWidget('orderbook', ticker);
  }, TICKER_WITH_LIQUIDITY);

  // Wait for data to load
  await new Promise(r => setTimeout(r, 5000));

  // Check widget state
  const result = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-orderbook"]');
    if (!widget) return { found: false };

    return {
      found: true,
      hasBids: widget.textContent.includes('BIDS'),
      hasAsks: widget.textContent.includes('ASKS'),
      hasToggle: widget.querySelector('button[title*="perspective"]') !== null,
      isLoading: widget.textContent.includes('Loading'),
      hasError: widget.textContent.includes('Error') || widget.textContent.includes('Failed'),
      preview: widget.textContent.substring(0, 400)
    };
  });

  console.log('\n📊 Widget Status:');
  console.log(`   Found: ${result.found ? '✅' : '❌'}`);
  console.log(`   Has BIDS header: ${result.hasBids ? '✅' : '❌'}`);
  console.log(`   Has ASKS header: ${result.hasAsks ? '✅' : '❌'}`);
  console.log(`   Has perspective toggle: ${result.hasToggle ? '✅' : '❌'}`);
  console.log(`   Is loading: ${result.isLoading ? '⏳' : '✅'}`);
  console.log(`   Has error: ${result.hasError ? '❌' : '✅'}`);
  console.log(`\n   Preview:\n   ${result.preview}\n`);

  await page.screenshot({ path: 'orderbook-liquidity-test.png', fullPage: true });
  console.log('📸 Screenshot saved: orderbook-liquidity-test.png\n');

  await browser.disconnect();
}

testOrderBookWithLiquidity().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
