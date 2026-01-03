/**
 * Test adding an OrderBook widget properly
 */
import puppeteer from 'puppeteer-core';

async function testAddOrderBook() {
  console.log('Testing OrderBook widget with proper command...\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(`Error: ${error.message}`);
  });

  // Reload page
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('=== Clear any existing widgets ===');
  await page.evaluate(() => {
    window.__workspaceStore.setState({ widgets: [] });
  });
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('=== Step 1: Open command palette ===');
  await page.keyboard.press('`');
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('=== Step 2: Search for "add order" ===');
  await page.type('input[type="text"]', 'add order');
  await new Promise(resolve => setTimeout(resolve, 300));

  // Get filtered commands
  const commands = await page.evaluate(() => {
    const results = document.querySelectorAll('[data-selected]');
    return Array.from(results).map(el => {
      const label = el.querySelector('div:first-child')?.textContent;
      return { label, selected: el.getAttribute('data-selected') === 'true' };
    });
  });

  console.log('\nFiltered commands:');
  commands.forEach((cmd, i) => {
    console.log(`  ${i}. ${cmd.label} ${cmd.selected ? '(selected)' : ''}`);
  });

  console.log('\n=== Step 3: Press Enter to add OrderBook widget ===');
  await page.keyboard.press('Enter');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check the widget
  const widget = await page.evaluate(() => {
    const state = window.__workspaceStore.getState();
    return state.widgets[0] || null;
  });

  console.log('\n=== Widget Added ===');
  console.log(`Type: ${widget?.type}`);
  console.log(`Title: ${widget?.title}`);
  console.log(`Ticker: ${widget?.ticker || 'none'}`);

  // Take a screenshot
  await page.screenshot({ path: 'orderbook-added.png', fullPage: true });
  console.log('\nScreenshot saved to: orderbook-added.png');

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.error(err));
  } else {
    console.log('\n✓ No JavaScript errors');
  }

  await browser.disconnect();
  console.log('\n✓ Test complete!');
}

testAddOrderBook().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
