/**
 * Test OrderBook and capture console logs
 */
import puppeteer from 'puppeteer-core';

const TICKER = 'KXMVESPORTSMULTIGAMEEXTENDED-S2025B68844DC239-5D188D810F1';

async function testWithConsole() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[OrderBookWidget]') || text.includes('orderbook')) {
      logs.push(text);
    }
  });

  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => window.__workspaceStore.setState({ widgets: [] }));

  console.log('Adding OrderBook widget...\n');
  await page.evaluate((ticker) => {
    window.__addWidget('orderbook', ticker);
  }, TICKER);

  await new Promise(r => setTimeout(r, 6000));

  console.log('Console logs:');
  logs.forEach(log => console.log(`  ${log}`));

  await browser.disconnect();
}

testWithConsole().catch(console.error);
