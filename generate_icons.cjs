const { Jimp } = require('jimp');

async function createIcon(size, filename) {
  // Try using Jimp constructor
  const image = new Jimp({ width: size, height: size, color: '#1E3A8A' });
  await image.write(filename);
  console.log('Saved', filename);
}

async function main() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    await createIcon(size, `public/icons/icon-${size}x${size}.png`);
  }
  
  const mobile = new Jimp({ width: 768, height: 1376, color: '#08081a' });
  await mobile.write('public/screenshots/mobile.png');
  const desktop = new Jimp({ width: 1376, height: 768, color: '#08081a' });
  await desktop.write('public/screenshots/desktop.png');
}

main().catch(console.error);
