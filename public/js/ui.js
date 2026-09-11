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
    
    // Standart ikon formatlaması (heç vaxt 💎🔴 emoji qalmasın)
    const formattedText = (typeof ICONS !== 'undefined' && typeof ICONS.formatText === 'function')
        ? ICONS.formatText(text)
        : text;
    el.innerHTML = formattedText;

    container.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
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
    const comboEl = document.getElementById('stat-combo');
    if (comboEl) {
        const comboMult = gameState.combo >= 10 ? '3.0x 🔥' : (gameState.combo >= 5 ? '2.0x ⚡' : (gameState.combo >= 3 ? '1.5x' : '1.0x'));
        comboEl.innerHTML = `${gameState.combo} <span class="text-[10px] text-amber-400 font-normal">(${comboMult})</span>`;
    }

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
    if (borderText && borderDot) {
        if (gameState.borderOpen) {
            borderText.innerHTML = '<span class="text-emerald-300 font-bold tracking-wider">SƏRHƏD AÇIQDIR</span>';
            borderDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse';
        } else {
            borderText.innerHTML = `<span class="text-slate-300 tracking-wider">SƏRHƏD BAĞLIDIR</span> <span class="text-rose-400 font-semibold text-[11px]">(${gameState.scoreProgress}/${gameState.scoreReq})</span>`;
            borderDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse';
        }
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
    const tabs = ['skins', 'market', 'base', 'econ', 'turrets'];

    tabs.forEach(t => {
        const btn = document.getElementById(`lab-tab-btn-${t}`);
        const content = document.getElementById(`lab-tab-content-${t}`);
        if (btn) {
            let activeColor = 'border-sky-400 text-sky-300';
            if (t === 'skins') activeColor = 'border-cyan-400 text-cyan-300';
            else if (t === 'market') activeColor = 'border-amber-400 text-amber-300';
            else if (t === 'econ') activeColor = 'border-rose-500 text-rose-400';
            else if (t === 'turrets') activeColor = 'border-purple-400 text-purple-300';

            btn.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold border-b-2 ' +
                (tab === t ? activeColor : 'border-transparent text-slate-400 hover:text-slate-200') +
                ' flex items-center gap-1.5 transition cursor-pointer';
        }
        if (content) {
            content.classList.toggle('hidden', tab !== t);
        }
    });

    if (tab === 'skins') {
        renderSkinsShop();
    } else if (tab === 'base') {
        updatePermUpgradesUI();
    } else if (tab === 'econ') {
        updatePermUpgradesUI();
    } else if (tab === 'turrets') {
        if (typeof updateTurretsUI === 'function') updateTurretsUI();
    }
    if (typeof ICONS !== 'undefined' && typeof ICONS.renderAll === 'function') {
        ICONS.renderAll();
    }
}

function updatePermUpgradesUI() {
    // 1. BAZA XASSƏLƏR (Mavi Almaz)
    const list = [
        { type: 'speed', lvl: permUpgrades.speedLvl, max: MAX_PERM_LVL, bonus: `+0.35 Sürət` },
        { type: 'magnet', lvl: permUpgrades.magnetLvl, max: MAX_PERM_LVL, bonus: `+15px Sahə` },
        { type: 'coinVal', lvl: permUpgrades.coinValLvl, max: MAX_PERM_LVL, bonus: `+3 Qızıl` },
        { type: 'coinSpawn', lvl: permUpgrades.coinRateLvl || permUpgrades.coinSpawnLvl || 0, max: MAX_PERM_LVL, bonus: `-0.15s Vaxt` },
        { type: 'dashCD', lvl: permUpgrades.dashCDLvl || 0, max: MAX_PERM_LVL, bonus: `-0.2s CD` },
        { type: 'startGold', lvl: permUpgrades.startGoldLvl || 0, max: MAX_PERM_LVL, bonus: `+30 Qızıl` },
        { type: 'shield', lvl: permUpgrades.shieldLvl || 0, max: MAX_PERM_LVL, bonus: `+10% Şans` },
        { type: 'powerUp', lvl: permUpgrades.powerUpLvl || 0, max: MAX_PERM_LVL, bonus: `-1.0s İnterval` }
    ];

    const cyanIcon = (typeof ICONS !== 'undefined') ? ICONS.cyanDiamond({ size: 19 }) : '💎';

    list.forEach(item => {
        const lvlEl = document.getElementById(`lab-lvl-${item.type}`);
        const costEl = document.getElementById(`lab-cost-${item.type}`);
        const btn = document.getElementById(`lab-btn-${item.type}`);

        if (lvlEl) lvlEl.innerText = `Lv.${item.lvl}`;

        if (item.lvl >= item.max) {
            if (costEl) costEl.innerText = 'MAKS';
            if (btn) btn.classList.add('disabled');
        } else {
            const cost = Math.max(1, item.lvl);
            if (costEl) costEl.innerHTML = `${cost} ${cyanIcon}`;
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

    const rubyIcon = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 19 }) : '<span data-icon="103" data-size="19"></span>';

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
        const pct = Math.round(lvl * 14);
        if (pctEl) {
            pctEl.innerText = lvl === MAX_ECON_LVL ? `70% Qənaət (-70% Qiymət Artımı)` : (lvl === 0 ? `-0% Qiymət Artımı` : `-${pct}% Qiymət Artımı`);
        }

        if (lvl >= MAX_ECON_LVL) {
            if (costEl) costEl.innerText = 'MAKS';
            if (btn) btn.classList.add('disabled');
        } else {
            const costs = BULLET_ECON_COSTS[item.type] || [3, 6, 10, 15, 25];
            const cost = costs[lvl];
            if (costEl) costEl.innerHTML = `${cost} ${rubyIcon}`;
            if (btn) {
                if (redDiamonds >= cost) btn.classList.remove('disabled');
                else btn.classList.add('disabled');
            }
        }
    });
}

function buyBulletEconUpgrade(type) {
    const key = `bullet${type.charAt(0).toUpperCase() + type.slice(1)}EconLvl`;
    const currentLvl = permUpgrades[key] || 0;
    if (currentLvl >= MAX_ECON_LVL) {
        showToast('Bu tələ üzrə qənaət maksimum həddədir!', 'info');
        return;
    }
    const costs = BULLET_ECON_COSTS[type] || [3, 6, 10, 15, 25];
    const cost = costs[currentLvl];

    if (redDiamonds >= cost) {
        redDiamonds -= cost;
        permUpgrades[key] = currentLvl + 1;
        savePermanentData();
        audio.playChest();
        showToast(`[ruby] ${getTrapName(type)} Qənaəti Artırıldı! (Lv.${permUpgrades[key]} üçün -${cost} [ruby])`, 'redDiamond');
        updatePermUpgradesUI();
        updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Qırmızı Almaz Çatmır! (${cost} [ruby] tələb olunur)`, 'error');
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
    let key = type === 'speed' ? 'speedLvl' : type === 'magnet' ? 'magnetLvl' : type === 'coinVal' ? 'coinValLvl' : type === 'coinRate' ? 'coinRateLvl' : type === 'shield' ? 'shieldLvl' : 'powerUpLvl';
    let currentLvl = permUpgrades[key] || 0;

    if (currentLvl >= MAX_PERM_LVL) {
        showToast('Bu təkmilləşdirmə artıq maksimal səviyyədədir (Lv.10)!', 'info');
        return;
    }

    const cost = Math.max(1, currentLvl); // Level dəyərində almaz

    if (diamonds >= cost) {
        diamonds -= cost;
        permUpgrades[key] = (permUpgrades[key] || 0) + 1;

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
        showToast(`Qırmızı Almaz Çatmır! (50 [ruby] tələb olunur. Sizdə: ${redDiamonds})`, 'error');
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
            const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 18 }) : '<span data-icon="103" data-size="18"></span>';
            dashBadge.innerHTML = `
                <button tabindex="-1" onclick="buyTwinTurrets();" class="btn-red-diamond px-4 py-2 rounded-xl text-slate-950 font-orbitron font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
                    50 ${rubySvg} İLƏ AL
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

        const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 22 }) : '<span data-icon="103" data-size="22"></span>';
        document.getElementById('chest-floor-title').innerText = `${floor}-CU QAT SANDIĞI!`;
        document.getElementById('chest-reward-desc').innerText = `Təbriklər! ${floor}-cu qata çatdınız. Bu sandıqdan sizə birdəfəlik ${rewardCount} Qırmızı Almaz təqdim olunur!`;
        document.getElementById('chest-reward-count').innerHTML = `<span class="inline-flex items-center gap-1.5">+${rewardCount} ${rubySvg} Qırmızı Almaz</span>`;

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

// ==================== KİBER MAĞAZA: DƏRİLƏR & SANDIQLAR & BİRJA ====================

function getSkinsCatalog() {
    if (typeof SKINS !== 'undefined' && SKINS && Object.keys(SKINS).length > 0) return SKINS;
    if (typeof window !== 'undefined' && window.SKINS && Object.keys(window.SKINS).length > 0) return window.SKINS;
    return {
        default: { id: 'default', name: 'Kiber Qaçışçı', title: 'Cyber Runner', icon: 'fa-user-ninja', color: '#00ffcc', trailColor: 'rgba(0, 255, 204,', glowColor: '#00ffcc', desc: 'Standart balanslaşdırılmış kiber-qaçışçı forması.', costType: 'free', cost: 0 },
        spark: { id: 'spark', name: 'Kvant Qığılcımı', title: 'Quantum Spark', icon: 'fa-bolt', color: '#facc15', trailColor: 'rgba(250, 204, 21,', glowColor: '#facc15', desc: 'Yüksək gərginlikli cəldlik və ildırım parıltısı.', costType: 'diamonds', cost: 15, altCost: 600, altType: 'gold' },
        aegis: { id: 'aegis', name: 'Titan Zirehli', title: 'Titan Aegis', icon: 'fa-shield-halved', color: '#38bdf8', trailColor: 'rgba(56, 189, 248,', glowColor: '#38bdf8', desc: 'Polad-mavi enerji aurası və dayanıqlı kiber-qoruyucu.', costType: 'diamonds', cost: 25, altCost: 1200, altType: 'gold' },
        inferno: { id: 'inferno', name: 'Lava Cəlladı', title: 'Inferno Slayer', icon: 'fa-fire-flame-curved', color: '#ef4444', trailColor: 'rgba(239, 68, 68,', glowColor: '#ef4444', desc: 'Lava qorxusunu məhv edən qəzəbli alovlu döyüşçü.', costType: 'redDiamonds', cost: 20, altCost: 2500, altType: 'gold' },
        void: { id: 'void', name: 'Void Hökmdarı', title: 'Void Sovereign', icon: 'fa-crown', color: '#c084fc', trailColor: 'rgba(192, 132, 252,', glowColor: '#c084fc', desc: 'Qaranlıq anomaliyaları ram edən ali kibernetik forma.', costType: 'redDiamonds', cost: 35, altCost: 4000, altType: 'gold' }
    };
}

let currentPreviewSkinId = null;
let skinStageAnimFrame = null;
let skinStageTime = 0;

function setPreviewSkin(skinId) {
    const skinsList = getSkinsCatalog();
    if (!skinsList[skinId]) return;
    currentPreviewSkinId = skinId;

    const skin = skinsList[skinId];
    const nameEl = document.getElementById('preview-skin-name');
    const titleEl = document.getElementById('preview-skin-title');
    const badgeEl = document.getElementById('preview-skin-badge');
    const descEl = document.getElementById('preview-skin-desc');

    if (nameEl) nameEl.innerText = skin.name;
    if (titleEl) titleEl.innerText = skin.title;
    if (badgeEl) {
        badgeEl.innerHTML = `
            <span class="inline-block px-3 py-1 rounded-full text-xs font-orbitron font-bold border shadow-md" style="background: ${skin.color}20; color: ${skin.color}; border-color: ${skin.color}60;">
                ${skin.badge || '⚖️ Standart Forma'}
            </span>
        `;
    }
    if (descEl) descEl.innerText = skin.perk || skin.desc;

    // Kartların seçilmə çərçivəsini yenilə
    renderSkinsShop();
}

function startSkinStageAnimation() {
    const canvas = document.getElementById('skin-stage-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (skinStageAnimFrame) {
        cancelAnimationFrame(skinStageAnimFrame);
        skinStageAnimFrame = null;
    }

    let trailHistory = [];

    function renderStage() {
        skinStageTime += 0.035;
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Kiber tor (grid) arxa planı
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        const step = 20;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const skinsList = getSkinsCatalog();
        const activeId = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
        const skin = skinsList[activeId] || skinsList['default'];

        // Balonun havada süzülməsi (Float & Sinus dalğası)
        const centerX = w / 2 + Math.sin(skinStageTime * 1.6) * 18;
        const centerY = h / 2 + Math.sin(skinStageTime * 2.8) * 12;
        const radius = 24;

        // İzlər (Trail)
        trailHistory.push({ x: centerX, y: centerY });
        if (trailHistory.length > 14) trailHistory.shift();

        trailHistory.forEach((t, i) => {
            const factor = i / trailHistory.length;
            ctx.beginPath();
            ctx.arc(t.x, t.y, radius * factor * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = `${skin.trailColor || 'rgba(0, 255, 204,'} ${factor * 0.3})`;
            ctx.fill();
        });

        // Geniş Neon Aura (Pulsasiya)
        ctx.save();
        const pulse = 1 + Math.sin(skinStageTime * 3.5) * 0.12;
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2.4 * pulse);
        grad.addColorStop(0, `${skin.trailColor || 'rgba(0, 255, 204,'} 0.4)`);
        grad.addColorStop(0.6, `${skin.trailColor || 'rgba(0, 255, 204,'} 0.12)`);
        grad.addColorStop(1, `${skin.trailColor || 'rgba(0, 255, 204,'} 0)`);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 2.4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. Kiber Orbital Enerji Halqası
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 1.7, radius * 0.65, skinStageTime * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = skin.color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = skin.glowColor;
        ctx.stroke();

        // 4. XÜSUSİ DƏRİ MODELİ (NİNJA KASKI, ELEKTRİK TİKANLARI, MECHA ZİREHİ, BUYNIZLAR, KİBER TAC)
        const lookAngle = Math.sin(skinStageTime * 1.6) * 0.35;
        if (typeof drawSkinModel === 'function') {
            drawSkinModel(ctx, centerX, centerY, radius, activeId, lookAngle, skinStageTime, false);
        } else {
            ctx.shadowBlur = 28;
            ctx.shadowColor = skin.glowColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = skin.color;
            ctx.fill();
        }

        ctx.restore();

        // 5. MAĞAZADAKI BÜTÜN KARTLARIN CANLI MODEL VİTRİNLƏRİNİN RƏNDƏRİ (60 FPS)
        Object.keys(skinsList).forEach((sid, idx) => {
            const cardCanvas = document.getElementById(`skin-card-canvas-${sid}`);
            if (!cardCanvas) return;
            const cctx = cardCanvas.getContext('2d');
            if (!cctx) return;

            const cw = cardCanvas.width;
            const ch = cardCanvas.height;
            cctx.clearRect(0, 0, cw, ch);

            const cskin = skinsList[sid];
            const isEquipped = (permUpgrades && permUpgrades.equippedSkin === sid);
            const isPrev = (currentPreviewSkinId === sid);

            // Radial kiber aura
            const cGrad = cctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, 45);
            cGrad.addColorStop(0, `${cskin.color}25`);
            cGrad.addColorStop(0.7, `${cskin.color}08`);
            cGrad.addColorStop(1, 'transparent');
            cctx.fillStyle = cGrad;
            cctx.fillRect(0, 0, cw, ch);

            // İncə kiber tor
            cctx.strokeStyle = `${cskin.color}18`;
            cctx.lineWidth = 1;
            cctx.beginPath();
            cctx.moveTo(cw / 2, 8); cctx.lineTo(cw / 2, ch - 8);
            cctx.moveTo(8, ch / 2); cctx.lineTo(cw - 8, ch / 2);
            cctx.stroke();

            // Fərdi Canlı Kiber Kostyum Modeli
            const cardFloatY = ch / 2 + Math.sin(skinStageTime * 2.5 + idx * 1.3) * 4;
            const cardFacing = Math.sin(skinStageTime * 1.8 + idx) * 0.45;
            if (typeof drawSkinModel === 'function') {
                drawSkinModel(cctx, cw / 2, cardFloatY, 19, sid, cardFacing, skinStageTime + idx * 2, false);
            }
        });

        skinStageAnimFrame = requestAnimationFrame(renderStage);
    }

    renderStage();
}

function renderSkinsShop() {
    const container = document.getElementById('skins-cards-container');
    if (!container) return;

    const skinsList = getSkinsCatalog();
    const owned = (permUpgrades && permUpgrades.ownedSkins) ? permUpgrades.ownedSkins : ['default'];
    const active = (permUpgrades && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
    const preview = currentPreviewSkinId || active;
    const playerGold = Math.floor(gameState.gold || 0);

    let html = '';
    Object.values(skinsList).forEach(skin => {
        const isOwned = owned.includes(skin.id);
        const isActive = active === skin.id;
        const isPreviewing = preview === skin.id;

        let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-950/70';
        let glowStyle = `box-shadow: 0 0 15px ${skin.color}15;`;
        if (isActive) {
            borderClass = 'border-emerald-500 shadow-xl shadow-emerald-500/25 bg-slate-900/80';
            glowStyle = `box-shadow: 0 0 28px ${skin.color}44;`;
        } else if (isPreviewing) {
            borderClass = 'border-cyan-400 shadow-lg shadow-cyan-400/25 bg-slate-900/80';
            glowStyle = `box-shadow: 0 0 22px ${skin.color}33;`;
        }

        let actionBtn = '';
        if (isActive) {
            actionBtn = `
                <button disabled class="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 cursor-default shadow-md shadow-emerald-500/20">
                    <i class="fa-solid fa-check-circle"></i> TƏCHİZ EDİLİB
                </button>
            `;
        } else if (isOwned) {
            actionBtn = `
                <button onclick="event.stopPropagation(); buyOrEquipSkin('${skin.id}'); setPreviewSkin('${skin.id}');" class="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-cyan-500/20 hover:scale-[1.02]">
                    <i class="fa-solid fa-hand-pointer"></i> SEÇ / TƏCHİZ ET
                </button>
            `;
        } else {
            let canAffordMain = false;
            let mainCostLabel = '';
            if (skin.costType === 'diamonds') {
                canAffordMain = diamonds >= skin.cost;
                mainCostLabel = `${skin.cost} 💎`;
            } else if (skin.costType === 'redDiamonds') {
                canAffordMain = redDiamonds >= skin.cost;
                const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 18 }) : '💎';
                mainCostLabel = `<span class="inline-flex items-center gap-1">${skin.cost} ${rubySvg}</span>`;
            }

            const canAffordGold = skin.altCost && playerGold >= skin.altCost;

            actionBtn = `
                <div class="flex flex-col gap-1.5 w-full">
                    <button onclick="event.stopPropagation(); buyOrEquipSkin('${skin.id}', false); setPreviewSkin('${skin.id}');" class="w-full py-2 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${canAffordMain ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60'}">
                        <span>AL: ${mainCostLabel}</span>
                    </button>
                    ${skin.altCost ? `
                    <button onclick="event.stopPropagation(); buyOrEquipSkin('${skin.id}', true); setPreviewSkin('${skin.id}');" class="w-full py-1.5 rounded-xl font-orbitron font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${canAffordGold ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40' : 'bg-slate-900 text-slate-600 border border-slate-800 opacity-50'}">
                        <span>və ya ${skin.altCost} 🪙 Qızıl</span>
                    </button>
                    ` : ''}
                </div>
            `;
        }

        html += `
            <div onclick="setPreviewSkin('${skin.id}');" class="glass-card p-4 rounded-3xl border ${borderClass} flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-300 cursor-pointer hover:-translate-y-1" style="${glowStyle}">
                
                <!-- Üst Emblem və Canlı Status Nişanı -->
                <div class="w-full flex items-center justify-between px-1 mb-2">
                    <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/80" style="color: ${skin.color}; border-color: ${skin.color}40;">
                        <i class="fa-solid ${skin.icon} mr-1"></i> ${skin.title}
                    </span>
                    ${isActive ? `<span class="bg-emerald-500 text-slate-950 rounded-full px-2 py-0.5 text-[9px] font-orbitron font-bold shadow flex items-center gap-1"><i class="fa-solid fa-check"></i> AKTİV</span>` : (isOwned ? `<span class="text-slate-400 text-[9px] font-mono">SAHİBSƏN</span>` : '')}
                </div>

                <!-- CANLI KİBERNETİK MODEL VİTRİNİ (CANVAS PREVIEW) -->
                <div class="relative w-24 h-24 rounded-2xl flex items-center justify-center mb-3 bg-slate-950 border border-slate-800 shadow-inner group-hover:border-cyan-500/50 transition-colors duration-300 overflow-hidden" style="box-shadow: inset 0 0 20px ${skin.color}20, 0 0 15px ${skin.color}15;">
                    <canvas id="skin-card-canvas-${skin.id}" width="96" height="96" class="w-full h-full block pointer-events-none"></canvas>
                    <div class="absolute bottom-1 right-2 text-[8px] font-mono text-slate-600 tracking-tighter uppercase pointer-events-none">3D HOLO</div>
                </div>

                <div class="mb-3 w-full">
                    <h4 class="font-orbitron font-bold text-sm text-white tracking-wide group-hover:text-cyan-300 transition-colors">${skin.name}</h4>
                    <div class="my-1.5">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-bold border shadow-sm" style="background: ${skin.color}18; color: ${skin.color}; border-color: ${skin.color}45;">
                            ${skin.badge || '⚖️ Standart Forma'}
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-snug font-medium px-1 min-h-[32px] flex items-center justify-center">${skin.perk || skin.desc}</p>
                </div>

                <div class="w-full pt-2.5 border-t border-slate-800/80">
                    ${actionBtn}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Animasiyanı başlat
    startSkinStageAnimation();
}

function buyOrEquipSkin(skinId, useAltCurrency = false) {
    const skinsList = getSkinsCatalog();
    if (!skinsList || !skinsList[skinId]) return;
    const skin = skinsList[skinId];
    if (!permUpgrades.ownedSkins || !Array.isArray(permUpgrades.ownedSkins)) permUpgrades.ownedSkins = ['default'];

    if (permUpgrades.ownedSkins.includes(skinId)) {
        permUpgrades.equippedSkin = skinId;
        savePermanentData();
        if (typeof player !== 'undefined' && player.applySkin) {
            player.applySkin();
        }
        if (typeof audio !== 'undefined' && audio.playCoin) audio.playCoin();
        showToast(`✨ "${skin.name}" dərisi aktivləşdirildi!`, 'success');
        renderSkinsShop();
        return;
    }

    if (useAltCurrency && skin.altCost) {
        if ((gameState.gold || 0) < skin.altCost) {
            showToast(`Kifayət qədər Qızıl yoxdur! Lazımdır: ${skin.altCost} 🪙`, 'error');
            return;
        }
        gameState.gold -= skin.altCost;
    } else {
        if (skin.costType === 'diamonds') {
            if (diamonds < skin.cost) {
                showToast(`Kifayət qədər Mavi Almaz yoxdur! Lazımdır: ${skin.cost} 💎`, 'error');
                return;
            }
            diamonds -= skin.cost;
        } else if (skin.costType === 'redDiamonds') {
            if (redDiamonds < skin.cost) {
                showToast(`Kifayət qədər Qırmızı Almaz yoxdur! Lazımdır: ${skin.cost} [ruby]`, 'error');
                return;
            }
            redDiamonds -= skin.cost;
        }
    }

    permUpgrades.ownedSkins.push(skinId);
    permUpgrades.equippedSkin = skinId;
    savePermanentData();

    if (typeof player !== 'undefined' && player.applySkin) {
        player.applySkin();
    }
    if (typeof audio !== 'undefined' && audio.playChest) {
        audio.playChest();
    }
    showToast(`🎉 Təbriklər! "${skin.name}" dərisi alındı və təchiz edildi!`, 'success');

    renderSkinsShop();
    updatePermUpgradesUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
}

function openCyberCrate() {
    const cost = 8;
    if (diamonds < cost) {
        showToast(`Kiber Sandıq üçün ən azı ${cost} 💎 Mavi Almaz lazımdır!`, 'error');
        return;
    }

    diamonds -= cost;

    const rewardGold = Math.floor(Math.random() * 400) + 250;
    const rewardRed = Math.random() < 0.4 ? (Math.floor(Math.random() * 3) + 1) : 0;

    let dropSkin = null;
    const skinsList = getSkinsCatalog();
    const unownedSkins = Object.keys(skinsList).filter(s => !permUpgrades.ownedSkins.includes(s));
    if (unownedSkins.length > 0 && Math.random() < 0.15) {
        dropSkin = unownedSkins[Math.floor(Math.random() * unownedSkins.length)];
        permUpgrades.ownedSkins.push(dropSkin);
    }

    gameState.gold = (gameState.gold || 0) + rewardGold;
    if (rewardRed > 0) redDiamonds += rewardRed;
    savePermanentData();

    if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();

    let msg = `📦 Kiber Sandıq açıldı: +${rewardGold} 🪙 Qızıl`;
    if (rewardRed > 0) msg += `, +${rewardRed} [ruby] Qırmızı Almaz`;
    if (dropSkin) msg += ` və 🌟 NADİR DƏRİ: "${skinsList[dropSkin].name}"!`;

    showToast(msg, 'success');

    renderSkinsShop();
    updatePermUpgradesUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
}

function openGoldCrate() {
    const cost = 1000;
    if ((gameState.gold || 0) < cost) {
        showToast(`Qızıl Sandıq üçün ən azı ${cost} 🪙 Qızıl lazımdır!`, 'error');
        return;
    }

    gameState.gold -= cost;

    const rewardBlue = Math.floor(Math.random() * 10) + 6;
    const rewardRed = Math.floor(Math.random() * 3) + 1;

    diamonds += rewardBlue;
    redDiamonds += rewardRed;
    savePermanentData();

    if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
    showToast(`🏆 Qızıl Sandıq açıldı: +${rewardBlue} 💎 Mavi Almaz, +${rewardRed} [ruby] Qırmızı Almaz!`, 'success');

    renderSkinsShop();
    updatePermUpgradesUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
}

function exchangeCurrency(action) {
    if (action === 'buy_gold') {
        if (diamonds < 6) {
            showToast('Kifayət qədər Mavi Almaz yoxdur! Lazımdır: 6 💎', 'error');
            return;
        }
        diamonds -= 6;
        gameState.gold = (gameState.gold || 0) + 450;
        showToast('💱 Mübadilə uğurlu: +450 🪙 Qızıl alındı!', 'success');
    } else if (action === 'buy_diamonds') {
        if ((gameState.gold || 0) < 800) {
            showToast('Kifayət qədər Qızıl yoxdur! Lazımdır: 800 🪙', 'error');
            return;
        }
        gameState.gold -= 800;
        diamonds += 12;
        showToast('💱 Mübadilə uğurlu: +12 💎 Mavi Almaz alındı!', 'success');
    } else if (action === 'buy_red_diamonds') {
        if (diamonds < 25) {
            showToast('Kifayət qədər Mavi Almaz yoxdur! Lazımdır: 25 💎', 'error');
            return;
        }
        diamonds -= 25;
        redDiamonds += 5;
        showToast('💱 Mübadilə uğurlu: +5 [ruby] Qırmızı Almaz konvertasiya edildi!', 'success');
    }

    savePermanentData();
    if (typeof audio !== 'undefined' && audio.playCoin) audio.playCoin();

    renderSkinsShop();
    updatePermUpgradesUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
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
