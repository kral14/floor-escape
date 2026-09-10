const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFile = path.join(publicDir, 'index.html');
const cssFile = path.join(publicDir, 'css', 'style.css');

const jsFiles = [
    'js/audio.js',
    'js/state.js',
    'js/entities/player.js',
    'js/entities/monster.js',
    'js/entities/bullet.js',
    'js/entities/coin.js',
    'js/entities/turrets.js',
    'js/giftcodes.js',
    'js/auth.js',
    'js/dashboard.js',
    'js/ui.js',
    'js/game.js'
];

let html = fs.readFileSync(htmlFile, 'utf-8');
const css = fs.readFileSync(cssFile, 'utf-8');

// Replace CSS link with inline style
html = html.replace(
    '<link rel="stylesheet" href="css/style.css">',
    `<style>\n${css}\n</style>`
);

// Read and concatenate all JS files
let combinedJs = '';
for (const relPath of jsFiles) {
    const fullPath = path.join(publicDir, relPath);
    if (fs.existsSync(fullPath)) {
        combinedJs += `\n/* ===== ${relPath} ===== */\n` + fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
}

// Remove individual script tags and insert combined script
const scriptTagsRegex = /<!-- MODULYAR SKRİPTLƏR -->[\s\S]*?<\/body>/;
html = html.replace(
    scriptTagsRegex,
    () => `<!-- BİRLƏŞDİRİLMİŞ MODULLAR -->\n<script>\n${combinedJs}\n</script>\n</body>`
);

// Write to root index.html
const rootIndex = path.join(__dirname, 'index.html');
fs.writeFileSync(rootIndex, html, 'utf-8');
console.log('✅ scratch/floor_escape/index.html uğurla yeniləndi!');

// Copy to e:\oyun.html
const targetE = 'e:\\oyun.html';
try {
    fs.writeFileSync(targetE, html, 'utf-8');
    console.log('✅ e:\\oyun.html uğurla yeniləndi!');
} catch (err) {
    console.error('e:\\oyun.html yazılarkən xəta:', err.message);
}
