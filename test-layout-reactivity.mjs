/**
 * Test layout reactivity when widgets are added/removed
 */
import puppeteer from 'puppeteer-core';

async function testLayoutReactivity() {
  console.log('🧪 Testing Layout Reactivity\n');

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
  await new Promise(r => setTimeout(r, 2000));

  // Check initial state
  console.log('📋 Checking initial widget count...\n');

  const initialState = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    const widgets = document.querySelectorAll('.widget-container');
    return {
      storeCount: state?.widgets?.length || 0,
      domCount: widgets.length,
      storeWidgets: state?.widgets?.map(w => ({ type: w.type, id: w.id })) || [],
    };
  });

  console.log(`   Store widget count: ${initialState.storeCount}`);
  console.log(`   DOM widget count: ${initialState.domCount}`);
  console.log(`   Match: ${initialState.storeCount === initialState.domCount ? '✅' : '❌'}\n`);

  // Test adding a widget via store
  console.log('➕ Adding a Chart widget via store...\n');

  await page.evaluate(() => {
    const addWidget = window.__addWidget;
    if (addWidget) {
      // addWidget signature: (type, ticker?, config?)
      addWidget('chart', 'TEST-TICKER', {});
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterAddState = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    const widgets = document.querySelectorAll('.widget-container');

    // Find chart widget by type in state
    const chartWidgetInState = state?.widgets?.find(w => w.type === 'chart');
    const chartWidgetId = chartWidgetInState?.id;
    const chartWidget = chartWidgetId ? document.querySelector(`#widget-${chartWidgetId}`) : null;

    return {
      storeCount: state?.widgets?.length || 0,
      domCount: widgets.length,
      hasChartWidget: !!chartWidget,
      chartWidgetInState: !!chartWidgetInState,
      chartWidgetPosition: chartWidget ? {
        gridColumnStart: chartWidget.style.gridColumnStart,
        gridColumnEnd: chartWidget.style.gridColumnEnd,
        gridRowStart: chartWidget.style.gridRowStart,
        gridRowEnd: chartWidget.style.gridRowEnd,
      } : null,
    };
  });

  console.log(`   Store widget count after add: ${afterAddState.storeCount}`);
  console.log(`   DOM widget count after add: ${afterAddState.domCount}`);
  console.log(`   Chart widget in state: ${afterAddState.chartWidgetInState ? '✅' : '❌'}`);
  console.log(`   Chart widget exists in DOM: ${afterAddState.hasChartWidget ? '✅' : '❌'}`);
  console.log(`   Store/DOM match: ${afterAddState.storeCount === afterAddState.domCount ? '✅' : '❌'}`);

  if (afterAddState.chartWidgetPosition) {
    console.log(`   Chart widget position:`);
    console.log(`     Column: ${afterAddState.chartWidgetPosition.gridColumnStart} → ${afterAddState.chartWidgetPosition.gridColumnEnd}`);
    console.log(`     Row: ${afterAddState.chartWidgetPosition.gridRowStart} → ${afterAddState.chartWidgetPosition.gridRowEnd}`);
  }
  console.log();

  // Test removing a widget via store
  console.log('➖ Removing the Chart widget via store...\n');

  const chartWidgetId = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    const chartWidget = state?.widgets?.find(w => w.type === 'chart');
    return chartWidget?.id;
  });

  if (chartWidgetId) {
    await page.evaluate((id) => {
      const removeWidget = window.__removeWidget;
      if (removeWidget) {
        removeWidget(id);
      }
    }, chartWidgetId);
  }

  await new Promise(r => setTimeout(r, 1000));

  const afterRemoveState = await page.evaluate(() => {
    const state = window.__workspaceStore?.getState();
    const widgets = document.querySelectorAll('.widget-container');

    // Check if chart widget still exists
    const chartWidgetInState = state?.widgets?.find(w => w.type === 'chart');
    const chartWidgetId = chartWidgetInState?.id;
    const chartWidget = chartWidgetId ? document.querySelector(`#widget-${chartWidgetId}`) : null;

    return {
      storeCount: state?.widgets?.length || 0,
      domCount: widgets.length,
      hasChartWidget: !!chartWidget,
      chartWidgetInState: !!chartWidgetInState,
    };
  });

  console.log(`   Store widget count after remove: ${afterRemoveState.storeCount}`);
  console.log(`   DOM widget count after remove: ${afterRemoveState.domCount}`);
  console.log(`   Chart widget in state: ${afterRemoveState.chartWidgetInState ? '❌ FAIL' : '✅ PASS'}`);
  console.log(`   Chart widget still in DOM: ${afterRemoveState.hasChartWidget ? '❌ FAIL' : '✅ PASS'}`);
  console.log(`   Store/DOM match: ${afterRemoveState.storeCount === afterRemoveState.domCount ? '✅' : '❌'}\n`);

  // Check if back to initial state
  const backToInitial = afterRemoveState.storeCount === initialState.storeCount &&
                        afterRemoveState.domCount === initialState.domCount;
  console.log(`   Back to initial state: ${backToInitial ? '✅' : '❌'}\n`);

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log();
  } else {
    console.log('✅ No JavaScript errors\n');
  }

  await page.screenshot({ path: 'layout-reactivity-test.png', fullPage: true });
  console.log('📸 Screenshot: layout-reactivity-test.png\n');

  await browser.disconnect();

  // Summary
  const allPass =
    initialState.storeCount === initialState.domCount &&
    afterAddState.storeCount === afterAddState.domCount &&
    afterAddState.chartWidgetInState &&
    afterAddState.hasChartWidget &&
    afterRemoveState.storeCount === afterRemoveState.domCount &&
    !afterRemoveState.chartWidgetInState &&
    !afterRemoveState.hasChartWidget &&
    backToInitial &&
    errors.length === 0;

  if (allPass) {
    console.log('✨ Layout reactivity is working correctly!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
  }
}

testLayoutReactivity().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
