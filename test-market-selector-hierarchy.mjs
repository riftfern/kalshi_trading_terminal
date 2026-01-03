/**
 * Test MarketSelectorWidget Event → Market hierarchy
 */
import puppeteer from 'puppeteer-core';

async function testMarketSelectorHierarchy() {
  console.log('🧪 Testing MarketSelectorWidget Event → Market Hierarchy\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Clear workspace
  await page.evaluate(() => window.__workspaceStore.setState({ widgets: [] }));

  console.log('✅ Step 1: Add MarketSelectorWidget\n');
  await page.evaluate(() => {
    window.__addWidget('market-selector');
  });

  await new Promise(r => setTimeout(r, 3000));

  // Check initial view (Events)
  console.log('📋 Step 2: Check Events List\n');
  const eventsView = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    if (!widget) return { found: false };

    const searchPlaceholder = widget.querySelector('input[type="text"]')?.placeholder;
    const items = widget.querySelectorAll('.border-b.border-slate-800');
    const firstItemText = items[0]?.textContent || '';
    const hasArrowIcons = widget.querySelectorAll('svg path[d*="M9 5l7 7-7 7"]').length > 0;
    const footer = widget.querySelector('.border-t.border-slate-700')?.textContent || '';

    return {
      found: true,
      searchPlaceholder,
      itemCount: items.length,
      firstItemText: firstItemText.substring(0, 100),
      hasArrowIcons,
      footer,
    };
  });

  console.log(`   Widget found: ${eventsView.found ? '✅' : '❌'}`);
  console.log(`   Search placeholder: "${eventsView.searchPlaceholder}"`);
  console.log(`   Events count: ${eventsView.itemCount}`);
  console.log(`   Has arrow indicators: ${eventsView.hasArrowIcons ? '✅' : '❌'}`);
  console.log(`   Footer: "${eventsView.footer}"`);
  console.log(`   First item: ${eventsView.firstItemText}\n`);

  // Click first event
  console.log('🖱️  Step 3: Click first event to view markets\n');
  await page.evaluate(() => {
    const firstEvent = document.querySelector('[id^="widget-market-selector"] .border-b.border-slate-800');
    if (firstEvent) firstEvent.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  // Check markets view
  const marketsView = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    if (!widget) return { found: false };

    const hasBreadcrumb = widget.textContent.includes('← Back to Events');
    const searchPlaceholder = widget.querySelector('input[type="text"]')?.placeholder;
    const items = widget.querySelectorAll('.border-b.border-slate-800');
    const firstItemText = items[0]?.textContent || '';
    const hasQuoteBookButtons = widget.querySelectorAll('button').length > 2;
    const footer = widget.querySelector('.border-t.border-slate-700')?.textContent || '';

    return {
      found: true,
      hasBreadcrumb,
      searchPlaceholder,
      marketCount: items.length,
      firstItemText: firstItemText.substring(0, 100),
      hasQuoteBookButtons,
      footer,
    };
  });

  console.log(`   Has breadcrumb: ${marketsView.hasBreadcrumb ? '✅' : '❌'}`);
  console.log(`   Search placeholder: "${marketsView.searchPlaceholder}"`);
  console.log(`   Markets count: ${marketsView.marketCount}`);
  console.log(`   Has Quote/Book buttons: ${marketsView.hasQuoteBookButtons ? '✅' : '❌'}`);
  console.log(`   Footer: "${marketsView.footer}"`);
  console.log(`   First market: ${marketsView.firstItemText}\n`);

  // Click "Quote" button on first market
  console.log('🖱️  Step 4: Click "Quote" button on first market\n');
  await page.evaluate(() => {
    const quoteBtn = document.querySelector('[id^="widget-market-selector"] button');
    if (quoteBtn && quoteBtn.textContent === 'Quote') {
      quoteBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Check if QuoteWidget was added
  const quoteWidgetAdded = await page.evaluate(() => {
    const widgets = window.__workspaceStore.getState().widgets;
    const quoteWidget = widgets.find(w => w.type === 'quote');
    return !!quoteWidget;
  });

  console.log(`   QuoteWidget added: ${quoteWidgetAdded ? '✅' : '❌'}\n`);

  // Click back button
  console.log('🖱️  Step 5: Click "← Back to Events"\n');
  await page.evaluate(() => {
    const backBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('← Back to Events')
    );
    if (backBtn) backBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const backToEvents = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    const searchPlaceholder = widget?.querySelector('input[type="text"]')?.placeholder;
    const hasArrowIcons = widget?.querySelectorAll('svg path[d*="M9 5l7 7-7 7"]').length > 0;
    return {
      searchPlaceholder,
      hasArrowIcons,
    };
  });

  console.log(`   Back to events view: ${backToEvents.searchPlaceholder === 'Search events...' ? '✅' : '❌'}`);
  console.log(`   Arrow icons visible: ${backToEvents.hasArrowIcons ? '✅' : '❌'}\n`);

  // Test pagination (Load More button)
  console.log('🔄 Step 6: Check pagination\n');
  const hasPagination = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    const loadMoreBtn = Array.from(widget?.querySelectorAll('button') || []).find(
      btn => btn.textContent === 'Load more'
    );
    return !!loadMoreBtn;
  });

  console.log(`   "Load more" button available: ${hasPagination ? '✅' : '❌'}\n`);

  // Take screenshot
  await page.screenshot({ path: 'market-selector-hierarchy-test.png', fullPage: true });
  console.log('📸 Screenshot saved: market-selector-hierarchy-test.png\n');

  if (errors.length > 0) {
    console.log('❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('✅ No JavaScript errors!');
  }

  await browser.disconnect();
  console.log('\n✨ Test complete!\n');
}

testMarketSelectorHierarchy().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
