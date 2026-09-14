// OYUNÇU HESABI VƏ BULUD SİNXRONİZASİYA MENECERİ (AUTH & CLOUD SYNC)

let currentPlayer = null;
let authMode = 'login'; // 'login' və ya 'register'
let syncTimeout = null;

// Səhifə yüklənəndə oyunçunu yoxlayırıq
function initAuth() {
    try {
        const savedPlayer = localStorage.getItem('floor_escape_player');
        const path = (window.location.pathname || '').toLowerCase();
        const isGameOrShop = path.includes('game.html') || path.includes('shop.html');

        if (savedPlayer) {
            currentPlayer = JSON.parse(savedPlayer);
            window.currentPlayer = currentPlayer;
            document.documentElement.classList.remove('auth-locked');

            const dashView = document.getElementById('dashboard-view');
            if (dashView) dashView.classList.remove('hidden');
            const modal = document.getElementById('auth-modal-overlay');
            if (modal) modal.classList.add('hidden');

            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            if (typeof updateDashboardUI === 'function') updateDashboardUI();
            if (typeof INBOX !== 'undefined' && typeof INBOX.updateWsPlayer === 'function') {
                INBOX.updateWsPlayer(currentPlayer.playerId);
            }
            // Serverdən ən son məlumatları çəkməyə cəhd edirik
            fetchLatestPlayerData();
        } else {
            // GİRİŞ YOXDUR: İstifadəçini içəri qətiyyən buraxmırıq!
            window.currentPlayer = null;
            currentPlayer = null;

            if (isGameOrShop) {
                window.location.replace('index.html');
                return;
            }

            document.documentElement.classList.add('auth-locked');
            const dashView = document.getElementById('dashboard-view');
            if (dashView) dashView.classList.add('hidden');

            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            openAuthModal('login', true);
            dismissAppBootCurtain();
        }
    } catch (e) {
        console.error('Oyunçu məlumatları oxunarkən xəta:', e);
        window.currentPlayer = null;
        currentPlayer = null;
        document.documentElement.classList.add('auth-locked');
        openAuthModal('login', true);
        dismissAppBootCurtain();
    }
}

// Native App Shell pərdəsini qaldıran funksiya
function dismissAppBootCurtain() {
    requestAnimationFrame(() => {
        const curtain = document.getElementById('app-boot-curtain');
        if (curtain) {
            curtain.classList.add('app-ready');
            setTimeout(() => {
                try {
                    if (curtain && curtain.parentNode) {
                        curtain.parentNode.removeChild(curtain);
                    }
                } catch(e) {}
            }, 300);
        }
    });
}
window.dismissAppBootCurtain = dismissAppBootCurtain;

// Serverdən ən son oyunçu məlumatlarını çəkib real olaraq tətbiq etmək (Verilənlər Bazasından real oxuma)
async function fetchLatestPlayerData() {
    const p = window.currentPlayer || currentPlayer;
    if (!p || !p.playerId) return;
    try {
        const res = await fetch(`/api/player/profile?playerId=${encodeURIComponent(p.playerId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.player) {
            applyPlayerDataFromCloud(data.player);
        }
    } catch (e) {
        console.log('Serverlə əlaqə qurulmadı (oflayn rejim):', e.message);
    }
}

// Header-də oyunçu profilini yeniləmək
function updatePlayerHeaderUI() {
    if (typeof renderHeaderProfile === 'function') {
        renderHeaderProfile();
    }

    const profileContainer = document.getElementById('player-profile-bar');
    if (!profileContainer) return;

    const p = window.currentPlayer || currentPlayer;

    if (p && p.playerId) {
        profileContainer.innerHTML = `
            <div class="flex items-center gap-2 bg-slate-900/80 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-md">
                <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-orbitron font-bold text-white text-xs shadow-inner">
                    ${(p.username || 'P').charAt(0).toUpperCase()}
                </div>
                <div class="flex flex-col text-left">
                    <div class="flex items-center gap-1.5 leading-none">
                        <span class="font-orbitron font-bold text-xs text-white tracking-wide max-w-[90px] truncate" title="${p.username}">${p.username}</span>
                        <span id="sync-indicator" class="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Buludla Sinxronlaşdırılıb"></span>
                    </div>
                    <button tabindex="-1" onclick="copyPlayerId('${p.playerId}');" class="text-[10px] font-mono text-cyan-300/80 hover:text-cyan-200 transition cursor-pointer text-left leading-tight" title="ID-ni kopyalamaq üçün vurun">
                        ID: #${p.playerId} <i class="fa-regular fa-copy text-[8px] ml-0.5 opacity-70"></i>
                    </button>
                </div>
                <button tabindex="-1" onclick="logoutPlayer(); this.blur();" class="ml-1 w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 flex items-center justify-center text-xs transition cursor-pointer" title="Çıxış et">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        profileContainer.innerHTML = `
            <button tabindex="-1" onclick="openAuthModal('login'); this.blur();" class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition cursor-pointer">
                <i class="fa-solid fa-user text-cyan-200 text-xs"></i>
                <span>GİRİŞ / QEYDİYYAT</span>
            </button>
        `;
    }

    if (typeof updateDashboardProfileCard === 'function') {
        updateDashboardProfileCard();
    }
}

function copyPlayerId(id) {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
        showToast(`ID #${id} kopyalandı! İstənilən yerdə bu ID ilə daxil ola bilərsiniz.`, 'success');
    }).catch(() => {
        showToast(`ID: #${id}`, 'info');
    });
}

// Modal açmaq
function openAuthModal(mode = 'login', force = false) {
    authMode = mode;
    const modal = document.getElementById('auth-modal-overlay');
    const closeBtn = document.getElementById('auth-modal-close-btn');
    const dashView = document.getElementById('dashboard-view');
    if (!modal) return;

    modal.classList.remove('hidden');

    const p = window.currentPlayer || currentPlayer;
    const isLocked = force || !p || !p.playerId;

    if (closeBtn) {
        if (isLocked) {
            closeBtn.classList.add('hidden');
        } else {
            closeBtn.classList.remove('hidden');
        }
    }

    if (isLocked) {
        document.documentElement.classList.add('auth-locked');
        if (dashView) dashView.classList.add('hidden');
    }

    switchAuthTab(mode);
}

function closeAuthModal() {
    const p = window.currentPlayer || currentPlayer;
    if (!p || !p.playerId) {
        // Giriş edilməyibsə modal bağlanmamalıdır və içəri heç bir halda buraxılmamalıdır!
        return;
    }

    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.add('hidden');
    document.documentElement.classList.remove('auth-locked');

    const dashView = document.getElementById('dashboard-view');
    if (dashView) dashView.classList.remove('hidden');

    const err = document.getElementById('auth-error-msg');
    if (err) err.textContent = '';
    // Pəncərə bağlananda PIN gizlətməni ilkin vəziyyətə gətir
    const pinInput = document.getElementById('auth-input-pin');
    const eyeIcon = document.getElementById('auth-pin-eye-icon');
    if (pinInput) pinInput.type = 'password';
    if (eyeIcon) eyeIcon.className = 'fa-solid fa-eye text-xs text-slate-400';
}

// PIN Şifrəni Göstər / Gizlət (Show/Hide Password)
function toggleAuthPinVisibility() {
    const pinInput = document.getElementById('auth-input-pin');
    const eyeIcon = document.getElementById('auth-pin-eye-icon');
    if (!pinInput) return;

    if (pinInput.type === 'password') {
        pinInput.type = 'text';
        if (eyeIcon) {
            eyeIcon.className = 'fa-solid fa-eye-slash text-xs text-cyan-400';
        }
    } else {
        pinInput.type = 'password';
        if (eyeIcon) {
            eyeIcon.className = 'fa-solid fa-eye text-xs text-slate-400';
        }
    }
}
window.toggleAuthPinVisibility = toggleAuthPinVisibility;

function switchAuthTab(mode) {
    authMode = mode;
    const btnLoginTab = document.getElementById('tab-btn-login');
    const btnRegTab = document.getElementById('tab-btn-register');
    const loginNote = document.getElementById('auth-login-note');
    const submitBtn = document.getElementById('auth-submit-btn');
    const err = document.getElementById('auth-error-msg');
    if (err) err.textContent = '';

    if (mode === 'login') {
        if (btnLoginTab) btnLoginTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs bg-cyan-600 text-white shadow';
        if (btnRegTab) btnRegTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs text-slate-400 hover:text-slate-200';
        if (loginNote) loginNote.textContent = 'Giriş üçün adınızı və ya 7 rəqəmli ID-nizi istifadə edin:';
        if (submitBtn) submitBtn.textContent = 'DAXİL OL';
    } else {
        if (btnLoginTab) btnLoginTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs text-slate-400 hover:text-slate-200';
        if (btnRegTab) btnRegTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs bg-emerald-600 text-white shadow';
        if (loginNote) loginNote.textContent = 'Yeni hesab yaradın və avtomatik 7 rəqəmli ID əldə edin:';
        if (submitBtn) submitBtn.textContent = 'QEYDİYYATDAN KEÇ';
    }
}

// Form təsdiqi (Giriş / Qeydiyyat)
async function handleAuthSubmit() {
    const userInput = document.getElementById('auth-input-username');
    const pinInput = document.getElementById('auth-input-pin');
    const err = document.getElementById('auth-error-msg');

    const userVal = userInput ? userInput.value.trim() : '';
    const pinVal = pinInput ? pinInput.value.trim() : '';

    if (!userVal || !pinVal) {
        if (err) err.textContent = 'Zəhmət olmasa bütün xanaları doldurun!';
        return;
    }

    if (authMode === 'login') {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: userVal, pin: pinVal })
            });
            const data = await res.json();
            if (!data.success) {
                if (err) err.textContent = data.message || 'Giriş uğursuz oldu!';
                return;
            }

            // Uğurlu giriş
            currentPlayer = data.player;
            window.currentPlayer = currentPlayer;
            localStorage.setItem('floor_escape_player', JSON.stringify(currentPlayer));

            // Serverdən gələn məlumatları oyuna tətbiq edirik
            applyPlayerDataFromCloud(data.player);

            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            if (typeof updateDashboardUI === 'function') updateDashboardUI();
            if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
            if (typeof INBOX !== 'undefined' && typeof INBOX.updateWsPlayer === 'function') {
                INBOX.updateWsPlayer(currentPlayer.playerId);
            }
            if (typeof INBOX !== 'undefined' && typeof INBOX.fetch === 'function') {
                INBOX.fetch();
            }

            closeAuthModal();
            showToast(`Xoş gəldin, ${currentPlayer.username}! (ID: #${currentPlayer.playerId})`, 'success');

        } catch (e) {
            if (err) err.textContent = 'Serverlə əlaqə xətası: ' + e.message;
        }
    } else {
        // Qeydiyyat
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userVal,
                    pin: pinVal,
                    gold: gameState.gold || 75,
                    diamonds: diamonds || 0,
                    redDiamonds: redDiamonds || 0,
                    bestFloor: gameState.bestFloor || 1,
                    permUpgrades: permUpgrades || {},
                    claimedChests: claimedChests || []
                })
            });
            const data = await res.json();
            if (!data.success) {
                if (err) err.textContent = data.message || 'Qeydiyyat xətası!';
                return;
            }

            // Uğurlu qeydiyyat
            currentPlayer = data.player;
            window.currentPlayer = currentPlayer;
            localStorage.setItem('floor_escape_player', JSON.stringify(currentPlayer));

            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            if (typeof updateDashboardUI === 'function') updateDashboardUI();
            if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
            if (typeof INBOX !== 'undefined' && typeof INBOX.updateWsPlayer === 'function') {
                INBOX.updateWsPlayer(currentPlayer.playerId);
            }
            if (typeof INBOX !== 'undefined' && typeof INBOX.fetch === 'function') {
                INBOX.fetch();
            }

            closeAuthModal();
            showToast(`Hesab yaradıldı! Sizin Unikal ID: #${currentPlayer.playerId}`, 'success');

        } catch (e) {
            if (err) err.textContent = 'Serverlə əlaqə xətası: ' + e.message;
        }
    }
}

// Buluddan gələn datanı real olaraq oyuna yazmaq (Real-time DB Persistence)
function applyPlayerDataFromCloud(player) {
    if (!player) return;

    if (player.diamonds !== undefined) {
        diamonds = parseInt(player.diamonds) || 0;
        if (typeof gameState !== 'undefined') gameState.diamonds = diamonds;
    }
    if (player.redDiamonds !== undefined) {
        redDiamonds = parseInt(player.redDiamonds) || 0;
        if (typeof gameState !== 'undefined') gameState.redDiamonds = redDiamonds;
    }
    if (player.gold !== undefined && typeof gameState !== 'undefined') {
        gameState.gold = parseFloat(player.gold) || 0;
    }
    if (player.bestFloor !== undefined && typeof gameState !== 'undefined') {
        gameState.bestFloor = Math.max(1, parseInt(player.bestFloor) || 1);
    }
    if (player.permUpgrades && typeof player.permUpgrades === 'object') {
        permUpgrades = { ...DEFAULT_PERM_UPGRADES, ...player.permUpgrades };
        if (!Array.isArray(permUpgrades.ownedSkins) || permUpgrades.ownedSkins.length === 0) {
            permUpgrades.ownedSkins = ['default'];
        }
        if (!permUpgrades.equippedSkin || (typeof SKINS !== 'undefined' && !SKINS[permUpgrades.equippedSkin])) {
            permUpgrades.equippedSkin = 'default';
        }
        if (!Array.isArray(permUpgrades.ownedSpawnAnims) || permUpgrades.ownedSpawnAnims.length === 0) {
            permUpgrades.ownedSpawnAnims = ['singularity', 'portal'];
        } else if (!permUpgrades.ownedSpawnAnims.includes('singularity')) {
            permUpgrades.ownedSpawnAnims.push('singularity');
        }
        if (!permUpgrades.equippedSpawnAnim || (typeof SPAWN_ANIMS !== 'undefined' && !SPAWN_ANIMS[permUpgrades.equippedSpawnAnim])) {
            permUpgrades.equippedSpawnAnim = 'singularity';
        }
    }
    if (Array.isArray(player.claimedChests)) {
        claimedChests = player.claimedChests;
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof renderLab === 'function') renderLab();
    if (typeof renderShop === 'function') renderShop();
}

// Buluda sinxronizasiya (Avtomatik və ya dəyişikliklərdə dərhal bazaya yazır)
function syncPlayerDataCloud(immediate = false) {
    const p = window.currentPlayer || currentPlayer;
    if (!p || !p.playerId) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    const doSync = async () => {
        try {
            const ind = document.getElementById('sync-indicator');
            if (ind) ind.className = 'inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse';

            const payload = {
                playerId: p.playerId,
                gold: (typeof gameState !== 'undefined' && gameState.gold !== undefined) ? gameState.gold : 0,
                diamonds: (typeof diamonds !== 'undefined') ? diamonds : 0,
                redDiamonds: (typeof redDiamonds !== 'undefined') ? redDiamonds : 0,
                bestFloor: (typeof gameState !== 'undefined' && gameState.bestFloor) ? gameState.bestFloor : 1,
                totalScore: (typeof gameState !== 'undefined' && gameState.totalScore) ? gameState.totalScore : 0,
                permUpgrades: (typeof permUpgrades !== 'undefined') ? permUpgrades : {},
                claimedChests: (typeof claimedChests !== 'undefined') ? claimedChests : []
            };

            const res = await fetch('/api/player/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    if (data.diamonds !== undefined) {
                        diamonds = data.diamonds;
                        if (typeof gameState !== 'undefined') gameState.diamonds = diamonds;
                    }
                    if (data.redDiamonds !== undefined) {
                        redDiamonds = data.redDiamonds;
                        if (typeof gameState !== 'undefined') gameState.redDiamonds = redDiamonds;
                    }
                    if (data.bestFloor !== undefined && typeof gameState !== 'undefined') {
                        gameState.bestFloor = Math.max(gameState.bestFloor || 1, data.bestFloor);
                    }
                    if (typeof updateUI === 'function') updateUI();
                    if (typeof updateDashboardUI === 'function') updateDashboardUI();
                    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
                }
                if (ind) ind.className = 'inline-block w-2 h-2 rounded-full bg-emerald-400';
            } else {
                if (ind) ind.className = 'inline-block w-2 h-2 rounded-full bg-rose-400';
            }
        } catch (e) {
            const ind = document.getElementById('sync-indicator');
            if (ind) ind.className = 'inline-block w-2 h-2 rounded-full bg-slate-500';
        }
    };

    if (immediate) {
        doSync();
    } else {
        syncTimeout = setTimeout(doSync, 1200);
    }
}

// Hesabdan çıxış: Alert yerinə Kiber Modal açır
function logoutPlayer() {
    const modal = document.getElementById('logout-modal-overlay');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        confirmLogoutAction();
    }
}
window.logoutPlayer = logoutPlayer;

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal-overlay');
    if (modal) {
        modal.classList.add('hidden');
    }
}
window.closeLogoutModal = closeLogoutModal;

// "BƏLİ, ÇIXIŞ ET": Bütün məlumatları bazaya yazır, lokal əlaqəni tam kəsir və login pəncərəsinə yönləndirir
async function confirmLogoutAction() {
    closeLogoutModal();

    // 1. Çıxışdan öncə mövcud bütün oyunçu məlumatlarını verilənlər bazasına yazırıq
    const activePlayer = window.currentPlayer || currentPlayer;
    if (activePlayer && activePlayer.playerId) {
        try {
            const payload = {
                playerId: activePlayer.playerId,
                gold: (typeof gameState !== 'undefined' && gameState.gold !== undefined) ? gameState.gold : 75,
                diamonds: (typeof diamonds !== 'undefined') ? diamonds : 0,
                redDiamonds: (typeof redDiamonds !== 'undefined') ? redDiamonds : 0,
                bestFloor: (typeof gameState !== 'undefined' && gameState.bestFloor) ? gameState.bestFloor : 1,
                totalScore: (typeof gameState !== 'undefined' && gameState.totalScore) ? gameState.totalScore : 0,
                permUpgrades: (typeof permUpgrades !== 'undefined') ? permUpgrades : {},
                claimedChests: (typeof claimedChests !== 'undefined') ? claimedChests : []
            };
            await fetch('/api/player/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('Çıxışda son sinxronizasiya xətası:', e);
        }
    }

    // 2. Lokal yaddaşla (localStorage) əlaqəni TAM KƏSİRİK - Köhnə heç bir məlumat qalmır
    const localKeysToRemove = [
        'floor_escape_player',
        'floor_escape_diamonds',
        'floor_escape_red_diamonds',
        'floor_escape_best_floor',
        'floor_escape_perm_upgrades',
        'floor_escape_claimed_chests',
        'floor_escape_active_run',
        'floor_escape_user_id',
        'floor_escape_user',
        'floor_escape_guest_id',
        'fe_player',
        'floor_escape_local_gift_codes',
        'floor_escape_active_nav_page',
        'floor_escape_active_lab_tab'
    ];
    localKeysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
    });
    try {
        document.documentElement.removeAttribute('data-initial-nav');
        document.documentElement.removeAttribute('data-initial-lab');
    } catch (e) {}

    // 3. Yaddaşdakı (RAM) cari oyunçu vəziyyətini ilkin sıfır vəziyyətinə gətiririk
    currentPlayer = null;
    window.currentPlayer = null;
    diamonds = 0;
    redDiamonds = 0;
    claimedChests = [];
    if (typeof DEFAULT_PERM_UPGRADES !== 'undefined') {
        permUpgrades = { ...DEFAULT_PERM_UPGRADES };
    }
    if (typeof gameState !== 'undefined') {
        gameState.gold = 75;
        gameState.floor = 1;
        gameState.bestFloor = 1;
        gameState.scoreProgress = 0;
        gameState.totalScore = 0;
        gameState.diamonds = 0;
        gameState.redDiamonds = 0;
        gameState.gameOver = false;
        gameState.paused = true;
    }

    // 4. Bütün interfeysi (UI) dərhal sıfırlanmış şəkildə yeniləyirik
    updatePlayerHeaderUI();
    if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
    if (typeof renderLab === 'function') renderLab();
    if (typeof renderShop === 'function') renderShop();
    if (typeof INBOX !== 'undefined' && typeof INBOX.updateWsPlayer === 'function') {
        INBOX.updateWsPlayer(null);
    }

    showToast('Hesabdan çıxış edildi. Bütün məlumatlar bazada saxlanıldı.', 'info');

    // 5. İstifadəçini dərhal Giriş səhifəsinə / modalına yönləndiririk
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('shop.html') || currentPath.endsWith('game.html') || currentPath.endsWith('guide.html')) {
        window.location.href = 'index.html?auth=login';
        return;
    }

    document.documentElement.classList.add('auth-locked');
    const dashView = document.getElementById('dashboard-view');
    if (dashView) dashView.classList.add('hidden');

    if (typeof openAuthModal === 'function') {
        openAuthModal('login', true);
    }
}
window.confirmLogoutAction = confirmLogoutAction;

// Sənəd hazır olanda inisializasiya
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});


// ==================== GİRİŞ PORTALI SƏHİFƏSİ MENECERİ ====================
let portalAuthMode = 'login';

function checkSavedAccountOnLoad() {
    const savedBox = document.getElementById('auth-saved-account-box');
    const formBox = document.getElementById('auth-form-box');
    const avatar = document.getElementById('auth-saved-avatar');
    const name = document.getElementById('auth-saved-name');
    const idEl = document.getElementById('auth-saved-id');

    if (currentPlayer && currentPlayer.playerId) {
        if (savedBox) savedBox.classList.remove('hidden');
        if (formBox) formBox.classList.add('hidden');
        if (avatar) avatar.innerText = (currentPlayer.username || 'P').charAt(0).toUpperCase();
        if (name) name.innerText = currentPlayer.username || 'Player';
        if (idEl) idEl.innerText = `ID: #${currentPlayer.playerId}`;
    } else {
        if (savedBox) savedBox.classList.add('hidden');
        if (formBox) formBox.classList.remove('hidden');
    }
}

function showAuthView() {
    const authView = document.getElementById('auth-view');
    const dashView = document.getElementById('dashboard-view');
    const gameScreen = document.getElementById('game-screen-container');

    if (authView) {
        authView.classList.remove('hidden');
        if (dashView) dashView.classList.add('hidden');
        if (gameScreen) gameScreen.classList.add('hidden');
        checkSavedAccountOnLoad();
    } else {
        // auth-view yoxdursa (index.html modal rejimindədirsə), dashboard-u göstər
        if (dashView) dashView.classList.remove('hidden');
        if (typeof showDashboardView === 'function') showDashboardView();
    }
}

function enterDashboard() {
    const authView = document.getElementById('auth-view');
    if (authView) authView.classList.add('hidden');

    if (typeof showDashboardView === 'function') {
        showDashboardView();
    }
}

function switchToManualAuth() {
    const savedBox = document.getElementById('auth-saved-account-box');
    const formBox = document.getElementById('auth-form-box');
    if (savedBox) savedBox.classList.add('hidden');
    if (formBox) formBox.classList.remove('hidden');
}

function switchAuthPortalTab(mode) {
    portalAuthMode = mode;
    const btnLoginTab = document.getElementById('auth-tab-btn-login');
    const btnRegTab = document.getElementById('auth-tab-btn-register');
    const note = document.getElementById('auth-portal-note');
    const submitBtn = document.getElementById('portal-submit-btn');
    const err = document.getElementById('portal-error-msg');
    if (err) err.textContent = '';

    if (mode === 'login') {
        if (btnLoginTab) btnLoginTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs bg-cyan-600 text-white shadow transition';
        if (btnRegTab) btnRegTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs text-slate-400 hover:text-slate-200 transition';
        if (note) note.textContent = 'Giriş üçün adınızı və ya 7 rəqəmli ID-nizi daxil edin:';
        if (submitBtn) submitBtn.textContent = 'DAXİL OL';
    } else {
        if (btnLoginTab) btnLoginTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs text-slate-400 hover:text-slate-200 transition';
        if (btnRegTab) btnRegTab.className = 'flex-1 py-2 rounded-xl font-orbitron font-bold text-xs bg-emerald-600 text-white shadow transition';
        if (note) note.textContent = 'Yeni hesab yaradın və avtomatik 7 rəqəmli ID əldə edin:';
        if (submitBtn) submitBtn.textContent = 'QEYDİYYATDAN KEÇ';
    }
}

async function handlePortalAuthSubmit() {
    const userInput = document.getElementById('portal-input-username');
    const pinInput = document.getElementById('portal-input-pin');
    const err = document.getElementById('portal-error-msg');

    const userVal = userInput ? userInput.value.trim() : '';
    const pinVal = pinInput ? pinInput.value.trim() : '';

    if (!userVal || !pinVal) {
        if (err) err.textContent = 'Zəhmət olmasa bütün xanaları doldurun!';
        return;
    }

    if (portalAuthMode === 'login') {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: userVal, pin: pinVal })
            });
            const data = await res.json();
            if (!data.success) {
                if (err) err.textContent = data.message || 'Giriş uğursuz oldu!';
                return;
            }

            currentPlayer = data.player;
            window.currentPlayer = currentPlayer;
            localStorage.setItem('floor_escape_player', JSON.stringify(currentPlayer));
            applyPlayerDataFromCloud(data.player);
            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            if (typeof updateDashboardUI === 'function') updateDashboardUI();
            if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();

            showToast(`Xoş gəldin, ${currentPlayer.username}! (ID: #${currentPlayer.playerId})`, 'success');
            enterDashboard();
        } catch (e) {
            if (err) err.textContent = 'Serverlə əlaqə xətası: ' + e.message;
        }
    } else {
        // Qeydiyyat
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userVal,
                    pin: pinVal,
                    gold: gameState.gold || 75,
                    diamonds: diamonds || 0,
                    redDiamonds: redDiamonds || 0,
                    bestFloor: gameState.bestFloor || 1,
                    permUpgrades: permUpgrades || {},
                    claimedChests: claimedChests || []
                })
            });
            const data = await res.json();
            if (!data.success) {
                if (err) err.textContent = data.message || 'Qeydiyyat xətası!';
                return;
            }

            currentPlayer = data.player;
            window.currentPlayer = currentPlayer;
            localStorage.setItem('floor_escape_player', JSON.stringify(currentPlayer));
            updatePlayerHeaderUI();
            if (typeof renderHeaderProfile === 'function') renderHeaderProfile();
            if (typeof updateDashboardUI === 'function') updateDashboardUI();
            if (typeof updateHomeDashboardData === 'function') updateHomeDashboardData();

            showToast(`Hesab yaradıldı! Sizin Unikal ID: #${currentPlayer.playerId}`, 'success');
            enterDashboard();
        } catch (e) {
            if (err) err.textContent = 'Serverlə əlaqə xətası: ' + e.message;
        }
    }
}

function loginAsGuest() {
    showToast('Qonaq rejimi ilə davam edilir', 'info');
    enterDashboard();
}


// ==================== AĞILLI SESSİYA VƏ AÇILIŞ MARŞRUTU ====================
function checkInitialAuthRoute() {
    try {
        const savedPlayer = localStorage.getItem('floor_escape_player');
        if (savedPlayer) {
            currentPlayer = JSON.parse(savedPlayer);
            if (currentPlayer && currentPlayer.playerId) {
                updatePlayerHeaderUI();
                fetchLatestPlayerData();
                // Əgər daxil olubsa, birbaşa Daşborda keçir (səhifə yenilənəndə çölə atmır!)
                enterDashboard();
                return;
            }
        }
    } catch(e) {
        console.error('Sessiya yoxlanarkən xəta:', e);
    }

    // Əgər hesab yoxdursa
    const authView = document.getElementById('auth-view');
    if (authView) {
        showAuthView();
    } else {
        enterDashboard();
    }
}
window.checkInitialAuthRoute = checkInitialAuthRoute;
