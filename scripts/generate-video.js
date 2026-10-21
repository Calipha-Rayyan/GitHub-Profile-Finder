import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateHeroVideo() {
  console.log('Starting video generation...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=gl'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // HTML content with Canvas rendering seamless loop
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: #F0EAFE; }
    canvas { width: 1280px; height: 720px; display: block; }
  </style>
</head>
<body>
  <canvas id="c" width="1280" height="720"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const W = 1280, H = 720;
    const DURATION_SEC = 8;
    const FPS = 30;
    const TOTAL_FRAMES = DURATION_SEC * FPS;

    // Prismatic floating panels
    const panels = [
      { baseAngle: 0, radX: 350, radY: 180, sizeW: 240, sizeH: 160, rotOffset: 0.2, color: 'rgba(103, 80, 216, 0.25)', border: 'rgba(103, 80, 216, 0.4)' },
      { baseAngle: Math.PI * 0.4, radX: 420, radY: 220, sizeW: 300, sizeH: 180, rotOffset: -0.4, color: 'rgba(216, 204, 247, 0.35)', border: 'rgba(207, 196, 237, 0.5)' },
      { baseAngle: Math.PI * 0.8, radX: 300, radY: 150, sizeW: 180, sizeH: 140, rotOffset: 0.6, color: 'rgba(244, 119, 115, 0.18)', border: 'rgba(244, 119, 115, 0.35)' },
      { baseAngle: Math.PI * 1.2, radX: 460, radY: 250, sizeW: 280, sizeH: 200, rotOffset: -0.3, color: 'rgba(75, 55, 143, 0.22)', border: 'rgba(75, 55, 143, 0.4)' },
      { baseAngle: Math.PI * 1.6, radX: 380, radY: 190, sizeW: 220, sizeH: 150, rotOffset: 0.5, color: 'rgba(255, 224, 216, 0.3)', border: 'rgba(244, 119, 115, 0.3)' }
    ];

    // Floating particles
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        baseAngle: (i / 35) * Math.PI * 2,
        rad: 120 + (i % 5) * 80,
        yAmp: 30 + (i % 7) * 15,
        speedMul: (i % 2 === 0 ? 1 : -1) * (1 + (i % 3) * 0.5),
        size: 3 + (i % 4) * 2,
        color: i % 3 === 0 ? 'rgba(244, 119, 115, 0.6)' : i % 3 === 1 ? 'rgba(103, 80, 216, 0.5)' : 'rgba(216, 204, 247, 0.7)'
      });
    }

    function renderFrame(t) { // t from 0 to 1
      const angle = t * Math.PI * 2;

      // Clear with background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#F0EAFE');
      bgGrad.addColorStop(0.5, '#E6DDFB');
      bgGrad.addColorStop(1, '#D8CCF7');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Large ambient radial lights
      const light1X = W * 0.35 + Math.sin(angle) * 120;
      const light1Y = H * 0.4 + Math.cos(angle) * 80;
      const rad1 = ctx.createRadialGradient(light1X, light1Y, 10, light1X, light1Y, 450);
      rad1.addColorStop(0, 'rgba(103, 80, 216, 0.35)');
      rad1.addColorStop(0.6, 'rgba(103, 80, 216, 0.08)');
      rad1.addColorStop(1, 'rgba(103, 80, 216, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, W, H);

      const light2X = W * 0.7 + Math.cos(angle) * 140;
      const light2Y = H * 0.6 + Math.sin(angle) * 90;
      const rad2 = ctx.createRadialGradient(light2X, light2Y, 10, light2X, light2Y, 400);
      rad2.addColorStop(0, 'rgba(244, 119, 115, 0.28)');
      rad2.addColorStop(0.6, 'rgba(255, 224, 216, 0.1)');
      rad2.addColorStop(1, 'rgba(244, 119, 115, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, W, H);

      // Orbital Rings
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      
      // Ring 1
      ctx.rotate(angle * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, 480, 260, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(103, 80, 216, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ring 2
      ctx.beginPath();
      ctx.ellipse(0, 0, 380, 200, -Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(244, 119, 115, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Translucent Prismatic Panels
      panels.forEach((p, idx) => {
        const panAngle = p.baseAngle + angle;
        const px = W * 0.5 + Math.cos(panAngle) * p.radX;
        const py = H * 0.5 + Math.sin(panAngle) * p.radY;
        const rot = p.rotOffset + Math.sin(angle * 2 + idx) * 0.25;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);

        // Glass panel body
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 1.5;
        
        // Rounded rectangle panel
        const r = 16;
        const w = p.sizeW;
        const h = p.sizeH;
        ctx.beginPath();
        ctx.roundRect(-w/2, -h/2, w, h, r);
        ctx.fill();
        ctx.stroke();

        // Inner specular reflection line
        ctx.beginPath();
        ctx.moveTo(-w/2 + 20, -h/2 + 15);
        ctx.lineTo(w/2 - 40, -h/2 + 15);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });

      // Floating Accent Particles
      particles.forEach((part) => {
        const pAng = part.baseAngle + angle * part.speedMul;
        const pX = W * 0.5 + Math.cos(pAng) * part.rad;
        const pY = H * 0.5 + Math.sin(pAng) * (part.rad * 0.5) + Math.sin(angle * 3) * part.yAmp;

        ctx.beginPath();
        ctx.arc(pX, pY, part.size, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.fill();
      });
    }

    window.startRecording = function() {
      return new Promise((resolve, reject) => {
        const stream = canvas.captureStream(FPS);
        const options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 3000000 };
        const recorder = new MediaRecorder(stream, options);
        const chunks = [];

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        };

        recorder.start();

        let frame = 0;
        function step() {
          if (frame <= TOTAL_FRAMES) {
            renderFrame(frame / TOTAL_FRAMES);
            frame++;
            setTimeout(step, 1000 / FPS);
          } else {
            recorder.stop();
          }
        }
        step();
      });
    };

    window.capturePoster = function() {
      renderFrame(0);
      return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    };
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent);
  await page.waitForFunction('typeof window.startRecording === "function"');

  console.log('Capturing hero poster image...');
  const posterBase64 = await page.evaluate(() => window.capturePoster());
  const posterBuffer = Buffer.from(posterBase64, 'base64');
  const posterPath = path.resolve(__dirname, '../public/images/hero-poster.jpg');
  fs.writeFileSync(posterPath, posterBuffer);
  console.log('Poster image written to', posterPath, `(${posterBuffer.length} bytes)`);

  console.log('Recording 8-second seamless looping WebM video...');
  const videoBase64 = await page.evaluate(async () => {
    return await window.startRecording();
  });

  const videoBuffer = Buffer.from(videoBase64, 'base64');
  const videoPath = path.resolve(__dirname, '../public/videos/hero-bg.webm');
  fs.writeFileSync(videoPath, videoBuffer);
  console.log('WebM video written to', videoPath, `(${videoBuffer.length} bytes)`);

  await browser.close();
  console.log('Video generation complete!');
}

generateHeroVideo().catch(err => {
  console.error('Failed to generate video:', err);
  process.exit(1);
});
