import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateVibrantHeroVideo() {
  console.log('--- Generating Vibrant Animated Background Video (Lavender Prism Enhanced) ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=gl'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // HTML content with rich, vibrant abstract geometric motion
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: #EFE6FF; }
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

    // Prismatic floating geometric structures
    const structures = [
      { baseAngle: 0, radX: 360, radY: 170, size: 140, rotSpeed: 1, color: 'rgba(109, 40, 217, 0.38)', stroke: 'rgba(139, 92, 246, 0.65)' },
      { baseAngle: Math.PI * 0.35, radX: 420, radY: 220, size: 170, rotSpeed: -1, color: 'rgba(255, 107, 107, 0.32)', stroke: 'rgba(255, 107, 107, 0.65)' },
      { baseAngle: Math.PI * 0.7, radX: 320, radY: 140, size: 110, rotSpeed: 1.5, color: 'rgba(53, 199, 212, 0.35)', stroke: 'rgba(53, 199, 212, 0.7)' },
      { baseAngle: Math.PI * 1.1, radX: 480, radY: 240, size: 190, rotSpeed: -0.8, color: 'rgba(230, 80, 155, 0.32)', stroke: 'rgba(230, 80, 155, 0.6)' },
      { baseAngle: Math.PI * 1.5, radX: 390, radY: 180, size: 130, rotSpeed: 1.2, color: 'rgba(68, 56, 202, 0.35)', stroke: 'rgba(139, 92, 246, 0.65)' },
      { baseAngle: Math.PI * 1.85, radX: 280, radY: 130, size: 95, rotSpeed: -1.4, color: 'rgba(255, 224, 216, 0.45)', stroke: 'rgba(255, 107, 107, 0.6)' }
    ];

    // Floating glowing particles with connection lines
    const particles = [];
    for (let i = 0; i < 42; i++) {
      particles.push({
        baseAngle: (i / 42) * Math.PI * 2,
        rad: 140 + (i % 6) * 75,
        yAmp: 35 + (i % 5) * 15,
        speedMul: (i % 2 === 0 ? 1 : -1) * (1 + (i % 3) * 0.5),
        size: 3 + (i % 4) * 2.5,
        color: i % 4 === 0 ? '#FF6B6B' : i % 4 === 1 ? '#35C7D4' : i % 4 === 2 ? '#8B5CF6' : '#E6509B'
      });
    }

    function renderFrame(t) {
      const angle = t * Math.PI * 2;

      // Base rich gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#EFE6FF');
      bg.addColorStop(0.45, '#E3D5FF');
      bg.addColorStop(1, '#D8C5FF');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Moving atmospheric light orbs (Cyan, Violet, Coral, Pink)
      // 1. Violet/Indigo Orb
      const l1X = W * 0.32 + Math.sin(angle) * 160;
      const l1Y = H * 0.38 + Math.cos(angle) * 110;
      const rad1 = ctx.createRadialGradient(l1X, l1Y, 20, l1X, l1Y, 480);
      rad1.addColorStop(0, 'rgba(109, 40, 217, 0.42)');
      rad1.addColorStop(0.5, 'rgba(139, 92, 246, 0.16)');
      rad1.addColorStop(1, 'rgba(109, 40, 217, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, W, H);

      // 2. Coral/Peach Orb
      const l2X = W * 0.72 + Math.cos(angle) * 180;
      const l2Y = H * 0.58 + Math.sin(angle) * 120;
      const rad2 = ctx.createRadialGradient(l2X, l2Y, 20, l2X, l2Y, 440);
      rad2.addColorStop(0, 'rgba(255, 107, 107, 0.35)');
      rad2.addColorStop(0.5, 'rgba(255, 224, 216, 0.14)');
      rad2.addColorStop(1, 'rgba(255, 107, 107, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, W, H);

      // 3. Cyan Glowing Orb (Adds vibrant modern SaaS illumination)
      const l3X = W * 0.55 + Math.sin(angle + Math.PI) * 140;
      const l3Y = H * 0.28 + Math.cos(angle + Math.PI) * 90;
      const rad3 = ctx.createRadialGradient(l3X, l3Y, 15, l3X, l3Y, 360);
      rad3.addColorStop(0, 'rgba(53, 199, 212, 0.36)');
      rad3.addColorStop(0.5, 'rgba(53, 199, 212, 0.12)');
      rad3.addColorStop(1, 'rgba(53, 199, 212, 0)');
      ctx.fillStyle = rad3;
      ctx.fillRect(0, 0, W, H);

      // 4. Pink Accent Orb
      const l4X = W * 0.2 + Math.cos(angle * 1.5) * 100;
      const l4Y = H * 0.75 + Math.sin(angle * 1.5) * 80;
      const rad4 = ctx.createRadialGradient(l4X, l4Y, 15, l4X, l4Y, 320);
      rad4.addColorStop(0, 'rgba(230, 80, 155, 0.28)');
      rad4.addColorStop(1, 'rgba(230, 80, 155, 0)');
      ctx.fillStyle = rad4;
      ctx.fillRect(0, 0, W, H);

      // Elegant Orbital Rings with depth rotation
      ctx.save();
      ctx.translate(W * 0.55, H * 0.48);

      // Major Ellipse 1 (Cyan/Violet)
      ctx.save();
      ctx.rotate(angle * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 520, 270, Math.PI / 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.32)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Major Ellipse 2 (Coral/Pink)
      ctx.save();
      ctx.rotate(-angle * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, 420, 210, -Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Inner Ellipse 3 (Cyan glowing)
      ctx.save();
      ctx.rotate(angle * 0.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, 310, 160, Math.PI / 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(53, 199, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // Prismatic Drifting Glass Hexagons/Polygons
      structures.forEach((st, idx) => {
        const curAngle = st.baseAngle + angle;
        const px = W * 0.55 + Math.cos(curAngle) * st.radX;
        const py = H * 0.48 + Math.sin(curAngle) * st.radY;
        const rot = curAngle * st.rotSpeed + Math.sin(angle * 2 + idx) * 0.3;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);

        // Glass panel polygon (rounded 6-sided crystal)
        ctx.beginPath();
        const sides = 6;
        const radius = st.size * 0.55;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = st.color;
        ctx.fill();
        ctx.strokeStyle = st.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner geometric facets
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius * 0.8, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(-radius * 0.5, radius * 0.7);
        ctx.moveTo(0, 0);
        ctx.lineTo(-radius * 0.5, -radius * 0.7);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Specular highlight gleam
        ctx.beginPath();
        ctx.arc(radius * 0.3, -radius * 0.3, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      });

      // Render Floating Glow Particles
      const renderedPoints = [];
      particles.forEach((part) => {
        const pAng = part.baseAngle + angle * part.speedMul;
        const pX = W * 0.55 + Math.cos(pAng) * part.rad;
        const pY = H * 0.48 + Math.sin(pAng) * (part.rad * 0.55) + Math.sin(angle * 3 + part.baseAngle) * part.yAmp;

        renderedPoints.push({ x: pX, y: pY, color: part.color });

        ctx.beginPath();
        ctx.arc(pX, pY, part.size, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.shadowColor = part.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Subtle dynamic constellation lines between nearby particles
      for (let i = 0; i < renderedPoints.length; i++) {
        for (let j = i + 1; j < renderedPoints.length; j++) {
          const p1 = renderedPoints[i];
          const p2 = renderedPoints[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(189, 169, 234, ' + (0.28 * (1 - dist / 110)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    window.startRecording = function() {
      return new Promise((resolve, reject) => {
        const stream = canvas.captureStream(FPS);
        const options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 3500000 };
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
      return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
    };
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent);
  await page.waitForFunction('typeof window.startRecording === "function"');

  console.log('Capturing vibrant hero poster image...');
  const posterBase64 = await page.evaluate(() => window.capturePoster());
  const posterBuffer = Buffer.from(posterBase64, 'base64');
  const posterPath = path.resolve(__dirname, '../public/images/hero-poster.jpg');
  fs.writeFileSync(posterPath, posterBuffer);
  console.log('✓ Poster image written to', posterPath, `(${posterBuffer.length} bytes)`);

  console.log('Recording 8-second seamless looping WebM video with enhanced vibrancy...');
  const videoBase64 = await page.evaluate(async () => {
    return await window.startRecording();
  });

  const videoBuffer = Buffer.from(videoBase64, 'base64');
  const videoPath = path.resolve(__dirname, '../public/videos/hero-bg.webm');
  fs.writeFileSync(videoPath, videoBuffer);
  console.log('✓ WebM video written to', videoPath, `(${videoBuffer.length} bytes)`);

  await browser.close();
  console.log('✓ Video generation complete!');
}

generateVibrantHeroVideo().catch(err => {
  console.error('Failed to generate video:', err);
  process.exit(1);
});
