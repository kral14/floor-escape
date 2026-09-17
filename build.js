const { execFileSync } = require('child_process');
const path = require('path');

// 🛑 0. BUILD MƏRHƏLƏSİNDƏ POSTGRESQL YOXLANIŞI (Qoşulma yoxdursa BUILD DƏRHAL DAYANIR!)
try {
    execFileSync(process.execPath, [path.join(__dirname, 'check_db_build.js')], { stdio: 'inherit' });
} catch (e) {
    console.error('\n[FATAL] Baza yoxlanışı uğursuz oldu. Build prosesi dayandırılır.\n');
    process.exit(1);
}

try {
    const tailwindCli = require.resolve('tailwindcss/lib/cli.js');
    execFileSync(process.execPath, [tailwindCli, '-c', 'tailwind.config.cjs', '-i', 'public/css/tailwind-input.css', '-o', 'public/css/tailwind.css', '--minify'], { cwd: __dirname, stdio: 'inherit' });
} catch (twErr) {
    console.log('ℹ Tailwind CLI tapılmadı və ya atlandı, mövcud CSS faylları saxlanılır.');
}

const fs = require('fs');

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

// 5. Root lava-preview.html
const publicLava = path.join(publicDir, 'lava-preview.html');
if (fs.existsSync(publicLava)) {
    let lavaHtml = fs.readFileSync(publicLava, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'lava-preview.html'), lavaHtml, 'utf-8');
    console.log('✓ Root lava-preview.html sinxronlaşdırıldı.');
}

// 6. Root editor qovluğu
const publicEditor = path.join(publicDir, 'editor');
const rootEditor = path.join(__dirname, 'editor');
if (fs.existsSync(publicEditor)) {
    if (!fs.existsSync(rootEditor)) fs.mkdirSync(rootEditor, { recursive: true });
    ['index.html', 'editor.js', 'editor.css'].forEach(f => {
        const src = path.join(publicEditor, f);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(rootEditor, f));
        }
    });
    console.log('✓ Root editor/ qovluğu sinxronlaşdırıldı.');
}

console.log('✓ Build prosesi uğurla tamamlandı!');
