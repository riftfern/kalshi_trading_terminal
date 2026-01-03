/**
 * Test OrderBookWidget Reciprocal Transformer
 * Verifies that the backend hydrates missing Ask side using reciprocal logic
 */
import puppeteer from 'puppeteer-core';

async function testOrderbookReciprocal() {
  console.log('🧪 Testing OrderBook Reciprocal Transformer\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Capture network requests
  const apiRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      apiRequests.push({ url, method: request.method() });
    }
  });

  const apiResponses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/markets/') && url.includes('/orderbook')) {
      try {
        const data = await response.json();
        apiResponses.push({ url, status: response.status(), data });
      } catch (e) {
        apiResponses.push({ url, status: response.status(), error: 'Failed to parse JSON' });
      }
    }
  });

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Clear workspace
  await page.evaluate(() => window.__workspaceStore.setState({ widgets: [] }));

  console.log('✅ Step 1: Add OrderBookWidget\n');
  await page.evaluate(() => {
    window.__addWidget('orderbook', 'KXMACRO-24DEC31-B1575');
  });

  await new Promise(r => setTimeout(r, 5000)); // Wait for orderbook to load

  console.log('📡 Step 2: Check API Response\n');

  if (apiResponses.length === 0) {
    console.log('   ❌ No orderbook API responses captured!\n');
  } else {
    const obResponse = apiResponses[apiResponses.length - 1];
    console.log(`   Status: ${obResponse.status}`);
    console.log(`   URL: ${obResponse.url}\n`);

    if (obResponse.data) {
      const { bids, asks, spread, midpoint, bestBid, bestAsk } = obResponse.data;

      console.log('   Hydrated Orderbook Structure:');
      console.log(`   - Has bids array: ${Array.isArray(bids) ? '✅' : '❌'} (${bids?.length || 0} levels)`);
      console.log(`   - Has asks array: ${Array.isArray(asks) ? '✅' : '❌'} (${asks?.length || 0} levels)`);
      console.log(`   - Best Bid: ${bestBid}`);
      console.log(`   - Best Ask: ${bestAsk}`);
      console.log(`   - Spread: ${spread}`);
      console.log(`   - Midpoint: ${midpoint}\n`);

      // Verify reciprocal logic: if we have raw data
      if (obResponse.data._raw) {
        console.log('   🔍 Verifying Reciprocal Logic:\n');
        const { yes, no } = obResponse.data._raw;

        if (no && no.length > 0) {
          const noBid = no[0]; // [price, qty]
          const expectedAsk = 100 - noBid[0];
          const actualAsk = asks[0]?.[0];

          console.log(`   NO Bid: ${noBid[0]}¢ (${noBid[1]} contracts)`);
          console.log(`   Expected YES Ask: 100 - ${noBid[0]} = ${expectedAsk}¢`);
          console.log(`   Actual YES Ask: ${actualAsk}¢`);
          console.log(`   Match: ${expectedAsk === actualAsk ? '✅' : '❌'}\n`);
        }
      }
    }
  }

  console.log('📋 Step 3: Check OrderBook Widget Display\n');
  const widgetState = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-orderbook"]');
    if (!widget) return { found: false };

    const hasTitle = !!widget.querySelector('.text-sm.font-semibold');
    const hasSubtitle = !!widget.querySelector('.text-xs.text-cyan-400');
    const hasBidsHeader = widget.textContent.includes('BIDS (YES)');
    const hasAsksHeader = widget.textContent.includes('ASKS');
    const hasSpread = widget.textContent.includes('Spread:');
    const hasMid = widget.textContent.includes('Mid:');

    const bidLevels = widget.querySelectorAll('.flex-1 .flex.justify-between.px-2.py-0\\.5.relative');
    const hasBids = bidLevels.length > 0;

    // Check for green volume bars (bids)
    const hasGreenBars = widget.querySelectorAll('.bg-green-900\\/30').length > 0;
    // Check for red volume bars (asks)
    const hasRedBars = widget.querySelectorAll('.bg-red-900\\/30').length > 0;

    return {
      found: true,
      hasTitle,
      hasSubtitle,
      hasBidsHeader,
      hasAsksHeader,
      hasSpread,
      hasMid,
      hasBids,
      bidLevelCount: bidLevels.length,
      hasGreenBars,
      hasRedBars,
    };
  });

  console.log(`   Widget found: ${widgetState.found ? '✅' : '❌'}`);
  console.log(`   Has title: ${widgetState.hasTitle ? '✅' : '❌'}`);
  console.log(`   Has subtitle: ${widgetState.hasSubtitle ? '✅' : '❌'}`);
  console.log(`   Has "BIDS (YES)" header: ${widgetState.hasBidsHeader ? '✅' : '❌'}`);
  console.log(`   Has "ASKS" header: ${widgetState.hasAsksHeader ? '✅' : '❌'}`);
  console.log(`   Has spread display: ${widgetState.hasSpread ? '✅' : '❌'}`);
  console.log(`   Has midpoint display: ${widgetState.hasMid ? '✅' : '❌'}`);
  console.log(`   Has bid levels: ${widgetState.hasBids ? '✅' : '❌'} (${widgetState.bidLevelCount} levels)`);
  console.log(`   Has green volume bars (bids): ${widgetState.hasGreenBars ? '✅' : '❌'}`);
  console.log(`   Has red volume bars (asks): ${widgetState.hasRedBars ? '✅' : '❌'}\n`);

  // Take screenshot
  await page.screenshot({ path: 'orderbook-reciprocal-test.png', fullPage: true });
  console.log('📸 Screenshot saved: orderbook-reciprocal-test.png\n');

  if (errors.length > 0) {
    console.log('❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('✅ No JavaScript errors!');
  }

  await browser.disconnect();
  console.log('\n✨ Test complete!\n');
}

testOrderbookReciprocal().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
