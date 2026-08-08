// build-postprocess.js
const fs = require('fs');
const path = require('path');

const srcIndex = path.join(__dirname, 'index.html');
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

let html = fs.readFileSync(srcIndex, 'utf8');

// Replace references to app.js and styles.css with minified versions
html = html.replace(/src="app\.js"/g, 'src="app.min.js"');
html = html.replace(/href="styles\.css"/g, 'href="styles.min.css"');

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
console.log('Wrote dist/index.html (references updated to app.min.js / styles.min.css)');
