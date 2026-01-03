/**
 * Test default widgets load on startup
 */
import puppeteer from 'puppeteer-core';

async function testDefaultWidgets() {
  console.log('🧪 Testing Default Widgets Load\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('📡 Loading page...\n');
  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('📋 Checking default widgets...\n');

  const widgetState = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    const marketSelector = document.querySelector('[id^="widget-market-selector"]');
    const orderbook = document.querySelector('[id^="widget-orderbook"]');
    const quote = document.querySelector('[id^="widget-quote"]');

    return {
      stateWidgetCount: state?.widgets?.length || 0,
      stateWidgets: state?.widgets?.map(w => ({ type: w.type, id: w.id })) || [],
      hasMarketSelector: !!marketSelector,
      hasOrderbook: !!orderbook,
      hasQuote: !!quote,
      marketSelectorContent: marketSelector?.textContent?.substring(0, 100) || '',
      orderbookContent: orderbook?.textContent?.substring(0, 100) || '',
      quoteContent: quote?.textContent?.substring(0, 100) || '',
    };
  });

  console.log(`   Widgets in store: ${widgetState.stateWidgetCount}`);
  console.log(`   Widget types: ${widgetState.stateWidgets.map(w => w.type).join(', ')}\n`);

  console.log(`   MarketSelector widget exists: ${widgetState.hasMarketSelector ? '✅' : '❌'}`);
  console.log(`   OrderBook widget exists: ${widgetState.hasOrderbook ? '✅' : '❌'}`);
  console.log(`   Quote widget exists: ${widgetState.hasQuote ? '✅' : '❌'}\n`);

  if (widgetState.marketSelectorContent) {
    console.log(`   MarketSelector content: "${widgetState.marketSelectorContent}..."`);
  }
  if (widgetState.orderbookContent) {
    console.log(`   OrderBook content: "${widgetState.orderbookContent}..."`);
  }
  if (widgetState.quoteContent) {
    console.log(`   Quote content: "${widgetState.quoteContent}..."\n`);
  }

  // Check if there's an empty state with buttons
  const hasEmptyState = await page.evaluate(() => {
    return document.body.textContent.includes('Trading Layout') ||
           document.body.textContent.includes('Research Layout') ||
           document.body.textContent.includes('Minimal Layout');
  });

  console.log(`   Has empty state with preset buttons: ${hasEmptyState ? '❌ FAIL' : '✅ PASS'}\n`);

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  } else {
    console.log('✅ No JavaScript errors\n');
  }

  await page.screenshot({ path: 'default-widgets-test.png', fullPage: true });
  console.log('📸 Screenshot: default-widgets-test.png\n');

  await browser.disconnect();

  // Summary
  const allPass = widgetState.stateWidgetCount === 3 &&
                  widgetState.hasMarketSelector &&
                  widgetState.hasOrderbook &&
                  widgetState.hasQuote &&
                  !hasEmptyState &&
                  errors.length === 0;

  if (allPass) {
    console.log('✨ All tests passed! Default widgets load correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
  }
}

testDefaultWidgets().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
