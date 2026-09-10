// İSTİFADƏÇİ İNTERFEYSİ (UI), MAĞAZA, LABORATORİYA VƏ SANDIQ MODULU

function showGoldToast(amount) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'gold-toast-badge flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full shadow-lg';
    el.innerHTML = `
        <span class="gold-coin-anim text-base">🪙</span>
        <span class="font-orbitron font-extrabold text-amber-300 text-sm tracking-wider tabular-nums">+${amount}</span>
    `;
    container.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
}

function showToast(text, type = 'info') {
    if (type === 'gold') {
        const match = text.match(/\+?(\d+)/);
        if (match) {
            showGoldToast(match[1]);
            return;
        }
    }

    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    const bgColors = {
        gold: 'bg-gradient-to-r from-amber-500/90 to-yellow-600/90 text-slate-950 border border-amber-300/40 shadow-amber-500/30',
        diamond: 'bg-gradient-to-r from-sky-500/90 to-blue-600/90 text-white border border-sky-300/40 shadow-sky-500/30',
        redDiamond: 'bg-gradient-to-r from-rose-500/90 to-red-600/90 text-white border border-rose-300/40 shadow-rose-500/30',
        success: 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white border border-emerald-300/40 shadow-emerald-500/30',
        error: 'bg-gradient-to-r from-rose-600/90 to-red-700/90 text-white border border-red-400/40 shadow-red-500/30',
        info: 'bg-gradient-to-r from-slate-800/95 to-slate-900/95 text-slate-200 border border-slate-700 shadow-slate-900/50'
    };

    el.className = `toast-msg px-4 py-2 rounded-xl text-xs font-orbitron font-bold shadow-lg flex items-center gap-2 backdrop-blur-md ${bgColors[type] || bgColors.info}`;
    el.innerHTML = text;

    container.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
}

function updateUI() {
    document.getElementById('stat-gold').innerText = Math.floor(gameState.gold);
    document.getElementById('stat-diamonds').innerText = diamonds;
    
    // Qırmızı Almaz Sayı
    const redDiamEls = document.querySelectorAll('.stat-red-diamonds');
    redDiamEls.forEach(el => el.innerText = redDiamonds);

    const headerDiamonds = document.getElementById('stat-header-diamonds');
    if (headerDiamonds) headerDiamonds.innerText = `${diamonds} 💎`;

    document.getElementById('stat-floor').innerText = gameState.floor;
    document.getElementById('stat-req-txt').innerText = `${gameState.scoreProgress}/${gameState.scoreReq}`;
    document.getElementById('stat-combo').innerText = gameState.combo;

    // Oyundaxili gücləndirmə kartlarında real yekun səviyyələr
    const totalSpeedLvl = permUpgrades.speedLvl + gameState.inGameSpeedLvl;
    const currentSpeedVal = (getBaseSpeed() + gameState.inGameSpeedLvl * 0.5).toFixed(1);
    document.getElementById('lvl-speed').innerText = `Lv.${totalSpeedLvl} (${currentSpeedVal})`;

    const totalMagnetLvl = permUpgrades.magnetLvl + gameState.inGameMagnetLvl;
    const currentMagnetVal = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
    document.getElementById('lvl-magnet').innerText = `Lv.${totalMagnetLvl} (${currentMagnetVal}px)`;

    const dashTxt = document.getElementById('stat-dash-status');
    if (gameState.dashCooldown <= 0) {
        dashTxt.innerText = 'HAZIR';
        dashTxt.className = 'font-orbitron font-bold text-xs text-emerald-400';
    } else {
        dashTxt.innerText = `${gameState.dashCooldown.toFixed(1)}s`;
        dashTxt.className = 'font-orbitron font-bold text-xs text-amber-400';
    }

    const borderText = document.getElementById('border-status-text');
    const borderDot = document.getElementById('border-icon-dot');
    if (gameState.borderOpen) {
        borderText.innerText = '🌟 SƏRHƏD AÇIQ!';
        borderText.className = 'font-orbitron text-xs text-emerald-400 font-bold tracking-wider';
        borderDot.className = 'w-3 h-3 rounded-full bg-emerald-400 animate-ping';
    } else {
        borderText.innerText = `🔒 ${gameState.scoreProgress}/${gameState.scoreReq}`;
        borderText.className = 'font-orbitron text-xs text-slate-300 tracking-wider';
        borderDot.className = 'w-3 h-3 rounded-full bg-rose-500 animate-pulse';
    }

    document.getElementById('floor-timer').innerText = `⏱ ${Math.floor(gameState.floorTime)}s`;
    if (gameState.borderOpen) {
        document.getElementById('coin-countdown-timer').innerText = 'DAYANDI';
    } else {
        document.getElementById('coin-countdown-timer').innerText = `${Math.max(0, gameState.coinCountdown).toFixed(1)}s`;
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
    updateTurretsUI();
}

let currentLabTab = 'base'; // 'base' | 'econ'

function switchLabTab(tab) {
    currentLabTab = tab;
    const btnBase = document.getElementById('lab-tab-btn-base');
    const btnEcon = document.getElementById('lab-tab-btn-econ');
    const btnTurrets = document.getElementById('lab-tab-btn-turrets');
    const contentBase = document.getElementById('lab-tab-content-base');
    const contentEcon = document.getElementById('lab-tab-content-econ');
    const contentTurrets = document.getElementById('lab-tab-content-turrets');

    if (btnBase) btnBase.className = 'px-4 py-1.5 text-xs font-orbitron font-bold border-b-2 ' + (tab === 'base' ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-400 hover:text-sky-300') + ' flex items-center gap-1.5 transition';
    if (btnEcon) btnEcon.className = 'px-4 py-1.5 text-xs font-orbitron font-bold border-b-2 ' + (tab === 'econ' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-rose-300') + ' flex items-center gap-1.5 transition';
    if (btnTurrets) btnTurrets.className = 'px-4 py-1.5 text-xs font-orbitron font-bold border-b-2 ' + (tab === 'turrets' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-cyan-300') + ' flex items-center gap-1.5 transition';

    if (contentBase) contentBase.classList.toggle('hidden', tab !== 'base');
    if (contentEcon) contentEcon.classList.toggle('hidden', tab !== 'econ');
    if (contentTurrets) contentTurrets.classList.toggle('hidden', tab !== 'turrets');
}

function updatePermUpgradesUI() {
    // 1. BAZA XASSƏLƏR (Mavi Almaz)
    const list = [
        { type: 'speed', lvl: permUpgrades.speedLvl, max: MAX_PERM_LVL, bonus: `+0.35 Sürət` },
        { type: 'magnet', lvl: permUpgrades.magnetLvl, max: MAX_PERM_LVL, bonus: `+15px Sahə` },
        { type: 'coinVal', lvl: permUpgrades.coinValLvl, max: MAX_PERM_LVL, bonus: `+3 Qızıl` },
        { type: 'coinRate', lvl: permUpgrades.coinRateLvl, max: MAX_PERM_LVL, bonus: `-0.3s Vaxt` }
    ];

    list.forEach(item => {
        const lvlEl = document.getElementById(`lab-lvl-${item.type}`);
        const costEl = document.getElementById(`lab-cost-${item.type}`);
        const btn = document.getElementById(`lab-btn-${item.type}`);

        if (lvlEl) lvlEl.innerText = `Lv.${item.lvl}`;

        if (item.lvl >= item.max) {
            if (costEl) costEl.innerText = 'MAKS';
            if (btn) btn.classList.add('disabled');
        } else {
            const cost = item.lvl; // 1->1, 2->2, ..., 9->9
            if (costEl) costEl.innerText = `${cost} 💎`;
            if (btn) {
                if (diamonds >= cost) btn.classList.remove('disabled');
                else btn.classList.add('disabled');
            }
        }
    });

    const labDiamonds = document.getElementById('lab-diamonds-count');
    if (labDiamonds) labDiamonds.innerText = diamonds;

    // 2. MƏRMİ QƏNAƏTİ / İNFİYASİYA AZALTMASI (Qırmızı Almaz)
    const labRedDiamonds = document.getElementById('lab-red-diamonds-count');
    if (labRedDiamonds) labRedDiamonds.innerText = redDiamonds;

    const econBullets = [
        { type: 'wall', name: 'Barrikada Divarı', base: 30 },
        { type: 'ice', name: 'Buz Mərmisi', base: 50 },
        { type: 'shock', name: 'Şok İldırımı', base: 90 },
        { type: 'mine', name: 'Partlayıcı Mina', base: 140 },
        { type: 'plasma', name: 'Plazma Əridici', base: 190 }
    ];

    econBullets.forEach(item => {
        const key = `bullet${item.type.charAt(0).toUpperCase() + item.type.slice(1)}EconLvl`;
        const lvl = permUpgrades[key] || 0;
        const lvlEl = document.getElementById(`lab-lvl-econ-${item.type}`);
        const pctEl = document.getElementById(`lab-pct-econ-${item.type}`);
        const costEl = document.getElementById(`lab-cost-econ-${item.type}`);
        const btn = document.getElementById(`lab-btn-econ-${item.type}`);

        if (lvlEl) lvlEl.innerText = `Lv.${lvl}/${MAX_ECON_LVL}`;
        const pct = lvl * 20;
        if (pctEl) {
            pctEl.innerText = lvl === MAX_ECON_LVL ? `100% Qənaət (Sabit ${item.base}🪙)` : `-${pct}% Qiymət Artımı`;
        }

        if (lvl >= MAX_ECON_LVL) {
            if (costEl) costEl.innerText = 'MAKS';
            if (btn) btn.classList.add('disabled');
        } else {
            const costs = BULLET_ECON_COSTS[item.type] || [3, 6, 10, 15, 25];
            const cost = costs[lvl];
            if (costEl) costEl.innerText = `${cost} 💎🔴`;
            if (btn) {
                if (redDiamonds >= cost) btn.classList.remove('disabled');
                else btn.classList.add('disabled');
            }
        }
    });
}

function buyBulletEconUpgrade(type) {
    if (typeof isDashboardActive !== 'undefined' && !isDashboardActive && !gameState.gameOver) {
        showToast('Laboratoriyadan təkmilləşdirmə Daşbordda və ya Oyun Bitdikdə mümkündür!', 'info');
        return;
    }
    audio.init();
    const key = `bullet${type.charAt(0).toUpperCase() + type.slice(1)}EconLvl`;
    const currentLvl = permUpgrades[key] || 0;
    if (currentLvl >= MAX_ECON_LVL) {
        showToast('Bu mərmi artıq maksimal qənaət səviyyəsindədir!', 'info');
        return;
    }
    const costs = BULLET_ECON_COSTS[type] || [3, 6, 10, 15, 25];
    const cost = costs[currentLvl];

    if (redDiamonds >= cost) {
        redDiamonds -= cost;
        permUpgrades[key] = currentLvl + 1;
        savePermanentData();
        audio.playChest();
        showToast(`💎🔴 ${getTrapName(type)} Qənaəti Artırıldı! (Lv.${permUpgrades[key]} üçün -${cost} 💎🔴)`, 'redDiamond');
        updatePermUpgradesUI();
        updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Qırmızı Almaz Çatmır! (${cost} 💎🔴 tələb olunur)`, 'error');
    }
}

// Oyundaxili müvəqqəti təkmilləşdirmə
function buyUpgrade(type) {
    if (gameState.gameOver || gameState.paused || gameState.transitioning) return;
    audio.init();

    if (type === 'speed') {
        const price = 50 + gameState.inGameSpeedLvl * 35;
        if (gameState.gold >= price) {
            gameState.gold -= price;
            gameState.inGameSpeedLvl++;
            player.speed = getBaseSpeed() + gameState.inGameSpeedLvl * 0.5;
            audio.playShoot();
            showToast(`🚀 Sürət Artırıldı! (Səviyyə: ${permUpgrades.speedLvl + gameState.inGameSpeedLvl})`, 'success');
            document.getElementById('price-upgrade-speed').innerText = `${50 + gameState.inGameSpeedLvl * 35} 🪙`;
            updateUI();
            saveActiveRun();
        } else {
            showToast('Qızıl Çatmır!', 'error');
        }
    } else if (type === 'magnet') {
        const price = 80 + gameState.inGameMagnetLvl * 45;
        if (gameState.gold >= price) {
            gameState.gold -= price;
            gameState.inGameMagnetLvl++;
            gameState.magnetRadius = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
            audio.playShoot();
            showToast(`🧲 Maqnit Genişləndi! (${gameState.magnetRadius}px)`, 'success');
            document.getElementById('price-upgrade-magnet').innerText = `${80 + gameState.inGameMagnetLvl * 45} 🪙`;
            updateUI();
            saveActiveRun();
        } else {
            showToast('Qızıl Çatmır!', 'error');
        }
    }
}

// Qalıcı laboratoriya təkmilləşdirməsi (Mavi Almazla)
function buyPermUpgrade(type) {
    if (typeof isDashboardActive !== 'undefined' && !isDashboardActive && !gameState.gameOver) {
        showToast('Laboratoriyadan təkmilləşdirmə Daşbordda və ya Oyun Bitdikdə mümkündür!', 'info');
        return;
    }

    audio.init();
    let key = type === 'speed' ? 'speedLvl' : type === 'magnet' ? 'magnetLvl' : type === 'coinVal' ? 'coinValLvl' : 'coinRateLvl';
    let currentLvl = permUpgrades[key];

    if (currentLvl >= MAX_PERM_LVL) {
        showToast('Bu təkmilləşdirmə artıq maksimal səviyyədədir (Lv.10)!', 'info');
        return;
    }

    const cost = currentLvl; // Level dəyərində almaz

    if (diamonds >= cost) {
        diamonds -= cost;
        permUpgrades[key]++;

        savePermanentData();
        audio.playDiamond();
        showToast(`💎 Qalıcı Yüksəltmə Alındı! (Lv.${permUpgrades[key]} üçün -${cost} 💎)`, 'success');

        player.speed = getBaseSpeed();
        gameState.magnetRadius = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
        updatePermUpgradesUI();
        updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Almaz Çatmır! (${cost} 💎 tələb olunur)`, 'error');
    }
}

// ƏKİZ SİLAHLARIN ALINMASI VƏ İDARƏEDİLMƏSİ (50 Qırmızı Almaz)
function buyTwinTurrets() {
    audio.init();
    if (permUpgrades.hasTwinTurrets) {
        showToast('Əkiz Qüllələr artıq alınıb və aktivdir!', 'info');
        return;
    }

    if (redDiamonds >= 50) {
        redDiamonds -= 50;
        permUpgrades.hasTwinTurrets = true;
        permUpgrades.turretEnabled = true;
        savePermanentData();
        audio.playChest();
        showToast('🔥 ƏKİZ QÜLLƏLƏR ALINDI! Hər iki kənardan avtomatik atəş edəcək!', 'redDiamond');
        updateTurretsUI();
        updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Qırmızı Almaz Çatmır! (50 💎🔴 tələb olunur. Sizdə: ${redDiamonds})`, 'error');
    }
}

const TURRET_PRICES_DICT = {
    wall: 30,
    ice: 50,
    shock: 90,
    mine: 140,
    plasma: 190,
    none: 0
};

function setTurretSideBullet(side, type) {
    if (side === 'left') {
        permUpgrades.turretLeftType = type;
    } else {
        permUpgrades.turretRightType = type;
    }
    savePermanentData();
    updateTurretsUI();
    const cost = TURRET_PRICES_DICT[type] || 0;
    const name = type === 'none' ? 'Bağlı (0🪙)' : `${getTrapName(type)} (${cost}🪙)`;
    showToast(`🎯 ${side === 'left' ? 'Sol' : 'Sağ'} Qüllə: ${name}`, 'info');
}

function setTurretInterval(seconds) {
    permUpgrades.turretInterval = parseFloat(seconds) || 5;
    savePermanentData();
    updateTurretsUI();
    showToast(`⏱ Qüllə Atəş İntervalı: ${permUpgrades.turretInterval}s təyin edildi!`, 'info');
}

function toggleTurretEnabled(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    permUpgrades.turretEnabled = !permUpgrades.turretEnabled;
    savePermanentData();
    updateTurretsUI();
    if (typeof showToast === 'function') {
        showToast(
            permUpgrades.turretEnabled ? '⚡ Əkiz Qüllələr: AKTİV EDİLDİ' : '⛔ Əkiz Qüllələr: SÖNDÜRÜLDÜ',
            permUpgrades.turretEnabled ? 'success' : 'warning'
        );
    }
}
window.toggleTurretEnabled = toggleTurretEnabled;
window.toggleTurretActive = toggleTurretEnabled;

function getTrapName(type) {
    const names = {
        wall: 'Barrikada',
        ice: 'Buz',
        shock: 'Şok',
        mine: 'Mina',
        plasma: 'Plazma',
        none: 'Bağlı'
    };
    return names[type] || type;
}

function updateTurretsUI() {
    const buyBtn = document.getElementById('btn-buy-turrets');
    const settingsPanel = document.getElementById('turret-settings-panel');

    if (!buyBtn || !settingsPanel) return;

    if (permUpgrades.hasTwinTurrets) {
        buyBtn.classList.add('hidden');
        settingsPanel.classList.remove('hidden');

        // Sol qüllə düymələri
        const leftBtns = document.querySelectorAll('.turret-btn-left');
        leftBtns.forEach(btn => {
            const bType = btn.dataset.type;
            if (bType === permUpgrades.turretLeftType) {
                btn.className = 'turret-btn-left p-1 rounded text-[10px] font-orbitron font-bold border-2 border-emerald-400 bg-emerald-500/30 text-white shadow-sm';
            } else {
                btn.className = 'turret-btn-left p-1 rounded text-[10px] font-orbitron border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500';
            }
        });

        // Sağ qüllə düymələri
        const rightBtns = document.querySelectorAll('.turret-btn-right');
        rightBtns.forEach(btn => {
            const bType = btn.dataset.type;
            if (bType === permUpgrades.turretRightType) {
                btn.className = 'turret-btn-right p-1 rounded text-[10px] font-orbitron font-bold border-2 border-cyan-400 bg-cyan-500/30 text-white shadow-sm';
            } else {
                btn.className = 'turret-btn-right p-1 rounded text-[10px] font-orbitron border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500';
            }
        });

        // Qiymət göstəriciləri (dinamik qiymətə uyğun)
        const leftCost = permUpgrades.turretLeftType !== 'none' ? getBulletCost(permUpgrades.turretLeftType) : 0;
        const rightCost = permUpgrades.turretRightType !== 'none' ? getBulletCost(permUpgrades.turretRightType) : 0;
        const totalCost = leftCost + rightCost;

        const leftEl = document.getElementById('turret-left-cost');
        if (leftEl) leftEl.innerText = permUpgrades.turretLeftType === 'none' ? 'BAĞLI' : `${leftCost} 🪙`;

        const rightEl = document.getElementById('turret-right-cost');
        if (rightEl) rightEl.innerText = permUpgrades.turretRightType === 'none' ? 'BAĞLI' : `${rightCost} 🪙`;

        const totalEl = document.getElementById('turret-total-cost');
        if (totalEl) totalEl.innerText = `${totalCost} 🪙`;

        // İnterval seçimi
        const intervalSelect = document.getElementById('turret-interval-select');
        if (intervalSelect) {
            intervalSelect.value = permUpgrades.turretInterval.toString();
        }

        // Aktivlik açarı
        const toggleBtn = document.getElementById('btn-turret-toggle');
        const turretBody = document.getElementById('turret-controls-body');

        if (toggleBtn) {
            if (permUpgrades.turretEnabled) {
                toggleBtn.className = 'text-[10px] font-orbitron font-bold px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 hover:border-emerald-400 transition cursor-pointer select-none shadow-sm shadow-emerald-500/20';
                toggleBtn.innerHTML = '<i class="fa-solid fa-power-off text-emerald-400 mr-1.5"></i> AKTİV';
            } else {
                toggleBtn.className = 'text-[10px] font-orbitron font-bold px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/70 text-rose-400 hover:border-rose-400 transition cursor-pointer select-none shadow-sm shadow-rose-500/20';
                toggleBtn.innerHTML = '<i class="fa-solid fa-power-off text-rose-500 mr-1.5"></i> SÖNDÜRÜLÜB';
            }
        }

        if (turretBody && turretBody.style) {
            turretBody.style.opacity = permUpgrades.turretEnabled ? '1' : '0.4';
            turretBody.style.pointerEvents = permUpgrades.turretEnabled ? 'auto' : 'none';
            turretBody.style.filter = permUpgrades.turretEnabled ? 'none' : 'grayscale(0.6)';
        }

        const dashBadge = document.getElementById('dash-turret-ownership-badge');
        if (dashBadge) {
            dashBadge.innerHTML = `
                <button tabindex="-1" onclick="toggleTurretActive();" class="px-3.5 py-1.5 rounded-xl font-orbitron font-bold text-xs ${permUpgrades.turretEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}">
                    ${permUpgrades.turretEnabled ? '<i class="fa-solid fa-power-off mr-1"></i> AKTİV (ON)' : '<i class="fa-solid fa-power-off mr-1"></i> SÖNDÜRÜLÜB (OFF)'}
                </button>
            `;
        }

        const dashLeft = document.getElementById('dash-turret-left-select');
        if (dashLeft) dashLeft.value = permUpgrades.turretLeftType || 'wall';

        const dashRight = document.getElementById('dash-turret-right-select');
        if (dashRight) dashRight.value = permUpgrades.turretRightType || 'wall';

        const dashInterval = document.getElementById('dash-turret-interval-select');
        if (dashInterval) dashInterval.value = (permUpgrades.turretInterval || 5).toString();

    } else {
        buyBtn.classList.remove('hidden');
        settingsPanel.classList.add('hidden');

        const dashBadge = document.getElementById('dash-turret-ownership-badge');
        if (dashBadge) {
            dashBadge.innerHTML = `
                <button tabindex="-1" onclick="buyTwinTurrets();" class="btn-red-diamond px-4 py-2 rounded-xl text-slate-950 font-orbitron font-bold text-xs shadow-md">
                    50 💎🔴 İLƏ AL
                </button>
            `;
        }
    }
}

// 10-CU QAT SANDIQ SİSTEMİ (MILESTONE CHEST)
let currentPendingRewardFloor = 0;

function checkMilestoneChest(floor) {
    if (floor % 10 === 0 && !claimedChests.includes(floor)) {
        currentPendingRewardFloor = floor;
        const rewardCount = floor / 10; // 10->1, 20->2, 30->3...

        document.getElementById('chest-floor-title').innerText = `${floor}-CU QAT SANDIĞI!`;
        document.getElementById('chest-reward-desc').innerText = `Təbriklər! ${floor}-cu qata çatdınız. Bu sandıqdan sizə birdəfəlik ${rewardCount} Qırmızı Almaz təqdim olunur!`;
        document.getElementById('chest-reward-count').innerText = `+${rewardCount} 💎🔴 Qırmızı Almaz`;

        const overlay = document.getElementById('chest-overlay');
        overlay.classList.remove('hidden');
        audio.playChest();
        return true;
    }
    return false;
}

function claimMilestoneChest() {
    if (currentPendingRewardFloor <= 0) return;
    const floor = currentPendingRewardFloor;

    if (!claimedChests.includes(floor)) {
        const rewardCount = floor / 10;
        redDiamonds += rewardCount;
        claimedChests.push(floor);
        savePermanentData();

        audio.playDiamond();
        showToast(`🎁 +${rewardCount} Qırmızı Almaz Qazanıldı!`, 'redDiamond');
        updateUI();
    }

    currentPendingRewardFloor = 0;
    document.getElementById('chest-overlay').classList.add('hidden');
}

function toggleLaboratoryModal() {
    const modal = document.getElementById('laboratory-modal');
    if (!modal) return;

    if (modal.classList.contains('hidden')) {
        if (!gameState.gameOver) {
            showToast('Laboratoriyadan yüksəltmələr ancaq Oyun Bitdikdə (Game Over) mümkündür!', 'info');
            return;
        }
        updatePermUpgradesUI();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}


// ==================== BÜTÜN MONİTORLAR ÜÇÜN RESPONSİV AVTO-SCALE VƏ BOŞLUQLAR ====================
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
window.adjustViewportFit = adjustViewportFit;
window.addEventListener('resize', adjustViewportFit);
window.addEventListener('load', adjustViewportFit);
