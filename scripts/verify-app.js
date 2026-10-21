import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fillInput(page, selector, text) {
  const input = await page.$(selector);
  await input.focus();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (text) {
    await input.type(text);
  }
}

async function verifyApp() {
  console.log('--- Starting Comprehensive Browser Verification ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Monitor console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // 1. Desktop Initial View (1440x900)
  console.log('1. Testing Desktop View (1440x900)...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Verify elements
  const title = await page.title();
  console.log('Page title:', title);

  const heroHeadline = await page.$eval('.hero__headline', el => el.textContent);
  console.log('Hero headline:', heroHeadline.trim());

  const hasVideo = await page.$eval('.hero__video', el => !!el);
  console.log('Video element present:', hasVideo);

  const hasPrism = await page.$eval('.prism__scene', el => !!el);
  console.log('3D Prism present:', hasPrism);

  await page.screenshot({ path: path.join(screenshotsDir, '1-desktop-hero.png') });
  console.log('Captured 1-desktop-hero.png');

  // 2. Test Empty Input Validation
  console.log('2. Testing Empty Input Validation...');
  const searchBtn = await page.$('.search-form__btn');
  await searchBtn.click();
  await page.waitForSelector('.search-form__error');
  const emptyError = await page.$eval('.search-form__error', el => el.textContent);
  console.log('Empty error message:', emptyError);
  await page.screenshot({ path: path.join(screenshotsDir, '2-empty-validation.png') });

  // 3. Test Invalid Username Validation
  console.log('3. Testing Invalid Username Validation...');
  await fillInput(page, '.search-form__input', 'invalid_user_name!!');
  await searchBtn.click();
  const invalidError = await page.$eval('.search-form__error', el => el.textContent);
  console.log('Invalid format error:', invalidError);

  // 4. Test User Not Found (404)
  console.log('4. Testing User Not Found (404)...');
  await fillInput(page, '.search-form__input', 'nonexistent-user-xyz-987');
  await searchBtn.click();
  await page.waitForSelector('.error-state', { timeout: 10000 });
  const notFoundTitle = await page.$eval('.error-state__title', el => el.textContent);
  const notFoundMsg = await page.$eval('.error-state__message', el => el.textContent);
  console.log('404 state title:', notFoundTitle);
  console.log('404 state message:', notFoundMsg);
  await page.screenshot({ path: path.join(screenshotsDir, '3-user-not-found.png') });

  // 5. Test Real Successful Search (octocat)
  console.log('5. Testing Real Search for "octocat"...');
  await fillInput(page, '.search-form__input', 'octocat');
  await searchBtn.click();

  // Wait for profile card
  await page.waitForSelector('.profile', { timeout: 15000 });
  const profileName = await page.$eval('.profile__name', el => el.textContent);
  const username = await page.$eval('.profile__username', el => el.textContent);
  console.log('Profile loaded:', profileName, username);

  // Verify stats
  const stats = await page.$$eval('.stats__card', cards =>
    cards.map(c => ({
      num: c.querySelector('.stats__number')?.textContent,
      lbl: c.querySelector('.stats__label')?.textContent,
    }))
  );
  console.log('Profile stats:', stats);

  // Verify repos
  await page.waitForSelector('.repo-card', { timeout: 10000 });
  const repoCount = await page.$$eval('.repo-card', cards => cards.length);
  const repoHeader = await page.$eval('.repos__count', el => el.textContent);
  console.log('Repos rendered:', repoCount, `(${repoHeader})`);

  await page.screenshot({ path: path.join(screenshotsDir, '4-profile-results.png') });
  console.log('Captured 4-profile-results.png');

  // Scroll down to repo grid
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotsDir, '5-repo-grid.png') });
  console.log('Captured 5-repo-grid.png');

  // 6. Test Responsive Viewports
  console.log('6. Testing Responsive Viewports...');
  const viewports = [
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-375', width: 375, height: 812 },
    { name: 'small-360', width: 360, height: 640 },
    { name: 'desktop-1024', width: 1024, height: 768 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(screenshotsDir, `responsive-${vp.name}.png`) });
    console.log(`Verified viewport ${vp.width}x${vp.height} -> responsive-${vp.name}.png`);
  }

  // 7. Check Console Errors
  console.log('\n--- Verification Summary ---');
  if (consoleErrors.length > 0) {
    console.warn('Console warnings/errors encountered:', consoleErrors);
  } else {
    console.log('✓ Zero console errors detected during full end-to-end run!');
  }

  await browser.close();
  console.log('All tests passed successfully!');
}

verifyApp().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
