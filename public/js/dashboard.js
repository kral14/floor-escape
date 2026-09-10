// DAŞBORD SƏHİFƏSİ, LİDERLƏR CƏDVƏLİ VƏ QLOBAL ÇAT MENECERİ

let chatPollingInterval = null;
let lastMessageId = 0;
let isChatOpen = false;
let unreadChatCount = 0;
let isDashboardActive = true;
let currentNavPage = 'home'; // 'home' | 'shop' | 'leaderboard' | 'chat' | 'giftcode'

// ==================== SƏHİFƏLƏR ARASI KEÇİD (VIEW ROUTER) ====================

function showDashboardView() {
    isDashboardActive = true;
    gameState.paused = true;

    const dashView = document.getElementById('dashboard-view');
    const gameScreen = document.getElementById('game-screen-container');

    if (dashView) dashView.classList.remove('hidden');
    if (gameScreen) gameScreen.classList.add('hidden');

    updateDashboardUI();
    switchNavPage(currentNavPage || 'home');
}

function showGameView() {
    isDashboardActive = false;
    gameState.paused = false;

    const dashView = document.getElementById('dashboard-view');
    const gameScreen = document.getElementById('game-screen-container');

    if (dashView) dashView.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');

    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.focus();

    audio.init();
    updateUI();
}

function startGameFromDashboard(forceNew = false) {
    if (forceNew) {
        restartGame();
    } else {
        const saved = JSON.parse(localStorage.getItem('floor_escape_active_run'));
        if (!saved || !saved.hasActiveRun || gameState.gameOver) {
            restartGame();
        }
    }
    showGameView();
}

function returnToDashboard() {
    if (!gameState.gameOver) {
        saveActiveRun();
    }
    if (typeof syncPlayerDataCloud === 'function') {
        syncPlayerDataCloud(true);
    }
    showDashboardView();
}

// ==================== MENYU NAVİQASİYASI (NAV TABS) ====================

function switchNavPage(pageId) {
    currentNavPage = pageId;
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

    if (pageId === 'home') {
        updateHomeDashboardData();
        startDashboardPreviewAnimation();
    } else if (pageId === 'shop') {
        updatePermUpgradesUI();
        updateTurretsUI();
    } else if (pageId === 'leaderboard') {
        loadLeaderboardData();
    } else if (pageId === 'chat') {
        fetchChatMessages(true);
    }
}

// ==================== ANA SƏHİFƏ STATİSTİKALARI ====================

function updateHomeDashboardData() {
    const user = currentPlayer ? currentPlayer.username : 'Oyunçu';
    const bestF = gameState.bestFloor || 1;
    const curGold = Math.floor(gameState.gold || 0);
    const curFloor = gameState.floor || 1;
    const curReq = gameState.scoreReq || 3;
    const curProg = gameState.scoreProgress || 0;
    const pId = currentPlayer && currentPlayer.playerId ? String(currentPlayer.playerId).padStart(7, '0') : '0000000';

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
    // Resurslar
    const goldEls = [document.getElementById('dash-stat-gold'), ...document.querySelectorAll('.dash-stat-gold')];
    goldEls.forEach(el => { if (el) el.innerText = Math.floor(gameState.gold || 0); });

    const diaEls = [document.getElementById('dash-stat-diamonds'), ...document.querySelectorAll('.dash-stat-diamonds')];
    diaEls.forEach(el => { if (el) el.innerText = Math.floor(gameState.diamonds || 0); });

    const redDiaEls = [document.getElementById('dash-stat-red-diamonds'), ...document.querySelectorAll('.stat-red-diamonds')];
    redDiaEls.forEach(el => { if (el) el.innerText = Math.floor(gameState.redDiamonds || 0); });

    // Header Profil
    renderHeaderProfile();

    // Ana səhifə məlumatları
    updateHomeDashboardData();
}

function renderHeaderProfile() {
    const profileContainer = document.getElementById('dash-header-profile') || document.getElementById('dash-profile-card');
    if (!profileContainer) return;

    if (currentPlayer && currentPlayer.playerId) {
        const pId = String(currentPlayer.playerId).padStart(7, '0');
        const initial = (currentPlayer.username || 'P').charAt(0).toUpperCase();
        const bestF = gameState.bestFloor || 1;

        profileContainer.innerHTML = `
            <div class="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-cyan-500/30">
                <div class="avatar w-8 h-8 rounded-lg flex items-center justify-center font-orbitron font-bold text-slate-950 text-xs shadow-inner">
                    ${initial}
                </div>
                <div class="flex flex-col text-left">
                    <p class="text-xs font-bold text-slate-200 leading-tight max-w-[80px] truncate">${escapeHtml(currentPlayer.username)}</p>
                    <button tabindex="-1" onclick="copyPlayerId('${currentPlayer.playerId}');" class="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 leading-tight text-left">#${pId}</button>
                </div>
                <button tabindex="-1" onclick="logoutPlayer();" class="ml-1 text-slate-500 hover:text-rose-400 text-xs transition" title="Çıxış et">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        profileContainer.innerHTML = `
            <button tabindex="-1" onclick="openAuthModal('login'); this.blur();" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-md transition">
                <i class="fa-solid fa-user text-cyan-200 text-xs"></i>
                <span>GİRİŞ</span>
            </button>
        `;
    }
}

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
                                <span class="text-sky-400 font-bold">${p.diamonds || 0} 💎</span>
                                <span class="text-rose-400 font-bold">${p.red_diamonds || 0} 💎🔴</span>
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

// ==================== QLOBAL CANLI ÇAT ====================

function toggleChat() {
    isChatOpen = !isChatOpen;
    const chatContainer = document.getElementById('chat-drawer');
    const badge = document.getElementById('chat-unread-badge');

    if (!chatContainer) return;

    if (isChatOpen) {
        chatContainer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        chatContainer.classList.add('translate-y-0', 'opacity-100');
        unreadChatCount = 0;
        if (badge) badge.classList.add('hidden');
        fetchChatMessages(true);
    } else {
        chatContainer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
        chatContainer.classList.remove('translate-y-0', 'opacity-100');
    }
}

async function fetchChatMessages(autoScroll = false) {
    try {
        const res = await fetch('/api/chat/messages');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.messages) {
            renderChatMessages(data.messages, autoScroll);
        }
    } catch (e) {
        // Sakit rejim
    }
}

function renderChatMessages(messages, forceScroll = false) {
    const lists = [
        document.getElementById('chat-messages-list'),
        document.getElementById('dash-chat-messages-list')
    ];

    let hasNew = false;
    const htmlContent = messages.map(m => {
        if (m.id > lastMessageId) {
            lastMessageId = m.id;
            hasNew = true;
        }

        const isMe = currentPlayer && currentPlayer.playerId === m.player_id;
        const timeStr = m.created_at ? formatChatTime(m.created_at) : '';

        return `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2.5">
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="font-orbitron font-bold text-[10px] ${isMe ? 'text-cyan-300' : 'text-amber-400'}">${escapeHtml(m.username)}</span>
                    <span class="text-[8px] font-mono text-slate-500">#${m.player_id}</span>
                    <span class="text-[8px] text-slate-500 ml-1">${timeStr}</span>
                </div>
                <div class="max-w-[85%] px-3 py-1.5 rounded-2xl text-xs break-words shadow-sm ${isMe ? 'bg-cyan-600/90 text-white rounded-tr-none' : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60'}">
                    ${escapeHtml(m.message)}
                </div>
            </div>
        `;
    }).join('');

    lists.forEach(listEl => {
        if (!listEl) return;
        const atBottom = listEl.scrollHeight - listEl.scrollTop <= listEl.clientHeight + 40;
        listEl.innerHTML = htmlContent;
        if (forceScroll || atBottom) {
            listEl.scrollTop = listEl.scrollHeight;
        }
    });

    if (hasNew && !isChatOpen && currentNavPage !== 'chat') {
        unreadChatCount++;
        const badge = document.getElementById('chat-unread-badge');
        if (badge) {
            badge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
            badge.classList.remove('hidden');
        }
    }
}

async function sendChatMessage(inputSource = 'drawer') {
    if (!currentPlayer || !currentPlayer.playerId) {
        showToast('Çatda mesaj yazmaq üçün əvvəlcə daxil olun!', 'warning');
        openAuthModal('login');
        return;
    }

    const inputId = inputSource === 'dash' ? 'dash-chat-input-text' : 'chat-input-text';
    const input = document.getElementById(inputId);
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    try {
        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: currentPlayer.playerId,
                username: currentPlayer.username,
                message: msg
            })
        });

        const data = await res.json();
        if (data.success) {
            input.value = '';
            await fetchChatMessages(true);
        } else {
            showToast(data.message || 'Mesaj göndərilmədi', 'error');
        }
    } catch (e) {
        showToast('Serverlə əlaqə qurulmadı', 'error');
    }
}

function formatChatTime(dateStr) {
    try {
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== DAŞBORD CANLI OYUN PREVIEW ANİMASİYASI ====================

// ==================== DAŞBORD CANLI OYUN PREVIEW ANİMASİYASI (REAL OYUN SİMULYASİYASI) ====================

let previewAnimId = null;
let previewState = {
    player: { x: 320, y: 110, vx: 1.8, vy: 0.6, radius: 12, facing: Math.PI / 2, trail: [], dashTimer: 0, shootTimer: 0 },
    lavaY: 225,
    lavaSpeed: 0.16,
    lavaWave: 0,
    lavaIceTimer: 0,
    lavaShockTimer: 0,
    lavaWallTimer: 0,
    borderOpen: false,
    scoreProgress: 0,
    scoreReq: 5,
    bullets: [],
    coins: [],
    particles: [],
    turretShootTimer: 0
};

function initPreviewEntities(W, H) {
    previewState.player.x = W / 2;
    previewState.player.y = 90;
    previewState.lavaY = H - 35;
    previewState.borderOpen = false;
    previewState.scoreProgress = 0;
    previewState.bullets = [];
    previewState.particles = [];

    // Sikkələr
    previewState.coins = [];
    for (let i = 0; i < 7; i++) {
        previewState.coins.push({
            x: 50 + Math.random() * (W - 100),
            y: 55 + Math.random() * (H - 120),
            collected: false
        });
    }
}

function startDashboardPreviewAnimation() {
    if (previewAnimId) cancelAnimationFrame(previewAnimId);

    const canvas = document.getElementById('dash-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    initPreviewEntities(W, H);

    function renderLoop() {
        if (!isDashboardActive || currentNavPage !== 'home') {
            previewAnimId = null;
            return;
        }

        // 1. MEYDAN FONU (Real oyundakı kiber grid)
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Mərkəzi Qat Nişanı (Şəffaf Orbitron rəqəmi)
        const currentFloorNum = gameState.bestFloor || 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.font = 'bold 90px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentFloorNum, W / 2, H / 2 + 5);

        // 2. YUXARI SƏRHƏD QAPISI (BORDER LINE)
        const borderY = 32;
        ctx.save();
        if (previewState.borderOpen) {
            ctx.strokeStyle = '#00ff66';
            ctx.shadowColor = '#00ff66';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(15, borderY);
            ctx.lineTo(W - 15, borderY);
            ctx.stroke();

            ctx.fillStyle = '#00ff66';
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('🚪 SƏRHƏD AÇIQDIR! NÖVBƏTİ QATA KEÇ!', W / 2, borderY - 8);
        } else {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(15, borderY);
            ctx.lineTo(W - 15, borderY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 9px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`🔒 SƏRHƏD [${previewState.scoreProgress}/${previewState.scoreReq} TƏLƏB]`, W / 2, borderY - 8);
        }
        ctx.restore();

        // 2.1 ŞAQUİLİ DİVAR XƏTLƏRİ
        ctx.save();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(18, H);
        ctx.moveTo(W - 18, 0); ctx.lineTo(W - 18, H);
        ctx.stroke();
        ctx.restore();

        // 3. ƏKİZ AVTOMATİK QÜLLƏLƏR (Real oyundakı TwinTurrets-in 1:1 eynisi)
        if (!previewState.turretCooldown) previewState.turretCooldown = 5.0;
        if (previewState.turretRecoilLeft === undefined) previewState.turretRecoilLeft = 0;
        if (previewState.turretRecoilRight === undefined) previewState.turretRecoilRight = 0;

        previewState.turretCooldown -= 0.016;
        if (previewState.turretRecoilLeft > 0.1) previewState.turretRecoilLeft *= 0.85;
        if (previewState.turretRecoilRight > 0.1) previewState.turretRecoilRight *= 0.85;

        const turretY = 100;
        const turretLeftColor = '#00ffcc';
        const turretRightColor = '#00ffcc';

        // Qüllələrdən vaxtaşırı atəş
        if (previewState.turretCooldown <= 0) {
            previewState.turretCooldown = 5.0;
            previewState.turretRecoilLeft = 6;
            previewState.turretRecoilRight = 6;

            // Sol qüllə mərmisi
            const angleL = Math.PI * 0.38;
            previewState.bullets.push({
                x: 18 + Math.cos(angleL) * 16,
                y: turretY + Math.sin(angleL) * 16,
                vx: Math.cos(angleL) * 4.5,
                vy: Math.sin(angleL) * 4.5,
                type: 'ice',
                color: '#00ffff'
            });

            // Sağ qüllə mərmisi
            const angleR = Math.PI * 0.62;
            previewState.bullets.push({
                x: (W - 18) + Math.cos(angleR) * 16,
                y: turretY + Math.sin(angleR) * 16,
                vx: Math.cos(angleR) * 4.5,
                vy: Math.sin(angleR) * 4.5,
                type: 'shock',
                color: '#c084fc'
            });
        }

        function drawDashTurretUnit(tx, ty, dir, recoil, activeColor, cdText) {
            ctx.save();
            ctx.translate(tx, ty);

            // Baza korpusu (divara bərkidilmiş lövhə)
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(dir === 1 ? -18 : -6, -24, 24, 48, 6);
            } else {
                ctx.rect(dir === 1 ? -18 : -6, -24, 24, 48);
            }
            ctx.fill();
            ctx.stroke();

            // Enerji nüvəsi (seçilmiş mərmi rəngində parıltı)
            ctx.shadowBlur = 12;
            ctx.shadowColor = activeColor;
            ctx.fillStyle = activeColor;
            ctx.beginPath();
            ctx.arc(dir === 1 ? -2 : 2, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Fırlanan/aşağı tuşlanan lülə
            ctx.save();
            ctx.translate(dir === 1 ? 4 : -4, 0);
            const angle = dir === 1 ? Math.PI * 0.38 : Math.PI * 0.62;
            ctx.rotate(angle);

            // Lülə geri təpmə (recoil)
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-4 - recoil, -3.5, 18, 7, 2);
            } else {
                ctx.rect(-4 - recoil, -3.5, 18, 7);
            }
            ctx.fill();
            ctx.stroke();

            // Lülə ucluğu
            ctx.fillStyle = activeColor;
            ctx.fillRect(12 - recoil, -4.5, 3, 9);
            ctx.restore();

            // Taymer göstəricisi (Qüllənin üstündəki 4.5s yazısı)
            ctx.font = 'bold 9px Orbitron';
            ctx.fillStyle = activeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(cdText, dir === 1 ? 12 : -12, -26);

            ctx.restore();
        }

        const cdStr = `${Math.max(0, previewState.turretCooldown).toFixed(1)}s`;
        // Sol Qüllə
        drawDashTurretUnit(18, turretY, 1, previewState.turretRecoilLeft, turretLeftColor, cdStr);
        // Sağ Qüllə
        drawDashTurretUnit(W - 18, turretY, -1, previewState.turretRecoilRight, turretRightColor, cdStr);

        // 4. SİKKƏLƏR (Fırlanan qızıl dairələr)
        const coinTime = Date.now() * 0.005;
        previewState.coins.forEach(c => {
            if (c.collected) return;
            const coinScale = Math.cos(coinTime + c.x * 0.03);
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(Math.abs(coinScale) < 0.2 ? 0.2 : coinScale, 1);
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        });

        // 5. OYUNÇU HƏRƏKƏTİ VƏ FİZİKASI (Bizim Topumuz)
        const pl = previewState.player;
        pl.x += pl.vx;
        pl.y += pl.vy;

        // Meydan divarlarından əks olunma
        if (pl.x < 36) { pl.x = 36; pl.vx = Math.abs(pl.vx); }
        if (pl.x > W - 36) { pl.x = W - 36; pl.vx = -Math.abs(pl.vx); }
        if (pl.y < (previewState.borderOpen ? 15 : borderY + pl.radius + 4)) {
            pl.y = previewState.borderOpen ? 15 : borderY + pl.radius + 4;
            pl.vy = Math.abs(pl.vy);
            if (previewState.borderOpen) {
                // Növbəti qata keçid effekti!
                initPreviewEntities(W, H);
            }
        }
        if (pl.y > previewState.lavaY - 35) {
            pl.y = previewState.lavaY - 35;
            pl.vy = -Math.abs(pl.vy);
        }

        // Oyunçu izi (Trail)
        pl.trail.push({ x: pl.x, y: pl.y, alpha: 0.6 });
        if (pl.trail.length > 8) pl.trail.shift();

        // Sikkələri maqnitlə çəkmə
        previewState.coins.forEach(c => {
            if (c.collected) return;
            const dist = Math.hypot(pl.x - c.x, pl.y - c.y);
            if (dist < 55) {
                c.x += (pl.x - c.x) * 0.15;
                c.y += (pl.y - c.y) * 0.15;
            }
            if (dist < pl.radius + 6) {
                c.collected = true;
                for (let i = 0; i < 4; i++) {
                    previewState.particles.push({
                        x: c.x, y: c.y,
                        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                        color: '#fbbf24', life: 1, decay: 0.03
                    });
                }
            }
        });

        // Oyunçunun Dash etməsi
        pl.dashTimer++;
        if (pl.dashTimer > 180) {
            pl.dashTimer = 0;
            pl.x += (pl.vx > 0 ? 1 : -1) * 35;
            for (let i = 0; i < 10; i++) {
                previewState.particles.push({
                    x: pl.x, y: pl.y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    color: '#00ffff', life: 1, decay: 0.04
                });
            }
        }

        // Oyunçunun lavaya doğru mərmi atması (Aşağıya doğru)
        pl.shootTimer++;
        if (pl.shootTimer > 60) {
            pl.shootTimer = 0;
            const types = ['ice', 'shock', 'wall', 'mine'];
            const chosenType = types[Math.floor(Math.random() * types.length)];
            const colors = { ice: '#38bdf8', shock: '#c084fc', wall: '#f59e0b', mine: '#f43f5e' };

            previewState.bullets.push({
                x: pl.x,
                y: pl.y + pl.radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 4.8,
                type: chosenType,
                color: colors[chosenType]
            });
        }

        // Oyunçu İzi Rəngi (player.js-in 1:1 eynisi)
        pl.trail.forEach((t, i) => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, pl.radius * (i / pl.trail.length) * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 204, ${t.alpha * 0.25})`;
            ctx.fill();
        });

        // BİZİM TOPUMUZ (player.js və istifadəçinin oyun ekranının 1:1 eynisi)
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';

        // Xarici radial aura
        const grad = ctx.createRadialGradient(pl.x, pl.y, 0, pl.x, pl.y, pl.radius * 1.8);
        grad.addColorStop(0, 'rgba(0, 255, 204, 0.2)');
        grad.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Parlaq cyan/yaşıl top gövdəsi
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();

        // Sol yuxarıdakı ağ parlaq ləkə (Highlight)
        ctx.beginPath();
        ctx.arc(pl.x - 3.5, pl.y - 4, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fill();

        ctx.restore();

        // İstiqamət ucluğu (Aşağıya və ya hərəkət istiqamətinə yönəlmiş üçbucaq ucluq)
        ctx.save();
        ctx.translate(pl.x, pl.y);
        const facingAngle = Math.atan2(pl.vy, pl.vx) || (Math.PI / 2);
        ctx.rotate(facingAngle);
        ctx.beginPath();
        ctx.moveTo(pl.radius + 7, 0);
        ctx.lineTo(pl.radius - 2, -4);
        ctx.lineTo(pl.radius - 2, 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 204, 0.85)';
        ctx.fill();
        ctx.restore();

        // 6. MƏRMİLƏR (Aşağıya, lavaya doğru hərəkət edir)
        for (let i = previewState.bullets.length - 1; i >= 0; i--) {
            const b = previewState.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Mərmi lavaya dəyəndə
            if (b.y >= previewState.lavaY - 8) {
                previewState.scoreProgress++;
                if (previewState.scoreProgress >= previewState.scoreReq) {
                    previewState.borderOpen = true;
                }

                if (b.type === 'ice') {
                    previewState.lavaIceTimer = 80;
                } else if (b.type === 'shock') {
                    previewState.lavaShockTimer = 90;
                } else if (b.type === 'wall') {
                    previewState.lavaWallTimer = 100;
                } else if (b.type === 'mine') {
                    previewState.lavaY = Math.min(H - 20, previewState.lavaY + 16);
                }

                for (let p = 0; p < 8; p++) {
                    previewState.particles.push({
                        x: b.x, y: previewState.lavaY,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 3 - 0.5,
                        color: b.color,
                        life: 1,
                        decay: 0.035
                    });
                }
                previewState.bullets.splice(i, 1);
            }
        }

        // 7. QALXAN LAVA / CANAVAR MEXANİKASI
        if (previewState.lavaWallTimer > 0) previewState.lavaWallTimer--;
        if (previewState.lavaShockTimer > 0) previewState.lavaShockTimer--;
        if (previewState.lavaIceTimer > 0) previewState.lavaIceTimer--;

        // Lavaya maneə yoxdursa yavaş-yavaş yuxarı qalxır
        if (previewState.lavaWallTimer === 0 && previewState.lavaShockTimer === 0) {
            const currentLavaSpeed = previewState.lavaIceTimer > 0 ? previewState.lavaSpeed * 0.25 : previewState.lavaSpeed;
            previewState.lavaY -= currentLavaSpeed;
            if (previewState.lavaY < 130) {
                previewState.lavaY = H - 35; // Simulyasiyada dövr edir
            }
        }

        previewState.lavaWave += 0.04;
        const shockShakeX = previewState.lavaShockTimer > 0 ? (Math.random() - 0.5) * 4 : 0;

        // Lava qatı
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, previewState.lavaY);

        for (let x = 0; x <= W; x += 16) {
            const wave = Math.sin(x * 0.04 + previewState.lavaWave) * 5;
            ctx.lineTo(x + shockShakeX, previewState.lavaY + wave);
        }
        ctx.lineTo(W, H);
        ctx.closePath();

        let lavaColorTop = '#f97316';
        let lavaColorMid = '#ef4444';
        if (previewState.lavaIceTimer > 0) {
            lavaColorTop = '#38bdf8'; // Buz donması
            lavaColorMid = '#0284c7';
        } else if (previewState.lavaShockTimer > 0) {
            lavaColorTop = '#c084fc'; // Şok iflici
            lavaColorMid = '#7e22ce';
        }

        const lavaGrad = ctx.createLinearGradient(0, previewState.lavaY - 10, 0, H);
        lavaGrad.addColorStop(0, lavaColorTop);
        lavaGrad.addColorStop(0.4, lavaColorMid);
        lavaGrad.addColorStop(1, '#450a0a');
        ctx.fillStyle = lavaGrad;
        ctx.shadowColor = lavaColorTop;
        ctx.shadowBlur = 18;
        ctx.fill();

        // Lava üst zolağı
        ctx.strokeStyle = previewState.lavaIceTimer > 0 ? '#bae6fd' : '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Barrikada divarı vizualı
        if (previewState.lavaWallTimer > 0) {
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.fillRect(15, previewState.lavaY - 6, W - 30, 6);
        }

        // Lavanın qorxunc gözləri
        ctx.fillStyle = previewState.lavaIceTimer > 0 ? '#e0f2fe' : '#fef08a';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(W / 2 - 35, previewState.lavaY + 22, 9, 6, -0.2, 0, Math.PI * 2);
        ctx.ellipse(W / 2 + 35, previewState.lavaY + 22, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(W / 2 - 35, previewState.lavaY + 22, 3.5, 0, Math.PI * 2);
        ctx.arc(W / 2 + 35, previewState.lavaY + 22, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 8. HİSSƏCİKLƏR (PARTİCLES)
        for (let i = previewState.particles.length - 1; i >= 0; i--) {
            const p = previewState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= (p.decay || 0.03);

            if (p.life <= 0) {
                previewState.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        previewAnimId = requestAnimationFrame(renderLoop);
    }

    renderLoop();
}

// ==================== İNİTİALİZASİYA ====================

// Çat sorğusu (Polling) - hər 3 saniyədən bir
function initChatPolling() {
    fetchChatMessages(false);
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(() => {
        fetchChatMessages(false);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initChatPolling();
    showDashboardView();
    startDashboardPreviewAnimation();
});


