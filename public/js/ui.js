// ƏSAS İSTİFADƏÇİ İNTERFEYSİ (UI) VƏ EKRAN TƏNZİMLƏNMƏSİ KOORDİNATORU

let _lastUIUpdateTime = 0;
let _lastUICache = {};

function updateUI(force = false) {
    const now = performance.now();
    // DOM reflow yükünü sıfırlamaq üçün hər kadrda deyil, maksimum 100ms-dən bir yenilənir
    if (!force && (now - _lastUIUpdateTime < 85)) {
        return;
    }
    _lastUIUpdateTime = now;

    const goldVal = Math.floor(gameState.gold);
    if (_lastUICache.gold !== goldVal) {
        _lastUICache.gold = goldVal;
        const goldEl = document.getElementById('stat-gold');
        if (goldEl) goldEl.innerText = goldVal;
    }

    if (_lastUICache.diamonds !== diamonds) {
        _lastUICache.diamonds = diamonds;
        const diamondsEl = document.getElementById('stat-diamonds');
        if (diamondsEl) diamondsEl.innerText = diamonds;
        const headerDiamonds = document.getElementById('stat-header-diamonds');
        if (headerDiamonds) headerDiamonds.innerText = `${diamonds} 💎`;
    }
    
    // Qırmızı Almaz Sayı
    if (_lastUICache.redDiamonds !== redDiamonds) {
        _lastUICache.redDiamonds = redDiamonds;
        const redDiamEls = document.querySelectorAll('.stat-red-diamonds');
        redDiamEls.forEach(el => el.innerText = redDiamonds);
    }

    // Kiber Ulduz Sayı
    const count = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 5;
    if (_lastUICache.cyberStars !== count) {
        _lastUICache.cyberStars = count;
        const cyberStarsEl = document.getElementById('stat-cyber-stars');
        if (cyberStarsEl) {
            cyberStarsEl.innerText = count;
            if (count === 0) {
                cyberStarsEl.className = 'font-orbitron text-rose-400 font-bold text-sm sm:text-base tabular-nums animate-pulse';
            } else {
                cyberStarsEl.className = 'font-orbitron text-cyan-300 font-bold text-sm sm:text-base tabular-nums';
            }
        }
    }

    if (_lastUICache.floor !== gameState.floor) {
        _lastUICache.floor = gameState.floor;
        const floorEl = document.getElementById('stat-floor');
        if (floorEl) floorEl.innerText = gameState.floor;
    }

    // 🛡️ Qat Qoruması Sayğacı (HUD Badge)
    const fpCount = (typeof gameState !== 'undefined' && gameState.floorProtection) ? gameState.floorProtection : 0;
    const fpBadge = document.getElementById('stat-floor-protection-badge');
    const fpCountEl = document.getElementById('stat-floor-protection-count');
    if (fpBadge) {
        if (fpCount > 0) {
            fpBadge.classList.remove('hidden');
            if (fpCountEl) fpCountEl.innerText = fpCount;
        } else {
            fpBadge.classList.add('hidden');
        }
    }

    // ❤️ MONSUN CANI (HP) HUD YENİLƏNMƏSİ
    const curHp = (typeof player !== 'undefined' && player && player.hp !== undefined) ? player.hp : 3;
    const maxHp = (typeof player !== 'undefined' && player && player.maxHp !== undefined) ? player.maxHp : 3;
    if (_lastUICache.hp !== curHp || _lastUICache.maxHp !== maxHp) {
        _lastUICache.hp = curHp;
        _lastUICache.maxHp = maxHp;
        const hpContainer = document.getElementById('stat-hp-hearts');
        const hpText = document.getElementById('stat-hp-text');
        if (hpText) hpText.innerText = `${curHp}/${maxHp}`;
        if (hpContainer) {
            let hHtml = '';
            for (let i = 0; i < maxHp; i++) {
                if (i < curHp) {
                    hHtml += '<i class="fa-solid fa-heart text-rose-500 text-xs sm:text-sm animate-pulse"></i>';
                } else {
                    hHtml += '<i class="fa-solid fa-heart text-slate-700/80 text-xs sm:text-sm"></i>';
                }
            }
            hpContainer.innerHTML = hHtml;
        }
    }


    const comboKey = `${gameState.combo}`;
    if (_lastUICache.combo !== comboKey) {
        _lastUICache.combo = comboKey;
        const comboEl = document.getElementById('stat-combo');
        if (comboEl) {
            const comboMult = gameState.combo >= 10 ? '3.0x 🔥' : (gameState.combo >= 5 ? '2.0x ⚡' : (gameState.combo >= 3 ? '1.5x' : '1.0x'));
            comboEl.innerHTML = `${gameState.combo} <span class="text-[10px] text-amber-400 font-normal">(${comboMult})</span>`;
        }
    }

    // Oyundaxili gücləndirmə kartlarında real yekun səviyyələr
    const lvlSpeedEl = document.getElementById('lvl-speed');
    if (lvlSpeedEl) {
        const totalSpeedLvl = (permUpgrades.speedLvl || 0) + (gameState.inGameSpeedLvl || 0);
        const currentSpeedVal = (getBaseSpeed() + (gameState.inGameSpeedLvl || 0) * 0.5).toFixed(1);
        lvlSpeedEl.innerText = `Lv.${totalSpeedLvl} (${currentSpeedVal})`;
    }

    const lvlMagnetEl = document.getElementById('lvl-magnet');
    if (lvlMagnetEl) {
        const totalMagnetLvl = (permUpgrades.magnetLvl || 0) + (gameState.inGameMagnetLvl || 0);
        const currentMagnetVal = getBaseMagnetRadius() + (gameState.inGameMagnetLvl || 0) * 25;
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
    const gpuZ = (typeof window !== 'undefined' && window.GRAPHICS_QUALITY !== 'low') ? ' translateZ(0)' : '';
    gameScreen.style.transform = `translate(-50%, -50%) scale(${scale})${gpuZ}`;
    gameScreen.style.willChange = 'transform';
}

window.updateUI = updateUI;
window.updateHpUI = function() {
    _lastUICache.hp = -1;
    updateUI(true);
};
window.adjustViewportFit = adjustViewportFit;
window.addEventListener('resize', adjustViewportFit);
window.addEventListener('load', adjustViewportFit);

