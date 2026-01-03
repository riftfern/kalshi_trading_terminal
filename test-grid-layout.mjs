/**
 * Test CSS Grid Layout Implementation
 */
import puppeteer from 'puppeteer-core';

async function testGridLayout() {
  console.log('🧪 Testing CSS Grid Layout\n');

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
  await page.goto('http://localhost:3000/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('📋 Checking Grid Layout...\n');

  const gridState = await page.evaluate(() => {
    const gridContainer = document.querySelector('.grid-layout');
    const widgets = document.querySelectorAll('.widget-container');

    if (!gridContainer) {
      return { hasGrid: false };
    }

    const gridStyles = window.getComputedStyle(gridContainer);

    // Get widget positioning
    const widgetData = Array.from(widgets).map((widget, index) => {
      const styles = window.getComputedStyle(widget);
      return {
        id: widget.id,
        gridColumnStart: styles.gridColumnStart,
        gridColumnEnd: styles.gridColumnEnd,
        gridRowStart: styles.gridRowStart,
        gridRowEnd: styles.gridRowEnd,
      };
    });

    return {
      hasGrid: true,
      gridDisplay: gridStyles.display,
      gridTemplateColumns: gridStyles.gridTemplateColumns,
      gridAutoRows: gridStyles.gridAutoRows,
      gridGap: gridStyles.gap,
      widgetCount: widgets.length,
      widgets: widgetData,
    };
  });

  if (!gridState.hasGrid) {
    console.log('   ❌ Grid container not found!\n');
    await browser.disconnect();
    return;
  }

  console.log(`   Grid display: ${gridState.gridDisplay === 'grid' ? '✅' : '❌'} (${gridState.gridDisplay})`);
  console.log(`   Grid template columns: ${gridState.gridTemplateColumns}`);
  console.log(`   Grid auto rows: ${gridState.gridAutoRows}`);
  console.log(`   Grid gap: ${gridState.gridGap}`);
  console.log(`   Widget count: ${gridState.widgetCount}\n`);

  console.log('📍 Widget Positioning:\n');
  gridState.widgets.forEach((widget, index) => {
    console.log(`   Widget ${index + 1} (${widget.id}):`);
    console.log(`     Column: ${widget.gridColumnStart} → ${widget.gridColumnEnd}`);
    console.log(`     Row: ${widget.gridRowStart} → ${widget.gridRowEnd}\n`);
  });

  // Check if widgets have proper positioning
  const hasPositioning = gridState.widgets.every(w =>
    w.gridColumnStart !== 'auto' &&
    w.gridRowStart !== 'auto'
  );

  console.log(`   Widgets have explicit positioning: ${hasPositioning ? '✅' : '❌'}\n`);

  // Test breakpoint responsiveness
  console.log('📱 Testing Responsive Breakpoints...\n');

  // Test medium breakpoint
  await page.setViewport({ width: 900, height: 768 });
  await new Promise(r => setTimeout(r, 500));

  const mdGrid = await page.evaluate(() => {
    const gridContainer = document.querySelector('.grid-layout');
    const gridStyles = window.getComputedStyle(gridContainer);
    return {
      gridTemplateColumns: gridStyles.gridTemplateColumns,
    };
  });

  console.log(`   Medium (900px): ${mdGrid.gridTemplateColumns}`);

  // Test small breakpoint
  await page.setViewport({ width: 600, height: 800 });
  await new Promise(r => setTimeout(r, 500));

  const smGrid = await page.evaluate(() => {
    const gridContainer = document.querySelector('.grid-layout');
    const gridStyles = window.getComputedStyle(gridContainer);
    return {
      gridTemplateColumns: gridStyles.gridTemplateColumns,
    };
  });

  console.log(`   Small (600px): ${smGrid.gridTemplateColumns}\n`);

  // Reset viewport
  await page.setViewport({ width: 1280, height: 800 });

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  } else {
    console.log('✅ No JavaScript errors\n');
  }

  await page.screenshot({ path: 'grid-layout-test.png', fullPage: true });
  console.log('📸 Screenshot: grid-layout-test.png\n');

  await browser.disconnect();

  const allPass = gridState.gridDisplay === 'grid' &&
                  hasPositioning &&
                  errors.length === 0;

  if (allPass) {
    console.log('✨ Grid layout is working correctly!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
  }
}

testGridLayout().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
