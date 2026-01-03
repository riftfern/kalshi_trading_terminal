/**
 * Test the new layout
 */
import puppeteer from 'puppeteer-core';

async function testLayout() {
  console.log('Testing new layout...\n');

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

  // Check if components exist
  const header = await page.evaluate(() => {
    return document.querySelector('#header')?.children.length || 0;
  });

  const main = await page.evaluate(() => {
    return document.querySelector('#main')?.children.length || 0;
  });

  const commandPalette = await page.evaluate(() => {
    return document.querySelector('.command-palette-container') !== null;
  });

  console.log('=== LAYOUT CHECK ===');
  console.log(`✓ Header elements: ${header}`);
  console.log(`✓ Main elements: ${main}`);
  console.log(`✓ Command palette exists: ${commandPalette}`);

  console.log('\n=== CONSOLE LOGS ===');
  consoleLogs.slice(-15).forEach(log => console.log(log));

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.error(err));
    await browser.disconnect();
    process.exit(1);
  } else {
    console.log('\n✓ No errors detected!');
  }

  // Test clicking the command palette button
  console.log('\n=== TESTING HEADER BUTTON ===');
  await page.click('button');
  await new Promise(resolve => setTimeout(resolve, 300));

  const paletteOpen = await page.evaluate(() => {
    const overlay = document.querySelector('.command-palette-container .fixed');
    return overlay && overlay.classList.contains('flex');
  });

  console.log(`Command palette opened: ${paletteOpen ? '✓' : '✗'}`);

  await browser.disconnect();
  console.log('\n✓ Layout test complete!');
}

testLayout().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
