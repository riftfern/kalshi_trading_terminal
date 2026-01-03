/**
 * Debug website loading issues
 */
import puppeteer from 'puppeteer-core';

async function debugWebsiteLoading() {
  console.log('🔍 Debugging Website Loading Issues\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      error: request.failure()?.errorText || 'Unknown error'
    });
  });

  const responses = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });

  console.log('📡 Step 1: Attempting to navigate to vanilla.html\n');

  try {
    await page.goto('http://localhost:3000/vanilla.html', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    console.log('   ✅ Page loaded successfully\n');
  } catch (err) {
    console.log(`   ❌ Page load failed: ${err.message}\n`);
  }

  // Wait a bit to capture any delayed errors
  await new Promise(r => setTimeout(r, 2000));

  console.log('📋 Step 2: Check Page State\n');

  const pageState = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body?.textContent?.substring(0, 200) || '',
      hasRootElement: !!document.getElementById('root'),
      hasAppElement: !!document.getElementById('app'),
      hasWorkspaceStore: !!window.__workspaceStore,
      hasCommandPalette: !!window.__commandPalette,
      hasAddWidget: !!window.__addWidget,
      bodyHTML: document.body?.innerHTML?.substring(0, 500) || ''
    };
  });

  console.log(`   URL: ${pageState.url}`);
  console.log(`   Title: ${pageState.title}`);
  console.log(`   Has #root: ${pageState.hasRootElement ? '✅' : '❌'}`);
  console.log(`   Has #app: ${pageState.hasAppElement ? '✅' : '❌'}`);
  console.log(`   Has __workspaceStore: ${pageState.hasWorkspaceStore ? '✅' : '❌'}`);
  console.log(`   Has __commandPalette: ${pageState.hasCommandPalette ? '✅' : '❌'}`);
  console.log(`   Has __addWidget: ${pageState.hasAddWidget ? '✅' : '❌'}`);
  console.log(`\n   Body content preview:\n   "${pageState.bodyText}"\n`);

  if (networkErrors.length > 0) {
    console.log('🚨 Step 3: Network Errors\n');
    networkErrors.forEach(err => {
      console.log(`   ❌ ${err.url}`);
      console.log(`      Error: ${err.error}\n`);
    });
  } else {
    console.log('✅ Step 3: No Network Errors\n');
  }

  if (errors.length > 0) {
    console.log('🚨 Step 4: JavaScript Errors\n');
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}\n`);
    });
  } else {
    console.log('✅ Step 4: No JavaScript Errors\n');
  }

  console.log('📝 Step 5: Recent Console Messages\n');
  consoleMessages.slice(-15).forEach(msg => {
    console.log(`   ${msg}`);
  });

  console.log('\n🌐 Step 6: Key Resource Loading\n');
  const jsFiles = responses.filter(r => r.url.includes('.js') && !r.url.includes('node_modules'));
  const cssFiles = responses.filter(r => r.url.includes('.css'));
  const htmlFiles = responses.filter(r => r.url.includes('.html'));

  console.log('   HTML Files:');
  htmlFiles.forEach(r => {
    const status = r.status === 200 ? '✅' : '❌';
    console.log(`   ${status} ${r.status} - ${r.url}`);
  });

  console.log('\n   JavaScript Files:');
  jsFiles.slice(0, 10).forEach(r => {
    const status = r.status === 200 ? '✅' : '❌';
    console.log(`   ${status} ${r.status} - ${r.url.split('/').pop()}`);
  });

  console.log('\n   CSS Files:');
  cssFiles.forEach(r => {
    const status = r.status === 200 ? '✅' : '❌';
    console.log(`   ${status} ${r.status} - ${r.url.split('/').pop()}`);
  });

  // Take screenshot
  await page.screenshot({ path: 'debug-website-loading.png', fullPage: true });
  console.log('\n📸 Screenshot saved: debug-website-loading.png\n');

  await browser.disconnect();
  console.log('✨ Debug complete!\n');
}

debugWebsiteLoading().catch(err => {
  console.error('\n❌ Debug failed:', err);
  process.exit(1);
});
