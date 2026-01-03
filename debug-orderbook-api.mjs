/**
 * Debug OrderBook API Response
 * Check if the reciprocal transformer is working
 */
import puppeteer from 'puppeteer-core';

async function debugOrderbookAPI() {
  console.log('🔍 Debugging OrderBook API\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Clear workspace and add widget
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
    window.__addWidget('orderbook', 'KXMACRO-24DEC31-B1575');
  });

  console.log('⏳ Waiting for orderbook to load...\n');
  await new Promise(r => setTimeout(r, 5000));

  // Check widget state
  const widgetData = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-orderbook"]');
    if (!widget) return { found: false };

    const text = widget.textContent || '';
    const hasLoadingText = text.includes('Loading');
    const hasErrorText = text.includes('error') || text.includes('Error');
    const hasSelectMarket = text.includes('Select a market');

    return {
      found: true,
      hasLoadingText,
      hasErrorText,
      hasSelectMarket,
      textContent: text.substring(0, 500),
    };
  });

  console.log('📋 Widget State:\n');
  console.log(`   Found: ${widgetData.found ? '✅' : '❌'}`);
  console.log(`   Has "Loading..." text: ${widgetData.hasLoadingText ? '✅' : '❌'}`);
  console.log(`   Has error text: ${widgetData.hasErrorText ? '✅' : '❌'}`);
  console.log(`   Has "Select a market" placeholder: ${widgetData.hasSelectMarket ? '✅' : '❌'}`);
  console.log(`\n   Widget content preview:\n   "${widgetData.textContent}"\n`);

  // Manually fetch orderbook API
  console.log('🌐 Testing API directly:\n');

  const apiTest = await page.evaluate(async () => {
    try {
      // Test market endpoint
      const marketRes = await fetch('/api/markets/KXMACRO-24DEC31-B1575');
      const marketData = await marketRes.json();

      // Test orderbook endpoint
      const obRes = await fetch('/api/markets/KXMACRO-24DEC31-B1575/orderbook?depth=10');
      const obData = await obRes.json();

      return {
        success: true,
        market: {
          status: marketRes.status,
          ticker: marketData.ticker,
          title: marketData.title,
          subtitle: marketData.subtitle,
        },
        orderbook: {
          status: obRes.status,
          hasBids: Array.isArray(obData.bids),
          hasAsks: Array.isArray(obData.asks),
          bidCount: obData.bids?.length || 0,
          askCount: obData.asks?.length || 0,
          bestBid: obData.bestBid,
          bestAsk: obData.bestAsk,
          spread: obData.spread,
          midpoint: obData.midpoint,
          hasRawData: !!obData._raw,
          data: obData,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  if (!apiTest.success) {
    console.log(`   ❌ API test failed: ${apiTest.error}\n`);
  } else {
    console.log('   Market Data:');
    console.log(`   - Status: ${apiTest.market.status}`);
    console.log(`   - Ticker: ${apiTest.market.ticker}`);
    console.log(`   - Title: ${apiTest.market.title}`);
    console.log(`   - Subtitle: ${apiTest.market.subtitle}\n`);

    console.log('   Orderbook Data:');
    console.log(`   - Status: ${apiTest.orderbook.status}`);
    console.log(`   - Has bids array: ${apiTest.orderbook.hasBids ? '✅' : '❌'} (${apiTest.orderbook.bidCount} levels)`);
    console.log(`   - Has asks array: ${apiTest.orderbook.hasAsks ? '✅' : '❌'} (${apiTest.orderbook.askCount} levels)`);
    console.log(`   - Best Bid: ${apiTest.orderbook.bestBid}`);
    console.log(`   - Best Ask: ${apiTest.orderbook.bestAsk}`);
    console.log(`   - Spread: ${apiTest.orderbook.spread}`);
    console.log(`   - Midpoint: ${apiTest.orderbook.midpoint}`);
    console.log(`   - Has _raw data: ${apiTest.orderbook.hasRawData ? '✅' : '❌'}\n`);

    if (apiTest.orderbook.hasRawData && apiTest.orderbook.data._raw) {
      console.log('   🔍 Reciprocal Logic Verification:\n');
      const { yes, no } = apiTest.orderbook.data._raw;

      console.log(`   Raw YES bids: ${yes?.length || 0} levels`);
      console.log(`   Raw NO bids: ${no?.length || 0} levels\n`);

      if (no && no.length > 0 && apiTest.orderbook.data.asks.length > 0) {
        const noBid = no[0];
        const yesAsk = apiTest.orderbook.data.asks[0];
        const expectedAsk = 100 - noBid[0];

        console.log(`   NO Bid [0]: ${noBid[0]}¢ × ${noBid[1]} contracts`);
        console.log(`   Expected YES Ask: 100 - ${noBid[0]} = ${expectedAsk}¢`);
        console.log(`   Actual YES Ask [0]: ${yesAsk[0]}¢ × ${yesAsk[1]} contracts`);
        console.log(`   Reciprocal formula works: ${expectedAsk === yesAsk[0] ? '✅ YES' : '❌ NO'}\n`);
      }
    }
  }

  // Console messages
  if (consoleMessages.length > 0) {
    console.log('📝 Console Messages:\n');
    consoleMessages.slice(-10).forEach(msg => console.log(`   ${msg}`));
    console.log();
  }

  // Errors
  if (errors.length > 0) {
    console.log('❌ JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  }

  await browser.disconnect();
  console.log('✨ Debug complete!\n');
}

debugOrderbookAPI().catch(err => {
  console.error('\n❌ Debug failed:', err);
  process.exit(1);
});
