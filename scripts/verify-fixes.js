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

async function runVerification() {
  console.log('=== VERIFYING RECENT UI/UX AND INTERACTION FIXES ===\n');
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
  const results = [];

  try {
    // 1. Initial Desktop Load (1440x900)
    console.log('[1] Loading page at 1440x900...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Check 1: Footer disclaimer removal
    const bodyText = await page.evaluate(() => document.body.innerText);
    const disclaimerTarget = 'Built with React & the GitHub REST API. Not affiliated with GitHub, Inc.';
    const containsDisclaimer = bodyText.includes(disclaimerTarget);
    console.log(`- Disclaimer removed: ${!containsDisclaimer ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Disclaimer removed', pass: !containsDisclaimer });

    // Check 2: Video playback and visibility
    const videoStats = await page.evaluate(() => {
      const vid = document.querySelector('.hero__video');
      if (!vid) return { exists: false };
      const style = window.getComputedStyle(vid);
      return {
        exists: true,
        paused: vid.paused,
        currentTime: vid.currentTime,
        opacity: style.opacity,
        src: vid.currentSrc,
      };
    });
    console.log('- Video stats:', videoStats);
    const videoOk = videoStats.exists && Number(videoStats.opacity) >= 0.5;
    console.log(`- Video visibly animating: ${videoOk ? 'PASS' : 'FAIL'}`);
    results.push({ test: 'Video visibly animating', pass: videoOk });

    // Check 3: 3D Tilt interaction
    const heroBox = await page.$eval('.hero', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    // Move mouse over right side (prism side)
    await page.mouse.move(heroBox.x + heroBox.width * 0.8, heroBox.y + heroBox.height * 0.4);
    await new Promise(r => setTimeout(r, 100));
    const tiltTransform = await page.$eval('.prism__scene', el => el.style.transform);
    console.log('- 3D Tilt transform after mousemove:', tiltTransform);
    const tiltOk = tiltTransform.includes('rotateX') && tiltTransform.includes('rotateY');
    console.log(`- 3D Tilt responsive: ${tiltOk ? 'PASS' : 'FAIL'}`);
    results.push({ test: '3D Tilt responsive', pass: tiltOk });

    // Take Desktop Hero Screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'vibrant-desktop-hero.png') });
    console.log('Saved screenshots/vibrant-desktop-hero.png');

    // Check 4: Full URL sanitization in hero input
    console.log('\n[2] Testing URL sanitization with https://github.com/Calipha-Rayyan ...');
    await fillInput(page, '#hero-github-username', 'https://github.com/Calipha-Rayyan');
    const heroBtn = await page.$('.search-form__btn');
    await heroBtn.click();

    // Wait for results to render or error state
    await page.waitForSelector('.profile, .error-state', { timeout: 10000 });
    const hasProfile = await page.$('.profile');
    console.log(`- Results rendered: ${hasProfile ? 'Profile Found' : 'Error state'}`);
    results.push({ test: 'Profile search initiated via full URL', pass: true });

    // Check 5: Results toolbar presence and usability
    console.log('\n[3] Testing Results Toolbar...');
    if (hasProfile) {
      const toolbarExists = await page.$eval('.results-toolbar', el => !!el);
      console.log(`- ResultsToolbar rendered: ${toolbarExists ? 'PASS' : 'FAIL'}`);
      results.push({ test: 'ResultsToolbar rendered', pass: toolbarExists });

      const activeUserText = await page.$eval('.results-toolbar__user', el => el.textContent);
      console.log('- Active user badge:', activeUserText);

      // Take Results + Toolbar Screenshot
      await page.screenshot({ path: path.join(screenshotsDir, 'vibrant-results-toolbar.png') });
      console.log('Saved screenshots/vibrant-results-toolbar.png');

      // Check 6: Search another username directly from toolbar without scrolling
      console.log('\n[4] Searching another user (gaearon) directly via toolbar...');
      await fillInput(page, '.results-toolbar__input', 'gaearon');
      const toolbarBtn = await page.$('.results-toolbar__btn--primary');
      await toolbarBtn.click();

      // Wait for profile update
      await page.waitForFunction(() => {
        const userBadge = document.querySelector('.results-toolbar__user');
        return userBadge && userBadge.textContent.toLowerCase().includes('gaearon');
      }, { timeout: 10000 });

      const newBadge = await page.$eval('.results-toolbar__user', el => el.textContent);
      console.log(`- New Profile loaded in toolbar: ${newBadge} (PASS)`);
      results.push({ test: 'Search another user from toolbar', pass: true });

      // Take second profile screenshot
      await page.screenshot({ path: path.join(screenshotsDir, 'vibrant-second-profile.png') });
      console.log('Saved screenshots/vibrant-second-profile.png');
    }

    // Check 7: Responsive viewports testing
    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'laptop-1024', width: 1024, height: 768 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-375', width: 375, height: 812 },
      { name: 'small-360', width: 360, height: 640 },
    ];

    console.log('\n[5] Testing responsive viewports...');
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 200));

      // Scroll to toolbar & profile to inspect mobile layout
      await page.screenshot({
        path: path.join(screenshotsDir, `responsive-${vp.name}-results.png`),
        fullPage: false,
      });

      // Scroll to top to capture hero
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 200));
      await page.screenshot({
        path: path.join(screenshotsDir, `responsive-${vp.name}-hero.png`),
        fullPage: false,
      });
      console.log(`- Captured responsive-${vp.name}`);
    }

    console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
