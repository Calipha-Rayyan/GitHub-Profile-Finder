import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIDEO_PATH = path.resolve(__dirname, '../public/videos/hero-bg.webm');
const OUTPUT_IMAGE = path.resolve(__dirname, '../screenshots/hero-video-frame.png');

const server = http.createServer((req, res) => {
  if (!fs.existsSync(VIDEO_PATH)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'video/webm' });
  fs.createReadStream(VIDEO_PATH).pipe(res);
});

server.listen(9881, async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; background:#000; overflow:hidden;">
        <video src="http://localhost:9881" autoplay muted loop style="width:100vw; height:100vh; object-fit:cover;"></video>
      </body>
      </html>
    `;
    await page.setContent(html);
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: OUTPUT_IMAGE });
    console.log(`Saved hero video frame to ${OUTPUT_IMAGE}`);

    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
  }
});
