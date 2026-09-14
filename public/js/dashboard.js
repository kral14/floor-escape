// DAŞBORD SƏHİFƏSİ VƏ LİDERLƏR CƏDVƏLİ MENECERİ

let isDashboardActive = true;

function getSavedNavPage() {
    try {
        const saved = localStorage.getItem('floor_escape_active_nav_page');
        if (saved && ['home', 'shop', 'leaderboard', 'chat', 'giftcode'].includes(saved)) {
            return saved;
        }
    } catch (e) {}
    return 'home';
}

let currentNavPage = getSavedNavPage(); // 'home' | 'shop' | 'leaderboard' | 'chat' | 'giftcode'

// ==================== SƏHİFƏLƏR ARASI KEÇİD (VIEW ROUTER) ====================

function showDashboardView() {
    isDashboardActive = true;
    gameState.paused = true;

    const authView = document.getElementById('auth-view');
    const dashView = document.getElementById('dashboard-view');
    const gameScreen = document.getElementById('game-screen-container');

    if (authView) authView.classList.add('hidden');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (dashView) dashView.classList.remove('hidden');

    updateDashboardUI();
    const targetPage = currentNavPage || getSavedNavPage();
    switchNavPage(targetPage);

    if (typeof dismissAppBootCurtain === 'function') {
        dismissAppBootCurtain();
    }
}

function showGameView() {
    isDashboardActive = false;
    gameState.paused = false;

    const authView = document.getElementById('auth-view');
    const dashView = document.getElementById('dashboard-view');
    const gameScreen = document.getElementById('game-screen-container');

    if (authView) authView.classList.add('hidden');
    if (dashView) dashView.classList.add('hidden');
    if (gameScreen) {
        gameScreen.classList.remove('hidden');
        if (typeof adjustViewportFit === 'function') {
            adjustViewportFit();
            requestAnimationFrame(adjustViewportFit);
        }
    }

    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.focus();

    audio.init();
    updateUI();
}

function startGameFromDashboard(forceNew = false) {
    const p = window.currentPlayer || (typeof currentPlayer !== 'undefined' ? currentPlayer : null);
    if (!p || !p.playerId) {
        if (typeof openAuthModal === 'function') {
            openAuthModal('login', true);
        }
        return;
    }
    if (forceNew) {
        localStorage.removeItem('floor_escape_active_run');
    }
    sessionStorage.setItem('floor_escape_play_intro', 'true');
    // Daşborddan oyuna eyni tabda birbaşa keçid
    window.location.href = 'game.html';
}

function returnToDashboard() {
    try {
        if (typeof gameState !== 'undefined' && !gameState.gameOver) {
            if (typeof saveActiveRun === 'function') saveActiveRun();
        }
        if (typeof syncPlayerDataCloud === 'function') {
            syncPlayerDataCloud(true);
        }
    } catch (e) {
        console.warn('Yadda saxlanarkən xəta:', e);
    }
    // Oyundan Daşborda eyni tabda birbaşa qayıdış
    window.location.href = 'index.html';
}

// ==================== MENYU NAVİQASİYASI (NAV TABS) ====================

function switchNavPage(pageId) {
    if (!['home', 'shop', 'leaderboard', 'chat', 'giftcode'].includes(pageId)) {
        pageId = 'home';
    }
    currentNavPage = pageId;
    try {
        localStorage.setItem('floor_escape_active_nav_page', pageId);
        document.documentElement.setAttribute('data-initial-nav', pageId);
    } catch (e) {}
    const pages = ['home', 'shop', 'leaderboard', 'chat', 'giftcode'];

    pages.forEach(p => {
        const navBtn = document.getElementById(`nav-btn-${p}`);
        const pageEl = document.getElementById(`nav-page-${p}`);

        if (p === pageId) {
            if (navBtn) navBtn.classList.add('active');
            if (pageEl) pageEl.classList.remove('hidden');
        } else {
            if (navBtn) navBtn.classList.remove('active');
            if (pageEl) pageEl.classList.add('hidden');
        }
    });

    // 🎛️ Header Rejimləri: Mağazada yalnız Geri düyməsi + Balanslar (Qızıl və Almazlar) görünür
    const stdHeader = document.getElementById('dash-header-standard');
    const shopHeader = document.getElementById('dash-header-shop-bar');

    const chatWidget = document.getElementById('global-chat-widget');
    if (pageId === 'shop') {
        if (stdHeader) stdHeader.classList.add('hidden');
        if (shopHeader) {
            shopHeader.classList.remove('hidden');
            shopHeader.classList.add('flex');
        }
        if (chatWidget) chatWidget.classList.add('hidden');
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    } else {
        if (stdHeader) stdHeader.classList.remove('hidden');
        if (shopHeader) {
            shopHeader.classList.add('hidden');
            shopHeader.classList.remove('flex');
        }
        if (chatWidget) chatWidget.classList.remove('hidden');
    }

    if (pageId === 'home') {
        updateHomeDashboardData();
        startDashboardPreviewAnimation();
    } else if (pageId === 'shop') {
        const labTabToOpen = (typeof getSavedLabTab === 'function') ? getSavedLabTab() : (typeof currentLabTab !== 'undefined' && currentLabTab ? currentLabTab : 'skins');
        if (typeof switchLabTab === 'function') switchLabTab(labTabToOpen);
        if (labTabToOpen === 'skins') {
            const subTabToOpen = (typeof getSavedSkinSubTab === 'function') ? getSavedSkinSubTab() : (localStorage.getItem('floor_escape_active_skin_subtab') || 'skins');
            if (typeof switchSkinSubTab === 'function') {
                switchSkinSubTab(subTabToOpen);
            } else if (typeof renderSkinsShop === 'function') {
                renderSkinsShop();
            }
        }
        if (typeof updatePermUpgradesUI === 'function') updatePermUpgradesUI();
        if (typeof updateTurretsUI === 'function') updateTurretsUI();
    } else if (pageId === 'leaderboard') {
        loadLeaderboardData();
    } else if (pageId === 'chat') {
        fetchChatMessages(true);
    }
}

// ==================== ANA SƏHİFƏ STATİSTİKALARI ====================

function updateHomeDashboardData() {
    const p = window.currentPlayer || currentPlayer;
    const user = (p && p.username) ? p.username : 'Giriş edilməyib';
    const bestF = (p && typeof gameState !== 'undefined' && gameState.bestFloor) ? gameState.bestFloor : 1;
    const curGold = Math.floor((p && typeof gameState !== 'undefined' && gameState.gold !== undefined) ? gameState.gold : 0);
    const curFloor = (typeof gameState !== 'undefined' && gameState.floor) ? gameState.floor : 1;
    const curReq = (typeof gameState !== 'undefined' && gameState.scoreReq) ? gameState.scoreReq : 3;
    const curProg = (p && typeof gameState !== 'undefined' && gameState.scoreProgress) ? gameState.scoreProgress : 0;
    const pId = (p && p.playerId) ? String(p.playerId).padStart(7, '0') : '-------';

    // 1. Xoş gəldin banneri
    const welcomeEl = document.getElementById('home-welcome-name') || document.getElementById('dash-welcome-name');
    if (welcomeEl) welcomeEl.innerText = user;

    const idTagEl = document.getElementById('home-player-id-tag');
    if (idTagEl) idTagEl.innerText = `#${pId}`;

    const bestFloorStatEl = document.getElementById('home-stat-highest-floor') || document.getElementById('dash-hero-best-floor');
    if (bestFloorStatEl) bestFloorStatEl.innerText = bestF;

    const totalGoldStatEl = document.getElementById('home-stat-total-gold') || document.getElementById('dash-hero-gold');
    if (totalGoldStatEl) {
        totalGoldStatEl.innerText = curGold >= 1000 ? `${(curGold / 1000).toFixed(1)}K` : curGold;
    }

    // 2. Cari İrəliləyiş (Qat progress)
    const curFloorBigEl = document.getElementById('home-current-floor-big') || document.getElementById('dash-cur-floor');
    if (curFloorBigEl) curFloorBigEl.innerText = curFloor;

    const progressSubEl = document.getElementById('home-progress-subtitle');
    if (progressSubEl) progressSubEl.innerText = `Qat ${curFloor} - Davam edir`;

    const nextTargetEl = document.getElementById('home-next-target-text') || document.getElementById('dash-cur-req');
    if (nextTargetEl) nextTargetEl.innerText = `${curProg}/${curReq} XAL`;

    const xpPct = Math.min(100, Math.round((curProg / curReq) * 100));
    const floorXpBar = document.getElementById('home-floor-xp-bar') || document.getElementById('dash-cur-xp-fill');
    if (floorXpBar) floorXpBar.style.width = `${xpPct}%`;

    const xpBadgeEl = document.getElementById('home-progress-badge-pct') || document.getElementById('dash-cur-xp-pct');
    if (xpBadgeEl) xpBadgeEl.innerText = `${xpPct}%`;

    // 3. Sağ Sütun Profil Kartı
    const profNameEl = document.getElementById('home-profile-display-name') || document.getElementById('dash-profile-name');
    if (profNameEl) profNameEl.innerText = user;

    const profHandleEl = document.getElementById('home-profile-handle') || document.getElementById('dash-profile-handle');
    if (profHandleEl) profHandleEl.innerText = `@${user.toLowerCase().replace(/\s+/g, '_')}`;

    const profAvatarBig = document.getElementById('home-profile-avatar-big');
    if (profAvatarBig) profAvatarBig.innerText = user.charAt(0).toUpperCase();

    const profLevelEl = document.getElementById('home-profile-level-text');
    if (profLevelEl) profLevelEl.innerText = `Səviyyə ${bestF}`;

    const profRecordCard = document.getElementById('home-profile-card-record');
    if (profRecordCard) profRecordCard.innerText = bestF;

    const profGoldCard = document.getElementById('home-profile-card-gold');
    if (profGoldCard) {
        profGoldCard.innerText = curGold >= 1000 ? `${(curGold / 1000).toFixed(1)}K` : curGold;
    }

    // Davam et düyməsi (əgər aktiv oyun varsa)
    const resumeBtn = document.getElementById('home-resume-game-btn') || document.getElementById('dash-resume-game-btn');
    const saved = JSON.parse(localStorage.getItem('floor_escape_active_run') || 'null');
    if (resumeBtn) {
        if (saved && saved.hasActiveRun && !gameState.gameOver) {
            resumeBtn.classList.remove('hidden');
        } else {
            resumeBtn.classList.add('hidden');
        }
    }

    // Mərhələlər
    updateLevelTiles(bestF);

    // Nailiyyətlər
    updateAchievementsUI(bestF, curGold);

    // Reytinq
    loadLeaderboardData();
}

function updateLevelTiles(bestFloor) {
    // Mərhələlər bloku istifadəçi istəyi ilə silinib
}

function updateAchievementsUI(bestFloor, gold) {
    // Statik kartlar mövcuddur
}

function updateDashboardUI() {
    const p = window.currentPlayer || currentPlayer;
    // Resurslar (Çıxış edilibsə və ya hesab yoxdursa təmiz 0 göstərilir)
    const curGold = p ? Math.floor((typeof gameState !== 'undefined' && gameState.gold !== undefined) ? gameState.gold : 75) : 0;
    const curDia = p ? Math.floor((typeof diamonds !== 'undefined') ? diamonds : ((typeof gameState !== 'undefined' && gameState.diamonds) || 0)) : 0;
    const curRedDia = p ? Math.floor((typeof redDiamonds !== 'undefined') ? redDiamonds : ((typeof gameState !== 'undefined' && gameState.redDiamonds) || 0)) : 0;

    const goldEls = [document.getElementById('dash-stat-gold'), ...document.querySelectorAll('.dash-stat-gold')];
    goldEls.forEach(el => { if (el) el.innerText = curGold; });

    const diaEls = [document.getElementById('dash-stat-diamonds'), ...document.querySelectorAll('.dash-stat-diamonds')];
    diaEls.forEach(el => { if (el) el.innerText = curDia; });

    const redDiaEls = [document.getElementById('dash-stat-red-diamonds'), ...document.querySelectorAll('.stat-red-diamonds')];
    redDiaEls.forEach(el => { if (el) el.innerText = curRedDia; });

    // Header Profil
    renderHeaderProfile();

    // Ana səhifə məlumatları
    updateHomeDashboardData();
}

function renderHeaderProfile() {
    const profileContainer = document.getElementById('dash-header-profile') || document.getElementById('dash-profile-card');
    if (!profileContainer) return;

    let p = window.currentPlayer || currentPlayer;
    if (!p || !p.playerId) {
        try {
            const saved = localStorage.getItem('floor_escape_player');
            if (saved) {
                p = JSON.parse(saved);
                window.currentPlayer = p;
                currentPlayer = p;
            }
        } catch (e) {}
    }

    if (p && p.playerId) {
        const pId = String(p.playerId).padStart(7, '0');
        const initial = (p.username || 'P').charAt(0).toUpperCase();

        profileContainer.innerHTML = `
            <div class="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-cyan-500/40 shadow-md">
                <div class="avatar w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-orbitron font-bold text-white text-xs shadow-inner">
                    ${initial}
                </div>
                <div class="flex flex-col text-left">
                    <p class="text-xs font-bold text-slate-200 leading-tight max-w-[85px] truncate" title="${escapeHtml(p.username)}">${escapeHtml(p.username)}</p>
                    <button tabindex="-1" onclick="copyPlayerId('${p.playerId}');" class="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 leading-tight text-left cursor-pointer">#${pId}</button>
                </div>
                <button tabindex="-1" onclick="logoutPlayer();" class="ml-1 w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 flex items-center justify-center text-xs transition cursor-pointer" title="Çıxış et">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        profileContainer.innerHTML = `
            <button tabindex="-1" onclick="openAuthModal('login'); this.blur();" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition cursor-pointer">
                <i class="fa-solid fa-user text-cyan-200 text-xs"></i>
                <span>GİRİŞ</span>
            </button>
        `;
    }
}
window.renderHeaderProfile = renderHeaderProfile;

// ==================== LİDERLƏR CƏDVƏLİ ====================

async function loadLeaderboardData() {
    const tableBody = document.getElementById('dash-leaderboard-tbody');
    const previewContainer = document.getElementById('home-leaderboard-preview-list') || document.getElementById('dash-leaderboard-preview');
    const loadingEl = document.getElementById('dash-leaderboard-loading');

    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();

        if (loadingEl) loadingEl.classList.add('hidden');

        if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 text-xs font-orbitron">Hələ heç bir oyunçu qeydiyyatdan keçməyib. İlk sən ol!</td></tr>`;
            }
            return;
        }

        const list = data.leaderboard;

        // Cari oyunçunun reytinq nömrəsini təyin et
        let myRank = 1;
        if (currentPlayer && currentPlayer.playerId) {
            const myRankIndex = list.findIndex(p => p.player_id === currentPlayer.playerId);
            myRank = myRankIndex !== -1 ? myRankIndex + 1 : list.length + 1;
        }
        const rankPosEl = document.getElementById('home-rank-position');
        if (rankPosEl) rankPosEl.innerText = `#${myRank}`;

        // 1. Ana səhifədəki kiçik reytinq xülasəsi
        if (previewContainer) {
            const top3 = list.slice(0, 3);
            let previewHtml = top3.map((p, index) => {
                const rank = index + 1;
                const colors = ['from-amber-400 to-amber-600', 'from-slate-300 to-slate-500', 'from-amber-700 to-amber-900'];
                return `
                    <div class="lb-row flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg bg-gradient-to-tr ${colors[index] || 'from-slate-700 to-slate-800'} flex items-center justify-center font-orbitron font-bold text-slate-950 text-[10px]">
                            ${rank}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-slate-200 truncate">${escapeHtml(p.username)}</p>
                            <p class="text-[10px] text-slate-400">Qat ${p.best_floor}</p>
                        </div>
                        ${rank === 1 ? '<i class="fa-solid fa-crown text-amber-400 text-xs"></i>' : ''}
                    </div>
                `;
            }).join('');

            // Əgər cari oyunçu varsa və top 3-də deyilsə, onu da göstər
            if (currentPlayer && currentPlayer.playerId) {
                previewHtml += `
                    <div class="lb-row me flex items-center gap-3 mt-1">
                        <div class="w-7 h-7 rounded-lg bg-cyan-500/25 flex items-center justify-center font-orbitron font-bold text-cyan-300 text-[10px]">
                            ${myRank}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-cyan-300 truncate">${escapeHtml(currentPlayer.username)} (Sən)</p>
                            <p class="text-[10px] text-slate-400">Qat ${gameState.bestFloor || 1}</p>
                        </div>
                    </div>
                `;
            }

            previewContainer.innerHTML = previewHtml;
        }

        // 2. Tam reytinq cədvəli
        if (tableBody) {
            tableBody.innerHTML = list.map((p, index) => {
                const rank = index + 1;
                let rankBadge = `<span class="font-orbitron font-bold text-xs text-slate-400">#${rank}</span>`;
                if (rank === 1) rankBadge = `<span class="text-base" title="1-ci yer">🥇</span>`;
                else if (rank === 2) rankBadge = `<span class="text-base" title="2-ci yer">🥈</span>`;
                else if (rank === 3) rankBadge = `<span class="text-base" title="3-cü yer">🥉</span>`;

                const isMe = currentPlayer && currentPlayer.playerId === p.player_id;
                const rowClass = isMe 
                    ? 'bg-cyan-950/50 border-l-4 border-cyan-400 text-cyan-200' 
                    : 'hover:bg-slate-800/40 border-b border-slate-800/60';

                return `
                    <tr class="${rowClass} transition">
                        <td class="py-3 px-4 text-center">${rankBadge}</td>
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-2.5">
                                <div class="w-7 h-7 rounded-lg ${isMe ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'} flex items-center justify-center font-bold text-xs font-orbitron shadow-sm">
                                    ${(p.username || 'P').charAt(0).toUpperCase()}
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-orbitron font-bold text-xs ${isMe ? 'text-cyan-300 font-extrabold' : 'text-slate-200'}">
                                        ${escapeHtml(p.username)} ${isMe ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded ml-1">SƏN</span>' : ''}
                                    </span>
                                    <span class="font-mono text-[9px] text-slate-400">ID: #${p.player_id}</span>
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-center">
                            <span class="font-orbitron font-bold text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                ${p.best_floor} Qat
                            </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex items-center justify-center gap-3 text-xs font-orbitron">
                                <span class="text-sky-400 font-bold flex items-center gap-1">${p.diamonds || 0} ${(typeof ICONS !== 'undefined') ? ICONS.cyanDiamond({ size: 13 }) : '💎'}</span>
                                <span class="text-rose-400 font-bold flex items-center gap-1">${p.red_diamonds || 0} ${(typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 13 }) : '💎'}</span>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-right">
                            <span class="font-orbitron font-bold text-xs text-amber-300">${Math.round(p.gold || 0)} 🪙</span>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (e) {
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

// ==================== İNİTİALİZASİYA ====================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initChatPolling === 'function') {
        initChatPolling();
    }
    const targetPage = currentNavPage || getSavedNavPage();
    if (targetPage === 'home' && typeof startDashboardPreviewAnimation === 'function') {
        startDashboardPreviewAnimation();
    }
});


