// ƏSAS İSTİFADƏÇİ İNTERFEYSİ (UI) VƏ EKRAN TƏNZİMLƏNMƏSİ KOORDİNATORU

function updateUI() {
    const goldEl = document.getElementById('stat-gold');
    if (goldEl) goldEl.innerText = Math.floor(gameState.gold);

    const diamondsEl = document.getElementById('stat-diamonds');
    if (diamondsEl) diamondsEl.innerText = diamonds;
    
    // Qırmızı Almaz Sayı
    const redDiamEls = document.querySelectorAll('.stat-red-diamonds');
    redDiamEls.forEach(el => el.innerText = redDiamonds);

    // Kiber Ulduz Sayı
    const cyberStarsEl = document.getElementById('stat-cyber-stars');
    if (cyberStarsEl) {
        const count = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 5;
        cyberStarsEl.innerText = count;
        if (count === 0) {
            cyberStarsEl.className = 'font-orbitron text-rose-400 font-bold text-sm sm:text-base tabular-nums animate-pulse';
        } else {
            cyberStarsEl.className = 'font-orbitron text-cyan-300 font-bold text-sm sm:text-base tabular-nums';
        }
    }

    const headerDiamonds = document.getElementById('stat-header-diamonds');
    if (headerDiamonds) headerDiamonds.innerText = `${diamonds} 💎`;

    const floorEl = document.getElementById('stat-floor');
    if (floorEl) floorEl.innerText = gameState.floor;

    const comboEl = document.getElementById('stat-combo');
    if (comboEl) {
        const comboMult = gameState.combo >= 10 ? '3.0x 🔥' : (gameState.combo >= 5 ? '2.0x ⚡' : (gameState.combo >= 3 ? '1.5x' : '1.0x'));
        comboEl.innerHTML = `${gameState.combo} <span class="text-[10px] text-amber-400 font-normal">(${comboMult})</span>`;
    }

    // Oyundaxili gücləndirmə kartlarında real yekun səviyyələr
    const lvlSpeedEl = document.getElementById('lvl-speed');
    if (lvlSpeedEl) {
        const totalSpeedLvl = permUpgrades.speedLvl + gameState.inGameSpeedLvl;
        const currentSpeedVal = (getBaseSpeed() + gameState.inGameSpeedLvl * 0.5).toFixed(1);
        lvlSpeedEl.innerText = `Lv.${totalSpeedLvl} (${currentSpeedVal})`;
    }

    const lvlMagnetEl = document.getElementById('lvl-magnet');
    if (lvlMagnetEl) {
        const totalMagnetLvl = permUpgrades.magnetLvl + gameState.inGameMagnetLvl;
        const currentMagnetVal = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
        lvlMagnetEl.innerText = `Lv.${totalMagnetLvl} (${currentMagnetVal}px)`;
    }

    const dashTxt = document.getElementById('stat-dash-status');
    if (dashTxt) {
        if (gameState.dashCooldown <= 0) {
            dashTxt.innerText = 'HAZIR';
            dashTxt.className = 'font-orbitron font-bold text-xs text-emerald-400';
        } else {
            dashTxt.innerText = `${gameState.dashCooldown.toFixed(1)}s`;
            dashTxt.className = 'font-orbitron font-bold text-xs text-amber-400';
        }
    }

    const borderText = document.getElementById('border-status-text');
    const borderDot = document.getElementById('border-icon-dot');
    if (borderText && borderDot) {
        if (gameState.borderOpen) {
            borderText.innerHTML = '<span class="text-emerald-300 font-bold tracking-wider">SƏRHƏD AÇIQDIR</span>';
            borderDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse';
        } else {
            borderText.innerHTML = `<span class="text-slate-300 tracking-wider">SƏRHƏD BAĞLIDIR</span> <span class="text-rose-400 font-semibold text-[11px]">(${gameState.scoreProgress}/${gameState.scoreReq})</span>`;
            borderDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse';
        }
    }

    const floorTimerEl = document.getElementById('floor-timer');
    if (floorTimerEl) floorTimerEl.innerText = `⏱ ${Math.floor(gameState.floorTime)}s`;

    const countdownEl = document.getElementById('coin-countdown-timer');
    if (countdownEl) {
        if (gameState.borderOpen) {
            countdownEl.innerText = 'DAYANDI';
        } else {
            countdownEl.innerText = `${Math.max(0, gameState.coinCountdown).toFixed(1)}s`;
        }
    }

    // Sol panel: Mərmi kartlarında dinamik qiymətlərin yenilənməsi
    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(t => {
        const priceEl = document.getElementById(`price-bullet-${t}`);
        if (priceEl) {
            const cost = getBulletCost(t);
            const usage = (gameState.bulletUsage && gameState.bulletUsage[t]) || 0;
            priceEl.innerHTML = `${cost} 🪙 ${usage > 0 ? `<span class="text-[9px] text-amber-300 font-normal">(${usage}x)</span>` : ''}`;
        }
    });

    // Əkiz Qüllələr Paneli Yenilənməsi
    if (typeof updateTurretsUI === 'function') {
        updateTurretsUI();
    }
}

// BÜTÜN MONİTORLAR ÜÇÜN RESPONSİV AVTO-SCALE VƏ BOŞLUQLAR
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

window.updateUI = updateUI;
window.adjustViewportFit = adjustViewportFit;
window.addEventListener('resize', adjustViewportFit);
window.addEventListener('load', adjustViewportFit);
