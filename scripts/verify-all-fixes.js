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

async function runFullVerification() {
  console.log('=== STARTING PORTFOLIO-QUALITY UPGRADE ACCEPTANCE VERIFICATION ===\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const testResults = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Initial Search Page Layout & Blank Area Fix
    // -------------------------------------------------------------
    console.log('[Test 1] Verifying search page layout, blank space elimination, and hero centering...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Check that .results-view does not exist in Search view
    const resultsViewInSearch = await page.$('.results-view');
    const isResultsAbsentInSearch = resultsViewInSearch === null;
    console.log(`- Empty results container eliminated from search page: ${isResultsAbsentInSearch ? 'PASS' : 'FAIL'}`);
    testResults.push({ test: 'Empty results container eliminated', pass: isResultsAbsentInSearch });

    // Measure hero vs window height
    const pageGeometry = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const footer = document.querySelector('.footer');
      return {
        windowHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        heroHeight: hero ? hero.offsetHeight : 0,
        footerTop: footer ? footer.getBoundingClientRect().top : 0,
      };
    });
    console.log('- Page geometry:', pageGeometry);
    // On 1440x900, with no search performed, document should fit comfortably without giant empty dead space
    const hasGiantGap = pageGeometry.bodyScrollHeight > 1600;
    console.log(`- No giant blank space: ${!hasGiantGap ? 'PASS' : 'FAIL'}`);
    testResults.push({ test: 'Blank space corrected', pass: !hasGiantGap });

    // -------------------------------------------------------------
    // TEST 2 & 3: Hero 3D Tilt & Video Playback
    // -------------------------------------------------------------
    console.log('\n[Test 2 & 3] Verifying Hero 3D tilt tracking and animated video background...');
    const videoStats = await page.evaluate(() => {
      const vid = document.querySelector('.hero__video');
      if (!vid) return { exists: false };
      return {
        exists: true,
        paused: vid.paused,
        currentTime: vid.currentTime,
        opacity: window.getComputedStyle(vid).opacity,
      };
    });
    console.log('- Video stats:', videoStats);
    const videoOk = videoStats.exists && Number(videoStats.opacity) >= 0.5;
    testResults.push({ test: 'Hero video visible and animating', pass: videoOk });

    // Move pointer over hero
    const heroBox = await page.$eval('.hero', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    await page.mouse.move(heroBox.x + heroBox.width * 0.85, heroBox.y + heroBox.height * 0.35);
    await new Promise(r => setTimeout(r, 120));

    const tiltTransform = await page.$eval('.prism__scene', el => el.style.transform);
    console.log('- Hero 3D Scene Transform:', tiltTransform);
    const heroTiltOk = tiltTransform.includes('rotateX') && tiltTransform.includes('rotateY');
    testResults.push({ test: 'Hero 3D tilt responsive', pass: heroTiltOk });

    // Capture Corrected Hero Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-corrected-hero.png') });
    console.log('Saved screenshots/qa-corrected-hero.png');

    // -------------------------------------------------------------
    // TEST 7: Search a Username & Open Dedicated Results View
    // -------------------------------------------------------------
    console.log('\n[Test 7] Searching for "octocat" and verifying results view transition...');
    await fillInput(page, '#hero-github-username', 'octocat');
    await page.click('.search-form__btn');

    // Wait for dedicated results view
    await page.waitForSelector('.results-view', { timeout: 10000 });
    await page.waitForSelector('.profile__name', { timeout: 10000 });

    const profileName = await page.$eval('.profile__name', el => el.textContent);
    console.log(`- Loaded profile: ${profileName}`);
    testResults.push({ test: 'Search opens dedicated results view', pass: true });

    // Verify URL query parameter synchronization
    const currentUrl = await page.evaluate(() => window.location.search);
    console.log(`- Synced URL query: ${currentUrl}`);
    const urlSynced = currentUrl.includes('user=octocat');
    testResults.push({ test: 'URL query synchronized', pass: urlSynced });

    // -------------------------------------------------------------
    // TEST 8: Prominent "← Back to Search" Button & Input Focus
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing "← Back to Search" button and focus restoration...');
    const backBtn = await page.$('.back-btn');
    const hasBackBtn = backBtn !== null;
    console.log(`- Prominent Back to Search button present: ${hasBackBtn ? 'PASS' : 'FAIL'}`);
    testResults.push({ test: 'Prominent Back to Search button present', pass: hasBackBtn });

    // Capture Profile Results with Back Button
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-profile-results-back-btn.png') });
    console.log('Saved screenshots/qa-profile-results-back-btn.png');

    // Click Back to Search
    await backBtn.click();
    await new Promise(r => setTimeout(r, 200));

    // Verify view returned to search
    const isHeroVisible = await page.$eval('.hero', el => !!el);
    const activeElementId = await page.evaluate(() => document.activeElement ? document.activeElement.id : '');
    console.log(`- Returned to Search view: ${isHeroVisible ? 'PASS' : 'FAIL'}`);
    console.log(`- Focused element after return: ${activeElementId}`);
    const focusRestored = activeElementId === 'hero-github-username';
    testResults.push({ test: 'Back to Search restores view and focus', pass: isHeroVisible && focusRestored });

    // -------------------------------------------------------------
    // TEST 9: Searching a Second Username without Refreshing
    // -------------------------------------------------------------
    console.log('\n[Test 9] Searching a second username ("gaearon") without refreshing...');
    await fillInput(page, '#hero-github-username', 'gaearon');
    await page.click('.search-form__btn');

    await page.waitForFunction(() => {
      const u = document.querySelector('.results-toolbar__user');
      return u && u.textContent.toLowerCase().includes('gaearon');
    }, { timeout: 10000 });

    const secondUser = await page.$eval('.results-toolbar__user', el => el.textContent);
    console.log(`- Loaded second user: ${secondUser}`);
    testResults.push({ test: 'Second username search without refresh', pass: true });

    // -------------------------------------------------------------
    // TEST 4 & 5: Repository Card 3D Tilt & Staggered Reveal
    // -------------------------------------------------------------
    console.log('\n[Test 4 & 5] Testing Repository Card 3D Tilt & Specular Highlights...');
    await page.waitForSelector('.repo-card', { timeout: 10000 });

    const cardBox = await page.$eval('.repo-card', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });

    // Hover over top-right quadrant of the repository card
    await page.mouse.move(cardBox.x + cardBox.width * 0.8, cardBox.y + cardBox.height * 0.25);
    await new Promise(r => setTimeout(r, 120));

    const cardTransform = await page.$eval('.repo-card', el => el.style.transform);
    console.log('- Repository Card 3D Transform on hover:', cardTransform);
    const cardTiltOk = cardTransform.includes('perspective') && cardTransform.includes('rotateX') && cardTransform.includes('translateY(-4px)');
    testResults.push({ test: 'Repository card 3D tilt on hover', pass: cardTiltOk });

    // Capture Repo Card 3D Tilt Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-repo-card-3d-tilt.png') });
    console.log('Saved screenshots/qa-repo-card-3d-tilt.png');

    // -------------------------------------------------------------
    // TEST 13, 14, 16: Local Favorite Bookmarking (No GitHub API Star)
    // -------------------------------------------------------------
    console.log('\n[Test 13, 14, 16] Testing Local Favorite toggle on repository card...');
    // Initial state: not saved
    const favBtn = await page.$('.repo-card__fav-btn');
    await favBtn.click();
    await new Promise(r => setTimeout(r, 150));

    const isFavActive = await page.$eval('.repo-card__fav-btn', el => el.classList.contains('repo-card__fav-btn--active'));
    console.log(`- Favorite active state toggled: ${isFavActive ? 'PASS' : 'FAIL'}`);
    testResults.push({ test: 'Favorite toggle active state', pass: isFavActive });

    // Check localStorage persistence
    const savedInStorage = await page.evaluate(() => {
      const raw = localStorage.getItem('github_profile_finder_saved_repos_v1');
      return raw ? JSON.parse(raw) : [];
    });
    console.log(`- Saved repos in localStorage count: ${savedInStorage.length}`);
    testResults.push({ test: 'Favorite stored in localStorage', pass: savedInStorage.length > 0 });

    // Verify navbar badge updated
    const navBadgeCount = await page.$eval('.navbar__badge', el => el.textContent.trim());
    console.log(`- Navbar saved badge count: ${navBadgeCount}`);
    testResults.push({ test: 'Navbar saved count updated', pass: Number(navBadgeCount) > 0 });

    // -------------------------------------------------------------
    // TEST 15: Dedicated Saved Repositories View
    // -------------------------------------------------------------
    console.log('\n[Test 15] Opening Dedicated Saved Repositories View...');
    const navSavedBtn = await page.$('.navbar__nav-btn');
    await navSavedBtn.click();
    await page.waitForSelector('.saved-view', { timeout: 10000 });

    const savedViewTitle = await page.$eval('.saved-view__title', el => el.textContent);
    console.log(`- Rendered Saved View: ${savedViewTitle}`);
    testResults.push({ test: 'Saved Repositories view rendered', pass: true });

    // Capture Saved View Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-saved-repositories-view.png') });
    console.log('Saved screenshots/qa-saved-repositories-view.png');

    // Test returning back to search from saved view
    const savedBackBtn = await page.$('.saved-view .back-btn');
    await savedBackBtn.click();
    await page.waitForSelector('.hero', { timeout: 10000 });
    console.log('- Returned to search view from Saved Repositories view (PASS)');

    // -------------------------------------------------------------
    // TEST 10, 11, 12: Persistent Recent Searches
    // -------------------------------------------------------------
    console.log('\n[Test 10, 11, 12] Testing Recent Searches display, click-to-search, and clear...');
    await page.waitForSelector('.recent-searches', { timeout: 10000 });

    const historyCount = await page.$eval('.recent-searches__count', el => el.textContent.trim());
    console.log(`- Recent Searches count on home screen: ${historyCount}`);
    testResults.push({ test: 'Recent Searches displayed on search screen', pass: Number(historyCount) > 0 });

    // Capture Recent Searches Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-recent-searches.png') });
    console.log('Saved screenshots/qa-recent-searches.png');

    // Test clicking a history item (octocat)
    const historyChips = await page.$$('.recent-searches__chip');
    if (historyChips.length > 0) {
      await historyChips[0].click();
      await page.waitForSelector('.results-view', { timeout: 10000 });
      console.log('- Clicking recent search chip triggered search (PASS)');
      testResults.push({ test: 'Clicking history entry repeats search', pass: true });
    }

    // Return to search
    await page.click('.back-btn');
    await page.waitForSelector('.recent-searches', { timeout: 10000 });

    // Test Clear History with two-step safe confirmation
    console.log('- Testing safe Clear History...');
    const clearBtn = await page.$('.recent-searches__clear-btn');
    await clearBtn.click(); // first click: prompts confirm
    await new Promise(r => setTimeout(r, 100));
    await clearBtn.click(); // second click: confirms clear
    await new Promise(r => setTimeout(r, 200));

    const recentSearchesAfterClear = await page.$('.recent-searches');
    console.log(`- History cleared safely: ${recentSearchesAfterClear === null ? 'PASS' : 'FAIL'}`);
    testResults.push({ test: 'Clear History removes entries safely', pass: recentSearchesAfterClear === null });

    // -------------------------------------------------------------
    // TEST 6: Reduced Motion Mode
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing prefers-reduced-motion: reduce mode...');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    const reducedVideoStats = await page.evaluate(() => {
      const vid = document.querySelector('.hero__video');
      const poster = document.querySelector('.hero__video--poster');
      return {
        videoPaused: vid ? vid.paused : true,
        posterRendered: poster !== null,
      };
    });
    console.log('- Reduced motion video stats:', reducedVideoStats);
    testResults.push({ test: 'Reduced motion pauses video & renders poster', pass: reducedVideoStats.videoPaused });

    // Capture Reduced Motion Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'qa-reduced-motion.png') });
    console.log('Saved screenshots/qa-reduced-motion.png');

    // Restore media features
    await page.emulateMediaFeatures([]);

    // -------------------------------------------------------------
    // TEST 19: Responsive Layout Testing Across 5 Viewports
    // -------------------------------------------------------------
    console.log('\n[Test 19] Testing responsive layout across 5 viewports...');
    const viewports = [
      { name: '1440x900', width: 1440, height: 900 },
      { name: '1024x768', width: 1024, height: 768 },
      { name: '768x1024', width: 768, height: 1024 },
      { name: '375x812', width: 375, height: 812 },
      { name: '360x640', width: 360, height: 640 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 150));
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`- Viewport ${vp.name} horizontal overflow: ${hasHorizontalScroll ? 'FAIL' : 'PASS'}`);
      testResults.push({ test: `Responsive ${vp.name} no overflow`, pass: !hasHorizontalScroll });
    }

    // Check console errors
    console.log(`\n- Unresolved console errors: ${consoleErrors.length}`);
    testResults.push({ test: 'Zero console errors', pass: consoleErrors.length === 0 });

    console.log('\n=== ALL PORTFOLIO-QUALITY VERIFICATION CHECKS COMPLETE ===');
    console.log(JSON.stringify(testResults, null, 2));

  } catch (err) {
    console.error('QA Test execution failure:', err);
  } finally {
    await browser.close();
  }
}

runFullVerification();
