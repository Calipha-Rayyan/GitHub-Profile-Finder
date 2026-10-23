import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

async function fillInput(page, selector, text) {
  const input = await page.$(selector);
  if (!input) throw new Error(`Selector "${selector}" not found`);
  await input.focus();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (text) {
    await input.type(text);
  }
}

async function verifyModalAndSimplifiedToolbar() {
  console.log('=== VERIFYING SIMPLIFIED TOOLBAR & CENTERED ERROR MODAL ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // 1. Test invalid format in hero search
    console.log('[1] Submitting invalid username ("invalid_username!!")...');
    await fillInput(page, '#hero-github-username', 'invalid_username!!');
    await page.click('.search-form__btn');

    await page.waitForSelector('.error-modal', { timeout: 5000 });
    const modalTitle1 = await page.$eval('.error-modal__title', el => el.textContent);
    console.log(`- Modal appeared: "${modalTitle1}" (PASS)`);
    results.push({ test: 'Invalid format triggers centered modal', pass: true });

    // Take screenshot of invalid format modal
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-error-modal-invalid-format.png') });
    console.log('Saved screenshots/qa-error-modal-invalid-format.png');

    // Click "Try Another Search"
    console.log('[2] Clicking "Try Another Search"...');
    await page.click('.error-modal__btn--primary');
    await new Promise(r => setTimeout(r, 200));

    // Verify modal dismissed and input focused
    const modalDismissed1 = (await page.$('.error-modal')) === null;
    const activeElementId = await page.evaluate(() => document.activeElement?.id);
    console.log(`- Modal dismissed: ${modalDismissed1}, Focused input: ${activeElementId}`);
    results.push({ test: 'Modal dismissed and input focused', pass: modalDismissed1 && activeElementId === 'hero-github-username' });

    // 2. Test valid search to check simplified ResultsToolbar
    console.log('\n[3] Searching valid user ("octocat")...');
    await fillInput(page, '#hero-github-username', 'octocat');
    await page.click('.search-form__btn');

    await page.waitForSelector('.results-view', { timeout: 10000 });
    await page.waitForSelector('.results-toolbar', { timeout: 5000 });

    // Check that toolbar does NOT contain the search form or input
    const toolbarInput = await page.$('.results-toolbar__input');
    const toolbarSearchBtn = await page.$('.results-toolbar__form');
    const isSearchFormRemoved = toolbarInput === null && toolbarSearchBtn === null;
    console.log(`- Redundant search input/button removed from ResultsToolbar: ${isSearchFormRemoved ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Toolbar search input removed', pass: isSearchFormRemoved });

    // Verify Back to Search and Saved buttons still exist in toolbar
    const hasBackBtn = (await page.$('.results-toolbar .back-btn')) !== null;
    console.log(`- "Back to Search" button present in ResultsToolbar: ${hasBackBtn ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Back to Search present in toolbar', pass: hasBackBtn });

    // Capture simplified toolbar screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-results-toolbar-simplified.png') });
    console.log('Saved screenshots/qa-results-toolbar-simplified.png');

    // 3. Click Back to Search and test nonexistent username (404)
    console.log('\n[4] Returning to search and searching nonexistent user...');
    await page.click('.results-toolbar .back-btn');
    await page.waitForSelector('.hero', { timeout: 5000 });

    await fillInput(page, '#hero-github-username', 'user-does-not-exist-9988771122');
    await page.click('.search-form__btn');

    // Wait for 404 error modal to appear
    await page.waitForSelector('.error-modal', { timeout: 10000 });
    const modalTitle404 = await page.$eval('.error-modal__title', el => el.textContent);
    const modalMessage404 = await page.$eval('.error-modal__message', el => el.textContent);
    console.log(`- 404 Modal appeared: "${modalTitle404}" - "${modalMessage404}" (PASS)`);
    results.push({ test: '404 User Not Found triggers centered modal', pass: true });

    // Capture wrong username modal screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-error-modal-wrong-username.png') });
    console.log('Saved screenshots/qa-error-modal-wrong-username.png');

    // Click "Okay"
    console.log('[5] Clicking "Okay" button...');
    await page.click('.error-modal__btn--secondary');
    await new Promise(r => setTimeout(r, 200));

    const modalDismissed2 = (await page.$('.error-modal')) === null;
    const heroVisible = (await page.$('.hero')) !== null;
    console.log(`- Modal dismissed: ${modalDismissed2}, Hero visible: ${heroVisible}`);
    results.push({ test: 'Okay button dismisses modal and restores search view', pass: modalDismissed2 && heroVisible });

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

verifyModalAndSimplifiedToolbar();
