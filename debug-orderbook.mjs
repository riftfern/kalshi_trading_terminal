/**
 * Debug OrderBook Widget - Check API responses and reciprocal logic
 */
import puppeteer from 'puppeteer-core';

const TEST_TICKER = 'KXMVESPORTSMULTIGAMEEXTENDED-S202511FB329DE4F-AB0877D8167';

async function debugOrderBook() {
  console.log('🔍 Debugging OrderBook Widget\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  // Capture network requests
  const requests = [];
  const responses = [];

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const url = response.url();
      let body = null;

      try {
        if (response.headers()['content-type']?.includes('application/json')) {
          body = await response.json();
        }
      } catch (e) {
        // Ignore parse errors
      }

      responses.push({ url, status, body });
    }
  });

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Navigate to the app
  console.log('📍 Navigating to http://localhost:3000/vanilla.html');
  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Clear workspace
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
  });

  console.log(`\n🔧 Adding OrderBook widget with ticker: ${TEST_TICKER.substring(0, 40)}...\n`);

  // Clear previous requests/responses
  requests.length = 0;
  responses.length = 0;

  // Add orderbook widget
  await page.evaluate((ticker) => {
    window.__addWidget('orderbook', ticker);
  }, TEST_TICKER);

  // Wait for API calls
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Analyze network requests
  console.log('📡 Network Requests:\n');

  const orderbookRequests = requests.filter(r => r.url.includes('orderbook'));
  const marketRequests = requests.filter(r => r.url.includes('markets'));
  const eventRequests = requests.filter(r => r.url.includes('events'));

  console.log(`   Markets API calls: ${marketRequests.length}`);
  marketRequests.forEach(req => {
    console.log(`     ${req.method} ${req.url}`);
  });

  console.log(`   Events API calls: ${eventRequests.length}`);
  eventRequests.forEach(req => {
    console.log(`     ${req.method} ${req.url}`);
  });

  console.log(`   OrderBook API calls: ${orderbookRequests.length}`);
  orderbookRequests.forEach(req => {
    console.log(`     ${req.method} ${req.url}`);
  });

  // Analyze responses
  console.log('\n📊 API Responses:\n');

  const orderbookResponses = responses.filter(r => r.url.includes('orderbook'));

  if (orderbookResponses.length === 0) {
    console.log('   ❌ NO ORDERBOOK API RESPONSES FOUND!');
  } else {
    orderbookResponses.forEach(res => {
      console.log(`   Status: ${res.status}`);
      console.log(`   URL: ${res.url}\n`);

      if (res.status === 401 || res.status === 403) {
        console.log('   ❌ AUTHENTICATION ERROR - Token refresh needed!');
        console.log(`   Response: ${JSON.stringify(res.body, null, 2)}\n`);
      } else if (res.status === 200) {
        console.log('   ✅ Success (200)');

        if (res.body) {
          console.log(`\n   🔍 Checking orderbook structure:`);
          console.log(`      Has 'yes' array: ${Array.isArray(res.body.yes)}`);
          console.log(`      Has 'no' array: ${Array.isArray(res.body.no)}`);
          console.log(`      Has 'asks' array: ${Array.isArray(res.body.asks)} ${res.body.asks ? '⚠️  UNEXPECTED!' : ''}`);
          console.log(`      Has 'bids' array: ${Array.isArray(res.body.bids)} ${res.body.bids ? '⚠️  UNEXPECTED!' : ''}`);

          if (res.body.yes) {
            console.log(`\n      YES array (first 3 levels):`);
            res.body.yes.slice(0, 3).forEach(level => {
              console.log(`        [${level[0]}, ${level[1]}]`);
            });
          }

          if (res.body.no) {
            console.log(`\n      NO array (first 3 levels):`);
            res.body.no.slice(0, 3).forEach(level => {
              console.log(`        [${level[0]}, ${level[1]}]`);
            });
          }
        }
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.status}`);
        console.log(`   Response: ${JSON.stringify(res.body, null, 2)}\n`);
      }
    });
  }

  // Check widget state
  console.log('\n🎨 Widget State:\n');

  const widgetInfo = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-orderbook"]');
    if (!widget) return { found: false };

    const hasError = widget.querySelector('.text-red-400') !== null;
    const errorText = hasError ? widget.querySelector('.text-red-400')?.textContent : null;
    const isLoading = widget.querySelector('.animate-spin') !== null;
    const hasContent = widget.textContent.includes('BIDS') || widget.textContent.includes('ASKS');

    return {
      found: true,
      hasError,
      errorText,
      isLoading,
      hasContent,
      textPreview: widget.textContent.substring(0, 200),
    };
  });

  if (!widgetInfo.found) {
    console.log('   ❌ Widget not found in DOM');
  } else {
    console.log(`   Widget found: ✅`);
    console.log(`   Is loading: ${widgetInfo.isLoading ? '⏳ Yes' : 'No'}`);
    console.log(`   Has error: ${widgetInfo.hasError ? `❌ Yes - ${widgetInfo.errorText}` : 'No'}`);
    console.log(`   Has content: ${widgetInfo.hasContent ? '✅ Yes' : '❌ No'}`);
    console.log(`   Text preview: ${widgetInfo.textPreview}`);
  }

  // Check console errors
  if (errors.length > 0) {
    console.log('\n❌ JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
  }

  // Check relevant console logs
  const relevantLogs = consoleLogs.filter(log =>
    log.includes('orderbook') ||
    log.includes('error') ||
    log.includes('Error') ||
    log.includes('401') ||
    log.includes('403')
  );

  if (relevantLogs.length > 0) {
    console.log('\n📝 Relevant Console Logs:\n');
    relevantLogs.forEach(log => console.log(`   ${log}`));
  }

  await browser.disconnect();
  console.log('\n✨ Debug complete!\n');
}

debugOrderBook().catch(err => {
  console.error('\n❌ Debug failed:', err);
  process.exit(1);
});
