/**
 * Debug browser state - systematic inspection
 */
import puppeteer from 'puppeteer-core';

async function debugBrowser() {
  console.log('🔍 Starting systematic browser debugging\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  // Step 1: Navigate and check initial state
  console.log('Step 1: Loading application...\n');
  await page.goto('http://localhost:3002/vanilla.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const url = await page.url();
  console.log(`✓ URL: ${url}\n`);

  // Check for console errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await new Promise(r => setTimeout(r, 1000));

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors Found:');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  } else {
    console.log('✓ No JavaScript errors\n');
  }

  // Step 2: Inspect GridLayout root element
  console.log('Step 2: Inspecting GridLayout mount point...\n');

  const rootInfo = await page.evaluate(() => {
    const main = document.getElementById('main');
    return {
      exists: !!main,
      tagName: main?.tagName,
      className: main?.className,
      computedWidth: main ? window.getComputedStyle(main).width : null,
      computedHeight: main ? window.getComputedStyle(main).height : null,
      children: main ? Array.from(main.children).map(child => ({
        tagName: child.tagName,
        className: child.className,
        id: child.id,
      })) : [],
    };
  });

  console.log('Main container:', JSON.stringify(rootInfo, null, 2));
  console.log();

  // Step 3: Inspect grid-layout container
  console.log('Step 3: Inspecting .grid-layout container...\n');

  const gridInfo = await page.evaluate(() => {
    const grid = document.querySelector('.grid-layout');
    if (!grid) {
      return { exists: false };
    }

    const styles = window.getComputedStyle(grid);
    return {
      exists: true,
      display: styles.display,
      gridTemplateColumns: styles.gridTemplateColumns,
      gridAutoRows: styles.gridAutoRows,
      gap: styles.gap,
      padding: styles.padding,
      width: styles.width,
      height: styles.height,
      childrenCount: grid.children.length,
      children: Array.from(grid.children).map(child => ({
        tagName: child.tagName,
        className: child.className,
        id: child.id,
      })),
    };
  });

  console.log('Grid layout:', JSON.stringify(gridInfo, null, 2));
  console.log();

  // Step 4: Inspect widget-container elements
  console.log('Step 4: Inspecting .widget-container elements...\n');

  const widgetInfo = await page.evaluate(() => {
    const containers = document.querySelectorAll('.widget-container');
    return Array.from(containers).map(container => {
      const styles = window.getComputedStyle(container);
      return {
        id: container.id,
        className: container.className,
        gridColumnStart: styles.gridColumnStart,
        gridColumnEnd: styles.gridColumnEnd,
        gridRowStart: styles.gridRowStart,
        gridRowEnd: styles.gridRowEnd,
        hasContent: container.children.length > 0,
        childrenCount: container.children.length,
      };
    });
  });

  console.log(`Found ${widgetInfo.length} widget containers:`);
  console.log(JSON.stringify(widgetInfo, null, 2));
  console.log();

  // Step 5: Inspect workspaceStore state
  console.log('Step 5: Inspecting workspaceStore state...\n');

  const storeState = await page.evaluate(() => {
    if (!window.__workspaceStore) {
      return { exists: false };
    }

    const state = window.__workspaceStore.getState();
    return {
      exists: true,
      widgetsCount: state.widgets?.length || 0,
      widgets: state.widgets?.map(w => ({
        id: w.id,
        type: w.type,
        title: w.title,
      })) || [],
      layoutsLg: state.layouts?.lg || [],
      layoutsMd: state.layouts?.md || [],
      layoutsSm: state.layouts?.sm || [],
      currentTicker: state.currentTicker,
      activeWidgetId: state.activeWidgetId,
    };
  });

  console.log('Store state:', JSON.stringify(storeState, null, 2));
  console.log();

  // Step 6: Identify discrepancy
  console.log('Step 6: Analysis\n');

  if (!storeState.exists) {
    console.log('❌ CRITICAL: workspaceStore is not exposed on window');
  } else if (storeState.widgetsCount === 0) {
    console.log('❌ CRITICAL: No widgets in store (expected 3 default widgets)');
  } else if (!gridInfo.exists) {
    console.log('❌ CRITICAL: .grid-layout element not found in DOM');
  } else if (gridInfo.display !== 'grid') {
    console.log(`❌ CRITICAL: .grid-layout has display: ${gridInfo.display} (expected "grid")`);
  } else if (widgetInfo.length === 0) {
    console.log('❌ CRITICAL: No .widget-container elements found (store has widgets but DOM is empty)');
  } else if (widgetInfo.length !== storeState.widgetsCount) {
    console.log(`❌ DISCREPANCY: Store has ${storeState.widgetsCount} widgets but DOM has ${widgetInfo.length} containers`);
  } else {
    console.log('✓ Store and DOM are in sync');

    // Check positioning
    const mispositioned = widgetInfo.filter(w =>
      w.gridColumnStart === 'auto' || w.gridRowStart === 'auto'
    );

    if (mispositioned.length > 0) {
      console.log(`❌ POSITIONING ISSUE: ${mispositioned.length} widgets have auto positioning`);
      console.log('Mispositioned widgets:', mispositioned.map(w => w.id));
    } else {
      console.log('✓ All widgets have explicit grid positioning');
    }
  }

  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('\n📸 Screenshot saved: debug-screenshot.png');

  await browser.disconnect();
}

debugBrowser().catch(err => {
  console.error('❌ Debug failed:', err);
  process.exit(1);
});
