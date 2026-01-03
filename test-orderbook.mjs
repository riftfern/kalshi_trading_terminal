/**
 * Test OrderBook widget functionality
 */
import puppeteer from 'puppeteer-core';

async function testOrderBook() {
  console.log('Testing OrderBook widget...\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(`Error: ${error.message}`);
  });

  // Reload page
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('=== Step 1: Open command palette ===');
  await page.keyboard.press('`');
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('=== Step 2: Type "orderbook" to search ===');
  await page.type('input[type="text"]', 'orderbook');
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('=== Step 3: Press Enter to add widget ===');
  await page.keyboard.press('Enter');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if widget was added
  const widgetCount = await page.evaluate(() => {
    return window.__workspaceStore.getState().widgets.length;
  });

  console.log(`\nWidgets in store: ${widgetCount}`);

  const widgetElement = await page.evaluate(() => {
    const widget = document.querySelector('[id^="widget-"]');
    return widget ? {
      exists: true,
      id: widget.id,
      hasContent: widget.querySelector('.flex.flex-col.h-full.font-mono') !== null
    } : { exists: false };
  });

  console.log(`Widget DOM exists: ${widgetElement.exists}`);
  if (widgetElement.exists) {
    console.log(`Widget ID: ${widgetElement.id}`);
    console.log(`Has orderbook content: ${widgetElement.hasContent}`);
  }

  // Check for errors
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.error(err));
  } else {
    console.log('\n✓ No JavaScript errors');
  }

  // Check console for useful messages
  console.log('\n=== RECENT CONSOLE LOGS ===');
  consoleLogs.slice(-10).forEach(log => console.log(log));

  await browser.disconnect();
  console.log('\n✓ Test complete!');
}

testOrderBook().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
