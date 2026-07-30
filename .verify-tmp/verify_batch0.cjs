const { chromium } = require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, locale: 'en-US' });
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  const storedLang = await page.evaluate(() => localStorage.getItem('language'));
  console.log('initial html lang (locale=en-US):', htmlLang, 'stored:', storedLang);

  const langBtn = page.locator('.toolbar-lang-btn');
  console.log('lang button count:', await langBtn.count());
  console.log('lang button text:', await langBtn.innerText());

  await langBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'D:/RCS-WorkOS-V2/.verify-tmp/lang-dropdown.png' });

  // click Indonesia option
  const idOption = page.locator('button', { hasText: 'Indonesia' });
  await idOption.click();
  await page.waitForTimeout(300);
  const htmlLangAfter = await page.evaluate(() => document.documentElement.lang);
  const storedLangAfter = await page.evaluate(() => localStorage.getItem('language'));
  console.log('after switching to ID: html lang=', htmlLangAfter, 'stored=', storedLangAfter);
  console.log('lang button text after switch:', await langBtn.innerText());

  await browser.close();
})();
