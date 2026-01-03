/**
 * Final comprehensive test of OrderBook widget with real Kalshi data
 */
import puppeteer from 'puppeteer-core';

const TEST_TICKER = 'KXMVESPORTSMULTIGAMEEXTENDED-S202511FB329DE4F-AB0877D8167';

async function testOrderBookFinal() {
  console.log('🧪 Testing OrderBook Widget with real Kalshi data\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(`❌ ${error.message}`);
  });

  // Reload page
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Step 1: Clear workspace');
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
  });

  console.log(`✅ Step 2: Add orderbook widget with ticker: ${TEST_TICKER.substring(0, 30)}...`);
  await page.evaluate((ticker) => {
    window.__workspaceStore.getState().widgets;
    const { addWidget } = window.__workspaceStore;
    // Manually add widget via store
    const newWidget = {
      id: `orderbook-${Date.now()}`,
      type: 'orderbook',
      ticker: ticker,
      title: 'Orderbook',
      config: { depth: 10 }
    };
    window.__workspaceStore.setState({
      widgets: [newWidget]
    });
  }, TEST_TICKER);

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n📊 Checking widget state...');

  const widgetState = await page.evaluate(() => {
    const state = window.__workspaceStore.getState();
    const widget = state.widgets[0];

    // Check if widget DOM exists
    const widgetElement = document.querySelector('[id^="widget-"]');
    if (!widgetElement) return { error: 'Widget DOM not found' };

    // Check for loading state
    const isLoading = widgetElement.querySelector('.animate-spin') !== null;

    // Check for error state
    const errorEl = widgetElement.querySelector('.text-red-400');
    const error = errorEl ? errorEl.textContent : null;

    // Check for orderbook content
    const hasBidsHeader = widgetElement.textContent.includes('BIDS');
    const hasAsksHeader = widgetElement.textContent.includes('ASKS');
    const hasPerspectiveToggle = widgetElement.querySelector('button[title*="perspective"]') !== null;

    // Check for title section
    const hasTitleSection = widgetElement.querySelector('.border-b.border-slate-700.pb-2') !== null;
    const hasTickerTag = widgetElement.textContent.includes('[KX');

    return {
      widget,
      isLoading,
      error,
      hasBidsHeader,
      hasAsksHeader,
      hasPerspectiveToggle,
      hasTitleSection,
      hasTickerTag,
    };
  });

  if (widgetState.error) {
    console.log(`\n❌ Error: ${widgetState.error}`);
  } else if (widgetState.isLoading) {
    console.log('\n⏳ Widget is still loading...');
  } else {
    console.log(`\n📈 Widget Status:`);
    console.log(`   ${widgetState.hasTitleSection ? '✅' : '❌'} Market title section`);
    console.log(`   ${widgetState.hasTickerTag ? '✅' : '❌'} Bloomberg-style ticker tag`);
    console.log(`   ${widgetState.hasBidsHeader ? '✅' : '❌'} BIDS header`);
    console.log(`   ${widgetState.hasAsksHeader ? '✅' : '❌'} ASKS header`);
    console.log(`   ${widgetState.hasPerspectiveToggle ? '✅' : '❌'} YES/NO perspective toggle`);
  }

  // Test perspective toggle
  console.log('\n🔄 Testing perspective toggle...');
  await page.click('button[title*="perspective"]');
  await new Promise(resolve => setTimeout(resolve, 500));

  const afterToggle = await page.evaluate(() => {
    const widgetElement = document.querySelector('[id^="widget-"]');
    return {
      hasNOBids: widgetElement.textContent.includes('ASKS (NO)'),
      buttonText: widgetElement.querySelector('button[title*="perspective"]')?.textContent
    };
  });

  console.log(`   Toggle button text: ${afterToggle.buttonText}`);
  console.log(`   ${afterToggle.hasNOBids ? '✅' : '❌'} Perspective switched to NO`);

  // Take screenshot
  await page.screenshot({ path: 'orderbook-final-test.png', fullPage: true });
  console.log('\n📸 Screenshot saved: orderbook-final-test.png');

  if (errors.length > 0) {
    console.log('\n❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('\n✅ No JavaScript errors!');
  }

  await browser.disconnect();
  console.log('\n✨ Test complete!\n');
}

testOrderBookFinal().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
