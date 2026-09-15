// KİBER MAĞAZA: DƏRİLƏR (SKINS), DOĞULUŞ ANİMASİYALARI (SPAWN FX) VƏ VİTRİN SİSTEMİ

function getSkinsCatalog() {
    if (typeof SKINS !== 'undefined' && SKINS && Object.keys(SKINS).length > 0) return SKINS;
    if (typeof window !== 'undefined' && window.SKINS && Object.keys(window.SKINS).length > 0) return window.SKINS;
    return {
        default: { id: 'default', name: 'Kiber Qaçışçı', title: 'Cyber Runner', icon: 'fa-user-ninja', color: '#00ffcc', trailColor: 'rgba(0, 255, 204,', glowColor: '#00ffcc', desc: 'Standart balanslaşdırılmış kiber-qaçışçı forması.', costType: 'free', cost: 0 },
        spark: { id: 'spark', name: 'Kvant Qığılcımı', title: 'Quantum Spark', icon: 'fa-bolt', color: '#facc15', trailColor: 'rgba(250, 204, 21,', glowColor: '#facc15', desc: 'Yüksək gərginlikli cəldlik və ildırım parıltısı.', costType: 'redDiamonds', cost: 10 },
        aegis: { id: 'aegis', name: 'Titan Zirehli', title: 'Titan Aegis', icon: 'fa-shield-halved', color: '#38bdf8', trailColor: 'rgba(56, 189, 248,', glowColor: '#38bdf8', desc: 'Polad-mavi enerji aurası və dayanıqlı kiber-qoruyucu.', costType: 'redDiamonds', cost: 15 },
        inferno: { id: 'inferno', name: 'Lava Cəlladı', title: 'Inferno Slayer', icon: 'fa-fire-flame-curved', color: '#ef4444', trailColor: 'rgba(239, 68, 68,', glowColor: '#ef4444', desc: 'Lava qorxusunu məhv edən qəzəbli alovlu döyüşçü.', costType: 'redDiamonds', cost: 20 },
        void: { id: 'void', name: 'Void Hökmdarı', title: 'Void Sovereign', icon: 'fa-crown', color: '#c084fc', trailColor: 'rgba(192, 132, 252,', glowColor: '#c084fc', desc: 'Qaranlıq anomaliyaları ram edən ali kibernetik forma.', costType: 'redDiamonds', cost: 30 }
    };
}
window.getSkinsCatalog = getSkinsCatalog;

const SINGULARITY_VARIANTS = {
    singularity: {
        id: 'singularity',
        shortName: 'Kiber',
        name: 'Kiber Sinqulyarlıq',
        title: 'Cyber Singularity',
        icon: 'fa-circle-nodes',
        fallbackIcon: 'fa-atom',
        color: '#38bdf8',
        glowColor: '#06b6d4',
        badge: '🌀 Kvant Sinqulyarlığı (3D Halqalar & Lavaya Zərbə)',
        desc: 'Kvant Fizikası: 3D hadisə üfüqü, aşağı atılan ulduzlar lavaya dəyəndə lavanı soyudur (-45px) və kristal qəlpələrə parçalayır.',
        cost: 55
    },
    supernova: {
        id: 'supernova',
        shortName: 'Supernova',
        name: 'Plazma Supernova',
        title: 'Plasma Supernova',
        icon: 'fa-fire-alt',
        fallbackIcon: 'fa-sun',
        color: '#fbbf24',
        glowColor: '#f97316',
        badge: '🔥 Plazma Supernova (Alovlu 3D Orbit & Lavaya Zərbə)',
        desc: 'Qızmar plazma qığılcımları və supernova nüvəsi: Aşağı şığıyan ulduzlar lavanı partladıb soyudur (-45px) və qəlpələrə bölür.',
        cost: 55
    },
    synapse: {
        id: 'synapse',
        shortName: 'Sinaps',
        name: 'Kvant Sinapsı',
        title: 'Quantum Synapse',
        icon: 'fa-bolt-lightning',
        fallbackIcon: 'fa-bolt',
        color: '#c084fc',
        glowColor: '#a855f7',
        badge: '⚡ Kvant Sinapsı (Bio-Elektrik Şəbəkə & Lavaya Zərbə)',
        desc: 'Bio-elektrik neyron şəbəkəsi və bənövşəyi pulslar: Kvant ulduzları aşağı atılaraq lavanı dondurub ləngidir və zərər vurur.',
        cost: 55
    },
    abyssal: {
        id: 'abyssal',
        shortName: 'Abiss',
        name: 'Dərin Abiss',
        title: 'Deep Abyssal',
        icon: 'fa-water',
        fallbackIcon: 'fa-eye',
        color: '#2dd4bf',
        glowColor: '#0f766e',
        badge: '🌊 Dərin Abiss (Biolüminisent Sporlar & Lavaya Zərbə)',
        desc: 'Dərin okean leviathan gözü və spor dalğaları: Düşən zümrüd kristalları lavaya zərbə vuraraq lavanı geriyə itələyir.',
        cost: 55
    }
};
window.SINGULARITY_VARIANTS = SINGULARITY_VARIANTS;

let currentSingularityVariantId = null;

function getSpawnAnimsCatalog() {
    return {
        tesseract: { id:'tesseract', name:'4D Kvant Tesseraktı', title:'Graviton Singularity Core', icon:'fa-cubes', color:'#c084fc', glowColor:'#a855f7', badge:'🔮 4D Kvant Tesseraktı', desc:'4D fırlanan hiperkub, qraviton kürələri və kvant hissəcikləri. Tam önbaxışda WASD ilə hərəkət, E ilə qraviton atışı.', costType:'free', cost:0 },
        glacial: { id: 'glacial', name: 'Kvant Buz Zirehi', title: 'Glacial Mecha Iris', icon: 'fa-snowflake', color: '#67e8f9', glowColor: '#38bdf8', badge: '❄️ Kvant Buz Zirehi', desc: 'Altıbucaqlı mexaniki zireh, üzən buz kameraları və kriogen hissəciklər. Önbaxışda WASD ilə hərəkət, E ilə buz atışı.', costType: 'free', cost: 0 },
        portal: { id: 'portal', name: 'Holoqramdan Doğuluş', title: 'Holo-Portal', icon: 'fa-atom', color: '#65dfff', glowColor: '#72ddff', badge: '🌀 Holoqram Portalı', desc: 'Portal açılır, orbital qəfəs və komet quyruqları toplanır, Mons meydana çıxır.', costType: 'free', cost: 0 },
        crystal: { id: 'crystal', name: 'Kristal Yarığı', title: 'Crystal Rift', icon: 'fa-gem', color: '#b899ff', glowColor: '#d9c5ff', badge: '💎 Kristal Yarığı', desc: 'İşıq çatı açılır, 3D perspektiv kristallar ayrılır, şimşək çaxır və Mons meydana çıxır.', costType: 'redDiamonds', cost: 15 },
        stellar: { id: 'stellar', name: 'Ulduz Nüvəsi', title: 'Stellar Bloom', icon: 'fa-sun', color: '#54d8cf', glowColor: '#f8d49a', badge: '🌟 Ulduz Nüvəsi', desc: 'Enerji toplanır, 3D axın lentləri fəzanı yarır, ulduz nüvəsi açılır və Mons doğulur.', costType: 'redDiamonds', cost: 25 },
        dracula: { id: 'dracula', name: 'Drakula', title: 'Dracula', icon: 'fa-bat', fallbackIcon: 'fa-feather', color: '#ba7886', glowColor: '#9774be', badge: '🦇 Yarasa Qanadları (+1 Sürət)', desc: 'Qaranlıq oyanır, nəhəng yarasa qanadları açılır və Monsa oyunda +1 hərəkət sürəti bəxş edir.', costType: 'redDiamonds', cost: 35 },
        seed: { id: 'seed', name: 'Yaşam Çiçəyi', title: 'Time Seed', icon: 'fa-seedling', fallbackIcon: 'fa-leaf', color: '#62e6a0', glowColor: '#ffe3a0', badge: '🌸 Yaşam Çiçəyi (+1 Can)', desc: 'Zaman toxumu cücərir, qoruyucu sarmaşıqlar və yaşam çiçəkləri Monsu əhatəyə alaraq +1 əlavə can bəxş edir.', costType: 'redDiamonds', cost: 45 },
        singularity: { 
            id: 'singularity', 
            name: 'Kvant Sinqulyarlığı', 
            title: 'Quantum Singularity', 
            icon: 'fa-circle-nodes', 
            fallbackIcon: 'fa-atom', 
            color: '#38bdf8', 
            glowColor: '#06b6d4', 
            badge: '🌀 Kvant Sinqulyarlığı (4 Fərqli Kvant Növü)', 
            desc: 'Kvant Fizikası: 3D hadisə üfüqü, aşağı atılan ulduzlar lavaya dəyəndə lavanı soyudur (-45px) və kristal qəlpələrə parçalayır.', 
            costType: 'redDiamonds', 
            cost: 55,
            isMultiVariant: true,
            variants: SINGULARITY_VARIANTS
        }
    };
}
function getSavedSkinSubTab() {
    try {
        const saved = localStorage.getItem('floor_escape_active_skin_subtab');
        if (saved && (saved === 'skins' || saved === 'anims')) {
            return saved;
        }
    } catch (e) {}
    return 'skins';
}
window.getSavedSkinSubTab = getSavedSkinSubTab;

let currentSkinSubTab = getSavedSkinSubTab(); // 'skins' | 'anims'
let currentPreviewSkinId = null;
let currentPreviewSpawnAnimId = null;
let previewSpawnEffectInstance = null;
let skinStageAnimFrame = null;
let skinStageTime = 0;

let hoveredSpawnAnimCardId = null;
let lastMiniCardRenderTime = 0;

function setHoveredSpawnAnimCard(aid) {
    if (hoveredSpawnAnimCardId === aid) return;
    const prevAid = hoveredSpawnAnimCardId;
    hoveredSpawnAnimCardId = aid;
    if (prevAid && prevAid !== currentPreviewSpawnAnimId) {
        drawStaticSpawnAnimCard(prevAid);
    }
}
window.setHoveredSpawnAnimCard = setHoveredSpawnAnimCard;

function selectSingularityVariant(variantId) {
    if (!SINGULARITY_VARIANTS[variantId]) return;
    currentSingularityVariantId = variantId;

    // Yuxarıdakı vitrində də dərhal həmin variantı canlandırırıq
    setPreviewSpawnAnim(variantId, false);

    // Kartın mini-kanvasını yeniləyirik
    drawStaticSpawnAnimCard('singularity');

    // Kartın HTML elementlərini (badge, düymələr, qiymət) yeniləyirik
    renderSpawnAnimsShop();
}
window.selectSingularityVariant = selectSingularityVariant;

function drawStaticSpawnAnimCard(aid) {
    const targetCardId = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(aid) ? 'singularity' : aid;
    const actualEffectId = (targetCardId === 'singularity') ? (currentSingularityVariantId || 'singularity') : targetCardId;

    const cardCanvas = document.getElementById(`spawn-anim-card-canvas-${targetCardId}`);
    if (!cardCanvas) return;
    const cctx = cardCanvas.getContext('2d');
    if (!cctx) return;

    const cw = cardCanvas.width;
    const ch = cardCanvas.height;
    cctx.clearRect(0, 0, cw, ch);

    const fxModule = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get(actualEffectId) : null;
    if (!fxModule) return;

    cctx.fillStyle = '#060715';
    cctx.fillRect(0, 0, cw, ch);

    const activeSkinId = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
    const drawMiniMonster = (mctx, mt) => {
        if (typeof drawSkinModel === 'function') {
            drawSkinModel(mctx, 0, 0, 16, activeSkinId, 0, mt * 2.5, false);
        }
    };

    // Kiber Sinqulyarlıq üçün tam açılmış 3D halqalar (wings, compass, crystals, mons) kadrı
    const isQuantum = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(actualEffectId);
    const staticT = isQuantum ? 6.2 : (fxModule.duration || 6.0) * 0.62;
    fxModule.draw(cctx, cw, ch, staticT, drawMiniMonster, false, actualEffectId);
}
window.drawStaticSpawnAnimCard = drawStaticSpawnAnimCard;

// ==================== 🔀 ALT-TAB KEÇİDİ ====================
function switchSkinSubTab(subTab) {
    if (!subTab) {
        subTab = getSavedSkinSubTab();
    }
    currentSkinSubTab = (subTab === 'anims') ? 'anims' : 'skins';

    try {
        localStorage.setItem('floor_escape_active_skin_subtab', currentSkinSubTab);
        if (document.documentElement) {
            document.documentElement.setAttribute('data-initial-skin-sub', currentSkinSubTab);
        }
    } catch (e) {}

    const btnSkins = document.getElementById('skin-subtab-btn-skins');
    const btnAnims = document.getElementById('skin-subtab-btn-anims');
    const contentSkins = document.getElementById('skin-subtab-content-skins');
    const contentAnims = document.getElementById('skin-subtab-content-anims');
    const replayBtn = document.getElementById('btn-replay-spawn-anim');

    if (currentSkinSubTab === 'anims') {
        if (btnSkins) {
            btnSkins.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold rounded-lg border-b-2 border-transparent text-slate-400 hover:text-cyan-300 flex items-center gap-2 transition cursor-pointer';
        }
        if (btnAnims) {
            btnAnims.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold rounded-lg border-b-2 border-amber-400 text-amber-300 flex items-center gap-2 transition cursor-pointer bg-slate-800/80 shadow-sm';
        }
        if (contentSkins) contentSkins.classList.add('hidden');
        if (contentAnims) contentAnims.classList.remove('hidden');
        if (replayBtn) replayBtn.classList.remove('hidden');

        const starBadge = document.getElementById('cyber-stars-shop-badge');
        if (starBadge) starBadge.classList.remove('hidden');
        if (typeof updateCyberStarsHUD === 'function') updateCyberStarsHUD();

        renderSpawnAnimsShop();
        const activeAnim = currentPreviewSpawnAnimId || (permUpgrades && permUpgrades.equippedSpawnAnim) || 'singularity';
        setPreviewSpawnAnim(activeAnim, false);
    } else {
        const starBadge = document.getElementById('cyber-stars-shop-badge');
        if (starBadge) starBadge.classList.add('hidden');

        if (btnSkins) {
            btnSkins.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold rounded-lg border-b-2 border-cyan-400 text-cyan-300 flex items-center gap-2 transition cursor-pointer bg-slate-800/80 shadow-sm';
        }
        if (btnAnims) {
            btnAnims.className = 'px-3.5 py-1.5 text-xs font-orbitron font-bold rounded-lg border-b-2 border-transparent text-slate-400 hover:text-amber-300 flex items-center gap-2 transition cursor-pointer';
        }
        if (contentSkins) contentSkins.classList.remove('hidden');
        if (contentAnims) contentAnims.classList.add('hidden');
        if (replayBtn) replayBtn.classList.add('hidden');

        renderSkinsShop();
        const activeSkin = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
        setPreviewSkin(activeSkin, false);
    }
}
window.switchSkinSubTab = switchSkinSubTab;

function updateCyberStarsHUD() {
    const countEl = document.getElementById('cyber-stars-count-val');
    const count = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 5;
    if (countEl) {
        countEl.innerText = count;
        if (count === 0) {
            countEl.className = 'text-rose-400 font-bold animate-pulse';
        } else {
            countEl.className = 'text-cyan-300 font-bold';
        }
    }
    if (typeof ICONS !== 'undefined' && typeof ICONS.renderDOM === 'function') {
        ICONS.renderDOM();
    }
}
window.updateCyberStarsHUD = updateCyberStarsHUD;

// ==================== 1. KOSTYUMLARIN ÖNBAXIŞI (SKINS PREVIEW) ====================
function highlightPreviewCard(previewId) {
    const skinsList = getSkinsCatalog();
    const active = (permUpgrades && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';

    Object.keys(skinsList).forEach(id => {
        const cardEl = document.getElementById(`skin-card-${id}`);
        if (!cardEl) return;
        const skin = skinsList[id];
        const isActive = active === id;
        const isPreview = previewId === id;

        if (isActive) {
            cardEl.className = 'glass-card p-2 sm:p-2.5 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/25 bg-slate-900/80 ring-1 ring-emerald-500/40 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer';
            cardEl.style.boxShadow = `0 0 20px ${skin.color}35`;
        } else if (isPreview) {
            cardEl.className = 'glass-card p-2 sm:p-2.5 rounded-2xl border-2 border-cyan-400 shadow-xl shadow-cyan-400/30 bg-slate-900/95 ring-2 ring-cyan-400/50 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer -translate-y-1';
            cardEl.style.boxShadow = `0 0 24px ${skin.color}50`;
        } else {
            cardEl.className = 'glass-card p-2 sm:p-2.5 rounded-2xl border border-slate-800 hover:border-cyan-400/50 bg-slate-950/70 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer hover:-translate-y-0.5';
            cardEl.style.boxShadow = `0 0 12px ${skin.color}10`;
        }
    });
}
window.highlightPreviewCard = highlightPreviewCard;

function setPreviewSkin(skinId, shouldScroll = false) {
    currentPreviewSkinId = skinId;
    const skinsList = getSkinsCatalog();
    const skin = skinsList[skinId];
    if (!skin) return;

    const indicatorEl = document.getElementById('preview-stage-indicator');
    if (indicatorEl) indicatorEl.innerText = 'CANLI OYUNÇU HOLOQRAMI';

    const nameEl = document.getElementById('preview-skin-name');
    if (nameEl) nameEl.innerText = skin.name;

    const titleEl = document.getElementById('preview-skin-title');
    if (titleEl) {
        titleEl.innerText = skin.title;
        titleEl.style.color = skin.color;
    }

    const badgeEl = document.getElementById('preview-skin-badge');
    if (badgeEl) {
        badgeEl.innerHTML = `<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-bold border shadow-sm" style="background: ${skin.color}20; color: ${skin.color}; border-color: ${skin.color}50;">${skin.badge || skin.title}</span>`;
    }

    const descEl = document.getElementById('preview-skin-desc');
    if (descEl) descEl.innerText = skin.perk || skin.desc;

    highlightPreviewCard(skinId);
    startSkinStageAnimation();

    if (shouldScroll) {
        const stage = document.getElementById('skin-stage-canvas');
        if (stage && stage.getBoundingClientRect().top < 0) {
            stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
window.setPreviewSkin = setPreviewSkin;

// ==================== 2. DOĞULUŞ ANİMASİYALARININ ÖNBAXIŞI (SPAWN FX PREVIEW) ====================
function highlightPreviewSpawnAnimCard(previewId) {
    const animsList = getSpawnAnimsCatalog();
    const active = (permUpgrades && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'singularity';
    const targetPreviewId = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(previewId) ? 'singularity' : previewId;
    const targetActiveId = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(active) ? 'singularity' : active;

    Object.keys(animsList).forEach(id => {
        const cardEl = document.getElementById(`spawn-anim-card-${id}`);
        if (!cardEl) return;
        const anim = animsList[id];
        const isActive = (targetActiveId === id);
        const isPreview = (targetPreviewId === id);

        if (isActive) {
            cardEl.className = 'glass-card p-2.5 sm:p-3 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/25 bg-slate-900/80 ring-1 ring-emerald-500/40 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer';
            cardEl.style.boxShadow = `0 0 20px ${anim.color}35`;
        } else if (isPreview) {
            cardEl.className = 'glass-card p-2.5 sm:p-3 rounded-2xl border-2 border-amber-400 shadow-xl shadow-amber-400/30 bg-slate-900/95 ring-2 ring-amber-400/50 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer -translate-y-1';
            cardEl.style.boxShadow = `0 0 24px ${anim.color}50`;
        } else {
            cardEl.className = 'glass-card p-2.5 sm:p-3 rounded-2xl border border-slate-800 hover:border-amber-400/50 bg-slate-950/70 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-200 cursor-pointer hover:-translate-y-0.5';
            cardEl.style.boxShadow = `0 0 12px ${anim.color}10`;
        }
    });
}
window.highlightPreviewSpawnAnimCard = highlightPreviewSpawnAnimCard;

function setPreviewSpawnAnim(animId, shouldScroll = false) {
    const prevAnimId = currentPreviewSpawnAnimId;
    currentPreviewSpawnAnimId = animId;
    if (SINGULARITY_VARIANTS[animId]) {
        currentSingularityVariantId = animId;
    }
    if (prevAnimId && prevAnimId !== animId) {
        drawStaticSpawnAnimCard(prevAnimId);
    }
    const animsList = getSpawnAnimsCatalog();
    const anim = SINGULARITY_VARIANTS[animId] || animsList[animId];
    if (!anim) return;

    const indicatorEl = document.getElementById('preview-stage-indicator');
    if (indicatorEl) indicatorEl.innerText = `DOĞULUŞ ANİMASİYASI: ${anim.title}`;

    const nameEl = document.getElementById('preview-skin-name');
    if (nameEl) nameEl.innerText = anim.name;

    const titleEl = document.getElementById('preview-skin-title');
    if (titleEl) {
        titleEl.innerText = anim.title;
        titleEl.style.color = anim.color;
    }

    const badgeEl = document.getElementById('preview-skin-badge');
    if (badgeEl) {
        badgeEl.innerHTML = `<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-bold border shadow-sm" style="background: ${anim.color}20; color: ${anim.color}; border-color: ${anim.color}50;">${anim.badge}</span>`;
    }

    const descEl = document.getElementById('preview-skin-desc');
    if (descEl) descEl.innerText = anim.desc;

    highlightPreviewSpawnAnimCard(animId);

    // Podesta canlı animasiya effektini başlat
    initSpawnAnimPreview(animId);

    if (shouldScroll) {
        const stage = document.getElementById('skin-stage-canvas');
        if (stage && stage.getBoundingClientRect().top < 0) {
            stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
window.setPreviewSpawnAnim = setPreviewSpawnAnim;

function initSpawnAnimPreview(animId) {
    const canvas = document.getElementById('skin-stage-canvas');
    if (!canvas) return;

    const activeSkin = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
    if (window.SingularitySpawnEffect && ['singularity', 'supernova', 'synapse', 'abyssal'].includes(animId)) {
        window.SingularitySpawnEffect.setTheme(animId);
    }
    const fxModule = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get(animId) : null;
    const fullDuration = (fxModule && fxModule.duration) ? fxModule.duration : 6.0;

    const SpawnClass = window.MonsSpawnEffect || window.MonsPortalEffect;
    if (SpawnClass) {
        previewSpawnEffectInstance = new SpawnClass({
            x: canvas.width / 2,
            y: canvas.height / 2 + 25,
            targetY: canvas.height / 2 - 14,
            skinId: activeSkin,
            animType: animId,
            loop: true
        });
        previewSpawnEffectInstance.duration = fullDuration;
        previewSpawnEffectInstance.maxAnimTime = fullDuration;
    }

    startSkinStageAnimation();
}
window.initSpawnAnimPreview = initSpawnAnimPreview;

function replaySpawnAnimPreview() {
    if (previewSpawnEffectInstance) {
        previewSpawnEffectInstance.time = 0;
        previewSpawnEffectInstance.finished = false;
        if (typeof showToast === 'function') {
            showToast('🔄 Doğuluş animasiyası yenidən başladıldı', 'info');
        }
    }
}
window.replaySpawnAnimPreview = replaySpawnAnimPreview;

// ==================== 3. VİTRİN KANVAS RENDER DÖVRÜ ====================
function startSkinStageAnimation() {
    if (skinStageAnimFrame) cancelAnimationFrame(skinStageAnimFrame);

    const canvas = document.getElementById('skin-stage-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    function renderStage() {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (currentSkinSubTab === 'anims') {
            // DOĞULUŞ ANİMASİYASI ÖNBAXIŞI (SPAWN FX)
            if (previewSpawnEffectInstance) {
                previewSpawnEffectInstance.update(dt);
                previewSpawnEffectInstance.draw(ctx, w, h);
            }
        } else {
            // KOSTYUMLARIN STANDART ÖNBAXIŞI (SKIN ROTATION & PLATFORM)
            const skinsList = getSkinsCatalog();
            const activeId = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
            const skin = skinsList[activeId] || skinsList['default'];

            skinStageTime += 0.028;

            const centerX = w / 2;
            const floatY = Math.sin(skinStageTime * 2.2) * 5;
            const centerY = (h / 2) - 4 + floatY;
            const radius = 24;
            const platY = (h / 2) + radius + 14;

            // 1. Radial Fon Aurası
            const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.45);
            bgGrad.addColorStop(0, `${skin.color}26`);
            bgGrad.addColorStop(0.6, `${skin.color}06`);
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // 2. Kiber Holoqram Podestı
            ctx.save();
            ctx.translate(centerX, platY);
            ctx.scale(1, 0.28);

            ctx.save();
            ctx.rotate(skinStageTime * 0.8);
            ctx.beginPath();
            ctx.arc(0, 0, radius * 2.6, 0, Math.PI * 2);
            ctx.strokeStyle = `${skin.color}40`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
            ctx.strokeStyle = `${skin.color}90`;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([]);
            ctx.stroke();

            const platFill = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.6);
            platFill.addColorStop(0, `${skin.color}50`);
            platFill.addColorStop(1, 'transparent');
            ctx.fillStyle = platFill;
            ctx.fill();
            ctx.restore();

            // 3. Şaquli Holoqram Lazer Şüaları
            ctx.save();
            for (let i = 0; i < 3; i++) {
                const beamAngle = skinStageTime * 1.2 + i * 2.1;
                const bx = centerX + Math.cos(beamAngle) * (radius * 0.8);
                ctx.strokeStyle = `${skin.color}25`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx, platY);
                ctx.lineTo(bx + Math.sin(skinStageTime + i) * 3, centerY + radius * 0.4);
                ctx.stroke();
            }
            ctx.restore();

            // 4. ƏSAS PERSONAJ (ŞAQULİ DİK, ZƏRİF DÖVR EDİR)
            const lookAngle = Math.sin(skinStageTime * 1.5) * 0.25;
            if (typeof drawSkinModel === 'function') {
                drawSkinModel(ctx, centerX, centerY, radius, activeId, lookAngle, skinStageTime, false);
            }
        }

        // Mini Kart Canvas-larını canlandır (Kostyumlar rejimi üçün)
        if (currentSkinSubTab === 'skins') {
            const skinsList = getSkinsCatalog();
            Object.keys(skinsList).forEach((sid, idx) => {
                const cardCanvas = document.getElementById(`skin-card-canvas-${sid}`);
                if (!cardCanvas) return;
                const cctx = cardCanvas.getContext('2d');
                if (!cctx) return;

                const cw = cardCanvas.width;
                const ch = cardCanvas.height;
                cctx.clearRect(0, 0, cw, ch);

                const cskin = skinsList[sid];
                const cGrad = cctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, 36);
                cGrad.addColorStop(0, `${cskin.color}25`);
                cGrad.addColorStop(0.7, `${cskin.color}06`);
                cGrad.addColorStop(1, 'transparent');
                cctx.fillStyle = cGrad;
                cctx.fillRect(0, 0, cw, ch);

                const cardFloatY = ch / 2 + Math.sin(skinStageTime * 2.5 + idx * 1.3) * 3;
                const cardFacing = Math.sin(skinStageTime * 1.8 + idx) * 0.25;
                if (typeof drawSkinModel === 'function') {
                    drawSkinModel(cctx, cw / 2, cardFloatY, 15, sid, cardFacing, skinStageTime + idx * 2, false);
                }
            });
        }

        // Mini Kart Canvas-larını canlandır (Doğuluş Animasiyaları üçün - ULTRA OPTİMİZASİYA)
        // Bütün 9 kartı birdən hər freymdə çəkmək CPU-nu dondurur.
        // YALNIZ kursor üzərində olan (hover) VƏ YA seçilmiş tək kart 30 FPS ilə canlanır!
        if (currentSkinSubTab === 'anims') {
            const requestedCardId = hoveredSpawnAnimCardId || currentPreviewSpawnAnimId;
            const isQuantumCard = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(requestedCardId);
            const activeCardId = isQuantumCard ? 'singularity' : requestedCardId;
            const activeEffectId = isQuantumCard ? (currentSingularityVariantId || 'singularity') : activeCardId;
            const nowSec = performance.now() / 1000;

            if (activeCardId && (nowSec - lastMiniCardRenderTime >= 0.033)) {
                lastMiniCardRenderTime = nowSec;
                const cardCanvas = document.getElementById(`spawn-anim-card-canvas-${activeCardId}`);
                if (cardCanvas) {
                    const cctx = cardCanvas.getContext('2d');
                    if (cctx) {
                        const cw = cardCanvas.width;
                        const ch = cardCanvas.height;
                        cctx.clearRect(0, 0, cw, ch);

                        const fxModule = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get(activeEffectId) : null;
                        if (fxModule) {
                            cctx.fillStyle = '#060715';
                            cctx.fillRect(0, 0, cw, ch);

                            const loopDur = fxModule.duration || 6.0;
                            const miniT = (nowSec * 1.35) % loopDur;

                            const activeSkinId = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';
                            const drawMiniMonster = (mctx, mt) => {
                                if (typeof drawSkinModel === 'function') {
                                    drawSkinModel(mctx, 0, 0, 16, activeSkinId, 0, mt * 2.5, false);
                                }
                            };

                            fxModule.draw(cctx, cw, ch, miniT, drawMiniMonster, false, activeEffectId);
                        }
                    }
                }
            }
        }

        skinStageAnimFrame = requestAnimationFrame(renderStage);
    }

    renderStage();
}
window.startSkinStageAnimation = startSkinStageAnimation;

// ==================== 4. KOSTYUMLAR MAĞAZASININ RENDERİ ====================
function handleSkinCardClick(skinId) {
    const skinsList = getSkinsCatalog();
    if (!skinsList || !skinsList[skinId]) return;
    const owned = (permUpgrades && permUpgrades.ownedSkins) ? permUpgrades.ownedSkins : ['default'];

    setPreviewSkin(skinId, true);

    if (owned.includes(skinId)) {
        buyOrEquipSkin(skinId);
    } else {
        if (typeof showToast === 'function') {
            showToast(`👁️ "${skinsList[skinId].name}" önbaxışa çıxarıldı`, 'info');
        }
    }
}
window.handleSkinCardClick = handleSkinCardClick;

function renderSkinsShop() {
    const container = document.getElementById('skins-cards-container');
    if (!container) return;

    const skinsList = getSkinsCatalog();
    const owned = (permUpgrades && permUpgrades.ownedSkins) ? permUpgrades.ownedSkins : ['default'];
    const active = (permUpgrades && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
    const preview = currentPreviewSkinId || active;

    let html = '';
    Object.values(skinsList).forEach(skin => {
        const isOwned = owned.includes(skin.id);
        const isActive = active === skin.id;
        const isPreviewing = preview === skin.id;

        let borderClass = 'border-slate-800 hover:border-cyan-400/40 bg-slate-950/70';
        let glowStyle = `box-shadow: 0 0 12px ${skin.color}10;`;
        if (isActive) {
            borderClass = 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/25 bg-slate-900/80 ring-1 ring-emerald-500/40';
            glowStyle = `box-shadow: 0 0 20px ${skin.color}35;`;
        } else if (isPreviewing) {
            borderClass = 'border-2 border-cyan-400 shadow-xl shadow-cyan-400/30 bg-slate-900/95 ring-2 ring-cyan-400/50 -translate-y-0.5';
            glowStyle = `box-shadow: 0 0 24px ${skin.color}50;`;
        }

        let actionBtn = '';
        if (isActive) {
            actionBtn = `
                <button disabled class="w-full py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 cursor-default shadow-sm shadow-emerald-500/20">
                    <i class="fa-solid fa-check-circle text-[9px]"></i> AKTİVDİR
                </button>
            `;
        } else if (isOwned) {
            actionBtn = `
                <div class="flex items-center gap-1.5 w-full">
                    <button type="button" onclick="event.stopPropagation(); setPreviewSkin('${skin.id}', true); if(typeof showToast==='function') showToast('👁️ \\'${skin.name}\\' önbaxışa çıxarıldı', 'info');" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 font-orbitron font-bold text-[9px] flex items-center justify-center gap-1 transition cursor-pointer" title="Holoqram Önbaxış">
                        <i class="fa-solid fa-eye text-[9px]"></i>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); buyOrEquipSkin('${skin.id}');" class="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition hover:scale-[1.02]">
                        <i class="fa-solid fa-hand-pointer text-[9px]"></i> TƏCHİZ ET
                    </button>
                </div>
            `;
        } else {
            const currentRed = (typeof redDiamonds !== 'undefined') ? redDiamonds : 0;
            const canAfford = currentRed >= skin.cost;
            const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 13 }) : '💎';

            actionBtn = `
                <div class="flex items-center gap-1.5 w-full">
                    <button type="button" onclick="event.stopPropagation(); setPreviewSkin('${skin.id}', true); if(typeof showToast==='function') showToast('👁️ \\'${skin.name}\\' önbaxışa çıxarıldı', 'info');" class="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 font-orbitron font-bold text-[9px] flex items-center justify-center gap-1 transition cursor-pointer shadow-sm hover:scale-105" title="Canlı Holoqram Önbaxışı">
                        <i class="fa-solid fa-eye text-[9px]"></i> Önbaxış
                    </button>
                    <button type="button" onclick="event.stopPropagation(); buyOrEquipSkin('${skin.id}');" class="flex-1 py-1.5 rounded-lg font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer ${canAfford ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 hover:scale-[1.02] border border-rose-400/50' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-rose-500/30'}">
                        <span>AL: ${skin.cost}</span>
                        <span>${rubySvg}</span>
                    </button>
                </div>
            `;
        }

        html += `
            <div id="skin-card-${skin.id}"
                 onclick="handleSkinCardClick('${skin.id}');"
                 onmouseenter="setPreviewSkin('${skin.id}', false);"
                 class="glass-card p-2.5 sm:p-3 rounded-2xl border ${borderClass} flex flex-col justify-between items-center text-center relative z-10 overflow-hidden group transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-cyan-400/60"
                 style="${glowStyle}"
                 title="${isOwned ? 'Təchiz etmək üçün klikləyin' : 'Canlı önbaxış üçün klikləyin'}">
                <div class="w-full flex items-center justify-between px-0.5 mb-1.5 pointer-events-none">
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border bg-slate-900/80 truncate max-w-[95px]" style="color: ${skin.color}; border-color: ${skin.color}40;">
                        <i class="fa-solid ${skin.icon} mr-0.5"></i> ${skin.title}
                    </span>
                    ${isActive ? `<span class="bg-emerald-500 text-slate-950 rounded-full px-1.5 py-0.5 text-[8px] font-orbitron font-bold shadow flex items-center gap-0.5"><i class="fa-solid fa-check"></i> AKTİV</span>` : (isOwned ? `<span class="text-slate-400 text-[8px] font-mono">SAHİBSƏN</span>` : '')}
                </div>

                <div class="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl flex items-center justify-center mb-1.5 bg-slate-950/90 border border-slate-800 shadow-inner group-hover:border-cyan-500/40 transition-colors duration-200 overflow-hidden pointer-events-none" style="box-shadow: inset 0 0 15px ${skin.color}20, 0 0 10px ${skin.color}15;">
                    <canvas id="skin-card-canvas-${skin.id}" width="72" height="72" class="w-full h-full block pointer-events-none"></canvas>
                    <div class="absolute bottom-0.5 right-1.5 text-[7px] font-mono text-slate-500 uppercase pointer-events-none">3D</div>
                </div>

                <div class="mb-1.5 w-full pointer-events-none">
                    <h4 class="font-orbitron font-bold text-xs text-white tracking-wide group-hover:text-cyan-300 transition-colors leading-tight">${skin.name}</h4>
                    <div class="my-1">
                        <span class="inline-block px-2 py-0.5 rounded-full text-[9px] font-orbitron font-bold border shadow-sm" style="background: ${skin.color}18; color: ${skin.color}; border-color: ${skin.color}45;">
                            ${skin.badge || 'Standart'}
                        </span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight font-medium px-0.5 line-clamp-1 min-h-[16px] flex items-center justify-center" title="${skin.perk || skin.desc}">${skin.perk || skin.desc}</p>
                </div>

                <div class="w-full pt-1.5 border-t border-slate-800/80">
                    ${actionBtn}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
window.renderSkinsShop = renderSkinsShop;

function buyOrEquipSkin(skinId) {
    const skinsList = getSkinsCatalog();
    if (!skinsList || !skinsList[skinId]) return;
    const skin = skinsList[skinId];
    if (!permUpgrades.ownedSkins || !Array.isArray(permUpgrades.ownedSkins)) permUpgrades.ownedSkins = ['default'];

    setPreviewSkin(skinId, true);

    if (permUpgrades.ownedSkins.includes(skinId)) {
        permUpgrades.equippedSkin = skinId;
        savePermanentData();
        renderSkinsShop();
        if (typeof showToast === 'function') {
            showToast(`✅ "${skin.name}" dərisi təchiz edildi!`, 'success');
        }
        if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();
        return;
    }

    const currentRed = (typeof redDiamonds !== 'undefined') ? redDiamonds : 0;
    if (currentRed < skin.cost) {
        if (typeof showToast === 'function') {
            showToast(`❌ Kifayət qədər Fancy Elmas yoxdur! Lazımdır: ${skin.cost} Fancy Elmas`, 'danger');
        }
        if (typeof audio !== 'undefined' && audio.playError) audio.playError();
        return;
    }

    redDiamonds -= skin.cost;
    localStorage.setItem('floor_escape_red_diamonds', redDiamonds);
    permUpgrades.ownedSkins.push(skinId);
    permUpgrades.equippedSkin = skinId;
    savePermanentData();

    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    renderSkinsShop();

    if (typeof showToast === 'function') {
        showToast(`🎉 "${skin.name}" dərisi uğurla alındı və təchiz edildi!`, 'success');
    }
    if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();
}
window.buyOrEquipSkin = buyOrEquipSkin;

// ==================== 5. DOĞULUŞ ANİMASİYALARI MAĞAZASININ RENDERİ ====================
function handleSpawnAnimCardClick(animId) {
    const animsList = getSpawnAnimsCatalog();
    if (!animsList[animId] && !SINGULARITY_VARIANTS[animId]) return;

    // Yalnızca kliklədikdə yuxarı səhnədə önbaxışı aktivləşdirir (alınıb-alınmamasından asılı olmayaraq)
    setPreviewSpawnAnim(animId, false);
}
window.handleSpawnAnimCardClick = handleSpawnAnimCardClick;

function renderSpawnAnimsShop() {
    const container = document.getElementById('spawn-anims-cards-container');
    if (!container) return;

    const animsList = getSpawnAnimsCatalog();
    const owned = (permUpgrades && permUpgrades.ownedSpawnAnims) ? permUpgrades.ownedSpawnAnims : ['singularity', 'portal'];
    const active = (permUpgrades && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'singularity';
    const preview = currentPreviewSpawnAnimId || active;

    let html = '';
    Object.values(animsList).forEach(anim => {
        let displayAnim = anim;
        let isMulti = !!anim.isMultiVariant;
        let multiVariantControls = '';

        if (isMulti) {
            // Əgər oyunda təchiz edilmiş animasiya bu 4-dən biridirsə, default olaraq onu seç
            if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(active) && !currentSingularityVariantId) {
                currentSingularityVariantId = active;
            }
            const curVar = SINGULARITY_VARIANTS[currentSingularityVariantId] || SINGULARITY_VARIANTS.singularity;
            displayAnim = { ...anim, ...curVar };

            multiVariantControls = `
                <div class="grid grid-cols-4 gap-1 w-full my-1.5 px-0.5" onclick="event.stopPropagation();">
                    ${Object.values(SINGULARITY_VARIANTS).map(v => {
                        const isVarOwned = owned.includes(v.id);
                        const isVarActive = (active === v.id);
                        const isVarSelected = (currentSingularityVariantId === v.id);
                        let pillClass = 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-700';
                        if (isVarSelected) {
                            pillClass = 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-sm ring-1 ring-amber-400/50';
                        } else if (isVarActive) {
                            pillClass = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
                        }
                        return `
                            <button type="button" 
                                    onclick="selectSingularityVariant('${v.id}');"
                                    class="px-1 py-1 rounded-lg text-[9px] font-orbitron font-bold transition flex items-center justify-center gap-0.5 border cursor-pointer ${pillClass}"
                                    style="${isVarSelected ? `border-color:${v.color}; color:${v.color};` : ''}"
                                    title="${v.name}">
                                <span>${v.shortName}</span>
                                ${!isVarOwned ? `<i class="fa-solid fa-lock text-[7px] text-slate-500 ml-0.5"></i>` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        const effectiveId = displayAnim.id; // əgər multiVariant-dırsa, cari variantın ID-si
        const isOwned = owned.includes(effectiveId);
        const isActive = (active === effectiveId);
        const isPreviewing = (preview === anim.id || preview === effectiveId);

        let borderClass = 'border-slate-800 hover:border-amber-400/40 bg-slate-950/70';
        let glowStyle = `box-shadow: 0 0 12px ${displayAnim.color}10;`;
        if (isActive && isPreviewing) {
            borderClass = 'border-2 border-emerald-400 shadow-xl shadow-emerald-500/30 bg-slate-900/95 ring-2 ring-emerald-400/50 -translate-y-0.5';
            glowStyle = `box-shadow: 0 0 24px ${displayAnim.color}60;`;
        } else if (isActive) {
            borderClass = 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/25 bg-slate-900/80 ring-1 ring-emerald-500/40';
            glowStyle = `box-shadow: 0 0 20px ${displayAnim.color}35;`;
        } else if (isPreviewing) {
            borderClass = 'border-2 border-amber-400 shadow-xl shadow-amber-400/30 bg-slate-900/95 ring-2 ring-amber-400/50 -translate-y-0.5';
            glowStyle = `box-shadow: 0 0 24px ${displayAnim.color}50;`;
        }

        let actionBtn = '';
        if (isActive) {
            actionBtn = `
                <div class="flex items-center gap-1.5 w-full">
                    <button type="button" onclick="event.stopPropagation(); openSpawnAnimFullscreenPreview('${effectiveId}');" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 font-orbitron font-bold text-[9px] flex items-center justify-center gap-1 transition cursor-pointer" title="Bütün qeydlər və Tam Baxış">
                        <i class="fa-solid fa-eye text-[9px]"></i>
                    </button>
                    <button disabled class="flex-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 cursor-default shadow-sm shadow-emerald-500/20">
                        <i class="fa-solid fa-check-circle text-[9px]"></i> AKTİVDİR
                    </button>
                </div>
            `;
        } else if (isOwned) {
            actionBtn = `
                <div class="flex items-center gap-1.5 w-full">
                    <button type="button" onclick="event.stopPropagation(); openSpawnAnimFullscreenPreview('${effectiveId}');" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/50 font-orbitron font-bold text-[9px] flex items-center justify-center gap-1 transition cursor-pointer" title="Bütün qeydlər və Tam Baxış">
                        <i class="fa-solid fa-eye text-[9px]"></i>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); buyOrEquipSpawnAnim('${effectiveId}');" class="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition hover:scale-[1.02]">
                        <i class="fa-solid fa-hand-pointer text-[9px]"></i> TƏCHİZ ET
                    </button>
                </div>
            `;
        } else {
            const currentRed = (typeof redDiamonds !== 'undefined') ? redDiamonds : 0;
            const canAfford = currentRed >= displayAnim.cost;
            const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 12 }) : '💎';

            actionBtn = `
                <div class="flex items-center gap-1.5 w-full">
                    <button type="button" onclick="event.stopPropagation(); openSpawnAnimFullscreenPreview('${effectiveId}');" class="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 font-orbitron font-bold text-[9px] flex items-center justify-center gap-1 transition cursor-pointer shadow-sm hover:scale-105" title="Bütün qeydlər və Tam Baxış">
                        <i class="fa-solid fa-eye text-[9px]"></i>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); buyOrEquipSpawnAnim('${effectiveId}');" class="flex-1 py-1.5 rounded-lg font-orbitron font-bold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer ${canAfford ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 hover:scale-[1.02] border border-rose-400/50' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-rose-500/30'}">
                        <span>AL: ${displayAnim.cost}</span>
                        <span>${rubySvg}</span>
                    </button>
                </div>
            `;
        }

        html += `
            <div id="spawn-anim-card-${anim.id}"
                 onclick="handleSpawnAnimCardClick('${effectiveId}');"
                 onmouseenter="setHoveredSpawnAnimCard('${anim.id}');"
                 onmouseleave="setHoveredSpawnAnimCard(null);"
                 class="glass-card p-2.5 rounded-2xl border ${borderClass} flex flex-col justify-between items-center text-center relative z-10 overflow-hidden group transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-amber-400/60"
                 style="${glowStyle}"
                 title="Önbaxış üçün klikləyin">
                
                <div class="w-full flex items-center justify-between px-0.5 mb-1 pointer-events-none">
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border bg-slate-900/80 truncate max-w-[100px]" style="color: ${displayAnim.color}; border-color: ${displayAnim.color}40;">
                        <i class="fa-solid ${displayAnim.icon} mr-0.5"></i> ${displayAnim.title}
                    </span>
                    ${isActive ? `<span class="bg-emerald-500 text-slate-950 rounded-full px-1.5 py-0.5 text-[8px] font-orbitron font-bold shadow flex items-center gap-0.5"><i class="fa-solid fa-check"></i> AKTİV</span>` : (isOwned ? `<span class="text-slate-400 text-[8px] font-mono">SAHİBSƏN</span>` : `<span class="text-rose-400 text-[8px] font-mono font-bold">${displayAnim.cost} 💎</span>`)}
                </div>

                <!-- CANLI ANİMASİYA PƏNCƏRƏSİ (KOMPAKT MİNİ KANVAS) -->
                <div class="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl flex items-center justify-center my-1 bg-[#060715] border border-slate-800 shadow-inner group-hover:border-amber-500/40 transition-colors duration-200 overflow-hidden pointer-events-none" style="box-shadow: inset 0 0 12px ${displayAnim.color}25, 0 0 8px ${displayAnim.color}20;">
                    <canvas id="spawn-anim-card-canvas-${anim.id}" width="160" height="160" class="w-full h-full block object-contain"></canvas>
                    <div class="absolute bottom-1 right-1 text-[6px] font-mono text-slate-400 bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none">FX</div>
                </div>

                ${anim.id === 'glacial' ? `<div class="w-full p-2 rounded-lg bg-sky-950/50 text-xs text-cyan-100" onclick="event.stopPropagation()">
                    <p>Başlanğıc: 6 buz mərmisi · E ilə atış</p>
                    <p>Hərəkətlə dolan tutum: ${getGlacialReloadLevel()}/6</p>
                    <button type="button" class="mt-2 p-2 rounded bg-sky-700 hover:bg-sky-600" onclick="buyGlacialReload()" ${getGlacialReloadLevel()>=6?'disabled':''}>${getGlacialReloadLevel()>=6?'Tam təkmilləşib':`Doldurma +1 · ${GLACIAL_RELOAD_PRICES[getGlacialReloadLevel()]} Fancy`}</button>
                </div>` : ''}
                ${multiVariantControls}

                <div class="mb-1 w-full pointer-events-none">
                    <h4 class="font-orbitron font-bold text-xs text-white tracking-wide group-hover:text-amber-300 transition-colors leading-tight">${displayAnim.name}</h4>
                    <div class="mt-0.5">
                        <span class="inline-block px-2 py-0.5 rounded-full text-[8.5px] font-orbitron font-bold border shadow-sm" style="background: ${displayAnim.color}18; color: ${displayAnim.color}; border-color: ${displayAnim.color}45;">
                            ${displayAnim.badge}
                        </span>
                    </div>
                </div>

                ${isMulti ? `
                    <div class="w-full my-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-sky-500/30 flex items-center justify-between gap-1 text-[10px] font-orbitron shadow-inner" onclick="event.stopPropagation();">
                        <div class="flex items-center gap-1 text-slate-300">
                            <i class="fa-solid fa-star text-amber-400 text-xs"></i>
                            <span>Ulduz:</span>
                            <span class="text-cyan-300 font-bold">${(permUpgrades && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 5}</span>
                        </div>
                        <button type="button" onclick="buyCyberStars(5, 5);" class="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 hover:border-sky-300 text-sky-300 font-bold text-[9px] flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-sm" title="5 Göy Almaz ilə 5 Kiber Ulduz al">
                            <span>+5 Ulduz: 5</span>
                            <span data-icon="cyanDiamond" data-size="11"></span>
                        </button>
                    </div>
                ` : ''}

                <div class="w-full pt-1.5 border-t border-slate-800/80">
                    ${actionBtn}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    requestAnimationFrame(() => {
        Object.keys(animsList).forEach(aid => {
            drawStaticSpawnAnimCard(aid);
        });
    });
}
window.renderSpawnAnimsShop = renderSpawnAnimsShop;

// ==================== 4. TAM EKRAN KİNO TEATR ÖNBAXIŞ MODALI ====================
let fullscreenAnimInstance = null;
let fullscreenAnimFrame = null;

function openSpawnAnimFullscreenPreview(animId) {
    const animsList = getSpawnAnimsCatalog();
    const anim = SINGULARITY_VARIANTS[animId] || animsList[animId];
    if (!anim) return;

    const modal = document.getElementById('spawn-anim-fullscreen-modal');
    if (!modal) return;

    // Səhnə podiumunu da həmin animasiyaya keçir
    setPreviewSpawnAnim(animId, false);

    // Məlumatları doldur
    const nameEl = document.getElementById('fs-anim-name');
    if (nameEl) nameEl.innerText = anim.name;

    const subTitleEl = document.getElementById('fs-anim-subtitle');
    if (subTitleEl) subTitleEl.innerText = `${anim.title} · Unikal Doğuluş Portalı`;

    const descEl = document.getElementById('fs-anim-desc');
    if (descEl) descEl.innerText = anim.desc;

    const iconEl = document.getElementById('fs-anim-icon');
    if (iconEl) iconEl.className = `fa-solid ${anim.icon}`;

    const iconBox = document.getElementById('fs-anim-icon-box');
    if (iconBox) {
        iconBox.style.color = anim.color;
        iconBox.style.borderColor = `${anim.color}60`;
        iconBox.style.backgroundColor = `${anim.color}20`;
    }

    const badgeEl = document.getElementById('fs-anim-badge');
    if (badgeEl) {
        badgeEl.innerText = anim.badge;
        badgeEl.style.color = anim.color;
        badgeEl.style.borderColor = `${anim.color}50`;
        badgeEl.style.backgroundColor = `${anim.color}20`;
    }

    const owned = (permUpgrades && permUpgrades.ownedSpawnAnims) ? permUpgrades.ownedSpawnAnims : ['singularity', 'portal'];
    const active = (permUpgrades && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'singularity';
    const isOwned = owned.includes(anim.id);
    const isActive = active === anim.id;

    // Sahiblik etiketi
    const ownerTag = document.getElementById('fs-anim-ownership-tag');
    if (ownerTag) {
        if (isActive) {
            ownerTag.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold';
            ownerTag.innerText = 'AKTİVDİR';
        } else if (isOwned) {
            ownerTag.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold';
            ownerTag.innerText = 'SAHİBSƏN';
        } else {
            ownerTag.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-rose-500/40 font-bold';
            ownerTag.innerText = `${anim.cost} FANCY ELMAS`;
        }
    }

    // Kənar panel xüsusi oyun üstünlükləri və qeydləri (Perk Box)
    const perkBox = document.getElementById('fs-anim-perk-box');
    if (perkBox) {
        if (animId === 'seed') {
            const seedLvl = (permUpgrades && permUpgrades.seedLifeLvl) ? permUpgrades.seedLifeLvl : 1;
            const upgradeCost = seedLvl === 1 ? 15 : 25;
            perkBox.innerHTML = `
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold text-emerald-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-heart-pulse"></i> Yaşam Çiçəyi Qorunması
                        </span>
                        <span class="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            🌸 Tutum: ${seedLvl}/3 Can
                        </span>
                    </div>
                    <div class="text-[11px] text-slate-300 leading-relaxed flex flex-col gap-1">
                        <div>• <strong>+${seedLvl} Can Qorunması:</strong> Mons oyuna qoruyucu sarmaşıqlar və orbital çiçəklərlə başlayır.</div>
                        <div>• <strong>Qalıcılıq:</strong> Qalan canlar qatlar keçdikdə itmir və qorunur.</div>
                        <div>• <strong>Arenada Bərpa:</strong> Canlar tükəndikdə arenada peyda olan 🌸 Yaşam Çiçəyini toplayaraq canı yenidən bərpa edə bilərsiniz.</div>
                    </div>
                    ${isOwned && seedLvl < 3 ? `
                        <div class="pt-2 mt-1 border-t border-slate-800/80 flex items-center justify-between">
                            <span class="text-[10px] text-slate-400 font-mono">Növbəti səviyyə: +${seedLvl + 1} Can</span>
                            <button type="button" onclick="upgradeSeedLife();" class="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-orbitron font-black text-[10px] rounded-lg shadow cursor-pointer transition hover:scale-105 active:scale-95 flex items-center gap-1">
                                <i class="fa-solid fa-arrow-up"></i> Yüksəlt (${upgradeCost}💎)
                            </button>
                        </div>
                    ` : (isOwned ? `<div class="text-[9px] font-mono text-amber-400 text-right mt-1">★ Maksimum Can Səviyyəsi Aktivdir</div>` : '')}
                </div>
            `;
        } else if (animId === 'dracula') {
            perkBox.innerHTML = `
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold text-rose-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt"></i> Drakula Qanadları Qabiliyyəti
                        </span>
                        <span class="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            🦇 +1 Hərəkət Sürəti
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        • <strong>Daimi Sürət Bonusu:</strong> Oyunda qaçış boyunca Monsun baza sürətini +1 vahid artırır.<br>
                        • <strong>Yarasa Qanadları:</strong> Teleportasiya və uçuş zamanı qaranlıq qanad tozu buraxır.
                    </p>
                </div>
            `;
        } else if (animId === 'stellar') {
            perkBox.innerHTML = `
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-star"></i> Ulduz Nüvəsi Qabiliyyəti
                        </span>
                        <span class="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            🌟 Kosmik Partlayış
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        • <strong>Kosmik Doğuluş:</strong> 3D axın lentləri fəzanı yarır, ulduz nüvəsi açılaraq kiber şüalanma bəxş edir.
                    </p>
                </div>
            `;
        } else if (animId === 'crystal') {
            perkBox.innerHTML = `
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold text-purple-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-gem"></i> Kristal Yarığı Qabiliyyəti
                        </span>
                        <span class="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            💎 İşıq Çatı
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        • <strong>Kristal Prizması:</strong> 3D perspektiv kristallar ayrılır, şimşək və prizmatik işıq dalğaları ilə Mons meydana çıxır.
                    </p>
                </div>
            `;
        } else if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(animId)) {
            const themeDetails = {
                singularity: {
                    title: 'Kiber Sinqulyarlıq (Cyan / Mavi)',
                    badge: '🌀 Hadisə Üfüqü & Qara Dəlik',
                    desc: 'Qara dəlik nüvəsi və foton halqası: Ulduzlar orbitdən ayrılıb lavaya şığıyır, lavanı güclü dondurub -45px geri itələyir və canavara zərər vurur.',
                    color: 'text-cyan-300',
                    border: 'border-cyan-500/40',
                    bg: 'bg-cyan-500/20'
                },
                supernova: {
                    title: 'Plazma Supernova (Qızıl / Alov)',
                    badge: '🔥 Alovlu Plazma Qığılcımları',
                    desc: 'Qızmar plazma partlayışları və supernova nüvəsi: Aşağı şığıyan ulduzlar lavanı partladıb soyudur (-45px) və qəlpələrə bölür.',
                    color: 'text-amber-300',
                    border: 'border-amber-500/40',
                    bg: 'bg-amber-500/20'
                },
                synapse: {
                    title: 'Kvant Sinapsı (Bənövşəyi / Elektrik)',
                    badge: '⚡ Bio-Elektrik Neyron Şəbəkəsi',
                    desc: 'Sinaps xətləri və elektrik pulsları: Kvant ulduzları aşağı atılaraq lavanı dondurub ləngidir və zərər vurur.',
                    color: 'text-purple-300',
                    border: 'border-purple-500/40',
                    bg: 'bg-purple-500/20'
                },
                abyssal: {
                    title: 'Dərin Abiss (Zümrüd / Tirkuaz)',
                    badge: '🌊 Dərinlik Leviathan Qolları',
                    desc: 'Biolüminisent sporlar və leviathan gözü: Düşən zümrüd kristalları lavaya zərbə vuraraq lavanı geriyə itələyir.',
                    color: 'text-teal-300',
                    border: 'border-teal-500/40',
                    bg: 'bg-teal-500/20'
                }
            };
            const activeDetail = themeDetails[animId] || themeDetails.singularity;

            perkBox.innerHTML = `
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold ${activeDetail.color} flex items-center gap-1.5">
                            <i class="fa-solid fa-atom"></i> ${activeDetail.title}
                        </span>
                        <span class="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded ${activeDetail.bg} ${activeDetail.color} border ${activeDetail.border}">
                            ${activeDetail.badge}
                        </span>
                    </div>
                    <div class="text-[11px] text-slate-300 leading-relaxed flex flex-col gap-1">
                        <div>• <strong>Kvant Simulyasiyası:</strong> 3D Pitch, Roll və Yaw bucaqları ilə fəzada dönən 3 pilləli telemetriya halqaları və dinamik qanadlar.</div>
                        <div>• <strong>Lavaya Zərbə:</strong> Düşən ulduzlar lavaya dəyəndə lavanı dərhal soyudur (-45px), kristal qəlpələrə parçalayır və canavara zərər vurur!</div>
                        <div>• <strong>Əl ilə Ulduz Qopartma:</strong> Oyunda [E] düyməsinə basdıqda orbitdən ulduz qoparaq aşağı şığıyır.</div>
                    </div>
                    <div class="pt-2 mt-1 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                        <span class="text-[9px] text-slate-400 font-mono">MÖVZU SEÇİMİ:</span>
                        <button type="button" onclick="if (window.SingularitySpawnEffect) { window.SingularitySpawnEffect.setTheme('singularity'); openSpawnAnimFullscreenPreview('singularity'); }" class="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[9px] rounded-lg font-mono transition shadow-sm">🌀 Kiber Sinqulyarlıq</button>
                        <button type="button" onclick="if (window.SingularitySpawnEffect) { window.SingularitySpawnEffect.setTheme('supernova'); openSpawnAnimFullscreenPreview('supernova'); }" class="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-[9px] rounded-lg font-mono transition shadow-sm">🔥 Plazma Supernova</button>
                        <button type="button" onclick="if (window.SingularitySpawnEffect) { window.SingularitySpawnEffect.setTheme('synapse'); openSpawnAnimFullscreenPreview('synapse'); }" class="px-2.5 py-1 bg-purple-950/80 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-[9px] rounded-lg font-mono transition shadow-sm">⚡ Kvant Sinapsı</button>
                        <button type="button" onclick="if (window.SingularitySpawnEffect) { window.SingularitySpawnEffect.setTheme('abyssal'); openSpawnAnimFullscreenPreview('abyssal'); }" class="px-2.5 py-1 bg-teal-950/80 border border-teal-500/40 hover:border-teal-400 text-teal-300 text-[9px] rounded-lg font-mono transition shadow-sm">🌊 Dərin Abiss</button>
                    </div>
                </div>
            `;
        } else {
            perkBox.innerHTML = `
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-nodes"></i> Kiber Holoqram Qabiliyyəti
                        </span>
                        <span class="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            🌀 Standart Doğuluş
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                        • <strong>Klassik Portal:</strong> Orbital qəfəs və komet quyruqları toplanır, qaçışçı sabit teleportasiya ilə doğulur.
                    </p>
                </div>
            `;
        }
    }

    // İdarəetmə ipucu
    const hintEl = document.getElementById('fs-anim-hint');
    if (hintEl) {
        if (animId === 'dracula') {
            hintEl.innerHTML = `<span class="text-amber-300 font-bold"><i class="fa-solid fa-gamepad mr-1"></i> W A S D / Oxlar — Sərbəst Uçuş və Qanad İdarəsi</span>`;
        } else if (animId === 'seed') {
            hintEl.innerHTML = `<span class="text-emerald-300 font-bold"><i class="fa-solid fa-seedling mr-1"></i> W A S D / Oxlar — Hərəkət və Çiçək Aurası</span>`;
        } else if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(animId)) {
            hintEl.innerHTML = `<span class="text-cyan-300 font-bold font-mono text-[11px]"><i class="fa-solid fa-atom mr-1"></i> [W][A][S][D] / Drag: 3D Uçuş · [BOŞLUQ]: Şok Dalğası · [E]: Ulduz Qopart</span>`;
        } else {
            hintEl.innerHTML = `60 FPS Dinamik Kiber Doğuluş`;
        }
    }

    // Düymə yuvasını doldur (Təchiz et / Al)
    const actionSlot = document.getElementById('fs-anim-action-slot');
    if (actionSlot) {
        if (isActive) {
            actionSlot.innerHTML = `<div class="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-orbitron font-bold text-xs text-center flex items-center justify-center gap-1.5"><i class="fa-solid fa-check-circle"></i> BU ANİMASİYA HAL-HAZIRDA AKTİVDİR</div>`;
        } else if (isOwned) {
            actionSlot.innerHTML = `<button type="button" onclick="buyOrEquipSpawnAnim('${anim.id}'); closeSpawnAnimFullscreenPreview();" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-orbitron font-black text-xs shadow-lg shadow-amber-500/30 cursor-pointer transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"><i class="fa-solid fa-hand-pointer"></i> Oyunda Təchiz Et</button>`;
        } else {
            actionSlot.innerHTML = `<button type="button" onclick="buyOrEquipSpawnAnim('${anim.id}'); closeSpawnAnimFullscreenPreview();" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-orbitron font-bold text-xs shadow-md shadow-rose-500/30 cursor-pointer transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"><span>${anim.cost} Fancy Elmas ilə Al</span></button>`;
        }
    }

    modal.classList.remove('hidden');

    // Kanvas animasiyasını başlat (TAM DURATION İLƏ)
    startFullscreenAnim(animId);
}
window.openSpawnAnimFullscreenPreview = openSpawnAnimFullscreenPreview;

let fsInteractiveHandlers = null;

function cleanupFullscreenInteractiveHandlers() {
    if (fsInteractiveHandlers) {
        window.removeEventListener('keydown', fsInteractiveHandlers.keydown);
        window.removeEventListener('keyup', fsInteractiveHandlers.keyup);
        if (fsInteractiveHandlers.canvas) {
            fsInteractiveHandlers.canvas.removeEventListener('mousedown', fsInteractiveHandlers.mousedown);
            window.removeEventListener('mousemove', fsInteractiveHandlers.mousemove);
            window.removeEventListener('mouseup', fsInteractiveHandlers.mouseup);
            fsInteractiveHandlers.canvas.removeEventListener('touchstart', fsInteractiveHandlers.touchstart);
            window.removeEventListener('touchmove', fsInteractiveHandlers.touchmove);
            window.removeEventListener('touchend', fsInteractiveHandlers.touchend);
        }
        fsInteractiveHandlers = null;
    }
}

function closeSpawnAnimFullscreenPreview() {
    const modal = document.getElementById('spawn-anim-fullscreen-modal');
    if (modal) modal.classList.add('hidden');
    if (fullscreenAnimFrame) cancelAnimationFrame(fullscreenAnimFrame);
    fullscreenAnimInstance = null;
    cleanupFullscreenInteractiveHandlers();

    const draculaFx = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get('dracula') : null;
    if (draculaFx) {
        draculaFx.interactive = false;
        if (typeof draculaFx.resetFlight === 'function') draculaFx.resetFlight();
    }
    const seedFx = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get('seed') : null;
    if (seedFx) {
        seedFx.interactive = false;
        if (typeof seedFx.resetFlight === 'function') seedFx.resetFlight();
    }
}
window.closeSpawnAnimFullscreenPreview = closeSpawnAnimFullscreenPreview;

function replayFullscreenAnim() {
    if (fullscreenAnimInstance) {
        fullscreenAnimInstance.time = 0;
        if (window.SingularitySpawnEffect && ['singularity', 'supernova', 'synapse', 'abyssal'].includes(fullscreenAnimInstance.animId)) {
            window.SingularitySpawnEffect.getPreviewEngine(fullscreenAnimInstance.animId).reset();
        }
        const fxModule = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get(fullscreenAnimInstance.animId) : null;
        if (fxModule && typeof fxModule.resetFlight === 'function') {
            fxModule.resetFlight();
        }
    }
}
window.replayFullscreenAnim = replayFullscreenAnim;

function startFullscreenAnim(animId) {
    if (fullscreenAnimFrame) cancelAnimationFrame(fullscreenAnimFrame);
    cleanupFullscreenInteractiveHandlers();

    const canvas = document.getElementById('spawn-anim-fullscreen-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fxModule = (typeof SpawnEffectRegistry !== 'undefined') ? SpawnEffectRegistry.get(animId) : null;
    const isQuantum = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(animId);

    if (window.SingularitySpawnEffect && isQuantum) {
        window.SingularitySpawnEffect.setTheme(animId);
    }
    if (fxModule) {
        if (typeof fxModule.resetFlight === 'function') fxModule.resetFlight();
        fxModule.interactive = true;
    }
    const fullDuration = (fxModule && fxModule.duration) ? fxModule.duration : 7.0;
    const activeSkin = currentPreviewSkinId || (permUpgrades && permUpgrades.equippedSkin) || 'default';

    fullscreenAnimInstance = {
        animId: animId,
        time: 0,
        duration: fullDuration,
        skinId: activeSkin
    };

    // İstifadəçinin orijinal interaktiv W/A/S/D və [E] idarəetməsi
    const keys = {};
    if (isQuantum && window.SingularitySpawnEffect) {
        const eng = window.SingularitySpawnEffect.getPreviewEngine(animId);
        eng.reset();

        let isDragging = false;
        let lastMouse = { x: 0, y: 0 };
        let lastDragTime = performance.now();

        const keydownHandler = (e) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
                keys[e.code] = true;
            } else if (e.code === 'Space') {
                e.preventDefault();
                eng.originalTheme.triggerBurst();
            } else if (e.code === 'KeyE') {
                e.preventDefault();
                const cw = canvas.width;
                const ch = canvas.height;
                const fired = eng.stellarSystem.launchStarFromOrbit(cw / 2 + eng.x, ch / 2 + eng.y, eng.rot3D, eng.orbitParticles, animId, false, Math.min(1, cw / 520, ch / 520));
                if (!fired && typeof showToast === 'function') {
                    showToast('⚡ Kiber Hissəciklər tükəndi (0/100)! Animasiyada atmağa hissəcik yoxdur.', 'warning');
                }
            }
        };

        const keyupHandler = (e) => {
            keys[e.code] = false;
        };

        const startDrag = (cx, cy) => {
            isDragging = true;
            lastMouse = { x: cx, y: cy };
            lastDragTime = performance.now();
            if (window.SingularitySpawnEffect.cyberAudio) window.SingularitySpawnEffect.cyberAudio.init();
        };

        const moveDrag = (cx, cy) => {
            if (!isDragging) return;
            const now = performance.now();
            const dt = Math.max(0.008, (now - lastDragTime) / 1000);
            const dx = cx - lastMouse.x;
            const dy = cy - lastMouse.y;
            eng.x += dx;
            eng.y += dy;
            eng.vx = dx / dt;
            eng.vy = dy / dt;
            lastMouse = { x: cx, y: cy };
            lastDragTime = now;
        };

        const endDrag = () => { isDragging = false; };

        const mousedown = (e) => startDrag(e.clientX, e.clientY);
        const mousemove = (e) => moveDrag(e.clientX, e.clientY);
        const mouseup = () => endDrag();

        const touchstart = (e) => {
            if (e.touches.length) startDrag(e.touches[0].clientX, e.touches[0].clientY);
        };
        const touchmove = (e) => {
            if (e.touches.length) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        };
        const touchend = () => endDrag();

        window.addEventListener('keydown', keydownHandler);
        window.addEventListener('keyup', keyupHandler);
        canvas.addEventListener('mousedown', mousedown);
        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
        canvas.addEventListener('touchstart', touchstart, { passive: true });
        window.addEventListener('touchmove', touchmove, { passive: true });
        window.addEventListener('touchend', touchend);

        fsInteractiveHandlers = {
            canvas,
            keydown: keydownHandler,
            keyup: keyupHandler,
            mousedown,
            mousemove,
            mouseup,
            touchstart,
            touchmove,
            touchend
        };
    }

    if (['glacial','tesseract'].includes(animId)) {
        const module = animId === 'glacial' ? window.GlacialSpawnEffect : window.TesseractSpawnEffect;
        const engine = module.getEngine('fullscreen');
        engine.restartIntro();
        const keydown = e => {
            if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
                e.preventDefault(); engine.keys[e.code] = true;
            } else if (e.code === 'KeyE') { e.preventDefault(); if(animId==='glacial')engine.javelinSystem.launchIceBullet();else engine.singularitySystem.launchGraviton(); }
        };
        const keyup = e => { engine.keys[e.code] = false; };
        window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
        fsInteractiveHandlers = {keydown, keyup};
    }
    let lastTime = performance.now();

    function renderLoop() {
        const modal = document.getElementById('spawn-anim-fullscreen-modal');
        if (!modal || modal.classList.contains('hidden') || !fullscreenAnimInstance) {
            return;
        }

        const now = performance.now();
        const dt = Math.min(0.04, (now - lastTime) / 1000);
        lastTime = now;

        fullscreenAnimInstance.time += dt;
        if (!isQuantum && !['glacial','tesseract'].includes(animId) && fullscreenAnimInstance.time > fullscreenAnimInstance.duration) {
            fullscreenAnimInstance.time = 0; // Dövr edir
        }

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Dərin təmiz qaranlıq fon
        ctx.fillStyle = '#060715';
        ctx.fillRect(0, 0, w, h);

        // İnteraktiv idarəetmə ilə 3D uçuş
        if (isQuantum && window.SingularitySpawnEffect) {
            const eng = window.SingularitySpawnEffect.getPreviewEngine(animId);
            let dx = 0, dy = 0;
            if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
            if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;

            const moveSpeed = 260;
            eng.vx += (dx * moveSpeed - eng.vx) * 0.12;
            eng.vy += (dy * moveSpeed - eng.vy) * 0.12;
            eng.x += eng.vx * dt;
            eng.y += eng.vy * dt;

            const limitX = w * 0.38;
            const limitY = h * 0.34;
            eng.x = Math.max(-limitX, Math.min(limitX, eng.x));
            eng.y = Math.max(-limitY, Math.min(limitY, eng.y));

            eng.timeline = fullscreenAnimInstance.time;
            eng.step(dt, eng.vx, eng.vy, false);

            const scale = Math.min(1, w / 520, h / 520);
            const drawMonster = (mctx, mt) => {
                if (typeof drawSkinModel === 'function') {
                    drawSkinModel(mctx, 0, 0, 28, fullscreenAnimInstance.skinId, 0, mt * 3, false);
                }
            };

            eng.render(ctx, w / 2 + eng.x, h / 2 + eng.y, scale, drawMonster, false, 1);
        } else if (['glacial','tesseract'].includes(animId)) {
            const module = animId === 'glacial' ? window.GlacialSpawnEffect : window.TesseractSpawnEffect;
            module.draw(ctx,w,h,fullscreenAnimInstance.time,(c,t,alpha)=>{
                c.save(); c.globalAlpha *= alpha;
                if (typeof drawSkinModel === 'function') drawSkinModel(c,0,0,28,fullscreenAnimInstance.skinId,0,t,false);
                c.restore();
            },false,'fullscreen');
        } else if (fxModule && typeof fxModule.draw === 'function') {
            const drawMonster = (mctx, mt) => {
                if (typeof drawSkinModel === 'function') {
                    drawSkinModel(mctx, 0, 0, 32, fullscreenAnimInstance.skinId, 0, mt * 3, false);
                }
            };
            fxModule.draw(ctx, w, h, fullscreenAnimInstance.time, drawMonster, false, fullscreenAnimInstance.animId);
        }

        // Progress bar və taymeri yenilə
        const progress = Math.min(1, fullscreenAnimInstance.time / fullscreenAnimInstance.duration);
        const pb = document.getElementById('fs-anim-progressbar');
        if (pb) pb.style.width = `${(progress * 100).toFixed(1)}%`;

        const timerEl = document.getElementById('fs-anim-timer');
        if (timerEl) {
            timerEl.innerText = `${fullscreenAnimInstance.time.toFixed(1)}s / ${fullscreenAnimInstance.duration.toFixed(1)}s`;
        }

        fullscreenAnimFrame = requestAnimationFrame(renderLoop);
    }

    renderLoop();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSpawnAnimFullscreenPreview();
    }
});

function buyOrEquipSpawnAnim(animId) {
    const animsList = getSpawnAnimsCatalog();
    const anim = SINGULARITY_VARIANTS[animId] || animsList[animId];
    if (!anim) return;
    if (!permUpgrades.ownedSpawnAnims || !Array.isArray(permUpgrades.ownedSpawnAnims)) permUpgrades.ownedSpawnAnims = ['portal'];

    if (SINGULARITY_VARIANTS[animId]) {
        currentSingularityVariantId = animId;
    }

    setPreviewSpawnAnim(animId, true);

    if (permUpgrades.ownedSpawnAnims.includes(animId)) {
        permUpgrades.equippedSpawnAnim = animId;
        savePermanentData();
        renderSpawnAnimsShop();
        if (typeof showToast === 'function') {
            showToast(`✅ "${anim.name}" doğuluş animasiyası təchiz edildi!`, 'success');
        }
        if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();
        return;
    }

    const currentRed = (typeof redDiamonds !== 'undefined') ? redDiamonds : 0;
    if (currentRed < anim.cost) {
        if (typeof showToast === 'function') {
            showToast(`❌ Kifayət qədər Fancy Elmas yoxdur! Lazımdır: ${anim.cost} Fancy Elmas`, 'danger');
        }
        if (typeof audio !== 'undefined' && audio.playError) audio.playError();
        return;
    }

    redDiamonds -= anim.cost;
    localStorage.setItem('floor_escape_red_diamonds', redDiamonds);
    permUpgrades.ownedSpawnAnims.push(animId);
    permUpgrades.equippedSpawnAnim = animId;
    savePermanentData();

    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    renderSpawnAnimsShop();

    if (typeof showToast === 'function') {
        showToast(`🎉 "${anim.name}" doğuluş animasiyası uğurla alındı və təchiz edildi!`, 'success');
    }
    if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();
}
window.buyOrEquipSpawnAnim = buyOrEquipSpawnAnim;

// 🌸 YAŞAM ÇİÇƏYİ CAN TUTUMUNUN YÜKSƏLDİLMƏSİ (1 -> 2 -> 3 Can)
function upgradeSeedLife() {
    if (!permUpgrades || !permUpgrades.ownedSpawnAnims || !permUpgrades.ownedSpawnAnims.includes('seed')) {
        if (typeof showToast === 'function') showToast('❌ Əvvəlcə Yaşam Çiçəyi animasiyasını əldə etməlisiniz!', 'error');
        return;
    }

    const curLvl = (permUpgrades && permUpgrades.seedLifeLvl) ? permUpgrades.seedLifeLvl : 1;
    if (curLvl >= 3) {
        if (typeof showToast === 'function') showToast('🌸 Yaşam Çiçəyi artıq maksimum səviyyədədir (3 Can)!', 'info');
        return;
    }

    const cost = curLvl === 1 ? 15 : 25;
    const currentRed = (typeof redDiamonds !== 'undefined') ? redDiamonds : 0;
    if (currentRed < cost) {
        if (typeof showToast === 'function') {
            showToast(`❌ Kifayət qədər Fancy Elmas yoxdur! Lazımdır: ${cost} Fancy Elmas`, 'danger');
        }
        if (typeof audio !== 'undefined' && audio.playError) audio.playError();
        return;
    }

    redDiamonds -= cost;
    localStorage.setItem('floor_escape_red_diamonds', redDiamonds);
    permUpgrades.seedLifeLvl = curLvl + 1;
    savePermanentData();

    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    if (typeof updateLobbyUI === 'function') updateLobbyUI();
    if (typeof audio !== 'undefined' && audio.playUpgrade) audio.playUpgrade();
    else if (typeof audio !== 'undefined' && audio.playSuccess) audio.playSuccess();

    if (typeof showToast === 'function') {
        showToast(`🎉 Yaşam Çiçəyi yüksəldildi! Yeni Can Tutumu: ${permUpgrades.seedLifeLvl} Can`, 'success');
    }

    renderSpawnAnimsShop();
    const modal = document.getElementById('spawn-anim-fullscreen-modal');
    if (modal && !modal.classList.contains('hidden')) {
        openSpawnAnimFullscreenPreview('seed');
    }
}
window.upgradeSeedLife = upgradeSeedLife;
