/**
 * Comprehensive functionality test
 */
import puppeteer from 'puppeteer-core';

async function testFullFunctionality() {
  console.log('🧪 Testing Full Website Functionality\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  const networkFailures = [];
  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      error: request.failure()?.errorText
    });
  });

  console.log('📡 Step 1: Load Page\n');
  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  console.log('   ✅ Page loaded\n');

  await new Promise(r => setTimeout(r, 2000));

  console.log('🏠 Step 2: Check Initial UI State\n');
  const initialState = await page.evaluate(() => {
    const header = document.querySelector('header');
    const appTitle = header?.textContent?.includes('GODEL KALSHI');
    const searchButton = !!document.querySelector('button');
    const hasWelcomeMessage = document.body.textContent.includes('Welcome to Godel Kalshi');
    const gridLayout = document.querySelector('[class*="grid"]') || document.querySelector('#app > div');

    return {
      hasHeader: !!header,
      appTitle,
      searchButton,
      hasWelcomeMessage,
      hasGridLayout: !!gridLayout,
    };
  });

  console.log(`   Has header: ${initialState.hasHeader ? '✅' : '❌'}`);
  console.log(`   Has app title: ${initialState.appTitle ? '✅' : '❌'}`);
  console.log(`   Has search button: ${initialState.searchButton ? '✅' : '❌'}`);
  console.log(`   Has welcome message: ${initialState.hasWelcomeMessage ? '✅' : '❌'}`);
  console.log(`   Has grid layout: ${initialState.hasGridLayout ? '✅' : '❌'}\n`);

  console.log('⌨️  Step 3: Test Command Palette\n');
  await page.keyboard.press('`');
  await new Promise(r => setTimeout(r, 500));

  const paletteState = await page.evaluate(() => {
    const palette = document.querySelector('[class*="command-palette"]') ||
                    Array.from(document.querySelectorAll('div')).find(d =>
                      d.textContent?.includes('Add Widget') || d.textContent?.includes('Quote Widget')
                    );
    const hasPalette = !!palette;
    const paletteVisible = palette && palette.style.display !== 'none';

    return {
      hasPalette,
      paletteVisible,
      paletteHTML: palette?.outerHTML?.substring(0, 200) || 'Not found'
    };
  });

  console.log(`   Command palette exists: ${paletteState.hasPalette ? '✅' : '❌'}`);
  console.log(`   Command palette visible: ${paletteState.paletteVisible ? '✅' : '❌'}\n`);

  // Close palette
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  console.log('🎯 Step 4: Add MarketSelector Widget\n');
  await page.evaluate(() => {
    if (window.__addWidget) {
      window.__addWidget('market-selector');
    }
  });

  await new Promise(r => setTimeout(r, 3000));

  const widgetState = await page.evaluate(() => {
    const widgets = window.__workspaceStore?.getState()?.widgets || [];
    const marketSelectorWidget = document.querySelector('[id^="widget-market-selector"]');

    return {
      widgetCount: widgets.length,
      hasMarketSelector: !!marketSelectorWidget,
      widgetContent: marketSelectorWidget?.textContent?.substring(0, 200) || ''
    };
  });

  console.log(`   Widgets in store: ${widgetState.widgetCount}`);
  console.log(`   MarketSelector visible: ${widgetState.hasMarketSelector ? '✅' : '❌'}`);
  console.log(`   Widget content: "${widgetState.widgetContent}"\n`);

  console.log('📊 Step 5: Check Backend API Connectivity\n');
  const apiCheck = await page.evaluate(async () => {
    try {
      const healthRes = await fetch('http://localhost:3001/api/health');
      const health = await healthRes.json();

      const marketsRes = await fetch('http://localhost:3001/api/markets?limit=5');
      const markets = await marketsRes.json();

      return {
        success: true,
        health,
        marketCount: markets.markets?.length || 0
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  });

  if (apiCheck.success) {
    console.log(`   ✅ API Health: ${apiCheck.health.status}`);
    console.log(`   ✅ Kalshi: ${apiCheck.health.kalshi}`);
    console.log(`   ✅ Markets fetched: ${apiCheck.marketCount}\n`);
  } else {
    console.log(`   ❌ API Error: ${apiCheck.error}\n`);
  }

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  }

  if (networkFailures.length > 0) {
    console.log('🚨 Network Failures:\n');
    networkFailures.forEach(f => console.log(`   ${f.url}: ${f.error}`));
    console.log();
  }

  if (errors.length === 0 && networkFailures.length === 0) {
    console.log('✅ No errors detected!\n');
  }

  await page.screenshot({ path: 'full-functionality-test.png', fullPage: true });
  console.log('📸 Screenshot: full-functionality-test.png\n');

  await browser.disconnect();
  console.log('✨ Test complete!\n');
}

testFullFunctionality().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
