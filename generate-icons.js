// Generate PWA icon PNGs from SVG
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG-based icons for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#g)"/>
  <path d="M14 30L24 12L34 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="18" y1="24" x2="30" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

// Also create an HTML file to convert SVGs to PNGs in browser
const html = `<!DOCTYPE html>
<html>
<head><title>Icon Generator</title></head>
<body>
<script>
const sizes = [${sizes.join(',')}];
sizes.forEach(size => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6366F1');
  grad.addColorStop(1, '#8B5CF6');
  
  // Rounded rect
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Mountain icon
  const s = size / 48;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(14 * s, 30 * s);
  ctx.lineTo(24 * s, 12 * s);
  ctx.lineTo(34 * s, 30 * s);
  ctx.stroke();
  
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(18 * s, 24 * s);
  ctx.lineTo(30 * s, 24 * s);
  ctx.stroke();
  
  const link = document.createElement('a');
  link.download = 'icon-' + size + 'x' + size + '.png';
  link.href = canvas.toDataURL('image/png');
  link.textContent = 'Download ' + size;
  document.body.appendChild(link);
  document.body.appendChild(document.createElement('br'));
});
</script>
</body>
</html>`;

fs.writeFileSync(path.join(iconsDir, 'generate.html'), html);
console.log('Created generate.html - open in browser to download PNGs');
console.log('Done!');
