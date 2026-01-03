/**
 * Comprehensive test for dashboard features: positioning and resizing
 */
import playwright from 'playwright';

async function testDashboard() {
  console.log('🧪 Testing Complete Dashboard Features\n');
  console.log('='.repeat(60) + '\n');

  const browser = await playwright.chromium.launch({
    headless: false,
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  console.log('📡 Loading application...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('✅ Application loaded\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Free Positioning
  console.log('TEST 1: FREE POSITIONING\n');
  console.log('-'.repeat(60) + '\n');

  const initialLayout = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    return state?.layouts?.lg || [];
  });

  console.log('Initial layout:');
  initialLayout.forEach(item => {
    console.log(`  ${item.i.padEnd(30)} pos:(${item.x},${item.y}) size:${item.w}x${item.h}`);
  });
  console.log();

  console.log('Action: Dragging OrderBook to bottom row...');

  try {
    const orderbook = await page.locator('#widget-orderbook-default').first();
    const gridContainer = await page.locator('.grid-layout').first();

    const containerBox = await gridContainer.boundingBox();
    const obBox = await orderbook.boundingBox();

    if (containerBox && obBox) {
      // Calculate target at row y=8
      const targetX = containerBox.x + 300;
      const targetY = containerBox.y + (8 * 46) + 20;

      const sourceX = obBox.x + obBox.width / 2;
      const sourceY = obBox.y + obBox.height / 2;

      await page.mouse.move(sourceX, sourceY);
      await page.mouse.down();
      await page.waitForTimeout(150);
      await page.mouse.move(targetX, targetY, { steps: 20 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(1000);

      const afterMove = await page.evaluate(() => {
        const state = window.__workspaceStore?.getState();
        return state?.layouts?.lg || [];
      });

      const obAfter = afterMove.find(l => l.i === 'orderbook-default');
      console.log(`Result: OrderBook moved to pos:(${obAfter?.x},${obAfter?.y})`);
      console.log(obAfter?.y && obAfter.y > 4 ? '✅ PASS - Widget repositioned\n' : '❌ FAIL - Widget not moved\n');
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}\n`);
  }

  console.log('='.repeat(60) + '\n');

  // Test 2: Resizing
  console.log('TEST 2: WIDGET RESIZING\n');
  console.log('-'.repeat(60) + '\n');

  const beforeResize = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    return state?.layouts?.lg || [];
  });

  const msBeforesize = beforeResize.find(l => l.i === 'market-selector-default');
  console.log(`Market Selector current size: ${msBeforesize?.w}x${msBeforesize?.h}`);
  console.log('Action: Resizing Market Selector larger...\n');

  try {
    const marketSelector = await page.locator('#widget-market-selector-default').first();
    const msBox = await marketSelector.boundingBox();

    if (msBox) {
      // Click on resize handle (bottom-right corner)
      const handleX = msBox.x + msBox.width - 10;
      const handleY = msBox.y + msBox.height - 10;

      await page.mouse.move(handleX, handleY);
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Drag to make it bigger (2 columns wider, 2 rows taller)
      await page.mouse.move(handleX + 200, handleY + 100, { steps: 15 });
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(1000);

      const afterResize = await page.evaluate(() => {
        const state = window.__workspaceStore?.getState();
        return state?.layouts?.lg || [];
      });

      const msAfter = afterResize.find(l => l.i === 'market-selector-default');
      console.log(`Result: Market Selector new size: ${msAfter?.w}x${msAfter?.h}`);

      const resized = msAfter && (msAfter.w > (msBeforesize?.w || 0) || msAfter.h > (msBeforesize?.h || 0));
      console.log(resized ? '✅ PASS - Widget resized\n' : '❌ FAIL - Widget not resized\n');
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}\n`);
  }

  console.log('='.repeat(60) + '\n');

  // Final layout summary
  console.log('FINAL LAYOUT SUMMARY\n');
  console.log('-'.repeat(60) + '\n');

  const finalLayout = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    return state?.layouts?.lg || [];
  });

  finalLayout.forEach(item => {
    console.log(`  ${item.i.padEnd(30)} pos:(${item.x},${item.y}) size:${item.w}x${item.h}`);
  });
  console.log();

  console.log('='.repeat(60) + '\n');

  // Take screenshot
  await page.screenshot({ path: 'dashboard-test.png', fullPage: true });
  console.log('📸 Screenshot saved: dashboard-test.png\n');

  // Keep browser open for manual testing
  console.log('🎨 MANUAL TESTING TIME!\n');
  console.log('Browser will stay open for 60 seconds.');
  console.log('Try these actions manually:\n');
  console.log('  1. Drag widgets anywhere on the grid');
  console.log('  2. Hover over bottom-right corner to see resize handle');
  console.log('  3. Drag resize handle to make widgets bigger/smaller');
  console.log('  4. Watch for cyan placeholder showing drop position\n');
  console.log('Press Ctrl+C to close early.\n');

  await page.waitForTimeout(60000);

  await browser.close();
  console.log('✓ Dashboard test complete!\n');
}

testDashboard().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
