/**
 * Test CSP fix
 */
import puppeteer from 'puppeteer-core';

async function testCSPFix() {
  console.log('🔍 Testing CSP Fix\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });

  const pages = await browser.pages();
  const page = pages[0];

  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    // Filter out CSP violations
    if (text.includes('Content Security Policy') || text.includes('CSP')) {
      consoleMessages.push(`[${msg.type()}] ${text}`);
    }
  });

  const cspViolations = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('violates the following Content Security Policy')) {
      cspViolations.push(text);
    }
  });

  console.log('📡 Loading page...\n');

  try {
    await page.goto('http://localhost:3000/vanilla.html', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    console.log('   ✅ Page loaded successfully\n');
  } catch (err) {
    console.log(`   ❌ Page load failed: ${err.message}\n`);
    await browser.disconnect();
    return;
  }

  await new Promise(r => setTimeout(r, 2000));

  console.log('📋 Checking page functionality...\n');

  const pageState = await page.evaluate(() => {
    return {
      hasHeader: !!document.getElementById('header'),
      hasMain: !!document.getElementById('main'),
      hasWorkspaceStore: !!window.__workspaceStore,
      bodyVisible: document.body.offsetHeight > 0,
      titleText: document.title
    };
  });

  console.log(`   Title: ${pageState.titleText}`);
  console.log(`   Has header: ${pageState.hasHeader ? '✅' : '❌'}`);
  console.log(`   Has main: ${pageState.hasMain ? '✅' : '❌'}`);
  console.log(`   Has workspace store: ${pageState.hasWorkspaceStore ? '✅' : '❌'}`);
  console.log(`   Body visible: ${pageState.bodyVisible ? '✅' : '❌'}\n`);

  // Test API connection
  console.log('🌐 Testing API connection...\n');

  const apiTest = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  if (apiTest.success) {
    console.log(`   ✅ API connected: ${apiTest.data.status}`);
    console.log(`   ✅ Kalshi: ${apiTest.data.kalshi}\n`);
  } else {
    console.log(`   ❌ API error: ${apiTest.error}\n`);
  }

  if (cspViolations.length > 0) {
    console.log('⚠️  CSP Violations Found:\n');
    cspViolations.forEach((violation, i) => {
      console.log(`   ${i + 1}. ${violation}\n`);
    });
  } else {
    console.log('✅ No CSP violations!\n');
  }

  if (consoleMessages.length > 0) {
    console.log('📝 CSP-related messages:\n');
    consoleMessages.forEach(msg => console.log(`   ${msg}`));
    console.log();
  }

  await page.screenshot({ path: 'csp-fix-test.png', fullPage: true });
  console.log('📸 Screenshot: csp-fix-test.png\n');

  await browser.disconnect();
  console.log('✨ Test complete!\n');
}

testCSPFix().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
