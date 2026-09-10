// ƏSAS OYUN MƏNTİQİ, FİZİKA VƏ OYUN DÖNGƏSİ (GAME LOOP)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// SABİT STANDART QRİD VƏ OYUN MEYDANI ÖLÇÜLƏRİ (800x680: 20x17 xana, hər biri 40px)
const canvasWidth = 800;
const canvasHeight = 680;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

function resizeCanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Brauzer zoomunun qarşısının alınması
window.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault();
}, { passive: false });

window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
        e.preventDefault();
    }
});

// QISAYOL DÜYMƏLƏRİ (KEYBINDS)
const DEFAULT_KEYBINDS = {
    wall: '1',
    ice: '2',
    shock: '3',
    mine: '4',
    plasma: '5'
};

let keybinds = { ...DEFAULT_KEYBINDS };
let isKeybindMode = false;
let recordingTrapType = null;

function loadKeybinds() {
    try {
        const saved = localStorage.getItem('floor_escape_keybinds');
        if (saved) keybinds = { ...DEFAULT_KEYBINDS, ...JSON.parse(saved) };
    } catch (e) {
        keybinds = { ...DEFAULT_KEYBINDS };
    }
}

function saveKeybinds() {
    localStorage.setItem('floor_escape_keybinds', JSON.stringify(keybinds));
}

function formatKeyDisplay(k) {
    if (!k) return '?';
    if (k === ' ') return 'SPACE';
    return k.toUpperCase();
}

function renderKeybindBadges() {
    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(type => {
        const badge = document.getElementById(`keybind-badge-${type}`);
        if (badge) badge.innerText = formatKeyDisplay(keybinds[type]);
    });
}

function toggleKeybindMode() {
    isKeybindMode = !isKeybindMode;
    const banner = document.getElementById('keybind-help-banner');
    const btn = document.getElementById('btn-toggle-keybinds');
    const label = document.getElementById('keybind-mode-label');

    if (isKeybindMode) {
        banner.classList.remove('hidden');
        btn.classList.add('border-rose-500', 'text-rose-400');
        label.innerText = 'Ləğv et';
        showToast('Qısayol dəyişmə rejimi aktivdir! Nişana klikləyin.', 'info');
    } else {
        cancelRebinding();
    }
}

function cancelRebinding() {
    isKeybindMode = false;
    recordingTrapType = null;
    const banner = document.getElementById('keybind-help-banner');
    const btn = document.getElementById('btn-toggle-keybinds');
    const label = document.getElementById('keybind-mode-label');

    if (banner) banner.classList.add('hidden');
    if (btn) btn.classList.remove('border-rose-500', 'text-rose-400');
    if (label) label.innerText = 'Qısayol';

    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(t => {
        const badge = document.getElementById(`keybind-badge-${t}`);
        if (badge) badge.classList.remove('recording');
    });
}

function startRebinding(type, event) {
    if (event) event.stopPropagation();
    isKeybindMode = true;
    recordingTrapType = type;

    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(t => {
        const badge = document.getElementById(`keybind-badge-${t}`);
        if (badge) {
            if (t === type) badge.classList.add('recording');
            else badge.classList.remove('recording');
        }
    });

    showToast(`${getTrapName(type)} üçün yeni düyməni basın...`, 'info');
}

// OBYEKTLƏR VƏ QURULUŞ
const player = new Player();
const monster = new Monster();
let bullets = [];
let coins = [];
let particles = [];
let keys = {};
let frameCount = 0;
let hasPassedBorder = false;

// MƏRMİ VƏ TƏLƏ ATMAQ
function fireBullet(type) {
    if (gameState.gameOver || gameState.paused || gameState.transitioning) return;
    audio.init();

    const price = getBulletCost(type);

    if (gameState.gold >= price) {
        gameState.gold -= price;
        gameState.totalTrapsPlaced++;
        if (!gameState.bulletUsage) gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };
        gameState.bulletUsage[type] = (gameState.bulletUsage[type] || 0) + 1;

        bullets.push(new Bullet(type, player.x, player.y + 15));
        audio.playShoot();

        updateUI();
        saveActiveRun();
    } else {
        showToast(`Qızıl Çatmır! (${price} 🪙 tələb olunur)`, 'error');
    }
}

// QATIN TAMAMLANMASI VƏ SƏRHƏDİN AÇILMASI
function checkBorderUnlock() {
    const req = gameState.getFloorRequirement(gameState.floor);
    if (!gameState.borderOpen && gameState.scoreProgress >= req) {
        gameState.borderOpen = true;
        audio.playDoorOpen();
        showToast(`🚪 SƏRHƏD AÇILDI! Qızıl dayandı, dərhal növbəti qata qalx!`, 'success');

        for (let i = 0; i < 35; i++) {
            particles.push(new Particle(
                canvasWidth / 2 + (Math.random() - 0.5) * 250,
                45 + Math.random() * 20,
                ['#00ff66', '#ffd700', '#00ffcc', '#ff00ff'],
                5
            ));
        }
        saveActiveRun();
    }
}

function nextFloor() {
    gameState.floor++;
    gameState.transitioning = true;
    keys = {};

    diamonds += 1;
    savePermanentData();
    audio.playDiamond();

    if (gameState.floor > gameState.bestFloor) {
        gameState.bestFloor = gameState.floor;
        localStorage.setItem('floor_escape_best_floor', gameState.bestFloor.toString());
        document.getElementById('stat-best-floor').innerText = `🏆 REKORD: ${gameState.bestFloor}`;
    }

    gameState.scoreProgress = 0;
    gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
    gameState.borderOpen = false;
    gameState.combo = 0;
    gameState.floorTime = 0;
    gameState.coinCountdown = getCoinSpawnInterval();
    hasPassedBorder = false;

    bullets = [];
    coins = [];
    player.reset();
    monster.reset();
    twinTurrets.reset();
    gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };

    spawnCoins();

    // 10-cu QAT SANDIQ YOXLANIŞI
    const openedChest = checkMilestoneChest(gameState.floor);

    const overlay = document.getElementById('floor-clear-overlay');
    const desc = document.getElementById('floor-clear-desc');
    desc.innerText = `${gameState.floor}-ci Qata keçdiniz! Tələb olunan xal: ${gameState.scoreReq}`;
    overlay.classList.remove('hidden');

    document.getElementById('main-view').classList.add('shake');
    setTimeout(() => {
        document.getElementById('main-view').classList.remove('shake');
        overlay.classList.add('hidden');
        gameState.transitioning = false;
        keys = {};
        showToast(`🚀 ${gameState.floor}-ci Qat Başladı!`, 'info');
        saveActiveRun();
    }, 1600);

    showToast(`🎉 ${gameState.floor}-ci Qat! (+1 💎 Almaz)`, 'diamond');
    updateUI();
    saveActiveRun();
}

function spawnCoins() {
    coins = [];
    const coinCount = 6 + gameState.floor * 2;
    for (let i = 0; i < coinCount; i++) {
        coins.push(new Coin(
            Math.random() * (canvasWidth - 80) + 40,
            Math.random() * (canvasHeight - 340) + 80
        ));
    }
}

function autoSpawnCoin() {
    if (gameState.gameOver || gameState.paused || gameState.transitioning || gameState.borderOpen) return;

    const maxAllowedCoins = 6 + gameState.floor * 2;
    if (coins.length >= maxAllowedCoins) return;

    const count = Math.min(2, maxAllowedCoins - coins.length);
    for (let i = 0; i < count; i++) {
        coins.push(new Coin(
            Math.random() * (canvasWidth - 60) + 30,
            Math.random() * (canvasHeight - 280) + 70
        ));
    }
}

function drawBorderLine() {
    const borderY = 55;
    const isOpen = gameState.borderOpen;

    ctx.save();
    const grad = ctx.createLinearGradient(0, borderY - 15, 0, borderY + 15);
    if (isOpen) {
        grad.addColorStop(0, 'rgba(0, 255, 100, 0)');
        grad.addColorStop(0.3, 'rgba(0, 255, 100, 0.3)');
        grad.addColorStop(0.5, 'rgba(0, 255, 100, 0.6)');
        grad.addColorStop(0.7, 'rgba(0, 255, 100, 0.3)');
        grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
    } else {
        grad.addColorStop(0, 'rgba(255, 0, 80, 0)');
        grad.addColorStop(0.5, 'rgba(255, 0, 80, 0.45)');
        grad.addColorStop(1, 'rgba(255, 0, 80, 0)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, borderY - 15, canvasWidth, 30);

    ctx.beginPath();
    ctx.moveTo(0, borderY);
    ctx.lineTo(canvasWidth, borderY);

    if (isOpen) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ff88';
        ctx.setLineDash([12, 6]);
    } else {
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ff0055';
        ctx.setLineDash([8, 8]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    const label = isOpen ? '🌟 SƏRHƏD AÇIQDIR - QATDAN ÇIXIŞ ÜÇÜN KEÇİN' : `🔒 SƏRHƏD BAĞLIDIR (${gameState.scoreProgress}/${gameState.scoreReq})`;
    ctx.font = 'bold 11px Orbitron';
    ctx.fillStyle = isOpen ? '#00ff88' : '#ff4466';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvasWidth / 2, borderY - 8);

    ctx.restore();
}

// ƏSAS OYUN DÖVRÜ (GAME LOOP)
function gameLoop() {
    frameCount++;

    if (!gameState.paused && !gameState.gameOver) {
        if (!gameState.transitioning) {
            gameState.floorTime += 1 / 60;

            if (gameState.dashCooldown > 0) {
                gameState.dashCooldown -= 1 / 60;
                if (gameState.dashCooldown < 0) gameState.dashCooldown = 0;
            }
            if (gameState.dashInvulnerable > 0) {
                gameState.dashInvulnerable--;
            }

            // Sərhəd bağlı olduqda sikkə taymeri işləyir
            if (!gameState.borderOpen) {
                gameState.coinCountdown -= 1 / 60;
                if (gameState.coinCountdown <= 0) {
                    autoSpawnCoin();
                    gameState.coinCountdown = getCoinSpawnInterval();
                }
            }

            // Əkiz Qüllələrin dövrü
            twinTurrets.update();
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Qrid Xətləri (20x17 xana)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvasWidth; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(canvasWidth, 0);
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.stroke();

        for (let y = 0; y < canvasHeight; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.stroke();

        // Mərkəzi Qat Nişanı
        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.font = '120px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameState.floor, canvasWidth / 2, canvasHeight / 2);

        drawBorderLine();

        player.update(keys);
        player.draw();

        // Əkiz Qüllələrin Çəkilməsi
        twinTurrets.draw();

        // Sikkələrin Çəkilməsi və Toplanması
        coins.forEach((c, index) => {
            c.draw();

            const dist = Math.hypot(player.x - c.x, player.y - c.y);
            const attractDist = gameState.magnetRadius;

            if (dist < attractDist) {
                const angle = Math.atan2(player.y - c.y, player.x - c.x);
                const magnetForce = 4.5 * (1 - dist / attractDist) + 2.5;
                c.x += Math.cos(angle) * magnetForce;
                c.y += Math.sin(angle) * magnetForce;
            }

            if (dist < player.radius + c.radius) {
                gameState.gold += c.value;
                gameState.combo++;
                if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

                audio.playCoin();
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(c.x, c.y, '#ffd700', 3));
                }

                coins.splice(index, 1);
                showGoldToast(c.value);
                updateUI();
            }
        });

        // Lavanın yenilənməsi və çəkilməsi
        monster.update();
        monster.draw();

        // Mərmilərin yenilənməsi və lavaya dəyməsi
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update();
            b.draw();

            if (b.y >= monster.y - 12) {
                audio.playImpact();
                gameState.totalTrapsDestroyed++;

                const scores = { wall: 1, ice: 2, shock: 3, mine: 4, plasma: 5 };
                const trapScore = scores[b.type] || 1;
                gameState.scoreProgress += trapScore;
                checkBorderUnlock();

                const rewards = { wall: 6, ice: 10, shock: 14, mine: 22, plasma: 32 };
                const reward = rewards[b.type] || 6;
                gameState.gold += reward;
                showGoldToast(reward);

                if (b.type === 'wall') {
                    audio.playBarricade();
                    monster.wallTimer = Math.max(monster.wallTimer, 180); // 3.0s fiziki barrikada divarı
                    for (let p = 0; p < 14; p++) {
                        particles.push(new Particle(b.x + (Math.random() - 0.5) * 40, monster.y, '#f59e0b', 4));
                    }
                } else if (b.type === 'ice') {
                    audio.playIce();
                    monster.iceTimer = Math.max(monster.iceTimer, 210); // 3.5s buz ləngitməsi
                    for (let p = 0; p < 14; p++) {
                        particles.push(new Particle(b.x + (Math.random() - 0.5) * 40, monster.y, '#00ffff', 4));
                    }
                } else if (b.type === 'shock') {
                    audio.playShock();
                    monster.shockTimer = Math.max(monster.shockTimer, 240); // 4.0s elektrik iflici
                    for (let p = 0; p < 18; p++) {
                        particles.push(new Particle(b.x + (Math.random() - 0.5) * 50, monster.y, '#c084fc', 4.5));
                    }
                } else if (b.type === 'mine') {
                    audio.playExplosion();
                    monster.y = Math.min(canvasHeight + 40, monster.y + 35);
                    monster.mineStunTimer = Math.max(monster.mineStunTimer, 80);
                    for (let p = 0; p < 25; p++) {
                        particles.push(new Particle(b.x + (Math.random() - 0.5) * 60, monster.y, '#f43f5e', 5));
                    }
                } else if (b.type === 'plasma') {
                    audio.playPlasma();
                    monster.plasmaTimer = Math.max(monster.plasmaTimer, 300); // 5.0s ərimə
                    for (let p = 0; p < 18; p++) {
                        particles.push(new Particle(b.x + (Math.random() - 0.5) * 50, monster.y, '#34d399', 4.5));
                    }
                }

                bullets.splice(i, 1);
                updateUI();
                continue;
            }

            if (b.y > canvasHeight + 50) {
                bullets.splice(i, 1);
            }
        }

        // Hissəciklər
        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            if (p.alpha <= 0) particles.splice(idx, 1);
        });

        // Sərhəddən keçid yoxlanışı
        const borderY = 55;
        if (gameState.borderOpen && player.y <= borderY + player.radius) {
            if (!hasPassedBorder) {
                hasPassedBorder = true;
                setTimeout(() => {
                    if (!gameState.gameOver) {
                        nextFloor();
                    }
                }, 250);
            }
        }

        // Oyunun bitməsi yoxlanışı
        if (!gameState.transitioning && gameState.dashInvulnerable <= 0 && monster.y <= player.y + player.radius) {
            triggerGameOver();
        }

        // Sərhəd açıq deyilsə passiv qızıl artımı
        if (frameCount % 30 === 0 && !gameState.borderOpen) {
            gameState.gold += 0.15 * (1 + gameState.combo * 0.05);
        }

        // Avtomatik yaddaşa qeyd
        if (frameCount % 20 === 0) {
            saveActiveRun();
        }

        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    gameState.gameOver = true;
    gameState.coinCountdown = getCoinSpawnInterval();
    bullets = [];
    coins = [];
    clearActiveRun();
    audio.playGameOver();
    cancelRebinding();

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };
    setTxt('final-floor', gameState.floor);
    setTxt('final-gold', Math.floor(gameState.gold));
    setTxt('final-traps', gameState.totalTrapsPlaced);
    setTxt('final-diamonds', diamonds);
    setTxt('final-red-diamonds', redDiamonds);
    
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.remove('hidden');

    if (typeof syncPlayerDataCloud === 'function') {
        syncPlayerDataCloud(true);
    }
}

function restartGame() {
    clearActiveRun();
    gameState.transitioning = false;
    keys = {};
    gameState.gold = 75;
    gameState.floor = 1;
    gameState.scoreProgress = 0;
    gameState.scoreReq = gameState.getFloorRequirement(1);
    gameState.borderOpen = false;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.totalTrapsPlaced = 0;
    gameState.totalTrapsDestroyed = 0;
    gameState.floorTime = 0;
    gameState.inGameSpeedLvl = 0;
    gameState.inGameMagnetLvl = 0;
    gameState.magnetRadius = getBaseMagnetRadius();
    gameState.dashCooldown = 0;
    gameState.coinCountdown = getCoinSpawnInterval();
    gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };
    hasPassedBorder = false;

    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');

    cancelRebinding();
    bullets = [];
    coins = [];
    player.reset();
    monster.reset();
    twinTurrets.reset();
    spawnCoins();
    updateUI();
    saveActiveRun();
}

function togglePause() {
    if (gameState.gameOver) return;
    gameState.paused = !gameState.paused;
    const pauseOverlay = document.getElementById('pause-overlay');
    if (gameState.paused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
    }
}

function toggleAudio() {
    audio.init();
    audio.muted = !audio.muted;
    const btn = document.getElementById('btn-sound');
    btn.innerHTML = audio.muted ? `<i class="fa-solid fa-volume-xmark text-sm text-rose-400"></i>` : `<i class="fa-solid fa-volume-high text-sm"></i>`;
}

// KLAVİATURA İDARƏETMƏSİ
window.addEventListener('keydown', e => {
    if (!e || typeof e.key === 'undefined') return;

    // Əgər istifadəçi çatda, hədiyyə kodu və ya başqa inputda mətn yazırsa, oyunu tətikləməsin
    const activeTag = document.activeElement ? (document.activeElement.tagName || '').toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
    }

    if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
    }

    if (gameState.transitioning) return;
    audio.init();
    const k = (e.key || '').toLowerCase();

    if (recordingTrapType) {
        e.preventDefault();
        e.stopPropagation();

        let assignedKey = k;
        if (e.code === 'Space') assignedKey = ' ';
        if (e.code === 'Tab') assignedKey = 'tab';

        keybinds[recordingTrapType] = assignedKey;
        saveKeybinds();
        renderKeybindBadges();
        audio.playKeySet();
        showToast(`${getTrapName(recordingTrapType)} qısayolu [${formatKeyDisplay(assignedKey)}] olaraq təyin edildi!`, 'success');

        cancelRebinding();
        return;
    }

    if (k) keys[k] = true;

    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        player.dash();
        return;
    }

    // Tələ atış qısayolları
    let matchedType = null;
    for (const [type, boundKey] of Object.entries(keybinds)) {
        if (boundKey === 'tab' && (e.key === 'Tab' || e.code === 'Tab')) {
            matchedType = type;
            break;
        } else if (boundKey === ' ' && (e.code === 'Space' || e.key === ' ')) {
            matchedType = type;
            break;
        } else if (boundKey && typeof boundKey === 'string' && boundKey.toLowerCase() === k) {
            matchedType = type;
            break;
        }
    }

    if (matchedType) {
        e.preventDefault();
        fireBullet(matchedType);
    }
});

window.addEventListener('keyup', e => {
    if (!e || typeof e.key === 'undefined') return;
    if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
    }
    const k = (e.key || '').toLowerCase();
    if (k) keys[k] = false;
});

canvas.addEventListener('click', () => {
    if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
    audio.init();
    canvas.focus();
});

function handleTouchStart(dir) {
    if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
    audio.init();
    keys['touch_' + dir] = true;
}
function handleTouchEnd(dir) {
    keys['touch_' + dir] = false;
}

function triggerPlayerDash() {
    if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
    audio.init();
    player.dash();
}

window.addEventListener('beforeunload', () => {
    if (!gameState.gameOver) {
        saveActiveRun();
    }
});

// İLKİN İŞƏSALMA
loadPermanentData();
loadKeybinds();
resizeCanvas();

player.reset();
monster.reset();
twinTurrets.reset();
spawnCoins();

const hasLoadedRun = loadActiveRun();

document.getElementById('stat-best-floor').innerText = `🏆 REKORD: ${gameState.bestFloor}`;
gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
renderKeybindBadges();
updatePermUpgradesUI();
updateTurretsUI();
updateUI();

if (hasLoadedRun) {
    showToast(`🔄 Oyun ${gameState.floor}-ci Qatdan davam edir! (Lavanın yeri saxlanıldı)`, 'success');
}

if (typeof showDashboardView === 'function') {
    showDashboardView();
} else {
    gameState.paused = false;
}

requestAnimationFrame(gameLoop);
