/**
 * Test MarketSelectorWidget Trending Sort and Liquidity Filter
 */
import puppeteer from 'puppeteer-core';

async function testTrendingAndFilter() {
  console.log('🧪 Testing Trending Sort and Liquidity Filter\n');

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

  console.log('🖱️  Step 2: Click first event to view markets\n');
  await page.evaluate(() => {
    const firstEvent = document.querySelector('[id^="widget-market-selector"] .border-b.border-slate-800');
    if (firstEvent) firstEvent.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  // Check for sort and filter controls
  console.log('📋 Step 3: Check Sort and Filter Controls\n');
  const controlsState = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    if (!widget) return { found: false };

    const hasSortLabel = widget.textContent.includes('Sort:');
    const hasSortButton = !!Array.from(widget.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Default') || btn.textContent.includes('Trending')
    );
    const hasLiquidCheckbox = !!widget.querySelector('input[type="checkbox"]');
    const hasLiquidLabel = widget.textContent.includes('Show Only Liquid Markets');

    return {
      found: true,
      hasSortLabel,
      hasSortButton,
      hasLiquidCheckbox,
      hasLiquidLabel,
    };
  });

  console.log(`   Has "Sort:" label: ${controlsState.hasSortLabel ? '✅' : '❌'}`);
  console.log(`   Has sort button: ${controlsState.hasSortButton ? '✅' : '❌'}`);
  console.log(`   Has liquidity checkbox: ${controlsState.hasLiquidCheckbox ? '✅' : '❌'}`);
  console.log(`   Has liquidity label: ${controlsState.hasLiquidLabel ? '✅' : '❌'}\n`);

  // Test sort toggle
  console.log('🖱️  Step 4: Toggle to Trending Sort\n');
  const beforeSort = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    const markets = widget.querySelectorAll('.border-b.border-slate-800');
    return {
      count: markets.length,
      firstMarket: markets[0]?.textContent.substring(0, 50) || '',
    };
  });

  await page.evaluate(() => {
    const sortBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Default')
    );
    if (sortBtn) sortBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterSort = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    const sortBtn = Array.from(widget.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Trending') || btn.textContent.includes('Default')
    );
    const markets = widget.querySelectorAll('.border-b.border-slate-800');
    const hasHeatBadges = widget.querySelectorAll('.bg-orange-900\\/30').length > 0;

    return {
      sortMode: sortBtn?.textContent || '',
      count: markets.length,
      firstMarket: markets[0]?.textContent.substring(0, 50) || '',
      hasHeatBadges,
    };
  });

  console.log(`   Sort mode changed: ${afterSort.sortMode.includes('Trending') ? '✅' : '❌'}`);
  console.log(`   Markets before: ${beforeSort.count}, after: ${afterSort.count}`);
  console.log(`   Has heat badges (🔥): ${afterSort.hasHeatBadges ? '✅' : '❌'}\n`);

  // Test liquidity filter
  console.log('🖱️  Step 5: Toggle Liquidity Filter\n');
  await page.evaluate(() => {
    const checkbox = document.querySelector('[id^="widget-market-selector"] input[type="checkbox"]');
    if (checkbox) checkbox.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterFilter = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-market-selector"]');
    const markets = widget.querySelectorAll('.border-b.border-slate-800');
    const checkbox = widget.querySelector('input[type="checkbox"]');
    const hasEmptyMessage = widget.textContent.includes('No liquid markets');

    return {
      checked: checkbox?.checked,
      marketCount: markets.length,
      hasEmptyMessage,
    };
  });

  console.log(`   Checkbox checked: ${afterFilter.checked ? '✅' : '❌'}`);
  console.log(`   Markets after filter: ${afterFilter.marketCount}`);
  console.log(`   Shows empty message if needed: ${afterFilter.marketCount === 0 && afterFilter.hasEmptyMessage ? '✅' : 'N/A'}\n`);

  // Take screenshot
  await page.screenshot({ path: 'trending-filter-test.png', fullPage: true });
  console.log('📸 Screenshot saved: trending-filter-test.png\n');

  if (errors.length > 0) {
    console.log('❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('✅ No JavaScript errors!');
  }

  await browser.disconnect();
  console.log('\n✨ Test complete!\n');
}

testTrendingAndFilter().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
