/**
 * Debug drag-and-drop with Brave browser using Playwright
 */
import playwright from 'playwright';

async function debugDragWithBrave() {
  console.log('🧪 Debugging Drag-and-Drop with Brave Browser\n');

  // Launch Brave browser
  const browser = await playwright.chromium.launch({
    headless: false,
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Collect console logs and errors
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('📡 Loading application...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Step 1: Check if widgets are rendered
  console.log('Step 1: Checking widget containers...\n');

  const widgets = await page.evaluate(() => {
    const containers = document.querySelectorAll('.widget-container');
    return Array.from(containers).map(c => ({
      id: c.id,
      draggable: c.draggable,
      className: c.className,
    }));
  });

  console.log(`Found ${widgets.length} widgets:`);
  widgets.forEach(w => {
    console.log(`  - ${w.id}: draggable=${w.draggable}`);
  });
  console.log();

  // Step 2: Check drag handles
  console.log('Step 2: Checking drag handles...\n');

  const dragHandles = await page.evaluate(() => {
    const handles = document.querySelectorAll('.widget-drag-handle');
    return Array.from(handles).map(h => ({
      className: h.className,
      parent: h.parentElement?.className,
      hasGripperIcon: !!h.querySelector('.widget-drag-icon'),
    }));
  });

  console.log(`Found ${dragHandles.length} drag handles:`);
  dragHandles.forEach((h, i) => {
    console.log(`  Handle ${i + 1}: hasGripper=${h.hasGripperIcon}`);
  });
  console.log();

  // Step 3: Add event listeners to track what happens
  console.log('Step 3: Adding debug event listeners...\n');

  await page.evaluate(() => {
    window.dragEvents = [];

    const containers = document.querySelectorAll('.widget-container');
    containers.forEach(container => {
      ['dragstart', 'drag', 'dragend', 'dragover', 'drop', 'dragleave'].forEach(eventType => {
        container.addEventListener(eventType, (e) => {
          window.dragEvents.push({
            type: eventType,
            widgetId: container.dataset.widgetId,
            target: e.target.className,
            currentTarget: e.currentTarget.className,
            timestamp: Date.now(),
          });
        });
      });
    });
  });

  console.log('✓ Debug listeners added\n');

  // Step 4: Try to drag Market Selector to OrderBook
  console.log('Step 4: Attempting to drag Market Selector to OrderBook...\n');

  try {
    // Get the drag handle (header) of Market Selector
    const marketSelectorHeader = await page.locator('#widget-market-selector-default .widget-drag-handle').first();
    const orderbookContainer = await page.locator('#widget-orderbook-default').first();

    // Get bounding boxes
    const sourceBox = await marketSelectorHeader.boundingBox();
    const targetBox = await orderbookContainer.boundingBox();

    if (!sourceBox || !targetBox) {
      console.log('❌ Could not get bounding boxes\n');
      await browser.close();
      return;
    }

    console.log(`Source (Market Selector header): x=${sourceBox.x}, y=${sourceBox.y}`);
    console.log(`Target (OrderBook): x=${targetBox.x}, y=${targetBox.y}\n`);

    // Perform drag
    console.log('Starting drag operation...\n');

    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.waitForTimeout(100);

    console.log('Mouse down on drag handle');

    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.waitForTimeout(100);

    console.log('Mouse moved to target');

    await page.mouse.up();

    console.log('Mouse released\n');

    await page.waitForTimeout(1000);

    // Check events that fired
    const events = await page.evaluate(() => window.dragEvents);

    console.log(`Drag events captured: ${events.length}\n`);

    if (events.length > 0) {
      console.log('Event sequence:');
      events.forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.type} on widget ${event.widgetId}`);
      });
      console.log();
    } else {
      console.log('⚠️  NO drag events were fired!\n');
      console.log('This suggests the drag is not being initiated properly.\n');
    }

    // Check if layout changed
    const finalLayout = await page.evaluate(() => {
      const state = window.__workspaceStore?.getState();
      return state?.layouts?.lg || [];
    });

    console.log('Final layout positions:');
    finalLayout.forEach(item => {
      console.log(`  ${item.i}: x=${item.x}, y=${item.y}`);
    });
    console.log();

  } catch (error) {
    console.log(`❌ Drag operation failed: ${error.message}\n`);
  }

  // Step 5: Check for JavaScript errors
  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`  ${err}`));
    console.log();
  } else {
    console.log('✅ No JavaScript errors\n');
  }

  // Step 6: Take screenshot
  await page.screenshot({ path: 'debug-drag-brave.png', fullPage: true });
  console.log('📸 Screenshot saved: debug-drag-brave.png\n');

  // Keep browser open for manual inspection
  console.log('🔍 Browser will stay open for 30 seconds for manual testing...');
  console.log('   Try dragging widgets manually to see if it works.\n');

  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✓ Browser closed\n');
}

debugDragWithBrave().catch(err => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});
