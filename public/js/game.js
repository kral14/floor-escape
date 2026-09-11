// ƏSAS OYUN MƏNTİQİ, FİZİKA VƏ OYUN DÖNGƏSİ (GAME LOOP)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
window.ctx = ctx;

// SABİT STANDART QRİD VƏ OYUN MEYDANI ÖLÇÜLƏRİ (800x680: 20x17 xana, hər biri 40px)
const canvasWidth = 800;
const canvasHeight = 680;
canvas.width = canvasWidth;
canvas.height = canvasHeight;


// BÜTÜN MONİTORLARDA TAM ORTALANMA VƏ YUXARIDAN-AŞAĞIDAN DƏQİQ 10PX BOŞLUQ
function adjustViewportFit() {
    const gameScreen = document.getElementById('game-screen-container');
    if (!gameScreen || gameScreen.classList.contains('hidden')) return;

    // Yuxarıdan və aşağıdan dəqiq 10px, yanlardan 10px boşluq
    const paddingY = 10;
    const paddingX = 10;

    const availW = Math.max(300, window.innerWidth - (paddingX * 2));
    const availH = Math.max(300, window.innerHeight - (paddingY * 2));

    const baseW = 1140;
    const baseH = 750;

    const scale = Math.min(availW / baseW, availH / baseH);

    gameScreen.style.position = 'absolute';
    gameScreen.style.left = '50%';
    gameScreen.style.top = '50%';
    gameScreen.style.margin = '0';
    gameScreen.style.transformOrigin = 'center center';
    gameScreen.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', adjustViewportFit);
window.addEventListener('load', adjustViewportFit);

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
let powerUps = [];
let floatingTexts = [];
let screenPulse = { color: '#00f0ff', alpha: 0 };
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
    if (window.audio) {
        audio.setFloor(gameState.floor, true);
    }
    const trackNames = ['Neon Retrowave (80s Synthwave)', 'Chiptune Arcade (8-Bit NES)', 'Acid Cyber Techno (TB-303)', 'Magma Doom Slayer (Darksynth)', 'Hyperion Trance (Euro-Trance)'];
    const trackName = trackNames[(gameState.floor - 1) % trackNames.length];
    showToast(`🎵 Qat ${gameState.floor}: ${trackName}`, 'info');

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

    // 🌀 MƏRHƏLƏ 4: ANOMALİYA TƏYİNİ (PLATFORMASIZ)
    applyFloorModifier();

    spawnCoins();
    spawnPowerUps();

    // 🛡️ LABORATORİYA: QATA QALXANLA BAŞLAMA ŞANSI (ALMAZ YÜKSƏLTMƏSİ)
    if (typeof getShieldStartChance === 'function' && Math.random() < getShieldStartChance()) {
        player.hasShield = true;
        showToast('🛡️ LABORATORİYA BONUSU: AEGIS QALXANI AKTİVDİR!', 'success');
    }

    // 10-cu QAT SANDIQ YOXLANIŞI
    const openedChest = checkMilestoneChest(gameState.floor);

    const overlay = document.getElementById('floor-clear-overlay');
    const desc = document.getElementById('floor-clear-desc');
    let modTxt = '';
    if (gameState.activeModifier === 'gravity') modTxt = ' [🪐 AY QRAVİTASİYASI]';
    else if (gameState.activeModifier === 'goldrush') modTxt = ' [💰 QIZIL QIZDIRMASI]';

    desc.innerText = `${gameState.floor}-ci Qata keçdiniz!${modTxt} Tələb olunan xal: ${gameState.scoreReq}`;
    overlay.classList.remove('hidden');

    document.getElementById('main-view').classList.add('shake');
    setTimeout(() => {
        document.getElementById('main-view').classList.remove('shake');
        overlay.classList.add('hidden');
        gameState.transitioning = false;
        keys = {};
        showToast(`🚀 ${gameState.floor}-ci Qat Başladı!${modTxt}`, 'info');
        saveActiveRun();
    }, 1600);

    showToast(`🎉 ${gameState.floor}-ci Qat! (+1 💎 Almaz)`, 'diamond');
    updateUI();
    saveActiveRun();
}

// 🌀 MƏRHƏLƏ 4: ANOMALİYA TƏTBİQİ (Qaranlıq qatı ləğv edildi)
function applyFloorModifier() {
    if (gameState.floor < 3) {
        gameState.activeModifier = 'normal';
        return;
    }
    const roll = Math.random();
    if (roll < 0.35) {
        gameState.activeModifier = 'gravity';
    } else if (roll < 0.70) {
        gameState.activeModifier = 'goldrush';
    } else {
        gameState.activeModifier = 'normal';
    }
}

function addFloatingText(x, y, text, color = '#00f0ff', size = 15) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        alpha: 1.0,
        vy: -1.3,
        life: 55
    });
}

// ⚡ ANİ VƏ KEÇİCİ İMPULS PARILTISI (QALICI DEYİL, ANİ OLUB İTİR)
function triggerScreenPulse(color = '#00f0ff', maxAlpha = 0.35) {
    screenPulse.color = color;
    screenPulse.alpha = maxAlpha;
}

function spawnCoins() {
    coins = [];
    let coinCount = 6 + gameState.floor * 2;
    if (gameState.activeModifier === 'goldrush') {
        coinCount = Math.floor(coinCount * 1.8);
    }
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

function spawnPowerUps() {
    powerUps = [];
    if (typeof PowerUp !== 'undefined') {
        powerUps.push(new PowerUp(
            Math.random() * (canvasWidth - 120) + 60,
            Math.random() * (canvasHeight - 320) + 90
        ));
    }
}

function autoSpawnPowerUp() {
    if (gameState.gameOver || gameState.paused || gameState.transitioning || gameState.borderOpen) return;
    if (powerUps.length >= 2) return;
    if (typeof PowerUp !== 'undefined') {
        powerUps.push(new PowerUp(
            Math.random() * (canvasWidth - 100) + 50,
            Math.random() * (canvasHeight - 300) + 80
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
        ctx.lineWidth = 3.2;
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#00ff88';
        ctx.lineDashOffset = -performance.now() * 0.025;
        ctx.setLineDash([14, 8]);
    } else {
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff0055';
        ctx.lineDashOffset = 0;
        ctx.setLineDash([8, 8]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ============================================================================
// SABİT SÜRƏT VƏ FPS İDARƏETMƏ SİSTEMİ (FIXED TIMESTEP & FPS STABILIZATION)
// Bütün monitorlarda (60Hz, 120Hz, 144Hz, 240Hz) oyunun sürətini dəqiq 1x real-zaman sürətində saxlayır.
// Həmçinin zəif cihazlar üçün 30 FPS qənaət rejimini təmin edir.
// ============================================================================

let targetFPS = parseInt(localStorage.getItem('floor_escape_target_fps') || '60', 10);
if (targetFPS !== 30 && targetFPS !== 60) targetFPS = 60;

let frameInterval = 1000 / targetFPS;
const FIXED_PHYSICS_DELTA = 1000 / 60; // Dəqiq 60Hz fizika addımı (16.66667 ms)
let lastFrameTime = performance.now();
let physicsAccumulator = 0;

// Canlı FPS Hesablama
let fpsFramesCount = 0;
let fpsLastTime = performance.now();
let currentMeasuredFPS = targetFPS;

function setTargetFPS(fps) {
    if (fps !== 30 && fps !== 60) return;
    targetFPS = fps;
    frameInterval = 1000 / targetFPS;
    localStorage.setItem('floor_escape_target_fps', targetFPS.toString());
    updateFpsUI();
    if (typeof showToast === 'function') {
        if (targetFPS === 60) {
            showToast('⚡ 60 FPS Rejimi aktivdir (Maksimum səlislik və sabit sürət)', 'success');
        } else {
            showToast('🔋 30 FPS Rejimi aktivdir (Zəif cihazlar üçün qənaət, oyun sürəti tam sabit qalır)', 'info');
        }
    }
}

function toggleFpsMode() {
    setTargetFPS(targetFPS === 60 ? 30 : 60);
}

function updateFpsUI() {
    const fpsEl = document.getElementById('stat-fps');
    const fpsBtn = document.getElementById('btn-fps-toggle');
    if (fpsEl) {
        fpsEl.innerText = `${targetFPS} FPS`;
    }
    if (fpsBtn) {
        if (targetFPS === 60) {
            fpsBtn.className = "px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:border-emerald-400 text-emerald-300 font-orbitron font-bold text-xs flex items-center gap-1.5 shadow transition select-none cursor-pointer";
            const icon = fpsBtn.querySelector('i');
            if (icon) icon.className = "fa-solid fa-gauge-high text-emerald-400 text-xs";
        } else {
            fpsBtn.className = "px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:border-amber-400 text-amber-300 font-orbitron font-bold text-xs flex items-center gap-1.5 shadow transition select-none cursor-pointer";
            const icon = fpsBtn.querySelector('i');
            if (icon) icon.className = "fa-solid fa-battery-half text-amber-400 text-xs";
        }
    }
}

// 1. DƏQİQ FİZİKA VƏ OYUN MƏNTİQİ ADDIMI (Həmişə 60Hz sabit addımla hesablanır)
function updatePhysicsStep() {
    frameCount++;

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

    player.update(keys);

    // 🔥 MƏRHƏLƏ 5: UÇAN NEON MƏTNLƏRİN YENİLƏNMƏSİ
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        ft.alpha = Math.max(0, ft.life / 55);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Sikkələrin çəkilməsi və toplanması
    coins.forEach((c, index) => {
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        // Super-Maqnit zamanı bütün arenadakı sikkələr güclü cəzb olunur
        const attractDist = (gameState.superMagnetTimer > 0) ? 950 : gameState.magnetRadius;
        const magnetMultiplier = (gameState.superMagnetTimer > 0) ? 2.5 : 1;

        if (dist < attractDist) {
            const angle = Math.atan2(player.y - c.y, player.x - c.x);
            const magnetForce = (4.5 * (1 - dist / attractDist) + 2.5) * magnetMultiplier;
            c.x += Math.cos(angle) * magnetForce;
            c.y += Math.sin(angle) * magnetForce;
        }

        if (dist < player.radius + c.radius) {
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

            // 🔥 MƏRHƏLƏ 5: DİNAMİK KOMBO ÇARPANI (1.5x, 2.0x, 3.0x)
            const comboMult = gameState.combo >= 10 ? 3.0 : (gameState.combo >= 5 ? 2.0 : (gameState.combo >= 3 ? 1.5 : 1.0));
            const gainedGold = Math.round(c.value * comboMult);
            gameState.gold += gainedGold;

            audio.playCoin();
            if (gameState.combo >= 3 && typeof audio.playCombo === 'function') {
                audio.playCombo(gameState.combo);
            }

            // Neon Arcade Kombo Bildirişləri
            if (gameState.combo === 3) {
                addFloatingText(c.x, c.y - 18, '🔥 COMBO x3! (1.5x)', '#f59e0b', 14);
                triggerScreenPulse('#f59e0b', 0.22);
            } else if (gameState.combo === 5) {
                addFloatingText(c.x, c.y - 20, '⚡ PERFECT ESCAPE! (2.0x)', '#00f0ff', 16);
                triggerScreenPulse('#00f0ff', 0.25);
            } else if (gameState.combo === 8) {
                addFloatingText(c.x, c.y - 22, '💥 UNSTOPPABLE! (2.0x)', '#ec4899', 17);
                triggerScreenPulse('#ec4899', 0.28);
            } else if (gameState.combo >= 10 && gameState.combo % 3 === 0) {
                addFloatingText(c.x, c.y - 24, `👑 ULTRA COMBO x${gameState.combo}! (3.0x)`, '#ffd700', 19);
                triggerScreenPulse('#ffd700', 0.32);
            }

            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(c.x, c.y, '#ffd700', 3));
            }

            coins.splice(index, 1);
            showGoldToast(gainedGold);
            updateUI();
            if (typeof saveActiveRun === 'function') saveActiveRun();
        }
    });

    // ⚡ Gücləndiricilərin (Power-Ups) yenilənməsi və toplanması
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (!p.update()) {
            powerUps.splice(i, 1);
            if (typeof saveActiveRun === 'function') saveActiveRun();
            continue;
        }

        const pDist = Math.hypot(player.x - p.x, player.y - p.y);
        if (pDist < player.radius + p.radius) {
            // Gücləndirici götürüldü!
            if (typeof audio !== 'undefined' && audio.playPowerUp) {
                audio.playPowerUp();
            }
            if (typeof particles !== 'undefined') {
                for (let k = 0; k < 18; k++) {
                    particles.push(new Particle(p.x, p.y, p.cfg.color, 3.5));
                }
            }

            if (p.type === 'shield') {
                player.hasShield = true;
                addFloatingText(player.x, player.y - 20, '🛡️ AEGIS SHIELD!', '#00f0ff', 15);
                if (typeof showToast === 'function') {
                    showToast('🛡️ ENERJİ QALXANI AKTİVLƏŞDİ!', 'success');
                }
            } else if (p.type === 'chrono') {
                gameState.chronoTimer = 240; // 4.0 saniyə (60fps)
                addFloatingText(player.x, player.y - 20, '⏱️ MATRIX SHIFT (4.0s)!', '#e879f9', 15);
                if (typeof showToast === 'function') {
                    showToast('⏱️ ZAMAN LƏNGİDİLDİ (4.0s)!', 'info');
                }
            } else if (p.type === 'jump') {
                player.hasHyperJump = true;
                addFloatingText(player.x, player.y - 20, '🚀 QUANTUM THRUSTER READY!', '#f59e0b', 16);
                if (typeof showToast === 'function') {
                    showToast('🚀 KVANT SIÇRAYIŞI HAZIRDIR! (Lavaya 2px qalmış avtomatik xilas edəcək)', 'warning');
                }
            } else if (p.type === 'magnet') {
                gameState.superMagnetTimer = 300; // 5.0 saniyə (60fps)
                addFloatingText(player.x, player.y - 20, '🧲 MAGNET STORM!', '#a855f7', 15);
                if (typeof showToast === 'function') {
                    showToast('🧲 SUPER MAQNİT FIRTINASI (5.0s)!', 'success');
                }
            }

            powerUps.splice(i, 1);
            if (typeof saveActiveRun === 'function') saveActiveRun();
        }
    }

    // Taymerlərin geri sayımı
    if (gameState.chronoTimer > 0) gameState.chronoTimer--;
    if (gameState.superMagnetTimer > 0) gameState.superMagnetTimer--;

    if (!gameState.gameOver && !gameState.paused && !gameState.transitioning) {
        const baseInterval = (typeof getPowerUpSpawnInterval === 'function') ? getPowerUpSpawnInterval() : 15;
        if (!gameState.powerUpCountdown) gameState.powerUpCountdown = baseInterval;
        gameState.powerUpCountdown -= 1 / 60;
        if (gameState.powerUpCountdown <= 0) {
            autoSpawnPowerUp();
            gameState.powerUpCountdown = baseInterval + Math.random() * 4;
        }
    }

    // Lavanın yenilənməsi (Qızıl Qızdırması zamanı 20% sürətlənmə)
    if (gameState.activeModifier === 'goldrush') {
        monster.speed = monster.baseSpeed * 1.20;
    }
    monster.update();

    // Mərmilərin yenilənməsi və lavaya dəyməsi
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update();

        const monsterTop = monster.surface ? monster.surface(b.x, monster.y) : monster.y;
        if (b.y >= monsterTop - 12) {
            if (monster.flash !== undefined) monster.flash = 0.1;
            audio.playImpact();
            gameState.totalTrapsDestroyed++;

            const scores = { wall: 1, ice: 2, shock: 3, mine: 4, plasma: 5 };
            const baseTrapScore = scores[b.type] || 1;
            const trapMult = gameState.combo >= 5 ? 2.0 : (gameState.combo >= 3 ? 1.5 : 1.0);
            const trapScore = Math.round(baseTrapScore * trapMult);
            gameState.scoreProgress += trapScore;
            checkBorderUnlock();

            const rewards = { wall: 6, ice: 10, shock: 14, mine: 22, plasma: 32 };
            const reward = Math.round((rewards[b.type] || 6) * trapMult);
            gameState.gold += reward;
            showGoldToast(reward);

            if (b.type === 'mine') {
                addFloatingText(b.x, monster.y - 25, '💥 MONSTER CRUSH!', '#f43f5e', 16);
            } else if (b.type === 'shock') {
                addFloatingText(b.x, monster.y - 25, '⚡ SHOCK PARALYSIS!', '#c084fc', 15);
            }

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
    for (let idx = particles.length - 1; idx >= 0; idx--) {
        const p = particles[idx];
        p.update();
        if (p.alpha <= 0) particles.splice(idx, 1);
    }

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

    // 🛡️ / 🚀 Lavanın Təhlükəsi, Kvant Sıçrayışı və Qalxan İerarxiyası
    const playerMonsterY = monster.surface ? monster.surface(player.x, monster.y) : monster.y;
    const distToLava = playerMonsterY - (player.y + player.radius);

    if (!gameState.transitioning && gameState.dashInvulnerable <= 0) {
        // 1. İLK ÖNCƏ: Lavaya toxunmağa az qalmış (<= 2px) Kvant Sıçrayışı dərhal aktivləşir və bizi yuxarı atır!
        if (distToLava <= 2 && player.hasHyperJump) {
            player.hyperJump();
            // Qalxan toxunulmaz qalır və sonrakı təhlükə üçün saxlanılır!
            if (typeof saveActiveRun === 'function') saveActiveRun();
        } else if (distToLava <= 0) {
            // 2. Əgər sıçrayış yoxdursa və lavaya toxunsaq, bu dəfə bizi QALXAN qoruyur!
            if (player.hasShield) {
                player.breakShield();
                if (typeof saveActiveRun === 'function') saveActiveRun();
            } else {
                triggerGameOver();
            }
        }
    }

    // Sərhəd açıq deyilsə passiv qızıl artımı
    if (frameCount % 30 === 0 && !gameState.borderOpen) {
        gameState.gold += 0.15 * (1 + gameState.combo * 0.05);
    }

    // Avtomatik yaddaşa qeyd
    if (frameCount % 20 === 0) {
        saveActiveRun();
    }
}

// 2. RENDERING ADDIMI (Canvas qrafikasının çəkilməsi)
function renderGame() {
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

    // ⚡ GÜCLƏNDİRİCİLƏR (POWER-UPS)
    powerUps.forEach(p => p.draw(ctx));

    player.draw();
    twinTurrets.draw();
    coins.forEach(c => c.draw());
    monster.draw();
    bullets.forEach(b => b.draw());
    particles.forEach(p => p.draw());

    // 🔥 MƏRHƏLƏ 5: UÇAN NEON MƏTNLƏR (FLOATING NEON TEXTS)
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.font = `900 ${ft.size}px Orbitron, sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 14;
        ctx.globalAlpha = ft.alpha;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });



    // ⚡ MƏRHƏLƏ 5: ANİ VƏ İTMƏSİ SÜRƏTLİ OLAN İMPULS PARILTISI (QALICI DEYİL, ANİ OLUB İTİR)
    if (screenPulse.alpha > 0.01) {
        ctx.save();
        const pGrad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.35, canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.65);
        pGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        pGrad.addColorStop(1, screenPulse.color);
        ctx.globalAlpha = screenPulse.alpha;
        ctx.fillStyle = pGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
        screenPulse.alpha *= 0.85; // Bir neçə kadrda (0.2s) sürətlə sönür və tamamilə yox olur!
    }

    // 🌀 MƏRHƏLƏ 4: AKTİV ANOMALİYA BANNERİ
    if (gameState.activeModifier && gameState.activeModifier !== 'normal') {
        ctx.save();
        let badgeTxt = '';
        let badgeColor = '#00f0ff';
        if (gameState.activeModifier === 'gravity') {
            badgeTxt = '🪐 ANOMALİYA: AY QRAVİTASİYASI (SÜZÜLƏN HƏRƏKƏT)';
            badgeColor = '#c084fc';
        } else if (gameState.activeModifier === 'goldrush') {
            badgeTxt = '💰 ANOMALİYA: QIZIL QIZDIRMASI (SÜRƏTLİ LAVA & 2X QIZIL)';
            badgeColor = '#fbbf24';
        }

        ctx.font = 'bold 10px Orbitron, sans-serif';
        const tw = ctx.measureText(badgeTxt).width;
        const bw = tw + 24;
        const bx = (canvasWidth - bw) / 2;
        const by = 18;

        ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = badgeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(bx, by, bw, 20, 5);
        } else {
            ctx.rect(bx, by, bw, 20);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = badgeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeTxt, canvasWidth / 2, by + 10);
        ctx.restore();
    }
}

// 3. ƏSAS OYUN DÖVRÜ (FIXED TIMESTEP & THROTTLED GAME LOOP)
function gameLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!lastFrameTime) lastFrameTime = timestamp;

    let elapsed = timestamp - lastFrameTime;

    // 144Hz / 240Hz monitorlarda və ya tez çağırışlarda frame-throttling
    // (tolerans: 1.5ms vaxt dalğalanmasına görə)
    if (elapsed < frameInterval - 1.5) {
        requestAnimationFrame(gameLoop);
        return;
    }

    lastFrameTime = timestamp - (elapsed % frameInterval);

    // Kəskin gecikmə və ya tab dəyişmə zamanı sıçrayışın qarşısını almaq
    if (elapsed > 100) elapsed = 100;

    physicsAccumulator += elapsed;

    // Canlı FPS sayğacı
    fpsFramesCount++;
    if (timestamp - fpsLastTime >= 1000) {
        currentMeasuredFPS = Math.round((fpsFramesCount * 1000) / (timestamp - fpsLastTime));
        fpsFramesCount = 0;
        fpsLastTime = timestamp;
        const fpsBadge = document.getElementById('stat-fps');
        if (fpsBadge) {
            fpsBadge.innerText = `${currentMeasuredFPS} FPS`;
        }
    }

    if (!gameState.paused && !gameState.gameOver) {
        // Hər 16.666ms üçün dəqiq 1 sabit fizika addımı
        // Beləliklə, istər 60 FPS, istərsə də 30 FPS rejimində oyunun real sürəti 100% sabit qalır!
        let steps = 0;
        while (physicsAccumulator >= FIXED_PHYSICS_DELTA && steps < 5) {
            updatePhysicsStep();
            physicsAccumulator -= FIXED_PHYSICS_DELTA;
            steps++;
        }

        renderGame();
        updateUI();
    } else {
        physicsAccumulator = 0;
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
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
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
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    if (gameState.gameOver) return;
    gameState.paused = !gameState.paused;
    const pauseOverlay = document.getElementById('pause-overlay');
    if (gameState.paused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
    }
}

function pauseGame() {
    if (gameState.gameOver || gameState.paused) return;
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    gameState.paused = true;
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('hidden');
    }
}

// ⏸️ BRAUZERDƏ TAB DƏYİŞDİKDƏ VƏ YA PƏNCƏRƏ AŞAĞI SALINDIQDA (BLUR) AVTOMATİK FASİLƏ
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGame();
    } else {
        lastFrameTime = performance.now();
        physicsAccumulator = 0;
    }
});

window.addEventListener('blur', () => {
    pauseGame();
});

window.addEventListener('focus', () => {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
});

function toggleAudio() {
    if (typeof audio !== 'undefined' && typeof audio.openSettings === 'function') {
        audio.openSettings();
    } else if (typeof audio !== 'undefined') {
        audio.init();
        audio.muted = !audio.muted;
        const btn = document.getElementById('btn-sound');
        if (btn) btn.innerHTML = audio.muted ? `<i class="fa-solid fa-volume-xmark text-sm text-rose-400"></i>` : `<i class="fa-solid fa-volume-high text-sm"></i>`;
    }
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
adjustViewportFit();

player.reset();
monster.reset();
twinTurrets.reset();
applyFloorModifier();

const hasLoadedRun = loadActiveRun();

document.getElementById('stat-best-floor').innerText = `🏆 REKORD: ${gameState.bestFloor}`;
gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
renderKeybindBadges();
updatePermUpgradesUI();
updateTurretsUI();
updateUI();

if (gameState.activeModifier === 'darkness') {
    gameState.activeModifier = 'normal';
}

if (hasLoadedRun) {
    showToast(`🔄 Oyun ${gameState.floor}-ci Qatdan davam edir! (Vəziyyət tam saxlanıldı)`, 'success');
} else {
    // Yalnız YENİ OYUNDA sikkələr və gücləndiricilər sıfırdan yaradılır
    spawnCoins();
    spawnPowerUps();
    if (typeof getShieldStartChance === 'function' && Math.random() < getShieldStartChance()) {
        player.hasShield = true;
        showToast('🛡️ LABORATORİYA BONUSU: AEGIS QALXANI AKTİVDİR!', 'success');
    }
}

// Oyun birbaşa başlayır
gameState.paused = false;
if (window.audio) {
    audio.init();
    audio.setFloor(gameState.floor, true);
}
const gameScreenContainer = document.getElementById('game-screen-container');
if (gameScreenContainer) {
    gameScreenContainer.classList.remove('hidden');
}
adjustViewportFit();

requestAnimationFrame(gameLoop);


// Pəncərə aktivliyi dəyişəndə vaxt sıçrayışının qarşısını almaq
document.addEventListener('visibilitychange', () => {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
});
