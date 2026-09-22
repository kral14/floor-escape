// GİRİŞ VƏ QISAYOLLAR İDARƏETMƏ SİSTEMİ (KEYBINDS & INPUT CONTROLLER)

const DEFAULT_KEYBINDS = {
    wall: '1',
    ice: '2',
    shock: '3',
    mine: '4',
    plasma: '5'
};

let keybinds = { ...DEFAULT_KEYBINDS };
let isKeybindMode = false;
let recordingTrapType = null;
let keys = {};

function loadKeybinds() {
    try {
        const saved = localStorage.getItem('floor_escape_keybinds');
        if (saved) keybinds = { ...DEFAULT_KEYBINDS, ...JSON.parse(saved) };
    } catch (e) {
        keybinds = { ...DEFAULT_KEYBINDS };
    }
}

function saveKeybinds() {
    localStorage.setItem('floor_escape_keybinds', JSON.stringify(keybinds));
}

function formatKeyDisplay(k) {
    if (!k) return '?';
    if (k === ' ') return 'SPACE';
    return k.toUpperCase();
}

function renderKeybindBadges() {
    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(type => {
        const badge = document.getElementById(`keybind-badge-${type}`);
        if (badge) badge.innerText = formatKeyDisplay(keybinds[type]);
    });
}

function toggleKeybindMode() {
    isKeybindMode = !isKeybindMode;
    const banner = document.getElementById('keybind-help-banner');
    const btn = document.getElementById('btn-toggle-keybinds');
    const label = document.getElementById('keybind-mode-label');

    if (isKeybindMode) {
        if (banner) banner.classList.remove('hidden');
        if (btn) btn.classList.add('border-rose-500', 'text-rose-400');
        if (label) label.innerText = 'Ləğv et';
        if (typeof showToast === 'function') {
            showToast('Qısayol dəyişmə rejimi aktivdir! Nişana klikləyin.', 'info');
        }
    } else {
        cancelRebinding();
    }
}

function cancelRebinding() {
    isKeybindMode = false;
    recordingTrapType = null;
    const banner = document.getElementById('keybind-help-banner');
    const btn = document.getElementById('btn-toggle-keybinds');
    const label = document.getElementById('keybind-mode-label');

    if (banner) banner.classList.add('hidden');
    if (btn) btn.classList.remove('border-rose-500', 'text-rose-400');
    if (label) label.innerText = 'Qısayol';

    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(t => {
        const badge = document.getElementById(`keybind-badge-${t}`);
        if (badge) badge.classList.remove('recording');
    });
}

function startRebinding(type, event) {
    if (event) event.stopPropagation();
    isKeybindMode = true;
    recordingTrapType = type;

    ['wall', 'ice', 'shock', 'mine', 'plasma'].forEach(t => {
        const badge = document.getElementById(`keybind-badge-${t}`);
        if (badge) {
            if (t === type) badge.classList.add('recording');
            else badge.classList.remove('recording');
        }
    });

    const trapName = typeof getTrapName === 'function' ? getTrapName(type) : type;
    if (typeof showToast === 'function') {
        showToast(`${trapName} üçün yeni düyməni basın...`, 'info');
    }
}

// KLAVİATURA HADİSƏLƏRİ
window.addEventListener('keydown', e => {
    if (!e || typeof e.key === 'undefined') return;

    // Əgər istifadəçi input və ya textareadadırsa
    const activeTag = document.activeElement ? (document.activeElement.tagName || '').toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
    }

    if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
    }

    // Ox düymələri və boşluq zamanı səhifənin scroll olmasını önləyirik
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }

    if (typeof gameState !== 'undefined' && gameState.transitioning) return;
    if (typeof gameState !== 'undefined' && gameState.isIntroPlaying) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (typeof monsPortal !== 'undefined' && monsPortal) monsPortal.skip();
        }
        return;
    }
    if (typeof audio !== 'undefined') audio.init();
    const k = (e.key || '').toLowerCase();
    const c = (e.code || '').toLowerCase();

    if (recordingTrapType) {
        e.preventDefault();
        e.stopPropagation();

        let assignedKey = k;
        if (e.code === 'Space') assignedKey = ' ';
        if (e.code === 'Tab') assignedKey = 'tab';

        keybinds[recordingTrapType] = assignedKey;
        saveKeybinds();
        renderKeybindBadges();
        if (typeof audio !== 'undefined' && audio.playKeySet) audio.playKeySet();
        const tName = typeof getTrapName === 'function' ? getTrapName(recordingTrapType) : recordingTrapType;
        if (typeof showToast === 'function') {
            showToast(`${tName} qısayolu [${formatKeyDisplay(assignedKey)}] olaraq təyin edildi!`, 'success');
        }

        cancelRebinding();
        return;
    }

    if (k) keys[k] = true;
    if (c) keys[c] = true;

    // 🔄 R / KeyR: YALNIZ GAME OVER olduqda oyunu dərhal yenidən başlatma qısayolu!
        if (!e.repeat && (e.code === 'KeyR' || k === 'r' || k === 'к')) {
            const isGameOver = typeof gameState !== 'undefined' && gameState.gameOver;
            const modal = document.getElementById('modal-overlay');
            const isModalVisible = modal && !modal.classList.contains('hidden');

            if (isGameOver || isModalVisible) {
                e.preventDefault();
                if (typeof restartGame === 'function') {
                    restartGame();
                    if (typeof showToast === 'function') {
                        showToast('🔄 Oyun yenidən başladıldı! [R]', 'info');
                    }
                }
                return;
            }
        }

        if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        triggerPlayerDash();
        return;
    }

    if (!e.repeat && (e.code === 'KeyE' || k === 'e') && keybinds.wall !== 'e' && keybinds.ice !== 'e' && keybinds.shock !== 'e' && keybinds.mine !== 'e' && keybinds.plasma !== 'e') {
        if (typeof SingularitySpawnEffect !== 'undefined' && typeof player !== 'undefined' && !gameState.gameOver && !gameState.paused) {
            if (permUpgrades.equippedSpawnAnim === 'glacial' && window.GlacialSpawnEffect) window.GlacialSpawnEffect.fireGame(player);
            else if (permUpgrades.equippedSpawnAnim === 'tesseract' && window.TesseractSpawnEffect) window.TesseractSpawnEffect.fireGame(player);
            else if (['singularity','supernova','synapse','abyssal'].includes(permUpgrades.equippedSpawnAnim)) SingularitySpawnEffect.launchInGameStar(player, true);
        }
    }

    // Tələ atış qısayolları
    let matchedType = null;
    for (const [type, boundKey] of Object.entries(keybinds)) {
        if (boundKey === 'tab' && (e.key === 'Tab' || e.code === 'Tab')) {
            matchedType = type;
            break;
        } else if (boundKey === ' ' && (e.code === 'Space' || e.key === ' ')) {
            matchedType = type;
            break;
        } else if (boundKey && typeof boundKey === 'string' && boundKey.toLowerCase() === k) {
            matchedType = type;
            break;
        }
    }

    if (matchedType && typeof fireBullet === 'function') {
        e.preventDefault();
        fireBullet(matchedType);
    }
});

window.addEventListener('keyup', e => {
    if (!e || typeof e.key === 'undefined') return;
    if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
    }
    const k = (e.key || '').toLowerCase();
    const c = (e.code || '').toLowerCase();
    if (k) keys[k] = false;
    if (c) keys[c] = false;
});

function handleTouchStart(dir) {
    if (typeof gameState !== 'undefined' && (gameState.transitioning || gameState.gameOver || gameState.paused)) return;
    if (typeof audio !== 'undefined') audio.init();
    keys['touch_' + dir] = true;
}

function handleTouchEnd(dir) {
    keys['touch_' + dir] = false;
}

function triggerPlayerDash() {
    if (typeof gameState !== 'undefined' && (gameState.transitioning || gameState.gameOver || gameState.paused)) return;
    if (typeof audio !== 'undefined') audio.init();
    if (typeof player !== 'undefined' && player.dash) player.dash();
    if (typeof SingularitySpawnEffect !== 'undefined' && SingularitySpawnEffect.themes) {
        const activeThemeKey = (typeof player !== 'undefined' && player.singularityTheme) ? player.singularityTheme : 'singularity';
        const activeTheme = SingularitySpawnEffect.themes[activeThemeKey];
        if (activeTheme && typeof activeTheme.triggerBurst === 'function') {
            activeTheme.triggerBurst();
        }
    }
}

window.keybinds = keybinds;
window.keys = keys;
window.loadKeybinds = loadKeybinds;
window.saveKeybinds = saveKeybinds;
window.formatKeyDisplay = formatKeyDisplay;
window.renderKeybindBadges = renderKeybindBadges;
window.toggleKeybindMode = toggleKeybindMode;
window.cancelRebinding = cancelRebinding;
window.startRebinding = startRebinding;
window.handleTouchStart = handleTouchStart;
window.handleTouchEnd = handleTouchEnd;
window.triggerPlayerDash = triggerPlayerDash;
