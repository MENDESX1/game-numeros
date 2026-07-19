const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const input = 'src/assets/images/logic_match_icon_1784304911540.jpg';

async function generate() {
  console.log('Generating pristine icons using sharp...');

  if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
  }
  if (!fs.existsSync('public/screenshots')) {
    fs.mkdirSync('public/screenshots', { recursive: true });
  }

  // Generate public/icons folder sizes
  for (const size of sizes) {
    const dest = `public/icons/icon-${size}x${size}.png`;
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`Generated ${dest}`);
  }

  // Generate root files
  await sharp(input).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(input).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(input).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(input).resize(32, 32).png().toFile('public/favicon-32x32.png');
  await sharp(input).resize(16, 16).png().toFile('public/favicon-16x16.png');
  await sharp(input).resize(512, 512).png().toFile('public/favicon.png');

  // Convert screenshots using sharp to guarantee perfect PNG headers and compliance
  const desktopInput = 'src/assets/images/screenshot_desktop_1784131471496.jpg';
  const mobileInput = 'src/assets/images/screenshot_mobile_1784131456742.jpg';
  
  if (fs.existsSync(desktopInput)) {
    await sharp(desktopInput).png().toFile('public/screenshots/desktop.png');
    console.log('Generated public/screenshots/desktop.png');
  }
  if (fs.existsSync(mobileInput)) {
    await sharp(mobileInput).png().toFile('public/screenshots/mobile.png');
    console.log('Generated public/screenshots/mobile.png');
  }

  console.log('Generating favicon.ico using png-to-ico...');
  try {
    const buf = await pngToIco(['public/favicon-16x16.png', 'public/favicon-32x32.png']);
    fs.writeFileSync('public/favicon.ico', buf);
    console.log('Generated public/favicon.ico successfully!');
  } catch (err) {
    console.error('Failed to generate favicon.ico:', err.message);
  }

  console.log('Icon generation complete!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
});
