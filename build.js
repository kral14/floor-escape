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

// 3. Root shop.html
const publicShop = path.join(publicDir, 'shop.html');
if (fs.existsSync(publicShop)) {
    let shopHtml = fs.readFileSync(publicShop, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'shop.html'), shopHtml, 'utf-8');
    console.log('✓ Root shop.html sinxronlaşdırıldı.');
}

// 4. Root guide.html
const publicGuide = path.join(publicDir, 'guide.html');
if (fs.existsSync(publicGuide)) {
    let guideHtml = fs.readFileSync(publicGuide, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'guide.html'), guideHtml, 'utf-8');
    console.log('✓ Root guide.html sinxronlaşdırıldı.');
}

console.log('✓ Build prosesi uğurla tamamlandı!');
