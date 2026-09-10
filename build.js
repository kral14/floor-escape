const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const cssFile = path.join(publicDir, 'css', 'style.css');
const css = fs.readFileSync(cssFile, 'utf-8');

// 1. Root index.html
const publicIndex = path.join(publicDir, 'index.html');
if (fs.existsSync(publicIndex)) {
    let indexHtml = fs.readFileSync(publicIndex, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'index.html'), indexHtml, 'utf-8');
    console.log('✓ Root index.html sinxronlaşdırıldı.');
}

// 2. Root game.html
const publicGame = path.join(publicDir, 'game.html');
if (fs.existsSync(publicGame)) {
    let gameHtml = fs.readFileSync(publicGame, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'game.html'), gameHtml, 'utf-8');
    console.log('✓ Root game.html sinxronlaşdırıldı.');
}

console.log('✓ Build prosesi uğurla tamamlandı!');
