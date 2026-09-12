// OBYEKT VƏ MÜKAFAT YARADICISI (SPAWNER & FLOOR PROGRESSION)

let coins = [];
let powerUps = [];
let floatingTexts = [];
let screenPulse = { color: '#00f0ff', alpha: 0 };
let particles = [];
let hasPassedBorder = false;

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

function triggerScreenPulse(color = '#00f0ff', maxAlpha = 0.35) {
    screenPulse.color = color;
    screenPulse.alpha = maxAlpha;
}

function spawnCoins() {
    coins = [];
    const canvasWidth = 800;
    const canvasHeight = 680;
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

    const canvasWidth = 800;
    const canvasHeight = 680;
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
    const canvasWidth = 800;
    const canvasHeight = 680;
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
    const canvasWidth = 800;
    const canvasHeight = 680;
    if (typeof PowerUp !== 'undefined') {
        powerUps.push(new PowerUp(
            Math.random() * (canvasWidth - 100) + 50,
            Math.random() * (canvasHeight - 300) + 80
        ));
    }
}

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

function checkBorderUnlock() {
    const req = gameState.getFloorRequirement(gameState.floor);
    if (!gameState.borderOpen && gameState.scoreProgress >= req) {
        gameState.borderOpen = true;
        if (typeof audio !== 'undefined' && audio.playDoorOpen) audio.playDoorOpen();
        if (typeof showToast === 'function') {
            showToast(`🚪 SƏRHƏD AÇILDI! Qızıl dayandı, dərhal növbəti qata qalx!`, 'success');
        }

        const canvasWidth = 800;
        for (let i = 0; i < 35; i++) {
            particles.push(new Particle(
                canvasWidth / 2 + (Math.random() - 0.5) * 250,
                45 + Math.random() * 20,
                ['#00ff66', '#ffd700', '#00ffcc', '#ff00ff'],
                5
            ));
        }
        if (typeof saveActiveRun === 'function') saveActiveRun();
    }
}

function nextFloor() {
    gameState.floor++;
    if (window.audio && typeof audio.setFloor === 'function') {
        audio.setFloor(gameState.floor, true);
    }
    const trackNames = ['Neon Retrowave (80s Synthwave)', 'Chiptune Arcade (8-Bit NES)', 'Acid Cyber Techno (TB-303)', 'Magma Doom Slayer (Darksynth)', 'Hyperion Trance (Euro-Trance)'];
    const trackName = trackNames[(gameState.floor - 1) % trackNames.length];
    if (typeof showToast === 'function') {
        showToast(`🎵 Qat ${gameState.floor}: ${trackName}`, 'info');
    }

    gameState.transitioning = true;
    keys = {};

    diamonds += 1;
    savePermanentData();
    if (typeof audio !== 'undefined' && audio.playDiamond) audio.playDiamond();

    if (gameState.floor > gameState.bestFloor) {
        gameState.bestFloor = gameState.floor;
        localStorage.setItem('floor_escape_best_floor', gameState.bestFloor.toString());
        const bestEl = document.getElementById('stat-best-floor');
        if (bestEl) bestEl.innerText = `🏆 REKORD: ${gameState.bestFloor}`;
    }

    gameState.scoreProgress = 0;
    gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
    gameState.borderOpen = false;
    gameState.combo = 0;
    gameState.floorTime = 0;
    gameState.coinCountdown = getCoinSpawnInterval();
    hasPassedBorder = false;

    if (typeof window.clearBullets === 'function') window.clearBullets();
    coins = [];
    if (typeof particles !== 'undefined') particles.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    if (typeof screenPulse !== 'undefined') screenPulse.alpha = 0;
    if (typeof player !== 'undefined' && player.reset) player.reset(false);
    if (typeof monster !== 'undefined' && monster.reset) monster.reset();
    if (typeof twinTurrets !== 'undefined' && twinTurrets.reset) twinTurrets.reset();

    applyFloorModifier();
    spawnCoins();
    spawnPowerUps();

    // QATA QALXANLA BAŞLAMA ŞANSI
    if (typeof getShieldStartChance === 'function' && Math.random() < getShieldStartChance()) {
        if (typeof player !== 'undefined') player.hasShield = true;
        if (typeof showToast === 'function') {
            showToast('🛡️ LABORATORİYA BONUSU: AEGIS QALXANI AKTİVDİR!', 'success');
        }
    }

    // 10-cu QAT SANDIQ YOXLANIŞI
    if (typeof checkMilestoneChest === 'function') {
        checkMilestoneChest(gameState.floor);
    }

    let modTxt = '';
    if (gameState.activeModifier === 'gravity') modTxt = ' [🪐 AY QRAVİTASİYASI]';
    else if (gameState.activeModifier === 'goldrush') modTxt = ' [💰 QIZIL QIZDIRMASI]';

    const overlay = document.getElementById('floor-clear-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (typeof showToast === 'function') {
        showToast(`🎉 ${gameState.floor}-ci Qat! (+1 💎 Almaz)${modTxt}`, 'diamond');
    }
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveActiveRun === 'function') saveActiveRun();

    // Növbəti qatda Mons yeni teleportasiya animasiyası ilə zəmindən çıxır (Teleport In)
    if (typeof playSummonIntro === 'function') {
        playSummonIntro(() => {
            gameState.transitioning = false;
            keys = {};
            if (typeof saveActiveRun === 'function') saveActiveRun();
        });
    } else {
        gameState.transitioning = false;
        keys = {};
    }
}

window.coins = coins;
window.powerUps = powerUps;
window.floatingTexts = floatingTexts;
window.screenPulse = screenPulse;
window.particles = particles;
window.hasPassedBorder = hasPassedBorder;
window.addFloatingText = addFloatingText;
window.triggerScreenPulse = triggerScreenPulse;
window.spawnCoins = spawnCoins;
window.autoSpawnCoin = autoSpawnCoin;
window.spawnPowerUps = spawnPowerUps;
window.autoSpawnPowerUp = autoSpawnPowerUp;
window.applyFloorModifier = applyFloorModifier;
window.checkBorderUnlock = checkBorderUnlock;
window.nextFloor = nextFloor;
