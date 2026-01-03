/**
 * Debug drag and resize interactions in Brave
 */
import playwright from 'playwright';

async function debugInteractions() {
  console.log('🔍 Debugging Widget Interactions\n');

  const browser = await playwright.chromium.launch({
    headless: false,
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Capture console logs and errors
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Browser Error: ${text}`);
    } else if (type === 'log' && (text.includes('Drag') || text.includes('Resize'))) {
      console.log(`📝 ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  console.log('📡 Loading application...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check 1: Widget container structure
  console.log('CHECK 1: Widget Container Structure\n');

  const widgetInfo = await page.evaluate(() => {
    const containers = document.querySelectorAll('.widget-container');
    return Array.from(containers).map(c => ({
      id: c.id,
      draggable: c.draggable,
      hasResizeHandle: !!c.querySelector('.widget-resize-handle'),
      children: Array.from(c.children).map(child => ({
        tag: child.tagName,
        className: child.className,
      })),
    }));
  });

  widgetInfo.forEach(w => {
    console.log(`  ${w.id}:`);
    console.log(`    draggable: ${w.draggable}`);
    console.log(`    hasResizeHandle: ${w.hasResizeHandle}`);
    console.log(`    children: ${w.children.length}`);
  });
  console.log();

  // Check 2: Event listeners attached
  console.log('CHECK 2: Testing Drag Events\n');

  await page.evaluate(() => {
    window.dragEventLog = [];

    const containers = document.querySelectorAll('.widget-container');
    containers.forEach(container => {
      ['dragstart', 'dragend', 'dragover', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, (e) => {
          window.dragEventLog.push({
            event: eventName,
            widget: container.id,
            timestamp: Date.now(),
          });
        });
      });
    });

    console.log('Event listeners attached for monitoring');
  });

  console.log('Attempting to drag Market Selector...\n');

  try {
    const marketSelector = await page.locator('#widget-market-selector-default').first();
    const msBox = await marketSelector.boundingBox();

    if (msBox) {
      const startX = msBox.x + msBox.width / 2;
      const startY = msBox.y + msBox.height / 2;
      const endX = startX + 200;
      const endY = startY + 200;

      console.log(`  Starting drag from (${Math.round(startX)}, ${Math.round(startY)})`);
      console.log(`  Moving to (${Math.round(endX)}, ${Math.round(endY)})\n`);

      await page.mouse.move(startX, startY);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.waitForTimeout(200);
      await page.mouse.up();
      await page.waitForTimeout(1000);

      const events = await page.evaluate(() => window.dragEventLog);

      console.log(`  Events captured: ${events.length}`);
      if (events.length > 0) {
        events.forEach(e => console.log(`    - ${e.event} on ${e.widget}`));
      } else {
        console.log('    ⚠️  NO DRAG EVENTS FIRED!');
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  console.log();

  // Check 3: Resize handle
  console.log('CHECK 3: Resize Handle\n');

  const resizeHandleInfo = await page.evaluate(() => {
    const handle = document.querySelector('.widget-resize-handle');
    if (!handle) {
      return { exists: false };
    }

    const styles = window.getComputedStyle(handle);
    const rect = handle.getBoundingClientRect();

    return {
      exists: true,
      opacity: styles.opacity,
      cursor: styles.cursor,
      position: {
        bottom: styles.bottom,
        right: styles.right,
        width: styles.width,
        height: styles.height,
      },
      boundingBox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      zIndex: styles.zIndex,
    };
  });

  if (resizeHandleInfo.exists) {
    console.log('  ✅ Resize handle exists');
    console.log(`     opacity: ${resizeHandleInfo.opacity}`);
    console.log(`     cursor: ${resizeHandleInfo.cursor}`);
    console.log(`     position: ${JSON.stringify(resizeHandleInfo.position)}`);
  } else {
    console.log('  ❌ Resize handle NOT FOUND');
  }

  console.log();

  // Check 4: Widget structure issue
  console.log('CHECK 4: Widget DOM Structure\n');

  const domStructure = await page.evaluate(() => {
    const container = document.querySelector('#widget-market-selector-default');
    if (!container) return { exists: false };

    function getStructure(element, depth = 0) {
      const indent = '  '.repeat(depth);
      let result = `${indent}<${element.tagName.toLowerCase()}`;

      if (element.className) {
        result += ` class="${element.className}"`;
      }
      if (element.id) {
        result += ` id="${element.id}"`;
      }
      if (element.draggable) {
        result += ` draggable="${element.draggable}"`;
      }

      result += '>\n';

      Array.from(element.children).forEach(child => {
        result += getStructure(child, depth + 1);
      });

      return result;
    }

    return {
      exists: true,
      structure: getStructure(container),
    };
  });

  if (domStructure.exists) {
    console.log(domStructure.structure);
  }

  console.log();

  // Check 5: GridLayout component state
  console.log('CHECK 5: GridLayout Component\n');

  const gridLayoutState = await page.evaluate(() => {
    const gridLayout = window.__gridLayout;
    if (!gridLayout) {
      return { exists: false };
    }

    return {
      exists: true,
      hasGridContainer: !!gridLayout.gridContainer,
    };
  });

  console.log(`  GridLayout exposed: ${gridLayoutState.exists}`);
  if (gridLayoutState.exists) {
    console.log(`  Has grid container: ${gridLayoutState.hasGridContainer}`);
  }

  console.log();

  // Screenshot
  await page.screenshot({ path: 'debug-interactions.png', fullPage: true });
  console.log('📸 Screenshot: debug-interactions.png\n');

  // Keep open for manual testing
  console.log('🔍 Browser staying open for 60 seconds...');
  console.log('Try manually:');
  console.log('  1. Click and drag a widget');
  console.log('  2. Hover over bottom-right corner of a widget');
  console.log('  3. Watch console for any logs\n');

  await page.waitForTimeout(60000);

  await browser.close();
}

debugInteractions().catch(err => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});
