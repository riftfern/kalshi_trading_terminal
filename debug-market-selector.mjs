/**
 * Debug MarketSelectorWidget - Check data source and structure
 */
import puppeteer from 'puppeteer-core';

async function debugMarketSelector() {
  console.log('🔍 Debugging MarketSelectorWidget\n');

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

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Clear workspace
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
  });

  console.log('🔧 Adding MarketSelectorWidget...\n');

  // Clear previous requests/responses
  requests.length = 0;
  responses.length = 0;

  // Add market selector widget
  await page.evaluate(() => {
    window.__addWidget('market-selector');
  });

  // Wait for API calls
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Analyze network requests
  console.log('📡 Network Requests:\n');

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

  // Analyze responses
  console.log('\n📊 API Responses:\n');

  const marketResponses = responses.filter(r => r.url.includes('markets') && r.status === 200);

  if (marketResponses.length > 0) {
    const res = marketResponses[0];
    console.log(`   Fetching: ${res.url}`);
    console.log(`   Status: ${res.status}`);

    if (res.body) {
      console.log(`\n   Data structure:`);
      console.log(`      Has 'markets' array: ${Array.isArray(res.body.markets)}`);
      console.log(`      Markets count: ${res.body.markets?.length || 0}`);
      console.log(`      Has 'cursor': ${!!res.body.cursor}`);

      if (res.body.markets && res.body.markets.length > 0) {
        const firstMarket = res.body.markets[0];
        console.log(`\n      First market sample:`);
        console.log(`        ticker: ${firstMarket.ticker?.substring(0, 40)}...`);
        console.log(`        title: ${firstMarket.title?.substring(0, 60)}...`);
        console.log(`        event_ticker: ${firstMarket.event_ticker || 'N/A'}`);
        console.log(`        category: ${firstMarket.category || 'N/A'}`);
      }
    }
  }

  // Check widget display
  console.log('\n🎨 Widget Display:\n');

  const widgetInfo = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    if (!widget) return { found: false };

    const searchInput = widget.querySelector('input[type="text"]');
    const hasSearch = !!searchInput;

    // Count visible items
    const items = widget.querySelectorAll('.border-b.border-slate-800');

    // Get first 3 items text
    const itemTexts = Array.from(items).slice(0, 3).map(item =>
      item.textContent.substring(0, 100)
    );

    return {
      found: true,
      hasSearch,
      itemCount: items.length,
      itemTexts,
      preview: widget.textContent.substring(0, 300),
    };
  });

  if (widgetInfo.found) {
    console.log(`   Widget found: ✅`);
    console.log(`   Has search input: ${widgetInfo.hasSearch ? '✅' : '❌'}`);
    console.log(`   Visible items: ${widgetInfo.itemCount}`);

    if (widgetInfo.itemTexts.length > 0) {
      console.log(`\n   First 3 items:`);
      widgetInfo.itemTexts.forEach((text, i) => {
        console.log(`     ${i + 1}. ${text}`);
      });
    }
  } else {
    console.log(`   Widget not found: ❌`);
  }

  await browser.disconnect();
  console.log('\n✨ Debug complete!\n');
}

debugMarketSelector().catch(err => {
  console.error('\n❌ Debug failed:', err);
  process.exit(1);
});
