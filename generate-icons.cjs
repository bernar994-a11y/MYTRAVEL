const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

sizes.forEach(s => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#g)"/><path d="M14 30L24 12L34 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="18" y1="24" x2="30" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
  fs.writeFileSync(path.join(dir, `icon-${s}x${s}.png`), svg);
  console.log(`Created icon-${s}x${s}`);
});

// Apple touch icon (same as 192)
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#g)"/><path d="M14 30L24 12L34 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="18" y1="24" x2="30" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
fs.writeFileSync(path.join(__dirname, 'public', 'apple-touch-icon.png'), svg192);

console.log('All icons created!');
