/**
 * Take a screenshot of the new layout
 */
import puppeteer from 'puppeteer-core';

async function takeScreenshot() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  await page.setViewport({ width: 1920, height: 1080 });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 500));

  await page.screenshot({
    path: 'vanilla-layout-screenshot.png',
    fullPage: true,
  });

  console.log('✓ Screenshot saved to: vanilla-layout-screenshot.png');

  await browser.disconnect();
}

takeScreenshot().catch(console.error);
