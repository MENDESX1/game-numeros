const fs = require('fs');
let sw = fs.readFileSync('public/sw.js', 'utf8');

// Update cache version to force an update
sw = sw.replace(/const CACHE_VERSION = 'v[0-9]+';/, "const CACHE_VERSION = 'v5';");

fs.writeFileSync('public/sw.js', sw);
console.log('SW updated');
