// TOAST VƏ QIZIL BİLDİRİŞLƏRİ MODULU

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

window.showGoldToast = showGoldToast;
window.showToast = showToast;
