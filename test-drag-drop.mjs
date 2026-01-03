/**
 * Test drag-and-drop functionality
 */
import puppeteer from 'puppeteer-core';

async function testDragDrop() {
  console.log('🧪 Testing Drag and Drop Functionality\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('📡 Loading page...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Check initial state
  console.log('📋 Initial layout positions:\n');

  const initialLayout = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    return state?.layouts?.lg || [];
  });

  initialLayout.forEach(item => {
    console.log(`   ${item.i}: x=${item.x}, y=${item.y}, w=${item.w}, h=${item.h}`);
  });
  console.log();

  // Check if containers are draggable
  const draggableInfo = await page.evaluate(() => {
    const containers = document.querySelectorAll('.widget-container');
    return Array.from(containers).map(c => ({
      id: c.id,
      draggable: c.draggable,
      hasDragListeners: !!c.ondragstart,
    }));
  });

  console.log('🔍 Widget container draggable status:\n');
  draggableInfo.forEach(info => {
    console.log(`   ${info.id}: draggable=${info.draggable}`);
  });
  console.log();

  // Simulate drag and drop
  console.log('🎯 Simulating drag and drop (Market Selector ↔ OrderBook)...\n');

  try {
    // Get the positions of the widgets to drag
    const widgetPositions = await page.evaluate(() => {
      const marketSelector = document.getElementById('widget-market-selector-default');
      const orderbook = document.getElementById('widget-orderbook-default');

      if (!marketSelector || !orderbook) {
        return null;
      }

      const msRect = marketSelector.getBoundingClientRect();
      const obRect = orderbook.getBoundingClientRect();

      return {
        marketSelector: {
          x: msRect.left + msRect.width / 2,
          y: msRect.top + msRect.height / 2,
        },
        orderbook: {
          x: obRect.left + obRect.width / 2,
          y: obRect.top + obRect.height / 2,
        },
      };
    });

    if (widgetPositions) {
      // Drag market selector to orderbook position
      await page.mouse.move(widgetPositions.marketSelector.x, widgetPositions.marketSelector.y);
      await page.mouse.down();
      await page.mouse.move(widgetPositions.orderbook.x, widgetPositions.orderbook.y, { steps: 10 });
      await page.mouse.up();

      await new Promise(r => setTimeout(r, 1000));

      // Check if layout changed
      const newLayout = await page.evaluate(() => {
        const state = window.__workspaceStore?.getState();
        return state?.layouts?.lg || [];
      });

      console.log('📋 Layout after drag:\n');
      newLayout.forEach(item => {
        console.log(`   ${item.i}: x=${item.x}, y=${item.y}, w=${item.w}, h=${item.h}`);
      });
      console.log();

      // Compare layouts
      const marketSelectorInitial = initialLayout.find(l => l.i === 'market-selector-default');
      const orderbookInitial = initialLayout.find(l => l.i === 'orderbook-default');
      const marketSelectorNew = newLayout.find(l => l.i === 'market-selector-default');
      const orderbookNew = newLayout.find(l => l.i === 'orderbook-default');

      const positionsSwapped =
        marketSelectorNew?.x === orderbookInitial?.x &&
        marketSelectorNew?.y === orderbookInitial?.y &&
        orderbookNew?.x === marketSelectorInitial?.x &&
        orderbookNew?.y === marketSelectorInitial?.y;

      if (positionsSwapped) {
        console.log('✅ Positions swapped successfully!\n');
      } else {
        console.log('❌ Positions did not swap\n');
        console.log('Expected:');
        console.log(`   market-selector: x=${orderbookInitial?.x}, y=${orderbookInitial?.y}`);
        console.log(`   orderbook: x=${marketSelectorInitial?.x}, y=${marketSelectorInitial?.y}`);
        console.log('Actual:');
        console.log(`   market-selector: x=${marketSelectorNew?.x}, y=${marketSelectorNew?.y}`);
        console.log(`   orderbook: x=${orderbookNew?.x}, y=${orderbookNew?.y}\n`);
      }
    } else {
      console.log('❌ Could not find widgets to drag\n');
    }
  } catch (error) {
    console.log(`❌ Drag simulation failed: ${error.message}\n`);
  }

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  } else {
    console.log('✅ No JavaScript errors\n');
  }

  await page.screenshot({ path: 'drag-drop-test.png', fullPage: true });
  console.log('📸 Screenshot saved: drag-drop-test.png\n');

  await browser.disconnect();
}

testDragDrop().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
