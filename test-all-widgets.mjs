/**
 * Comprehensive test for all vanilla widgets
 */
import puppeteer from 'puppeteer-core';

const TEST_TICKER = 'KXMVESPORTSMULTIGAMEEXTENDED-S202511FB329DE4F-AB0877D8167';

async function testAllWidgets() {
  console.log('🧪 Testing All Vanilla Widgets\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(`❌ ${error.message}`);
  });

  // Navigate to vanilla app
  console.log('📍 Navigating to http://localhost:3000/vanilla.html');
  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Step 1: Clear workspace\n');
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
  });

  // Test 1: Add OrderBook Widget
  console.log('📊 Test 1: OrderBook Widget');
  await page.evaluate((ticker) => {
    window.__addWidget('orderbook', ticker);
  }, TEST_TICKER);
  await new Promise(resolve => setTimeout(resolve, 4000));

  const orderbookStatus = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-orderbook"]');
    if (!widget) return 'Widget DOM not found';

    const hasTitle = widget.textContent.includes('Orderbook');
    const hasBidsHeader = widget.textContent.includes('BIDS');
    const hasPerspectiveToggle = widget.querySelector('button[title*="perspective"]') !== null;
    const hasLoadingOrError = widget.textContent.includes('Loading') || widget.textContent.includes('Error');

    if (hasLoadingOrError) {
      return `⏳ ${widget.textContent.includes('Loading') ? 'Loading...' : 'Error'}`;
    }

    return hasTitle && hasBidsHeader && hasPerspectiveToggle ? '✅ Working' : `❌ Missing: ${!hasTitle ? 'title ' : ''}${!hasBidsHeader ? 'bids ' : ''}${!hasPerspectiveToggle ? 'toggle' : ''}`;
  });
  console.log(`   OrderBook: ${orderbookStatus}\n`);

  // Test 2: Add Quote Widget
  console.log('📈 Test 2: Quote Widget');
  await page.evaluate((ticker) => {
    window.__addWidget('quote', ticker);
  }, TEST_TICKER);
  await new Promise(resolve => setTimeout(resolve, 4000));

  const quoteStatus = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-quote"]');
    if (!widget) return 'Widget DOM not found';

    const hasTitle = widget.textContent.includes('Quote');
    const hasBidAsk = widget.textContent.includes('Bid') && widget.textContent.includes('Ask');
    const hasVolume = widget.textContent.includes('Volume');

    return hasTitle && hasBidAsk && hasVolume ? '✅ Working' : '❌ Missing elements';
  });
  console.log(`   Quote: ${quoteStatus}\n`);

  // Test 3: Add Market Selector Widget
  console.log('🔍 Test 3: Market Selector Widget');
  await page.evaluate(() => {
    window.__addWidget('market-selector');
  });
  await new Promise(resolve => setTimeout(resolve, 4000));

  const marketSelectorStatus = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    if (!widget) return 'Widget DOM not found';

    const hasSearchInput = widget.querySelector('input[type="text"]') !== null;
    const hasTitle = widget.textContent.includes('Markets');

    return hasSearchInput && hasTitle ? '✅ Working' : '❌ Missing elements';
  });
  console.log(`   Market Selector: ${marketSelectorStatus}\n`);

  // Test 4: Add Trade History Widget
  console.log('📜 Test 4: Trade History Widget');
  await page.evaluate((ticker) => {
    window.__addWidget('trade-history', ticker);
  }, TEST_TICKER);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tradeHistoryStatus = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-trade-history"]');
    if (!widget) return 'Widget DOM not found';

    const hasTitle = widget.textContent.includes('Trade History');
    const hasHeaders = widget.textContent.includes('Price') &&
                      widget.textContent.includes('Qty') &&
                      widget.textContent.includes('Side');

    return hasTitle && hasHeaders ? '✅ Working' : '❌ Missing elements';
  });
  console.log(`   Trade History: ${tradeHistoryStatus}\n`);

  // Test 5: Add Watchlist Widget
  console.log('⭐ Test 5: Watchlist Widget');
  await page.evaluate(() => {
    window.__addWidget('watchlist');
  });
  await new Promise(resolve => setTimeout(resolve, 1000));

  const watchlistStatus = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-watchlist"]');
    if (!widget) return 'Widget DOM not found';

    const hasTitle = widget.textContent.includes('Watchlist');
    const hasAddButton = widget.querySelector('button[title="Add ticker"]') !== null;

    return hasTitle && hasAddButton ? '✅ Working' : '❌ Missing elements';
  });
  console.log(`   Watchlist: ${watchlistStatus}\n`);

  // Test 6: Check widget count
  const widgetCount = await page.evaluate(() => {
    return document.querySelectorAll('[id^="widget-"]').length;
  });
  console.log(`📦 Total widgets rendered: ${widgetCount}/5\n`);

  // Take screenshot
  await page.screenshot({ path: 'all-widgets-test.png', fullPage: true });
  console.log('📸 Screenshot saved: all-widgets-test.png\n');

  if (errors.length > 0) {
    console.log('❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('✅ No JavaScript errors!');
  }

  await browser.disconnect();
  console.log('\n✨ Test complete!\n');
}

testAllWidgets().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
