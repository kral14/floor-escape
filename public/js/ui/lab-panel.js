// LABORATORİYA VƏ VALYUTA MÜBADİLƏSİ MODULU

function getSavedLabTab() {
    try {
        const saved = localStorage.getItem('floor_escape_active_lab_tab');
        if (saved && ['skins', 'market', 'base', 'econ', 'turrets'].includes(saved)) {
            return saved;
        }
    } catch (e) {}
    return 'skins';
}

let currentLabTab = getSavedLabTab(); // 'base' | 'econ' | 'skins' | 'market' | 'turrets'

function switchLabTab(tab) {
    if (!['skins', 'market', 'base', 'econ', 'turrets'].includes(tab)) {
        tab = 'skins';
    }
    currentLabTab = tab;
    try {
        localStorage.setItem('floor_escape_active_lab_tab', tab);
        document.documentElement.setAttribute('data-initial-lab', tab);
    } catch (e) {}
    const tabs = ['skins', 'market', 'base', 'econ', 'turrets'];

    tabs.forEach(t => {
        const btn = document.getElementById(`lab-tab-btn-${t}`);
        const content = document.getElementById(`lab-tab-content-${t}`);
        if (btn) {
            let activeColor = 'border-sky-400 text-sky-300';
            if (t === 'skins') activeColor = 'border-cyan-400 text-cyan-300 bg-cyan-500/10';
            else if (t === 'market') activeColor = 'border-amber-400 text-amber-300 bg-amber-500/10';
            else if (t === 'econ') activeColor = 'border-rose-500 text-rose-400 bg-rose-500/10';
            else if (t === 'turrets') activeColor = 'border-purple-400 text-purple-300 bg-purple-500/10';

            btn.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold border-b-2 rounded-lg ' +
                (tab === t ? activeColor : 'border-transparent text-slate-400 hover:text-slate-200') +
                ' flex items-center gap-1.5 transition cursor-pointer';
        }
        if (content) {
            content.classList.toggle('hidden', tab !== t);
        }
    });

    if (tab === 'skins') {
        const targetSub = (typeof getSavedSkinSubTab === 'function') ? getSavedSkinSubTab() : (localStorage.getItem('floor_escape_active_skin_subtab') || 'skins');
        if (typeof switchSkinSubTab === 'function') {
            switchSkinSubTab(targetSub);
        } else if (typeof renderSkinsShop === 'function') {
            renderSkinsShop();
        }
    } else if (tab === 'base') {
        updatePermUpgradesUI();
    } else if (tab === 'econ') {
        updatePermUpgradesUI();
    } else if (tab === 'turrets') {
        if (typeof updateTurretsUI === 'function') updateTurretsUI();
    }
    if (typeof ICONS !== 'undefined') {
        if (typeof ICONS.renderDOM === 'function') ICONS.renderDOM();
        else if (typeof ICONS.renderAll === 'function') ICONS.renderAll();
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

    const starsValEl = document.getElementById('lab-val-cyber-stars');
    if (starsValEl) {
        const count = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 5;
        starsValEl.innerText = `${count} Ulduz`;
    }

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
        if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
        showToast(`[ruby] ${getTrapName(type)} Qənaəti Artırıldı! (Lv.${permUpgrades[key]} üçün -${cost} [ruby])`, 'redDiamond');
        updatePermUpgradesUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Fancy Elmas Çatmır! (${cost} Fancy Elmas tələb olunur)`, 'error');
    }
}

// Oyundaxili müvəqqəti təkmilləşdirmə
function buyUpgrade(type) {
    if (gameState.gameOver || gameState.paused || gameState.transitioning) return;
    if (typeof audio !== 'undefined') audio.init();

    if (type === 'speed') {
        const price = 50 + gameState.inGameSpeedLvl * 35;
        if (gameState.gold >= price) {
            gameState.gold -= price;
            gameState.inGameSpeedLvl++;
            player.speed = getBaseSpeed() + gameState.inGameSpeedLvl * 0.5;
            if (typeof audio !== 'undefined') audio.playShoot();
            showToast(`🚀 Sürət Artırıldı! (Səviyyə: ${permUpgrades.speedLvl + gameState.inGameSpeedLvl})`, 'success');
            const el = document.getElementById('price-upgrade-speed');
            if (el) el.innerText = `${50 + gameState.inGameSpeedLvl * 35} 🪙`;
            if (typeof updateUI === 'function') updateUI();
            if (typeof saveActiveRun === 'function') saveActiveRun();
        } else {
            showToast('Qızıl Çatmır!', 'error');
        }
    } else if (type === 'magnet') {
        const price = 80 + gameState.inGameMagnetLvl * 45;
        if (gameState.gold >= price) {
            gameState.gold -= price;
            gameState.inGameMagnetLvl++;
            gameState.magnetRadius = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
            if (typeof audio !== 'undefined') audio.playShoot();
            showToast(`🧲 Maqnit Genişləndi! (${gameState.magnetRadius}px)`, 'success');
            const el = document.getElementById('price-upgrade-magnet');
            if (el) el.innerText = `${80 + gameState.inGameMagnetLvl * 45} 🪙`;
            if (typeof updateUI === 'function') updateUI();
            if (typeof saveActiveRun === 'function') saveActiveRun();
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

    if (typeof audio !== 'undefined') audio.init();
    let key = type === 'speed' ? 'speedLvl' : type === 'magnet' ? 'magnetLvl' : type === 'coinVal' ? 'coinValLvl' : type === 'coinRate' ? 'coinRateLvl' : type === 'shield' ? 'shieldLvl' : 'powerUpLvl';
    let currentLvl = permUpgrades[key] || 0;

    if (currentLvl >= MAX_PERM_LVL) {
        showToast('Bu təkmilləşdirmə artıq maksimal səviyyədədir (Lv.10)!', 'info');
        return;
    }

    const cost = Math.max(1, currentLvl);

    if (diamonds >= cost) {
        diamonds -= cost;
        permUpgrades[key] = (permUpgrades[key] || 0) + 1;

        savePermanentData();
        if (typeof audio !== 'undefined') audio.playDiamond();
        showToast(`💎 Qalıcı Yüksəltmə Alındı! (Lv.${permUpgrades[key]} üçün -${cost} 💎)`, 'success');

        if (typeof player !== 'undefined') {
            player.speed = getBaseSpeed();
        }
        if (typeof gameState !== 'undefined') {
            gameState.magnetRadius = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
        }
        updatePermUpgradesUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        showToast(`Almaz Çatmır! (${cost} 💎 tələb olunur)`, 'error');
    }
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
    if (rewardRed > 0) msg += `, +${rewardRed} [ruby] Fancy Elmas`;
    if (dropSkin) msg += ` və 🌟 NADİR DƏRİ: "${skinsList[dropSkin].name}"!`;

    showToast(msg, 'success');

    if (typeof renderSkinsShop === 'function') renderSkinsShop();
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
    showToast(`🏆 Qızıl Sandıq açıldı: +${rewardBlue} 💎 Mavi Almaz, +${rewardRed} [ruby] Fancy Elmas!`, 'success');

    if (typeof renderSkinsShop === 'function') renderSkinsShop();
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
        showToast('💱 Mübadilə uğurlu: +5 [ruby] Fancy Elmas konvertasiya edildi!', 'success');
    }

    savePermanentData();
    if (typeof audio !== 'undefined' && audio.playCoin) audio.playCoin();

    if (typeof renderSkinsShop === 'function') renderSkinsShop();
    updatePermUpgradesUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
}

window.currentLabTab = currentLabTab;
window.getSavedLabTab = getSavedLabTab;
window.switchLabTab = switchLabTab;
window.updatePermUpgradesUI = updatePermUpgradesUI;
window.buyBulletEconUpgrade = buyBulletEconUpgrade;
window.buyUpgrade = buyUpgrade;
window.buyPermUpgrade = buyPermUpgrade;
window.toggleLaboratoryModal = toggleLaboratoryModal;
window.openCyberCrate = openCyberCrate;
window.openGoldCrate = openGoldCrate;
window.exchangeCurrency = exchangeCurrency;
