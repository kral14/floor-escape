// ============================================================================
// 📬 FLOOR ESCAPE: KİBER POÇT QUTUSU VƏ MƏKTUB SİSTEMİ (INBOX ENGINE)
// Admin tərəfindən göndərilən fərdi və qlobal hədiyyə məktublarını qəbul edir
// ============================================================================

(function (global) {
    let inboxMessages = [];
    let unreadCount = 0;
    let ws = null;
    let wsReconnectTimeout = null;

    function getCurrentPlayerId() {
        try {
            // 1. Qlobal currentPlayer (auth.js tərəfindən idarə olunur)
            if (typeof currentPlayer !== 'undefined' && currentPlayer && (currentPlayer.playerId || currentPlayer.player_id)) {
                return String(currentPlayer.playerId || currentPlayer.player_id);
            }
            // 2. getPlayerProfile funksiyası
            if (typeof getPlayerProfile === 'function') {
                const prof = getPlayerProfile();
                if (prof && (prof.playerId || prof.player_id)) {
                    return String(prof.playerId || prof.player_id);
                }
            }
            // 3. localStorage 'floor_escape_player'
            const savedPlayer = localStorage.getItem('floor_escape_player');
            if (savedPlayer) {
                const parsed = JSON.parse(savedPlayer);
                if (parsed && (parsed.playerId || parsed.player_id)) {
                    return String(parsed.playerId || parsed.player_id);
                }
            }
            // 4. localStorage 'floor_escape_user' və ya 'floor_escape_user_id'
            const userId = localStorage.getItem('floor_escape_user_id') || localStorage.getItem('floor_escape_player_id');
            if (userId) return String(userId);

            const userJson = localStorage.getItem('floor_escape_user') || localStorage.getItem('fe_player');
            if (userJson) {
                try {
                    const parsedUser = JSON.parse(userJson);
                    if (parsedUser && (parsedUser.playerId || parsedUser.player_id)) {
                        return String(parsedUser.playerId || parsedUser.player_id);
                    }
                } catch (ex) {}
            }

            // 5. Fallback qonaq ID
            let guestId = localStorage.getItem('floor_escape_guest_id');
            if (!guestId) {
                guestId = 'G-' + Math.floor(100000 + Math.random() * 900000);
                localStorage.setItem('floor_escape_guest_id', guestId);
            }
            return String(guestId);
        } catch (e) {
            return 'G-999999';
        }
    }

    // ============================================================================
    // ⚡ WEBSOCKET CANLI BAĞLANTI (REAL-TIME NOTIFICATION CLIENT)
    // ============================================================================
    function initWebSocket() {
        if (typeof WebSocket === 'undefined') return;
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            const host = window.location.hostname || 'localhost';
            const wsUrl = `ws://${host}:4001`;
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('⚡ [INBOX-WS] Canlı WebSocket əlaqəsi quruldu!');
                const pid = getCurrentPlayerId();
                if (pid) {
                    ws.send(JSON.stringify({ type: 'REGISTER', playerId: pid }));
                }
            };

            ws.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (data && data.type === 'NEW_INBOX_MESSAGE') {
                        onRealtimeMessageReceived(data.message);
                    }
                } catch (e) {
                    console.error('WebSocket mesajı oxunarkən xəta:', e);
                }
            };

            ws.onclose = () => {
                if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
                wsReconnectTimeout = setTimeout(initWebSocket, 3000);
            };

            ws.onerror = () => {
                try { ws.close(); } catch (e) {}
            };
        } catch (err) {
            if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
            wsReconnectTimeout = setTimeout(initWebSocket, 4000);
        }
    }

    function onRealtimeMessageReceived(newMsg) {
        console.log('📬 Yeni real-time məktub gəldi:', newMsg);
        
        // Siyahıya əlavə edirik (əgər hələ yoxdursa)
        if (newMsg && newMsg.id) {
            const exists = inboxMessages.some(m => m.id === newMsg.id);
            if (!exists) {
                inboxMessages.unshift(newMsg);
            }
        }

        // Qəbul edilməmiş sayğacı artırırıq
        updateInboxBadge();

        // Əgər modal hazırda açıqdırsa, anında yeni kartı render edirik
        const modal = document.getElementById('inbox-modal');
        if (modal && !modal.classList.contains('hidden')) {
            renderInboxModalContent();
        }

        // Səs effekti
        if (typeof audio !== 'undefined' && typeof audio.playChest === 'function') {
            audio.playChest();
        }

        // Canlı Toast bildirişi
        const title = (newMsg && newMsg.title) ? newMsg.title : 'Xüsusi Hədiyyə Məktubu';
        if (typeof showToast === 'function') {
            showToast(`📬 YENİ MƏKTUB: "${title}" Poçt Qutunuza çatdı!`, 'success');
        }

        // Poçt ikonunu canlandırırıq (parıldama effekti)
        const envelopeIcons = document.querySelectorAll('.fa-envelope');
        envelopeIcons.forEach(icon => {
            icon.classList.add('text-cyan-300', 'animate-pulse');
            setTimeout(() => icon.classList.remove('animate-pulse'), 5000);
        });
    }

    async function fetchInboxMessages() {
        const playerId = getCurrentPlayerId();
        if (!playerId) return;

        try {
            const res = await fetch(`/api/inbox?playerId=${encodeURIComponent(playerId)}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
                inboxMessages = data.messages;
                updateInboxBadge();
                renderInboxModalContent();
            }
        } catch (e) {
            // Server oflayn ola bilər, səssiz ötürürük
        }
    }

    function updateInboxBadge() {
        // Hələ qəbul edilməmiş məktubların sayı
        unreadCount = inboxMessages.filter(m => !m.is_claimed).length;

        const badgeEls = document.querySelectorAll('.inbox-badge');
        badgeEls.forEach(el => {
            if (unreadCount > 0) {
                el.innerText = unreadCount > 9 ? '9+' : unreadCount;
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    function openInboxModal() {
        fetchInboxMessages();
        const modal = document.getElementById('inbox-modal');
        if (modal) {
            modal.classList.remove('hidden');
            renderInboxModalContent();
        }
    }

    function closeInboxModal() {
        const modal = document.getElementById('inbox-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async function claimMessageGift(messageId, btnElement) {
        let playerId = getCurrentPlayerId();
        const msg = inboxMessages.find(m => m.id === messageId);

        // Əgər fərdi məktubdursa və hədəf oyunçu ID-si varsa, onu istifadə etmək
        if (msg && msg.target_type === 'SINGLE' && msg.player_id && msg.player_id !== 'ALL') {
            playerId = String(msg.player_id).trim();
        }

        if (!playerId) {
            if (typeof showToast === 'function') showToast('Xəta: Oyunçu profili tapılmadı!', 'error');
            return;
        }

        // Düyməni dərhal yoxlanış rejiminə keçiririk ki təkrar klik olmasın
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '⏳ Yoxlanılır...';
        }

        try {
            const res = await fetch('/api/inbox/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, messageId })
            });
            const data = await res.json();

            if (data && data.success) {
                // ⚡ Server təsdiqlədi: İndi rəsmi olaraq qəbul edildi statusu veririk
                if (msg) {
                    msg.is_claimed = 1;
                }

                if (btnElement) {
                    btnElement.disabled = true;
                    btnElement.className = 'px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-orbitron font-bold text-xs flex items-center gap-1 cursor-default shadow-sm shadow-emerald-500/10';
                    btnElement.innerHTML = '✓ Qəbul Edildi';
                }

                updateInboxBadge();

                // Almazları rəsmi server cavabı ilə artırırıq
                if (data.newDiamonds !== undefined) {
                    diamonds = data.newDiamonds;
                } else if (data.blueAdded) {
                    diamonds = (diamonds || 0) + data.blueAdded;
                }

                if (data.newRedDiamonds !== undefined) {
                    redDiamonds = data.newRedDiamonds;
                } else if (data.redAdded) {
                    redDiamonds = (redDiamonds || 0) + data.redAdded;
                }

                savePermanentData();
                if (typeof updateUI === 'function') updateUI();
                if (typeof updateDashboardUI === 'function') updateDashboardUI();
                if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
                if (typeof updatePermUpgradesUI === 'function') updatePermUpgradesUI();

                if (typeof audio !== 'undefined' && typeof audio.playDiamond === 'function') {
                    audio.playDiamond();
                }

                if (typeof showToast === 'function') {
                    showToast(data.message || '🎉 Hədiyyə qəbul edildi!', 'success');
                }
            } else {
                // ❌ Server rədd etdi: Niyə rədd edildiyini istifadəçiyə bildiririk
                const errMsg = (data && data.message) ? data.message : 'Server təsdiq etmədi!';
                
                if (data && data.alreadyClaimed) {
                    if (msg) msg.is_claimed = 1;
                    if (btnElement) {
                        btnElement.disabled = true;
                        btnElement.className = 'px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-orbitron font-bold text-xs flex items-center gap-1 cursor-default shadow-sm shadow-emerald-500/10';
                        btnElement.innerHTML = '✓ Artıq Təsdiqlənib';
                    }
                    updateInboxBadge();
                    if (typeof showToast === 'function') showToast(errMsg, 'info');
                } else if (data && data.isExpired) {
                    if (btnElement) {
                        btnElement.disabled = true;
                        btnElement.className = 'px-3 py-1 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 font-orbitron font-bold text-xs cursor-default';
                        btnElement.innerHTML = '⏰ Vaxtı Bitib';
                    }
                    if (typeof showToast === 'function') showToast(errMsg, 'error');
                } else {
                    if (btnElement) {
                        btnElement.disabled = false;
                        btnElement.innerHTML = '🎁 Qəbul Et';
                    }
                    if (typeof showToast === 'function') showToast(errMsg, 'error');
                }
            }
        } catch (err) {
            console.error('İnbox claim xətası:', err);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '🎁 Qəbul Et';
            }
            if (typeof showToast === 'function') showToast('Serverlə əlaqə kəsildi! Yenidən cəhd edin.', 'error');
        }
    }

    async function deleteMessage(messageId, btnElement) {
        const card = btnElement ? btnElement.closest('.inbox-card') : null;
        if (card) {
            card.style.transition = 'all 0.25s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.92)';
            setTimeout(() => {
                inboxMessages = inboxMessages.filter(m => m.id !== messageId);
                updateInboxBadge();
                renderInboxModalContent();
            }, 250);
        } else {
            inboxMessages = inboxMessages.filter(m => m.id !== messageId);
            updateInboxBadge();
            renderInboxModalContent();
        }

        if (typeof showToast === 'function') {
            showToast('Məktub silindi!', 'info');
        }

        try {
            const playerId = getCurrentPlayerId();
            await fetch('/api/inbox/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, playerId })
            });
        } catch (e) {
            console.log('Məktub silinərkən server fon xətası:', e);
        }
    }

    function copyGiftCode(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
            if (typeof showToast === 'function') showToast('🔑 Kod panoya kopyalandı!', 'success');
        } else {
            prompt('Kodu kopyalayın:', code);
        }
    }

    function renderInboxModalContent() {
        const container = document.getElementById('inbox-messages-list');
        if (!container) return;

        if (!inboxMessages || inboxMessages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 text-slate-400">
                    <div class="text-4xl mb-2">📭</div>
                    <p class="font-orbitron text-sm">Poçt qutunuz boşdur!</p>
                    <p class="text-xs text-slate-500 mt-1">Admin tərəfindən sizə göndərilən hədiyyə və bildirişlər burada görünəcək.</p>
                </div>
            `;
            return;
        }

        let html = '';
        inboxMessages.forEach(msg => {
            const isClaimed = !!msg.is_claimed;
            const blue = msg.blue_diamonds || 0;
            const red = msg.red_diamonds || 0;
            const dateStr = msg.created_at ? msg.created_at.substring(0, 16).replace('T', ' ') : '';
            
            // Vaxt bitmə yoxlanışı
            let isExpired = false;
            let expStr = '';
            if (msg.expires_at) {
                try {
                    const expDt = new Date(msg.expires_at);
                    if (new Date() > expDt) isExpired = true;
                    expStr = `<span class="text-[10px] ${isExpired ? 'text-rose-400' : 'text-amber-400'} font-bold">⏳ Bitir: ${expDt.toLocaleDateString()} ${expDt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
                } catch (e) {}
            }

            const cardBorder = isClaimed 
                ? 'border-slate-800 bg-slate-900/40 opacity-75' 
                : 'border-cyan-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]';

            html += `
                <div class="inbox-card p-3.5 rounded-2xl border ${cardBorder} flex flex-col gap-2.5 transition">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">${isClaimed ? '✉️' : '🎁'}</span>
                            <div>
                                <h4 class="font-orbitron font-bold text-xs ${isClaimed ? 'text-slate-300' : 'text-cyan-300'}">${escapeHtml(msg.title || 'Hədiyyə Məktubu')}</h4>
                                <span class="text-[10px] text-slate-400 font-mono">${dateStr}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-right">
                                ${expStr}
                            </div>
                            <button onclick="INBOX.deleteMessage(${msg.id}, this)" title="Məktubu Sil" class="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer border border-slate-700/50 hover:border-rose-500/40">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>

                    ${msg.note ? `
                        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                            <span class="text-[10px] text-sky-400 block font-bold mb-0.5">📝 ADMİN QEYDİ:</span>
                            ${escapeHtml(msg.note)}
                        </div>
                    ` : ''}

                    <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-orbitron font-bold text-slate-300">Hədiyyə:</span>
                            ${blue > 0 ? `<span class="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs flex items-center gap-1.5">+${blue} ${(typeof ICONS !== 'undefined') ? ICONS.cyanDiamond({ size: 20 }) : '💎'}</span>` : ''}
                            ${red > 0 ? `<span class="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-orbitron font-bold text-xs flex items-center gap-1.5">+${red} ${(typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 20 }) : '💎'}</span>` : ''}
                        </div>

                        <div class="flex items-center gap-1.5">
                            ${msg.gift_code ? `
                                <button onclick="INBOX.copyGiftCode('${escapeHtml(msg.gift_code)}')" title="Kodu Kopyala" class="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-[11px] font-bold cursor-pointer transition">
                                    📋 Kod
                                </button>
                            ` : ''}

                            ${isClaimed ? `
                                <span class="px-3 py-1 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-orbitron font-bold text-xs">
                                    ✓ Qəbul Edildi
                                </span>
                            ` : isExpired ? `
                                <span class="px-3 py-1 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 font-orbitron font-bold text-xs">
                                    ⏰ Vaxtı Bitib
                                </span>
                            ` : `
                                <button onclick="INBOX.claimMessageGift(${msg.id}, this)" class="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-orbitron font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition flex items-center gap-1">
                                    🎁 Qəbul Et
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }

    function updateWsPlayer(pid) {
        if (ws && ws.readyState === WebSocket.OPEN && pid) {
            ws.send(JSON.stringify({ type: 'REGISTER', playerId: String(pid) }));
        }
    }

    // Qlobal interfeys
    global.INBOX = {
        fetch: fetchInboxMessages,
        open: openInboxModal,
        close: closeInboxModal,
        claimMessageGift: claimMessageGift,
        deleteMessage: deleteMessage,
        copyGiftCode: copyGiftCode,
        getCurrentPlayerId: getCurrentPlayerId,
        updateWsPlayer: updateWsPlayer,
        initWebSocket: initWebSocket
    };

    // Avtomatik başlama (WebSocket və ilkin yükləmə)
    if (typeof document !== 'undefined') {
        const startInbox = () => {
            fetchInboxMessages();
            initWebSocket();
            // Ehtiyat üçün 30 saniyədən bir soft-yoxlanış
            setInterval(fetchInboxMessages, 30000);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startInbox);
        } else {
            startInbox();
        }
    }
})(typeof window !== 'undefined' ? window : this);
