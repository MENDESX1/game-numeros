const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

// Combine duplicate icons
const iconsMap = new Map();
manifest.icons.forEach(icon => {
  if (iconsMap.has(icon.src)) {
    const existing = iconsMap.get(icon.src);
    const purposes = new Set((existing.purpose || '').split(' ').concat((icon.purpose || '').split(' ')).filter(Boolean));
    existing.purpose = Array.from(purposes).join(' ');
  } else {
    iconsMap.set(icon.src, { ...icon });
  }
});
manifest.icons = Array.from(iconsMap.values());

fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest fixed');
