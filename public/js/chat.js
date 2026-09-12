// QLOBAL ÇAT VƏ MESAJLAŞMA ŞƏBƏKƏ MODULU

let chatPollingInterval = null;
let lastMessageId = 0;
let isChatOpen = false;
let unreadChatCount = 0;

function toggleChat() {
    isChatOpen = !isChatOpen;
    const chatContainer = document.getElementById('chat-drawer');
    const badge = document.getElementById('chat-unread-badge');

    if (!chatContainer) return;

    if (isChatOpen) {
        chatContainer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        chatContainer.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        unreadChatCount = 0;
        if (badge) badge.classList.add('hidden');
        fetchChatMessages(true);
    } else {
        chatContainer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
        chatContainer.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
}
window.toggleChat = toggleChat;

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
window.fetchChatMessages = fetchChatMessages;

function renderChatMessages(messages, forceScroll = false) {
    const lists = [
        document.getElementById('chat-messages-list'),
        document.getElementById('dash-chat-messages-list')
    ];

    let hasNew = false;
    const activePlayer = window.currentPlayer || (typeof currentPlayer !== 'undefined' ? currentPlayer : null);

    const htmlContent = messages.map(m => {
        if (m.id > lastMessageId) {
            lastMessageId = m.id;
            hasNew = true;
        }

        const isMe = activePlayer && activePlayer.playerId === m.player_id;
        const timeStr = m.created_at ? formatChatTime(m.created_at) : '';

        return `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2.5">
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="font-orbitron font-bold text-[10px] ${isMe ? 'text-cyan-300' : 'text-amber-400'}">${escapeChatHtml(m.username)}</span>
                    <span class="text-[8px] font-mono text-slate-500">#${m.player_id}</span>
                    <span class="text-[8px] text-slate-500 ml-1">${timeStr}</span>
                </div>
                <div class="max-w-[85%] px-3 py-1.5 rounded-2xl text-xs break-words shadow-sm ${isMe ? 'bg-cyan-600/90 text-white rounded-tr-none' : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60'}">
                    ${escapeChatHtml(m.message)}
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

    const curPage = typeof currentNavPage !== 'undefined' ? currentNavPage : 'home';
    if (hasNew && !isChatOpen && curPage !== 'chat') {
        unreadChatCount++;
        const badge = document.getElementById('chat-unread-badge');
        if (badge) {
            badge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
            badge.classList.remove('hidden');
        }
    }
}
window.renderChatMessages = renderChatMessages;

async function sendChatMessage(inputSource = 'drawer') {
    const activePlayer = window.currentPlayer || (typeof currentPlayer !== 'undefined' ? currentPlayer : null);
    if (!activePlayer || !activePlayer.playerId) {
        if (typeof showToast === 'function') showToast('Çatda mesaj yazmaq üçün əvvəlcə daxil olun!', 'warning');
        if (typeof openAuthModal === 'function') openAuthModal('login');
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
                playerId: activePlayer.playerId,
                username: activePlayer.username,
                message: msg
            })
        });

        const data = await res.json();
        if (data.success) {
            input.value = '';
            await fetchChatMessages(true);
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Mesaj göndərilmədi', 'error');
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Serverlə əlaqə qurulmadı', 'error');
    }
}
window.sendChatMessage = sendChatMessage;

function formatChatTime(dateStr) {
    try {
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

function escapeChatHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeChatHtml;

// Çat sorğusu (Polling) - hər 3 saniyədən bir
function initChatPolling() {
    fetchChatMessages(false);
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(() => {
        fetchChatMessages(false);
    }, 3000);
}
window.initChatPolling = initChatPolling;
