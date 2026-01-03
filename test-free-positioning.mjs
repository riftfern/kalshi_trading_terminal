/**
 * Test free grid positioning with Brave browser
 */
import playwright from 'playwright';

async function testFreePositioning() {
  console.log('🧪 Testing Free Grid Positioning\n');

  const browser = await playwright.chromium.launch({
    headless: false,
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('📡 Loading application...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check initial layout
  console.log('📋 Initial layout:\n');

  const initialLayout = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    return state?.layouts?.lg || [];
  });

  initialLayout.forEach(item => {
    console.log(`   ${item.i}: x=${item.x}, y=${item.y}, w=${item.w}, h=${item.h}`);
  });
  console.log();

  // Test 1: Move Market Selector to an empty area
  console.log('Test 1: Moving Market Selector to bottom-left (x=0, y=8)...\n');

  try {
    const marketSelector = await page.locator('#widget-market-selector-default').first();
    const gridContainer = await page.locator('.grid-layout').first();

    const containerBox = await gridContainer.boundingBox();
    const selectorBox = await marketSelector.boundingBox();

    if (!containerBox || !selectorBox) {
      console.log('❌ Could not get bounding boxes\n');
      await browser.close();
      return;
    }

    // Calculate target position (bottom-left of grid)
    // x=0, y=8 in grid coords
    const targetX = containerBox.x + 20; // left edge + padding
    const targetY = containerBox.y + (8 * (40 + 6)) + 20; // y=8 rows down

    const sourceX = selectorBox.x + selectorBox.width / 2;
    const sourceY = selectorBox.y + selectorBox.height / 2;

    // Perform drag
    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Check new layout
    const newLayout = await page.evaluate(() => {
      const state = window.__workspaceStore?.getState();
      return state?.layouts?.lg || [];
    });

    console.log('Layout after move:\n');
    newLayout.forEach(item => {
      console.log(`   ${item.i}: x=${item.x}, y=${item.y}, w=${item.w}, h=${item.h}`);
    });
    console.log();

    const marketSelectorNew = newLayout.find(l => l.i === 'market-selector-default');
    const moved = marketSelectorNew && (marketSelectorNew.y >= 4); // Should be lower than before

    if (moved) {
      console.log(`✅ Market Selector moved to new position (x=${marketSelectorNew.x}, y=${marketSelectorNew.y})\n`);
    } else {
      console.log('❌ Market Selector did not move to expected position\n');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}\n`);
  }

  // Test 2: Check placeholder visibility during drag
  console.log('Test 2: Checking placeholder appearance...\n');

  await page.evaluate(() => {
    window.placeholderSeen = false;
    const observer = new MutationObserver(() => {
      const placeholder = document.querySelector('.grid-placeholder');
      if (placeholder && placeholder.style.display !== 'none') {
        window.placeholderSeen = true;
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, childList: true });
  });

  try {
    const orderbook = await page.locator('#widget-orderbook-default').first();
    const obBox = await orderbook.boundingBox();

    if (obBox) {
      const sourceX = obBox.x + obBox.width / 2;
      const sourceY = obBox.y + obBox.height / 2;

      await page.mouse.move(sourceX, sourceY);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(sourceX + 100, sourceY + 100, { steps: 10 });
      await page.waitForTimeout(200);
      await page.mouse.up();
    }

    const placeholderWasSeen = await page.evaluate(() => window.placeholderSeen);

    if (placeholderWasSeen) {
      console.log('✅ Placeholder appeared during drag\n');
    } else {
      console.log('⚠️  Placeholder was not detected\n');
    }

  } catch (error) {
    console.log(`❌ Placeholder test failed: ${error.message}\n`);
  }

  // Screenshot
  await page.screenshot({ path: 'free-positioning-test.png', fullPage: true });
  console.log('📸 Screenshot: free-positioning-test.png\n');

  // Keep browser open for manual testing
  console.log('🔍 Browser will stay open for 30 seconds for manual testing...');
  console.log('   Try dragging widgets to different positions!\n');

  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✓ Tests complete\n');
}

testFreePositioning().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
