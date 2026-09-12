// ƏKİZ SİLAHLARIN ALINMASI, YÜKSƏLDİLMƏSİ VƏ OYANIŞ MENECERİ (Fancy Elmas)

const TURRET_PRICES_DICT = {
    wall: 30,
    ice: 50,
    shock: 90,
    mine: 140,
    plasma: 190,
    none: 0
};

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
window.getTrapName = getTrapName;

// 1. Əkiz Qüllələrin Kilidini Açmaq (50 Fancy Elmas)
function buyTwinTurrets() {
    if (typeof audio !== 'undefined' && audio.init) audio.init();
    if (permUpgrades.hasTwinTurrets) {
        if (typeof showToast === 'function') showToast('Əkiz Qüllələr artıq alınıb və aktivdir!', 'info');
        return;
    }

    if (redDiamonds >= 50) {
        redDiamonds -= 50;
        permUpgrades.hasTwinTurrets = true;
        permUpgrades.turretEnabled = true;
        permUpgrades.turretIntervalLvl = permUpgrades.turretIntervalLvl || 0;
        permUpgrades.turretInterval = typeof getTurretInterval === 'function' ? getTurretInterval() : 7.0;
        if (typeof savePermanentData === 'function') savePermanentData();
        if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
        if (typeof showToast === 'function') showToast('🔥 ƏKİZ QÜLLƏLƏR ALINDI! (50 Fancy Elmas xərcləndi)', 'redDiamond');
        updateTurretsUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
        if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    } else {
        if (typeof showToast === 'function') showToast(`Fancy Elmas Çatmır! (50 Fancy Elmas tələb olunur. Sizdə: ${redDiamonds})`, 'error');
    }
}
window.buyTwinTurrets = buyTwinTurrets;

// 2. Qüllə Atəş İntervalının Səviyyəsini Aşağı Salmaq (Hər dəfə -0.2s, 10 + lvl*5 Fancy Elmas, maks 4.0s)
function upgradeTurretInterval() {
    if (typeof audio !== 'undefined' && audio.init) audio.init();
    if (!permUpgrades.hasTwinTurrets) {
        if (typeof showToast === 'function') showToast('Əvvəlcə Əkiz Qüllələri aktivləşdirməlisiniz!', 'warning');
        return;
    }

    const currentLvl = permUpgrades.turretIntervalLvl || 0;
    if (currentLvl >= 15) {
        if (typeof showToast === 'function') showToast('⚡ Atəş intervalı artıq Maksimum Səviyyədədir (4.0s)!', 'info');
        return;
    }

    const cost = 10 + currentLvl * 5;
    if (redDiamonds >= cost) {
        redDiamonds -= cost;
        permUpgrades.turretIntervalLvl = currentLvl + 1;
        permUpgrades.turretInterval = typeof getTurretInterval === 'function' ? getTurretInterval() : Math.max(4.0, 7.0 - (currentLvl + 1) * 0.2);
        if (typeof savePermanentData === 'function') savePermanentData();
        if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
        
        const newInterval = typeof getTurretInterval === 'function' ? getTurretInterval() : (7.0 - (currentLvl + 1) * 0.2).toFixed(1);
        if (typeof showToast === 'function') {
            showToast(`⏱ Qüllə atəşi tezləşdi! İnterval: ${newInterval}s (-0.2s, -${cost} Fancy Elmas)`, 'redDiamond');
        }
        updateTurretsUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
        if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    } else {
        if (typeof showToast === 'function') {
            showToast(`Fancy Elmas Çatmır! (${cost} Fancy Elmas tələb olunur. Sizdə: ${redDiamonds})`, 'error');
        }
    }
}
window.upgradeTurretInterval = upgradeTurretInterval;

// 3. Oyanış Açarı Almaq (1000 Fancy Elmas)
function buyAwakeningKey() {
    if (typeof audio !== 'undefined' && audio.init) audio.init();
    if (permUpgrades.hasAwakeningKey) {
        if (typeof showToast === 'function') showToast('Sizdə artıq Əkiz Qüllə Oyanış Açarı var!', 'info');
        return;
    }

    if (redDiamonds >= 1000) {
        redDiamonds -= 1000;
        permUpgrades.hasAwakeningKey = true;
        if (typeof savePermanentData === 'function') savePermanentData();
        if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
        if (typeof showToast === 'function') showToast('🗝️ ƏFSANƏVİ OYANIŞ AÇARI ALINDI! (1000 Fancy Elmas)', 'redDiamond');
        updateTurretsUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
        if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    } else {
        if (typeof showToast === 'function') {
            showToast(`Fancy Elmas Çatmır! (1000 Fancy Elmas tələb olunur. Sizdə: ${redDiamonds})`, 'error');
        }
    }
}
window.buyAwakeningKey = buyAwakeningKey;

// 4. Əkiz Qüllələri Awakened (Oyanmış) vəziyyətə keçirmək
function awakenTwinTurrets() {
    if (typeof audio !== 'undefined' && audio.init) audio.init();
    if (!permUpgrades.hasTwinTurrets) {
        if (typeof showToast === 'function') showToast('Əvvəlcə Əkiz Qüllələri aktiv edin!', 'warning');
        return;
    }
    if (permUpgrades.turretAwakened) {
        if (typeof showToast === 'function') showToast('Əkiz Qüllələr artıq Oyanış (Awakened) formasındadır!', 'info');
        return;
    }
    const currentLvl = permUpgrades.turretIntervalLvl || 0;
    if (currentLvl < 15) {
        if (typeof showToast === 'function') {
            showToast('Oyanış üçün əvvəlcə atəş intervalını maksimum həddə (4.0s) endirməlisiniz!', 'warning');
        }
        return;
    }
    if (!permUpgrades.hasAwakeningKey) {
        if (typeof showToast === 'function') {
            showToast('Oyanış üçün Mağazadan 1000 Fancy Elmas ilə Oyanış Açarı alınmalıdır!', 'warning');
        }
        return;
    }

    permUpgrades.turretAwakened = true;
    if (typeof savePermanentData === 'function') savePermanentData();
    if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
    if (typeof showToast === 'function') {
        showToast('🔥⚡ ƏKİZ QÜLLƏLƏR OYANDI (AWAKENED)! Super güc və alovlu aura aktivdir!', 'redDiamond');
    }
    updateTurretsUI();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
}
window.awakenTwinTurrets = awakenTwinTurrets;

// Qüllə Mərmi Seçimi
function setTurretSideBullet(side, type) {
    if (side === 'left') {
        permUpgrades.turretLeftType = type;
    } else {
        permUpgrades.turretRightType = type;
    }
    if (typeof savePermanentData === 'function') savePermanentData();
    updateTurretsUI();
    const cost = TURRET_PRICES_DICT[type] || 0;
    const name = type === 'none' ? 'Bağlı (0🪙)' : `${getTrapName(type)} (${cost}🪙)`;
    if (typeof showToast === 'function') showToast(`🎯 ${side === 'left' ? 'Sol' : 'Sağ'} Qüllə: ${name}`, 'info');
}
window.setTurretSideBullet = setTurretSideBullet;

// Qüllə Aktiv/Deaktiv
function toggleTurretEnabled(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    permUpgrades.turretEnabled = !permUpgrades.turretEnabled;
    if (typeof savePermanentData === 'function') savePermanentData();
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

// UI Sinxronizasiyası
function updateTurretsUI() {
    const buyBtn = document.getElementById('btn-buy-turrets');
    const settingsPanel = document.getElementById('turret-settings-panel');

    const currentInterval = typeof getTurretInterval === 'function' ? getTurretInterval() : (permUpgrades.turretInterval || 7.0);
    const currentLvl = permUpgrades.turretIntervalLvl || 0;
    const isMaxLvl = currentLvl >= 15;
    const nextCost = isMaxLvl ? null : (10 + currentLvl * 5);

    // 1. Oyundaxili yan panel (game.html)
    if (buyBtn && settingsPanel) {
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

            // Xərc göstəriciləri
            const leftCost = permUpgrades.turretLeftType !== 'none' ? (typeof getBulletCost === 'function' ? getBulletCost(permUpgrades.turretLeftType) : (TURRET_PRICES_DICT[permUpgrades.turretLeftType] || 0)) : 0;
            const rightCost = permUpgrades.turretRightType !== 'none' ? (typeof getBulletCost === 'function' ? getBulletCost(permUpgrades.turretRightType) : (TURRET_PRICES_DICT[permUpgrades.turretRightType] || 0)) : 0;
            const totalCost = leftCost + rightCost;

            const leftEl = document.getElementById('turret-left-cost');
            if (leftEl) leftEl.innerText = permUpgrades.turretLeftType === 'none' ? 'BAĞLI' : `${leftCost} 🪙`;

            const rightEl = document.getElementById('turret-right-cost');
            if (rightEl) rightEl.innerText = permUpgrades.turretRightType === 'none' ? 'BAĞLI' : `${rightCost} 🪙`;

            const totalEl = document.getElementById('turret-total-cost');
            if (totalEl) totalEl.innerText = `${totalCost} 🪙`;

            // Atəş İntervalı Göstəricisi
            const intervalValEl = document.getElementById('turret-current-interval-val');
            if (intervalValEl) {
                intervalValEl.innerText = `${currentInterval}s`;
            }

            // Tez yüksəltmə düyməsi (game.html daxilində)
            const quickUpgradeBtn = document.getElementById('btn-quick-turret-interval');
            if (quickUpgradeBtn) {
                if (isMaxLvl) {
                    quickUpgradeBtn.disabled = true;
                    quickUpgradeBtn.className = 'px-2 py-0.5 rounded text-[9px] font-orbitron font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 cursor-default';
                    quickUpgradeBtn.innerText = 'MAKS';
                } else {
                    quickUpgradeBtn.disabled = false;
                    quickUpgradeBtn.className = 'px-2 py-0.5 rounded text-[9px] font-orbitron font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 cursor-pointer transition active:scale-95 flex items-center gap-1';
                    quickUpgradeBtn.innerHTML = `-0.2s (${nextCost} <span data-icon="103" data-size="10"></span>)`;
                }
            }

            // Aktivlik düyməsi
            const toggleBtn = document.getElementById('btn-turret-toggle');
            if (toggleBtn) {
                if (permUpgrades.turretEnabled) {
                    toggleBtn.className = 'text-[10px] font-orbitron font-bold px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 hover:border-emerald-400 transition cursor-pointer select-none shadow-sm shadow-emerald-500/20';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-power-off text-emerald-400 mr-1.5"></i> AKTİV';
                } else {
                    toggleBtn.className = 'text-[10px] font-orbitron font-bold px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/70 text-rose-400 hover:border-rose-400 transition cursor-pointer select-none shadow-sm shadow-rose-500/20';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-power-off text-rose-500 mr-1.5"></i> SÖNDÜRÜLÜB';
                }
            }

            // Oyanış (Awakened) nişanı
            const awakenedBadge = document.getElementById('turret-awakened-badge');
            if (awakenedBadge) {
                if (permUpgrades.turretAwakened) {
                    awakenedBadge.classList.remove('hidden');
                } else {
                    awakenedBadge.classList.add('hidden');
                }
            }

        } else {
            buyBtn.classList.remove('hidden');
            settingsPanel.classList.add('hidden');
        }
    }

    // 2. Mağaza Paneli (shop.html)
    const dashBadge = document.getElementById('dash-turret-ownership-badge');
    if (dashBadge) {
        if (permUpgrades.hasTwinTurrets) {
            dashBadge.innerHTML = `
                <div class="flex items-center gap-2">
                    ${permUpgrades.turretAwakened ? '<span class="px-3 py-1 rounded-lg font-orbitron font-black text-xs bg-rose-500/25 border border-rose-500 text-rose-300 shadow-md shadow-rose-500/30 animate-pulse"><i class="fa-solid fa-fire text-amber-400 mr-1"></i> AWAKENED</span>' : ''}
                    <button tabindex="-1" onclick="toggleTurretActive();" class="px-3.5 py-1.5 rounded-xl font-orbitron font-bold text-xs ${permUpgrades.turretEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'} cursor-pointer">
                        ${permUpgrades.turretEnabled ? '<i class="fa-solid fa-power-off mr-1"></i> AKTİV (ON)' : '<i class="fa-solid fa-power-off mr-1"></i> SÖNDÜRÜLÜB (OFF)'}
                    </button>
                </div>
            `;
        } else {
            const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 16 }) : '<span data-icon="103" data-size="16"></span>';
            dashBadge.innerHTML = `
                <button tabindex="-1" onclick="buyTwinTurrets();" class="btn-red-diamond px-4 py-2 rounded-xl text-slate-950 font-orbitron font-black text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition">
                    50 ${rubySvg} FANCY ELMAS İLƏ AKTİV ET
                </button>
            `;
        }
    }

    const dashLeft = document.getElementById('dash-turret-left-select');
    if (dashLeft) dashLeft.value = permUpgrades.turretLeftType || 'wall';

    const dashRight = document.getElementById('dash-turret-right-select');
    if (dashRight) dashRight.value = permUpgrades.turretRightType || 'wall';

    // Mağaza İnterval və Oyanış Kartı Yenilənməsi
    const dashIntervalText = document.getElementById('dash-turret-interval-display');
    if (dashIntervalText) {
        dashIntervalText.innerText = `${currentInterval}s`;
    }

    const dashIntervalLvlText = document.getElementById('dash-turret-interval-lvl');
    if (dashIntervalLvlText) {
        dashIntervalLvlText.innerText = isMaxLvl ? 'MAKS (4.0s)' : `Lv.${currentLvl}/15`;
    }

    const dashIntervalBtn = document.getElementById('dash-turret-interval-btn');
    if (dashIntervalBtn) {
        if (!permUpgrades.hasTwinTurrets) {
            dashIntervalBtn.disabled = true;
            dashIntervalBtn.className = 'w-full py-2.5 rounded-xl font-orbitron font-bold text-xs bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed';
            dashIntervalBtn.innerHTML = 'Əvvəlcə Qüllələri Aktiv Edin';
        } else if (isMaxLvl) {
            dashIntervalBtn.disabled = true;
            dashIntervalBtn.className = 'w-full py-2.5 rounded-xl font-orbitron font-bold text-xs bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 cursor-default';
            dashIntervalBtn.innerHTML = '✓ Maksimum Atəş Sürəti (4.0s)';
        } else {
            dashIntervalBtn.disabled = false;
            dashIntervalBtn.className = 'w-full py-2.5 rounded-xl font-orbitron font-bold text-xs bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 shadow-md shadow-rose-500/30 cursor-pointer transition active:scale-98 flex items-center justify-center gap-1.5';
            const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 14 }) : '💎';
            dashIntervalBtn.innerHTML = `<span>İntervalı Azalt (-0.2s)</span> <span class="bg-slate-950/40 px-2 py-0.5 rounded-lg text-white font-black">${nextCost} ${rubySvg}</span>`;
        }
    }

    // Oyanış (Awakening) Düyməsi və Vəziyyəti
    const dashAwakenCard = document.getElementById('dash-turret-awaken-action');
    if (dashAwakenCard) {
        if (!permUpgrades.hasTwinTurrets) {
            dashAwakenCard.innerHTML = `<span class="text-xs text-slate-500 font-orbitron">Qüllələr bağlıdır</span>`;
        } else if (permUpgrades.turretAwakened) {
            dashAwakenCard.innerHTML = `
                <div class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-950/80 via-red-900/40 to-rose-950/80 border border-rose-500/60 text-rose-300 font-orbitron font-black text-xs text-center shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-fire-flame-curved text-amber-400 animate-pulse"></i> AWAKENED STATUSU AKTİVDİR (SUPER GÜC)
                </div>
            `;
        } else if (isMaxLvl) {
            if (permUpgrades.hasAwakeningKey) {
                dashAwakenCard.innerHTML = `
                    <button onclick="awakenTwinTurrets();" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 text-slate-950 font-orbitron font-black text-xs shadow-xl shadow-rose-500/40 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2">
                        <i class="fa-solid fa-key text-slate-950"></i> OYANIŞI AKTİV ET (AÇAR HAZIRDIR)
                    </button>
                `;
            } else {
                const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 14 }) : '💎';
                dashAwakenCard.innerHTML = `
                    <button onclick="buyAwakeningKey();" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-900 via-pink-900 to-rose-900 hover:from-rose-800 hover:to-pink-800 border border-rose-500/60 text-white font-orbitron font-bold text-xs shadow-lg shadow-rose-500/25 transition cursor-pointer flex items-center justify-center gap-2">
                        <span><i class="fa-solid fa-key text-amber-400 mr-1"></i> Oyanış Açarı Al</span>
                        <span class="bg-slate-950/50 px-2 py-0.5 rounded-lg text-rose-300 font-black">1000 ${rubySvg}</span>
                    </button>
                `;
            }
        } else {
            dashAwakenCard.innerHTML = `
                <div class="text-[11px] text-slate-400 font-orbitron flex items-center gap-1.5">
                    <i class="fa-solid fa-lock text-slate-500"></i> Oyanış üçün intervalı 4.0s (Maks) etməlisiniz
                </div>
            `;
        }
    }

    // Market tabındakı Oyanış Açarı kartı (varsa)
    const marketKeyBtn = document.getElementById('btn-market-awakening-key');
    if (marketKeyBtn) {
        if (permUpgrades.hasAwakeningKey) {
            marketKeyBtn.disabled = true;
            marketKeyBtn.className = 'px-4 py-2 rounded-xl font-orbitron font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default';
            marketKeyBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> SAHİBSİNİZ';
        } else {
            marketKeyBtn.disabled = false;
            marketKeyBtn.className = 'px-4 py-2 rounded-xl font-orbitron font-bold text-xs bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 shadow-md shadow-rose-500/30 cursor-pointer transition active:scale-95 flex items-center gap-1.5';
            marketKeyBtn.innerHTML = '1,000 FANCY İLƏ AL';
        }
    }
}
window.updateTurretsUI = updateTurretsUI;
