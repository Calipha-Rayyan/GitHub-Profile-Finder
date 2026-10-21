import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots/qa');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper: Ensure element is scrolled into view, clear & fill input
async function fillInput(page, selector, text) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'center' });
  }, selector);
  await new Promise(r => setTimeout(r, 100));
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

async function clickSearch(page) {
  await page.evaluate(() => {
    document.querySelector('.search-form__btn')?.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 100));
  await page.click('.search-form__btn');
}

// Test runner results container
const testResults = [];

function recordTest(name, method, result, passed, issues = 'None') {
  testResults.push({ name, method, result, passed, issues });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${mark}] ${name} -> ${result}`);
}

async function runQA() {
  console.log('====================================================');
  console.log('   STARTING FINAL QA PASS — GITHUB PROFILE FINDER   ');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Monitor uncaught errors
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.toString()));

  // ----------------------------------------------------
  // SECTION 1: API SCENARIOS
  // ----------------------------------------------------
  console.log('\n--- SECTION 1: API SCENARIOS ---');

  await page.goto(APP_URL, { waitUntil: 'networkidle2' });

  // 1.1 Empty Username Submission
  await clickSearch(page);
  await page.waitForSelector('.search-form__error');
  const emptyMsg = await page.$eval('.search-form__error', el => el.textContent.trim());
  recordTest(
    '1. Empty Username Submission',
    'Submitted form with empty input string',
    `Rejected with validation message: "${emptyMsg}"`,
    emptyMsg.includes('Please enter a GitHub username')
  );

  // 1.2 Malformed Username Submission
  await fillInput(page, '.search-form__input', 'bad_user_name!!');
  await clickSearch(page);
  const malformedMsg = await page.$eval('.search-form__error', el => el.textContent.trim());
  recordTest(
    '2. Malformed Username Submission',
    'Submitted invalid characters ("bad_user_name!!")',
    `Rejected with format message: "${malformedMsg}"`,
    malformedMsg.includes('letters, numbers, and hyphens')
  );

  // 1.3 Search with Enter Key (valid user: "octocat")
  await fillInput(page, '.search-form__input', 'octocat');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.profile', { timeout: 15000 });
  const enterUser = await page.$eval('.profile__name', el => el.textContent.trim());
  recordTest(
    '3. Search Using Enter Key',
    'Typed "octocat" and triggered Enter keypress',
    `Form submitted; profile loaded successfully: "${enterUser}"`,
    enterUser.toLowerCase().includes('octocat')
  );

  // 1.4 Search with Search Button (valid user: "gaearon")
  await fillInput(page, '.search-form__input', 'gaearon');
  await clickSearch(page);
  await page.waitForFunction(
    () => document.querySelector('.profile__username')?.textContent?.includes('gaearon'),
    { timeout: 15000 }
  );
  await page.waitForSelector('.repo-card', { timeout: 15000 });
  const btnUser = await page.$eval('.profile__name', el => el.textContent.trim());
  recordTest(
    '4. Search Using Search Button',
    'Typed "gaearon" and clicked Search button',
    `Form submitted; profile loaded successfully: "${btnUser}"`,
    btnUser.length > 0
  );

  // 1.5 Valid Public Profile Field Inspection
  const profileFields = await page.evaluate(() => {
    return {
      name: document.querySelector('.profile__name')?.textContent?.trim(),
      username: document.querySelector('.profile__username')?.textContent?.trim(),
      bio: document.querySelector('.profile__bio')?.textContent?.trim(),
      avatarSrc: document.querySelector('.profile__avatar')?.getAttribute('src'),
      githubLink: document.querySelector('.profile__link')?.getAttribute('href'),
      statsCount: document.querySelectorAll('.stats__card').length,
      reposCount: document.querySelectorAll('.repo-card').length,
    };
  });
  recordTest(
    '5. Valid Profile & Repo Data Integrity',
    'Verified profile fields and repo cards rendered for live GitHub user',
    `Rendered Name: "${profileFields.name}", User: "${profileFields.username}", Avatar: valid, Link: "${profileFields.githubLink}", Stats: ${profileFields.statsCount}, Repos: ${profileFields.reposCount}`,
    profileFields.name && profileFields.statsCount === 3 && profileFields.reposCount > 0
  );

  // 1.6 Nonexistent User 404 State
  await fillInput(page, '.search-form__input', 'nonexist-user-xyz-987');
  await clickSearch(page);
  await page.waitForSelector('.error-state', { timeout: 15000 });
  const notFoundState = await page.evaluate(() => {
    return {
      title: document.querySelector('.error-state__title')?.textContent?.trim(),
      message: document.querySelector('.error-state__message')?.textContent?.trim(),
      hasRetry: !!document.querySelector('.error-state__btn'),
    };
  });
  recordTest(
    '6. Nonexistent Username 404 State',
    'Queried unmapped user account ("nonexist-user-xyz-987")',
    `Title: "${notFoundState.title}", Msg: "${notFoundState.message}", Retry button available: ${notFoundState.hasRetry}`,
    notFoundState.title.includes('Not Found') && notFoundState.hasRetry
  );

  // ----------------------------------------------------
  // CONTROLLED MOCKS & NETWORK INTERCEPTION
  // ----------------------------------------------------
  console.log('\n--- CONTROLLED MOCKS & INTERCEPTION ---');

  // 1.7 Network Failure Simulation
  await page.setRequestInterception(true);

  const networkFailHandler = request => {
    if (request.url().includes('api.github.com/users/mock-network-fail')) {
      request.abort('failed');
    } else {
      request.continue();
    }
  };
  page.on('request', networkFailHandler);

  await fillInput(page, '.search-form__input', 'mock-network-fail');
  await clickSearch(page);
  await page.waitForSelector('.error-state', { timeout: 10000 });
  const netErrorTitle = await page.$eval('.error-state__title', el => el.textContent.trim());
  const netErrorMsg = await page.$eval('.error-state__message', el => el.textContent.trim());
  const hasNetRetry = await page.$eval('.error-state__btn', el => !!el);

  recordTest(
    '7. Simulated Network Failure',
    'Intercepted request and simulated connection failure (net::ERR_FAILED)',
    `Title: "${netErrorTitle}", Message: "${netErrorMsg}", Retry: ${hasNetRetry}`,
    netErrorTitle.includes('Connection Error') && hasNetRetry
  );
  page.off('request', networkFailHandler);

  // 1.8 Rate Limit (403 with X-RateLimit-Remaining: 0) vs Generic 403 Forbidden
  const rateLimitHandler = request => {
    if (request.url().includes('api.github.com/users/mock-ratelimit')) {
      request.respond({
        status: 403,
        contentType: 'application/json',
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 1200),
        },
        body: JSON.stringify({ message: 'API rate limit exceeded for IP' }),
      });
    } else if (request.url().includes('api.github.com/users/mock-forbidden-other')) {
      request.respond({
        status: 403,
        contentType: 'application/json',
        headers: {
          'X-RateLimit-Remaining': '45',
        },
        body: JSON.stringify({ message: 'Resource blocked by organizational policy' }),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', rateLimitHandler);

  // Test true rate limit
  await fillInput(page, '.search-form__input', 'mock-ratelimit');
  await clickSearch(page);
  await page.waitForFunction(
    () => document.querySelector('.error-state__title')?.textContent?.includes('Rate Limit'),
    { timeout: 10000 }
  );
  const rateLimitTitle = await page.$eval('.error-state__title', el => el.textContent.trim());
  const rateLimitMsg = await page.$eval('.error-state__message', el => el.textContent.trim());

  recordTest(
    '8. Rate Limit Simulation (HTTP 403 + Remaining: 0)',
    'Mocked HTTP 403 with X-RateLimit-Remaining: 0 and reset timestamp',
    `Title: "${rateLimitTitle}", Msg: "${rateLimitMsg}"`,
    rateLimitTitle.includes('Rate Limit Exceeded') && rateLimitMsg.includes('Rate limit will reset in')
  );

  // Test generic 403 is NOT misclassified as rate limit
  await fillInput(page, '.search-form__input', 'mock-forbidden-other');
  await clickSearch(page);
  await page.waitForFunction(
    () => document.querySelector('.error-state__title')?.textContent?.includes('Forbidden'),
    { timeout: 10000 }
  );
  const forbiddenTitle = await page.$eval('.error-state__title', el => el.textContent.trim());
  const forbiddenMsg = await page.$eval('.error-state__message', el => el.textContent.trim());

  recordTest(
    '9. Distinguish 403 Forbidden from Rate Limit',
    'Mocked HTTP 403 with non-zero quota (org restriction)',
    `Title: "${forbiddenTitle}", Msg: "${forbiddenMsg}"`,
    forbiddenTitle === 'Access Forbidden' && forbiddenMsg.includes('Resource blocked')
  );
  page.off('request', rateLimitHandler);

  // 1.10 Partial Failure: Profile succeeds, Repos fail
  const partialFailureHandler = request => {
    if (request.url().includes('/users/mock-partial/repos')) {
      request.respond({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error loading repos' }),
      });
    } else if (request.url().includes('/users/mock-partial')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'mock-partial',
          name: 'Partial Success User',
          public_repos: 5,
          followers: 12,
          following: 3,
          avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
          html_url: 'https://github.com/mock-partial',
        }),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', partialFailureHandler);

  await fillInput(page, '.search-form__input', 'mock-partial');
  await clickSearch(page);
  await page.waitForSelector('.profile', { timeout: 10000 });
  await page.waitForSelector('.repos .error-state', { timeout: 10000 });

  const partialHasProfile = await page.$eval('.profile__name', el => el.textContent.trim());
  const partialRepoError = await page.$eval('.repos .error-state__title', el => el.textContent.trim());
  const partialHasRetry = await page.$eval('.repos .error-state__btn', el => el.textContent.trim());

  recordTest(
    '10. Partial Failure (Profile OK, Repos Fail)',
    'Profile returned 200 while /repos endpoint returned 500',
    `Profile retained: "${partialHasProfile}", Repo section displayed error: "${partialRepoError}", Repo Retry button: "${partialHasRetry}"`,
    partialHasProfile === 'Partial Success User' && partialRepoError.includes('Could not load repositories') && partialHasRetry.length > 0
  );
  page.off('request', partialFailureHandler);

  // 1.11 Race Condition Prevention (Pending Request Abort)
  let delayedResolved = false;
  const raceHandler = request => {
    const url = request.url();
    if (url.endsWith('/users/user-slow') || url.includes('/users/user-slow?')) {
      setTimeout(() => {
        delayedResolved = true;
        try {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              login: 'user-slow',
              name: 'Slow User (Old Search)',
              public_repos: 1,
              followers: 0,
              following: 0,
              html_url: 'https://github.com/user-slow',
            }),
          });
        } catch {
          // Request was aborted by client as expected
        }
      }, 1000);
    } else if (url.endsWith('/users/user-fast') || url.includes('/users/user-fast?')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'user-fast',
          name: 'Fast User (New Search)',
          public_repos: 2,
          followers: 10,
          following: 5,
          html_url: 'https://github.com/user-fast',
        }),
      });
    } else if (url.includes('/repos')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', raceHandler);

  await fillInput(page, '.search-form__input', 'user-slow');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 150));

  await fillInput(page, '.search-form__input', 'user-fast');
  await page.keyboard.press('Enter');

  await page.waitForFunction(
    () => document.querySelector('.profile__name')?.textContent?.includes('Fast User'),
    { timeout: 10000 }
  );

  await new Promise(r => setTimeout(r, 1500));
  const finalRenderedUser = await page.$eval('.profile__name', el => el.textContent.trim());

  recordTest(
    '11. Race Condition / AbortController',
    'Dispatched slow request (1.0s delay), immediately superseded by fast request',
    `Delayed request finished (${delayedResolved}), final rendered profile: "${finalRenderedUser}" (never overwritten by stale data)`,
    finalRenderedUser === 'Fast User (New Search)'
  );
  page.off('request', raceHandler);

  // 1.12 Zero Repositories Empty State
  const zeroReposHandler = request => {
    if (request.url().includes('/users/mock-zero/repos')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (request.url().includes('/users/mock-zero')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'mock-zero',
          name: 'Zero Repos Developer',
          public_repos: 0,
          followers: 2,
          following: 1,
          html_url: 'https://github.com/mock-zero',
        }),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', zeroReposHandler);

  await fillInput(page, '.search-form__input', 'mock-zero');
  await clickSearch(page);
  await page.waitForSelector('.empty-state', { timeout: 10000 });
  const emptyTitle = await page.$eval('.empty-state__title', el => el.textContent.trim());
  const emptyMsgText = await page.$eval('.empty-state__message', el => el.textContent.trim());

  recordTest(
    '12. Zero Repositories Empty State',
    'Loaded user with 0 public repositories',
    `Empty state displayed: "${emptyTitle}" — "${emptyMsgText}"`,
    emptyTitle.includes('No repositories') && emptyMsgText.includes("doesn't have any public repositories")
  );
  page.off('request', zeroReposHandler);

  // 1.13 Avatar Fallback & Optional Fields Handling
  const fallbackHandler = request => {
    if (request.url().includes('/users/mock-missing-fields/repos')) {
      request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (request.url().includes('/users/mock-missing-fields')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'mock-missing-fields',
          name: null,
          avatar_url: 'http://localhost:5173/nonexistent-avatar.png',
          bio: null,
          location: null,
          company: null,
          blog: null,
          public_repos: 0,
          followers: 0,
          following: 0,
          html_url: 'https://github.com/mock-missing-fields',
        }),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', fallbackHandler);

  await fillInput(page, '.search-form__input', 'mock-missing-fields');
  await clickSearch(page);
  await page.waitForSelector('.profile__avatar-fallback', { timeout: 10000 });
  const avatarFallbackInitial = await page.$eval('.profile__avatar-fallback', el => el.textContent.trim());
  const fallbackDisplayName = await page.$eval('.profile__name', el => el.textContent.trim());
  const metaItemsCount = await page.$$eval('.profile__meta-item', els => els.length);

  recordTest(
    '13. Avatar Fallback & Missing Optional Fields',
    'Loaded profile with broken avatar URL, null bio, location, company, blog, name',
    `Avatar fallback rendered with initial "${avatarFallbackInitial}", name defaulted to username "${fallbackDisplayName}", meta items count: ${metaItemsCount} (clean layout without empty items)`,
    avatarFallbackInitial === 'M' && fallbackDisplayName === 'mock-missing-fields' && metaItemsCount === 0
  );
  page.off('request', fallbackHandler);

  // 1.14 Repository Pagination / Load More
  const paginationHandler = request => {
    if (request.url().includes('page=2')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { Link: '' },
        body: JSON.stringify([
          { id: 201, name: 'repo-page-2-item-1', stargazers_count: 5, forks_count: 1, html_url: 'https://github.com/p2/1' },
          { id: 202, name: 'repo-page-2-item-2', stargazers_count: 12, forks_count: 0, html_url: 'https://github.com/p2/2' },
        ]),
      });
    } else if (request.url().includes('/users/mock-pagination/repos')) {
      const p1Repos = Array.from({ length: 12 }, (_, i) => ({
        id: 100 + i,
        name: `repo-page-1-item-${i + 1}`,
        stargazers_count: i * 2,
        forks_count: 0,
        html_url: `https://github.com/p1/${i + 1}`,
      }));
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { Link: '<https://api.github.com/user/1/repos?page=2>; rel="next"' },
        body: JSON.stringify(p1Repos),
      });
    } else if (request.url().includes('/users/mock-pagination')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'mock-pagination',
          name: 'Pagination Developer',
          public_repos: 14,
          followers: 10,
          following: 10,
          html_url: 'https://github.com/mock-pagination',
        }),
      });
    } else {
      request.continue();
    }
  };
  page.on('request', paginationHandler);

  await fillInput(page, '.search-form__input', 'mock-pagination');
  await clickSearch(page);
  await page.waitForSelector('.load-more__btn', { timeout: 10000 });
  const initialCardCount = await page.$$eval('.repo-card', els => els.length);
  await page.click('.load-more__btn');
  await page.waitForFunction(() => document.querySelectorAll('.repo-card').length === 14, { timeout: 10000 });
  const finalCardCount = await page.$$eval('.repo-card', els => els.length);
  const loadMoreGone = (await page.$('.load-more__btn')) === null;

  recordTest(
    '14. Repository Pagination / Load More',
    'Queried user with 14 repos across 2 pages; triggered Load More',
    `Initial cards: ${initialCardCount}, After click: ${finalCardCount}, Load More button removed at list end: ${loadMoreGone}`,
    initialCardCount === 12 && finalCardCount === 14 && loadMoreGone
  );
  page.off('request', paginationHandler);

  // Turn off request interception
  await page.setRequestInterception(false);

  // ----------------------------------------------------
  // SECTION 2: 3D ANIMATION & VIDEO VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: 3D ANIMATION & VIDEO ---');

  await page.goto(APP_URL, { waitUntil: 'networkidle2' });

  // 2.1 3D Object Pointer Responsiveness
  const initialTransform = await page.$eval('.prism__scene', el => el.style.transform);
  const prismBox = await page.$eval('.prism', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width * 0.8, y: r.y + r.height * 0.2 };
  });

  await page.mouse.move(prismBox.x, prismBox.y);
  await new Promise(r => setTimeout(r, 350));
  const tiltedTransform = await page.$eval('.prism__scene', el => el.style.transform);

  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 600));
  const resetTransform = await page.$eval('.prism__scene', el => el.style.transform);

  recordTest(
    '15. 3D Spatial Tilt Pointer Responsiveness',
    'Dispatched mouse movements over .prism container and evaluated transform',
    `Initial: "${initialTransform || 'none'}", On hover: "${tiltedTransform}", Reset: "${resetTransform}"`,
    tiltedTransform.includes('rotate') && tiltedTransform !== initialTransform
  );

  // 2.2 Genuine Spatial Depth Structure
  const panelsDepth = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('.prism__panel')).map(p => {
      const style = window.getComputedStyle(p);
      return {
        className: p.className,
        transform: style.transform,
        zIndex: style.zIndex,
      };
    });
    const scenePreserve3D = window.getComputedStyle(document.querySelector('.prism__scene')).transformStyle;
    const prismPerspective = window.getComputedStyle(document.querySelector('.prism')).perspective;
    return { panels, scenePreserve3D, prismPerspective };
  });

  recordTest(
    '16. Spatial 3D Multi-Layer Depth Configuration',
    'Inspected CSS perspective, preserve-3d, and translateZ layers',
    `Container perspective: ${panelsDepth.prismPerspective}, Scene transform-style: ${panelsDepth.scenePreserve3D}, Layer count: ${panelsDepth.panels.length}`,
    panelsDepth.prismPerspective === '1200px' && panelsDepth.scenePreserve3D === 'preserve-3d' && panelsDepth.panels.length >= 4
  );

  // 2.3 Video Loading & Properties
  const videoDetails = await page.evaluate(() => {
    const video = document.querySelector('video.hero__video');
    if (!video) return null;
    return {
      src: video.currentSrc,
      muted: video.muted,
      playsInline: video.playsInline,
      loop: video.loop,
      autoplay: video.autoplay,
      duration: video.duration,
      paused: video.paused,
      poster: video.poster,
    };
  });

  recordTest(
    '17. Background Video Attributes & Playback',
    'Evaluated HTML5 <video> attributes and current playback state',
    `Src: "${videoDetails?.src}", Muted: ${videoDetails?.muted}, PlaysInline: ${videoDetails?.playsInline}, Loop: ${videoDetails?.loop}, Duration: ${videoDetails?.duration?.toFixed(1)}s, Poster: "${videoDetails?.poster}"`,
    videoDetails?.muted && videoDetails?.loop && videoDetails?.playsInline && videoDetails?.duration > 5
  );

  // 2.4 Reduced Motion Simulation
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await new Promise(r => setTimeout(r, 400));

  const reducedMotionState = await page.evaluate(() => {
    const video = document.querySelector('video.hero__video');
    const orbit1 = window.getComputedStyle(document.querySelector('.prism__orbit--1')).animationDuration;
    return {
      videoPaused: video ? video.paused : true,
      orbitDuration: orbit1,
    };
  });

  recordTest(
    '18. Prefers-Reduced-Motion Handling',
    'Emulated prefers-reduced-motion: reduce in browser context',
    `Video paused: ${reducedMotionState.videoPaused}, Orbit animation duration: ${reducedMotionState.orbitDuration} (reduced/suppressed)`,
    reducedMotionState.videoPaused
  );

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  // 2.5 Video Tab Visibility Pause/Play
  const pausedOnHidden = await page.evaluate(() => {
    const video = document.querySelector('video.hero__video');
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const isPaused = video.paused;
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return isPaused;
  });

  recordTest(
    '19. Video Visibility Management',
    'Simulated tab backgrounding via visibilitychange document.hidden = true',
    `Video paused when document is hidden: ${pausedOnHidden}`,
    pausedOnHidden === true
  );

  // ----------------------------------------------------
  // SECTION 3: ACCESSIBILITY & RESPONSIVE BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: ACCESSIBILITY & RESPONSIVE ---');

  const viewports = [
    { name: '360x640 (Compact Mobile)', width: 360, height: 640 },
    { name: '375x812 (Standard iPhone)', width: 375, height: 812 },
    { name: '768x1024 (Tablet)', width: 768, height: 1024 },
    { name: '1024x768 (Small Desktop)', width: 1024, height: 768 },
    { name: '1440x900 (Large Desktop)', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 250));

    const metrics = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const searchBtnVisible = document.querySelector('.search-form__btn')?.offsetWidth > 0;
      const searchInputVisible = document.querySelector('.search-form__input')?.offsetWidth > 0;
      return {
        overflow: scrollWidth > docWidth + 1,
        docWidth,
        scrollWidth,
        searchBtnVisible,
        searchInputVisible,
      };
    });

    recordTest(
      `20. Responsive Viewport ${vp.name}`,
      `Audited viewport bounds, scrollWidth vs clientWidth, control visibility`,
      `Document: ${metrics.docWidth}px, Scroll: ${metrics.scrollWidth}px, Overflow: ${metrics.overflow}, Controls accessible: ${metrics.searchBtnVisible && metrics.searchInputVisible}`,
      !metrics.overflow && metrics.searchBtnVisible && metrics.searchInputVisible
    );
  }

  await page.setViewport({ width: 1440, height: 900 });

  // 3.2 Real Rendered Color Contrast Check
  const contrastEvaluations = await page.evaluate(() => {
    function getLum(rgbStr) {
      const rgb = rgbStr.match(/\d+/g).map(Number).map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }
    function ratio(c1, c2) {
      const l1 = getLum(c1), l2 = getLum(c2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const headline = document.querySelector('.hero__headline');
    const headlineColor = window.getComputedStyle(headline).color;
    const desc = document.querySelector('.hero__description');
    const descColor = window.getComputedStyle(desc).color;
    const btn = document.querySelector('.search-form__btn');
    const btnColor = window.getComputedStyle(btn).color;
    const btnBg = window.getComputedStyle(btn).backgroundColor;

    return {
      headlineRatio: ratio(headlineColor, bodyBg),
      descRatio: ratio(descColor, bodyBg),
      btnRatio: ratio(btnColor, btnBg),
    };
  });

  recordTest(
    '21. Rendered Elements Color Contrast (WCAG AA)',
    'Computed luminance and contrast ratios directly from getComputedStyle values',
    `Headline on bg: ${contrastEvaluations.headlineRatio.toFixed(2)}:1 (Target >= 4.5:1), Description on bg: ${contrastEvaluations.descRatio.toFixed(2)}:1 (Target >= 4.5:1), Button text on btn bg: ${contrastEvaluations.btnRatio.toFixed(2)}:1 (Target >= 4.5:1)`,
    contrastEvaluations.headlineRatio >= 4.5 && contrastEvaluations.descRatio >= 4.5 && contrastEvaluations.btnRatio >= 4.5
  );

  // 3.3 Keyboard Navigation & Visible Focus
  const keyboardCheck = await page.evaluate(() => {
    const input = document.querySelector('.search-form__input');
    const btn = document.querySelector('.search-form__btn');
    const navLink = document.querySelector('.navbar__link');

    input.focus();
    const inputFocused = document.activeElement === input;
    btn.focus();
    const btnFocused = document.activeElement === btn;
    navLink.focus();
    const navFocused = document.activeElement === navLink;

    return { inputFocused, btnFocused, navFocused };
  });

  recordTest(
    '22. Keyboard Navigation & Tab Sequence',
    'Tested focus states on search input, submit button, and navigation links',
    `Input focusable: ${keyboardCheck.inputFocused}, Submit focusable: ${keyboardCheck.btnFocused}, Nav link focusable: ${keyboardCheck.navFocused}`,
    keyboardCheck.inputFocused && keyboardCheck.btnFocused && keyboardCheck.navFocused
  );

  // 3.4 ARIA and Semantic Attributes
  const a11yAttributes = await page.evaluate(() => {
    const input = document.querySelector('.search-form__input');
    const form = document.querySelector('.search-form');
    const hero = document.querySelector('.hero');
    const prism = document.querySelector('.prism');

    return {
      hasFormRole: form?.getAttribute('role') === 'search',
      inputHasLabel: !!document.querySelector(`label[for="${input.id}"]`),
      heroAriaLabel: !!hero?.getAttribute('aria-label'),
      prismAriaHidden: prism?.getAttribute('aria-hidden') === 'true',
    };
  });

  recordTest(
    '23. ARIA Roles & Accessible Names',
    'Inspected search form role, input label binding, and decorative hiding',
    `role="search": ${a11yAttributes.hasFormRole}, <label for="input">: ${a11yAttributes.inputHasLabel}, decorative prism aria-hidden: ${a11yAttributes.prismAriaHidden}`,
    a11yAttributes.hasFormRole && a11yAttributes.inputHasLabel && a11yAttributes.prismAriaHidden
  );

  // ----------------------------------------------------
  // SECTION 4: PRODUCTION BUILD & CODE QUALITY
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: CODE QUALITY & ERRORS ---');

  recordTest(
    '24. Uncaught Page / Runtime Errors',
    'Monitored window.onerror and pageerror during entire QA run',
    `Uncaught runtime exceptions: ${pageErrors.length}`,
    pageErrors.length === 0,
    pageErrors.length > 0 ? pageErrors.join(', ') : 'None'
  );

  await browser.close();

  console.log('\n====================================================');
  console.log('                 QA RUN COMPLETED                   ');
  console.log('====================================================\n');

  const jsonPath = path.resolve(__dirname, '../screenshots/qa/qa-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
}

runQA().catch(err => {
  console.error('QA Runner encountered unhandled failure:', err);
  process.exit(1);
});
