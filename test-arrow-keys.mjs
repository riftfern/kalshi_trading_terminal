/**
 * Test to verify arrow key navigation works correctly with visual feedback
 */
import puppeteer from 'puppeteer-core';

async function testArrowKeys() {
  console.log('Testing arrow key navigation...\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 500));

  // Open command palette
  await page.keyboard.press('`');
  await new Promise(resolve => setTimeout(resolve, 300));

  // Test arrow key navigation multiple times
  for (let i = 0; i < 5; i++) {
    const beforePress = await page.evaluate(() => {
      const selected = document.querySelector('[data-selected="true"]');
      if (!selected) return null;

      const label = selected.querySelector('div:first-child')?.textContent || '';
      const hasHighlight = selected.classList.contains('bg-cyan-900/30');
      const hasBorder = selected.classList.contains('border-cyan-400');

      return { label, hasHighlight, hasBorder };
    });

    console.log(`Press ${i + 1}:`);
    console.log(`  Before: ${beforePress?.label || 'None'}`);
    console.log(`  Highlight: ${beforePress?.hasHighlight}`);
    console.log(`  Border: ${beforePress?.hasBorder}`);

    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 200));

    const afterPress = await page.evaluate(() => {
      const selected = document.querySelector('[data-selected="true"]');
      if (!selected) return null;

      const label = selected.querySelector('div:first-child')?.textContent || '';
      const hasHighlight = selected.classList.contains('bg-cyan-900/30');
      const hasBorder = selected.classList.contains('border-cyan-400');

      return { label, hasHighlight, hasBorder };
    });

    console.log(`  After:  ${afterPress?.label || 'None'}`);
    console.log(`  Highlight: ${afterPress?.hasHighlight}`);
    console.log(`  Border: ${afterPress?.hasBorder}`);
    console.log(`  Changed: ${beforePress?.label !== afterPress?.label}\n`);
  }

  await browser.disconnect();
}

testArrowKeys().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
