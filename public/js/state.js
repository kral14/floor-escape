// OYUN VƏZİYYƏTİ VƏ DAİMİ YADDAŞ MENECERİ

const MAX_PERM_LVL = 10;
const MAX_ECON_LVL = 5;

const BASE_BULLET_PRICES = {
    wall: 30,
    ice: 50,
    shock: 90,
    mine: 140,
    plasma: 190
};

const BULLET_BASE_GROWTH_RATE = {
    wall: 0.15,
    ice: 0.15,
    shock: 0.15,
    mine: 0.15,
    plasma: 0.15
};

const BULLET_ECON_COSTS = {
    wall:   [3, 6, 10, 15, 25],
    ice:    [4, 8, 14, 20, 30],
    shock:  [5, 10, 18, 26, 40],
    mine:   [6, 12, 22, 32, 50],
    plasma: [8, 16, 28, 40, 60]
};

function getBulletReductionPct(type) {
    const key = `bullet${type.charAt(0).toUpperCase() + type.slice(1)}EconLvl`;
    const lvl = Math.min(MAX_ECON_LVL, permUpgrades[key] || 0);
    return lvl * 0.14; // Hər səviyyə 14% azaldır (Maks Lv.5 = 70% qənaət, heç vaxt 100% olmur)
}

function getBulletCost(type) {
    const base = BASE_BULLET_PRICES[type] || 30;
    const usage = (gameState.bulletUsage && gameState.bulletUsage[type]) || 0;
    const baseGrowth = BULLET_BASE_GROWTH_RATE[type] || 0.15;
    const reduction = getBulletReductionPct(type);
    const effectiveGrowth = baseGrowth * (1 - reduction);
    return Math.round(base * (1 + usage * effectiveGrowth));
}

// KİBER MAĞAZA: DƏRİLƏR (SKINS) KATALOQU
const SKINS = {
    default: {
        id: 'default',
        name: 'Kiber Qaçışçı',
        title: 'Cyber Runner',
        icon: 'fa-user-ninja',
        color: '#00ffcc',
        trailColor: 'rgba(0, 255, 204,',
        glowColor: '#00ffcc',
        badge: '⚖️ Standart Balans',
        perk: 'Standart balanslaşdırılmış kiber forma.',
        desc: 'Arenada standart çeviklik və dayanıqlıq.',
        costType: 'free',
        cost: 0
    },
    spark: {
        id: 'spark',
        name: 'Kvant Qığılcımı',
        title: 'Quantum Spark',
        icon: 'fa-bolt',
        color: '#facc15',
        trailColor: 'rgba(250, 204, 21,',
        glowColor: '#facc15',
        badge: '⚡ +10% Qaçış Sürəti',
        perk: 'Hərəkət sürətini +10% artırır.',
        desc: 'Yüksək gərginlikli cəldlik və ildırım parıltısı.',
        costType: 'redDiamonds',
        cost: 10
    },
    aegis: {
        id: 'aegis',
        name: 'Titan Zirehli',
        title: 'Titan Aegis',
        icon: 'fa-shield-halved',
        color: '#38bdf8',
        trailColor: 'rgba(56, 189, 248,',
        glowColor: '#38bdf8',
        badge: '🛡️ +1.5s Zireh Qoruması',
        perk: 'Qalxan qırıldıqda və dash zamanı toxunulmazlıq vaxtını 1.5 saniyə uzadır.',
        desc: 'Polad-mavi enerji aurası və dayanıqlı kiber-qoruyucu.',
        costType: 'redDiamonds',
        cost: 15
    },
    inferno: {
        id: 'inferno',
        name: 'Lava Cəlladı',
        title: 'Inferno Slayer',
        icon: 'fa-fire-flame-curved',
        color: '#ef4444',
        trailColor: 'rgba(239, 68, 68,',
        glowColor: '#ef4444',
        badge: '🔥 +25% Qızıl Qazancı',
        perk: 'Yığılan bütün sikkələrdən qızıl qazancını +25% artırır.',
        desc: 'Lava qorxusunu məhv edən qəzəbli alovlu döyüşçü.',
        costType: 'redDiamonds',
        cost: 20
    },
    void: {
        id: 'void',
        name: 'Void Hökmdarı',
        title: 'Void Sovereign',
        icon: 'fa-crown',
        color: '#c084fc',
        trailColor: 'rgba(192, 132, 252,',
        glowColor: '#c084fc',
        badge: '👑 -20% Dash CD & +35px Maqnit',
        perk: 'Dash soyuma müddətini 20% azaldır və sikkə çəkmə sahəsini +35px genişləndirir.',
        desc: 'Qaranlıq anomaliyaları ram edən ali kibernetik forma.',
        costType: 'redDiamonds',
        cost: 30
    }
};
if (typeof window !== 'undefined') {
    window.SKINS = SKINS;
}

// 🌀 GİRİŞ VƏ DOĞULUŞ ANİMASİYALARI KATALOQU (SPAWN ANIMATIONS / INTRO FX)
// İstifadəçinin verdiyi 3 xüsusi doğuluş animasiyası
const SPAWN_ANIMS = {
    portal: {
        id: 'portal',
        name: 'Holoqramdan Doğuluş',
        title: 'Holo-Portal',
        icon: 'fa-atom',
        color: '#65dfff',
        glowColor: '#72ddff',
        badge: '🌀 Holoqram Portalı',
        desc: 'Portal açılır, orbital qəfəs və komet quyruqları toplanır, Mons meydana çıxır.',
        costType: 'free',
        cost: 0
    },
    crystal: {
        id: 'crystal',
        name: 'Kristal Yarığı',
        title: 'Crystal Rift',
        icon: 'fa-gem',
        color: '#b899ff',
        glowColor: '#d9c5ff',
        badge: '💎 Kristal Yarığı',
        desc: 'İşıq çatı açılır, 3D perspektiv kristallar ayrılır, şimşək çaxır və Mons meydana çıxır.',
        costType: 'redDiamonds',
        cost: 15
    },
    stellar: {
        id: 'stellar',
        name: 'Ulduz Nüvəsi',
        title: 'Stellar Bloom',
        icon: 'fa-sun',
        color: '#54d8cf',
        glowColor: '#f8d49a',
        badge: '🌟 Ulduz Nüvəsi',
        desc: 'Enerji toplanır, 3D axın lentləri fəzanı yarır, ulduz nüvəsi açılır və Mons doğulur.',
        costType: 'redDiamonds',
        cost: 25
    },
    dracula: {
        id: 'dracula',
        name: 'Drakula',
        title: 'Dracula',
        icon: 'fa-bat',
        fallbackIcon: 'fa-feather',
        color: '#ba7886',
        glowColor: '#9774be',
        badge: '🦇 Yarasa Qanadları (+1 Sürət)',
        desc: 'Qaranlıq oyanır, nəhəng yarasa qanadları açılır və Monsa oyunda +1 hərəkət sürəti bəxş edir.',
        costType: 'redDiamonds',
        cost: 35
    },
    seed: {
        id: 'seed',
        name: 'Yaşam Çiçəyi',
        title: 'Time Seed',
        icon: 'fa-seedling',
        fallbackIcon: 'fa-leaf',
        color: '#62e6a0',
        glowColor: '#ffe3a0',
        badge: '🌸 Yaşam Çiçəyi (+1-3 Can)',
        desc: 'Zaman toxumu cücərir, qoruyucu sarmaşıqlar və yaşam çiçəkləri Monsu əhatəyə alaraq 1-3 can qorunması bəxş edir. Arenada çiçək yığaraq canları bərpa etmək olar.',
        costType: 'redDiamonds',
        cost: 45
    },
    singularity: {
        id: 'singularity',
        name: 'Kiber Sinqulyarlıq',
        title: 'Cyber Singularity',
        icon: 'fa-circle-nodes',
        fallbackIcon: 'fa-atom',
        color: '#38bdf8',
        glowColor: '#06b6d4',
        badge: '🌀 Kvant Sinqulyarlığı (3D Halqalar & Lavaya Zərbə)',
        desc: 'Kvant Fizikası: 3D hadisə üfüqü, aşağı atılan ulduzlar lavaya dəyəndə lavanı soyudur (-45px) və kristal qəlpələrə parçalayır.',
        costType: 'redDiamonds',
        cost: 55
    },
    supernova: {
        id: 'supernova',
        name: 'Plazma Supernova',
        title: 'Plasma Supernova',
        icon: 'fa-fire-alt',
        fallbackIcon: 'fa-sun',
        color: '#fbbf24',
        glowColor: '#f97316',
        badge: '🔥 Plazma Supernova (Alovlu 3D Orbit & Lavaya Zərbə)',
        desc: 'Qızmar plazma qığılcımları və supernova nüvəsi: Aşağı şığıyan ulduzlar lavanı partladıb soyudur (-45px) və qəlpələrə bölür.',
        costType: 'redDiamonds',
        cost: 55
    },
    synapse: {
        id: 'synapse',
        name: 'Kvant Sinapsı',
        title: 'Quantum Synapse',
        icon: 'fa-bolt-lightning',
        fallbackIcon: 'fa-bolt',
        color: '#c084fc',
        glowColor: '#a855f7',
        badge: '⚡ Kvant Sinapsı (Bio-Elektrik Şəbəkə & Lavaya Zərbə)',
        desc: 'Bio-elektrik neyron şəbəkəsi və bənövşəyi pulslar: Kvant ulduzları aşağı atılaraq lavanı dondurub ləngidir və zərər vurur.',
        costType: 'redDiamonds',
        cost: 55
    },
    abyssal: {
        id: 'abyssal',
        name: 'Dərin Abiss',
        title: 'Deep Abyssal',
        icon: 'fa-water',
        fallbackIcon: 'fa-eye',
        color: '#2dd4bf',
        glowColor: '#0f766e',
        badge: '🌊 Dərin Abiss (Biolüminisent Sporlar & Lavaya Zərbə)',
        desc: 'Dərin okean leviathan gözü və spor dalğaları: Düşən zümrüd kristalları lavaya zərbə vuraraq lavanı geriyə itələyir.',
        costType: 'redDiamonds',
        cost: 55
    }
};
if (typeof window !== 'undefined') {
    window.SPAWN_ANIMS = SPAWN_ANIMS;
}

const DEFAULT_PERM_UPGRADES = {
    speedLvl: 1,          // Baza sürət (Lv.1 - Lv.10)
    magnetLvl: 1,         // Baza maqnit (Lv.1 - Lv.10)
    coinValLvl: 1,        // Sikkə dəyəri (Lv.1 - Lv.10)
    coinRateLvl: 1,       // Sikkə çıxış vaxtı (Lv.1 - Lv.10)
    shieldLvl: 0,         // 🛡️ Qalxan şansı (Lv.0 - Lv.10)
    powerUpLvl: 0,        // ⚡ Gücləndirici tezliyi (Lv.0 - Lv.10)
    dashCDLvl: 1,         // Dash tez bərpası
    startGoldLvl: 1,      // Başlanğıc qızıl
    equippedSkin: 'default', // Aktiv dəri (skin)
    ownedSkins: ['default'], // Sahib olunan dərilər
    equippedSpawnAnim: 'singularity', // 🌀 YENİ ƏSAS DOĞULUŞ ANİMASİYASI (Kvant Laboratoriyası FX)
    ownedSpawnAnims: ['singularity', 'supernova', 'synapse', 'abyssal', 'portal'], // Sahib olunan animasiyalar
    seedLifeLvl: 1,       // 🌸 Yaşam Çiçəyi Can Tutumu (Lv.1: 1 Can, Lv.2: 2 Can, Lv.3: 3 Can)
    // Əkiz Qüllələr (Twin Turrets)
    hasTwinTurrets: false,
    turretLeftType: 'wall',   // 'wall', 'ice', 'shock', 'mine', 'plasma', 'none'
    turretRightType: 'wall',  // 'wall', 'ice', 'shock', 'mine', 'plasma', 'none'
    turretInterval: 7.0,      // Dinamik interval (baza 7.0s)
    turretIntervalLvl: 0,     // 0 - 15 səviyyə (hər səviyyə -0.2s, maks 4.0s)
    hasAwakeningKey: false,   // 1000 Fancy Elmas ilə alınan Oyanış Açarı
    turretAwakened: false,    // Maksimum 4.0s-də açarla aktivləşdirilən Oyanış
    turretEnabled: true,
    // Mərmi Qiymət Artımı Qənaəti (Tab 2: Fancy Elmasla)
    bulletWallEconLvl: 0,
    bulletIceEconLvl: 0,
    bulletShockEconLvl: 0,
    bulletMineEconLvl: 0,
    bulletPlasmaEconLvl: 0,
    // ⚡ Kiber Ulduz Ehtiyatı (Başlanğıcda 5 ədəd, Göy Almazla artırılır)
    cyberStars: 5,
    maxCyberStars: 5
};

function buyCyberStars(amount = 5, costDiamonds = 5) {
    if (typeof diamonds === 'undefined') diamonds = 0;
    if (typeof permUpgrades === 'undefined') permUpgrades = { ...DEFAULT_PERM_UPGRADES };
    if ((permUpgrades.cyberStars || 0) >= 100) {
        if (typeof showToast === 'function') {
            showToast('★ Maksimum 100 Kiber Hissəcik tutumuna çatmısınız!', 'warning');
        }
        return false;
    }
    if (diamonds < costDiamonds) {
        if (typeof showToast === 'function') {
            showToast(`Kifayət qədər Göy Almaz yoxdur! Lazımdır: ${costDiamonds} 💎, Balans: ${diamonds} 💎`, 'error');
        }
        return false;
    }
    diamonds -= costDiamonds;
    const oldVal = permUpgrades.cyberStars || 0;
    permUpgrades.cyberStars = Math.min(100, oldVal + amount);
    permUpgrades.maxCyberStars = 100;

    // Kiber Sinqulyarlıq orbitini dərhal yeni sayla sinxronlaşdırırıq
    if (typeof SingularitySpawnEffect !== 'undefined' && typeof SingularitySpawnEffect.syncAllEnginesWithStars === 'function') {
        SingularitySpawnEffect.syncAllEnginesWithStars(permUpgrades.cyberStars);
    }

    savePermanentData();
    if (typeof updateShopPageHeader === 'function') updateShopPageHeader();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof updatePermUpgradesUI === 'function') updatePermUpgradesUI();
    if (typeof renderSpawnAnimsShop === 'function') renderSpawnAnimsShop();
    if (typeof updateCyberStarsHUD === 'function') updateCyberStarsHUD();
    if (typeof showToast === 'function') {
        showToast(`⭐ +${amount} Kiber Hissəcik əlavə olundu! Hal-hazırda: ${permUpgrades.cyberStars}/100`, 'success');
    }
    return true;
}
window.buyCyberStars = buyCyberStars;

function getMaxLifeFlowers() {
    if (typeof permUpgrades === 'undefined') return 1;
    return Math.max(1, Math.min(3, permUpgrades.seedLifeLvl || 1));
}
window.getMaxLifeFlowers = getMaxLifeFlowers;

function getTurretInterval() {
    const lvl = Math.min(15, Math.max(0, (typeof permUpgrades !== 'undefined' && permUpgrades.turretIntervalLvl) || 0));
    return Math.max(4.0, +(7.0 - lvl * 0.2).toFixed(1));
}

function getTurretIntervalCost() {
    const lvl = (typeof permUpgrades !== 'undefined' && permUpgrades.turretIntervalLvl) || 0;
    if (lvl >= 15) return null;
    return 10 + lvl * 5;
}

if (typeof window !== 'undefined') {
    window.getTurretInterval = getTurretInterval;
    window.getTurretIntervalCost = getTurretIntervalCost;
}

let permUpgrades = { ...DEFAULT_PERM_UPGRADES };
let diamonds = 0;          // Mavi Almaz (Normal laboratoriya üçün)
let redDiamonds = 0;       // Fancy Elmas (Xüsusi silahlar, açarlar və sandıqlar üçün)
let claimedChests = [];    // Açılmış 10-cu qat sandıqları [10, 20, 30...]

function loadPermanentData() {
    try {
        const savedPlayer = localStorage.getItem('floor_escape_player');
        // Əgər aktiv hesab yoxdursa (çıxış edilibsə), köhnə məlumatlar tamamilə rədd edilir
        if (!savedPlayer) {
            permUpgrades = { ...DEFAULT_PERM_UPGRADES };
            diamonds = 0;
            redDiamonds = 0;
            claimedChests = [];
            return;
        }

        const savedUpgrades = localStorage.getItem('floor_escape_perm_upgrades');
        if (savedUpgrades) {
            permUpgrades = { ...DEFAULT_PERM_UPGRADES, ...JSON.parse(savedUpgrades) };
            if (!Array.isArray(permUpgrades.ownedSkins) || permUpgrades.ownedSkins.length === 0) {
                permUpgrades.ownedSkins = ['default'];
            }
            if (!permUpgrades.equippedSkin || !SKINS[permUpgrades.equippedSkin]) {
                permUpgrades.equippedSkin = 'default';
            }
            if (!Array.isArray(permUpgrades.ownedSpawnAnims)) {
                permUpgrades.ownedSpawnAnims = ['singularity', 'supernova', 'synapse', 'abyssal', 'portal'];
            }
            // 4 Kvant laboratoriya temasını sahib olunanlara təminatlı əlavə edirik
            ['singularity', 'supernova', 'synapse', 'abyssal'].forEach(th => {
                if (!permUpgrades.ownedSpawnAnims.includes(th)) {
                    permUpgrades.ownedSpawnAnims.push(th);
                }
            });
            // Köhnə 'portal' qalıbsa, birbaşa yeni Kvant Sinqulyarlığına keçir
            if (!permUpgrades.equippedSpawnAnim || permUpgrades.equippedSpawnAnim === 'portal') {
                permUpgrades.equippedSpawnAnim = 'singularity';
            }
            if (!SPAWN_ANIMS[permUpgrades.equippedSpawnAnim]) {
                permUpgrades.equippedSpawnAnim = 'singularity';
            }
            if (typeof permUpgrades.cyberStars !== 'number' || isNaN(permUpgrades.cyberStars)) {
                permUpgrades.cyberStars = 5;
            }
            if (typeof permUpgrades.maxCyberStars !== 'number' || isNaN(permUpgrades.maxCyberStars)) {
                permUpgrades.maxCyberStars = Math.max(5, permUpgrades.cyberStars);
            }
            if (permUpgrades.turretBulletType && !permUpgrades.turretLeftType) {
                permUpgrades.turretLeftType = permUpgrades.turretBulletType;
                permUpgrades.turretRightType = permUpgrades.turretBulletType;
            }
        }
        const savedDiamonds = localStorage.getItem('floor_escape_diamonds');
        if (savedDiamonds !== null) {
            diamonds = parseInt(savedDiamonds) || 0;
        }
        const savedRedDiamonds = localStorage.getItem('floor_escape_red_diamonds');
        if (savedRedDiamonds !== null) {
            redDiamonds = parseInt(savedRedDiamonds) || 0;
        }
        const savedChests = localStorage.getItem('floor_escape_claimed_chests');
        if (savedChests) {
            claimedChests = JSON.parse(savedChests) || [];
        }
    } catch (e) {
        console.error('Daimi məlumatlar oxunarkən xəta:', e);
    }
}

function savePermanentData() {
    try {
        if (typeof permUpgrades !== 'undefined') {
            localStorage.setItem('floor_escape_perm_upgrades', JSON.stringify(permUpgrades));
        }
        const p = window.currentPlayer || (typeof currentPlayer !== 'undefined' ? currentPlayer : null);
        if (p) {
            p.permUpgrades = permUpgrades;
            if (typeof diamonds !== 'undefined') p.diamonds = diamonds;
            if (typeof redDiamonds !== 'undefined') p.redDiamonds = redDiamonds;
            localStorage.setItem('floor_escape_player', JSON.stringify(p));
        }
        if (typeof syncPlayerDataCloud === 'function') {
            syncPlayerDataCloud(true);
        }
    } catch (e) {
        console.error('Daimi məlumatlar saxlanılarkən xəta:', e);
    }
}

function getBaseSpeed() {
    let speed = 3.5 + (permUpgrades.speedLvl - 1) * 0.35;
    if (typeof permUpgrades !== 'undefined') {
        if (permUpgrades.equippedSkin === 'spark') {
            speed *= 1.10; // ⚡ Kvant Qığılcımı: +10% Qaçış Sürəti
        }
        if (permUpgrades.equippedSpawnAnim === 'dracula') {
            speed += 1.0; // 🦇 Drakula Qanadları: +1.0 Sürət!
        }
    }
    return speed;
}

function getBaseMagnetRadius() {
    let rad = 55 + (permUpgrades.magnetLvl - 1) * 15;
    if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'void') {
        rad += 35; // 👑 Void Hökmdarı: +35px Super-Maqnit
    }
    return rad;
}

function getCoinBonusValue() {
    let bonus = (permUpgrades.coinValLvl - 1) * 3;
    if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'inferno') {
        bonus += 5; // 🔥 Lava Cəlladı: Hər sikkədən +5 əlavə qızıl
    }
    return bonus;
}

function getCoinSpawnInterval() {
    return Math.max(2.0, 5.0 - (permUpgrades.coinRateLvl - 1) * 0.3);
}

// 🛡️ QATA QALXANLA BAŞLAMA ŞANSI (Lv.0 = 0%, Lv.1 = 10%, ..., Lv.10 = 100%)
function getShieldStartChance() {
    return (permUpgrades.shieldLvl || 0) * 0.10;
}

// ==================== KİBER DƏRİ FORMASI VƏ XÜSUSİ VİZUAL MODEL RƏSMİ ====================
function drawSkinModel(c, x, y, r, skinId, facing = 0, time = 0, isInvuln = false) {
    if (typeof SkinRegistry !== 'undefined' && SkinRegistry.drawSkinModel) {
        SkinRegistry.drawSkinModel(c, x, y, r, skinId, facing, time, isInvuln);
    }
}
if (typeof window !== 'undefined') {
    window.drawSkinModel = drawSkinModel;
}

// AKTİV OYUNUN VƏZİYYƏTİ
let gameState = {
    gold: 75,
    floor: 1,
    bestFloor: (typeof localStorage !== 'undefined' && localStorage.getItem('floor_escape_player') ? (parseInt(localStorage.getItem('floor_escape_best_floor')) || 1) : 1),
    diamonds: 0,
    redDiamonds: 0,
    scoreProgress: 0,
    scoreReq: 3,
    borderOpen: false,
    gameOver: false,
    paused: false,
    transitioning: false,
    isIntroPlaying: false,
    combo: 0,
    maxCombo: 0,
    totalTrapsPlaced: 0,
    totalTrapsDestroyed: 0,
    floorTime: 0,

    // Mərmi istifadə sayğacları (hər atışda inflyasiya üçün)
    bulletUsage: { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 },

    coinCountdown: 5.0,

    inGameSpeedLvl: 0,
    inGameMagnetLvl: 0,
    magnetRadius: 55,

    dashCooldown: 0,
    dashMaxCooldown: 3.5,
    dashInvulnerable: 0,

    getFloorRequirement(floor) {
        return 3 + (floor - 1) * 2;
    }
};

// AKTİV OYUNU YADDA SAXLAMAQ VƏ BƏRPA ETMƏK
function saveActiveRun() {
    if (gameState.gameOver) {
        clearActiveRun();
        return;
    }
    const runData = {
        hasActiveRun: true,
        floor: gameState.floor,
        gold: gameState.gold,
        scoreProgress: gameState.scoreProgress,
        scoreReq: gameState.scoreReq,
        borderOpen: gameState.borderOpen,
        inGameSpeedLvl: gameState.inGameSpeedLvl,
        inGameMagnetLvl: gameState.inGameMagnetLvl,
        totalTrapsPlaced: gameState.totalTrapsPlaced,
        totalTrapsDestroyed: gameState.totalTrapsDestroyed,
        maxCombo: gameState.maxCombo,
        combo: gameState.combo,
        floorTime: gameState.floorTime,
        coinCountdown: gameState.coinCountdown,
        bulletUsage: gameState.bulletUsage || { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 },
        // Boss dalğası və canı
        monsterBossWave: typeof monster !== 'undefined' && monster ? monster.currentBossWave : 1,
        monsterTotalWaves: typeof monster !== 'undefined' && monster ? monster.totalBossWaves : 3,
        monsterHp: typeof monster !== 'undefined' && monster ? monster.hp : 1500,
        monsterMaxHp: typeof monster !== 'undefined' && monster ? monster.maxHp : 1500,
        monsterIsDefeated: typeof monster !== 'undefined' && monster ? !!monster.isDefeated : false,
        // Lavanın dəqiq yeri və effektləri
        monsterY: typeof monster !== 'undefined' && monster ? monster.y : null,
        monsterSlowTimer: typeof monster !== 'undefined' && monster ? monster.slowTimer : 0,
        monsterStunTimer: typeof monster !== 'undefined' && monster ? monster.stunTimer : 0,
        monsterPlasmaTimer: typeof monster !== 'undefined' && monster ? monster.plasmaTimer : 0,
        // Oyunçunun koordinatları, qalxanı və kvant sıçrayışı
        playerX: typeof player !== 'undefined' && player ? player.x : null,
        playerY: typeof player !== 'undefined' && player ? player.y : null,
        playerHasShield: typeof player !== 'undefined' && player ? !!player.hasShield : false,
        playerHasHyperJump: typeof player !== 'undefined' && player ? !!player.hasHyperJump : false,
        playerLifeFlowers: typeof player !== 'undefined' && player ? (player.lifeFlowers || 0) : 0,
        playerMaxLifeFlowers: typeof player !== 'undefined' && player ? (player.maxLifeFlowers || 1) : 1,
        playerLifeFlowerState: typeof player !== 'undefined' && player ? (player.lifeFlowerState || 'none') : 'none',
        // Meydandakı sikkələr (DƏQİQ SİYAHI)
        coins: typeof coins !== 'undefined' && Array.isArray(coins) ? coins.map(c => ({ x: c.x, y: c.y, value: c.value })) : [],
        // Meydandakı gücləndiricilər (DƏQİQ SİYAHI)
        powerUps: typeof powerUps !== 'undefined' && Array.isArray(powerUps) ? powerUps.map(p => ({
            x: p.x,
            y: p.y,
            type: p.type,
            lifeTime: p.lifeTime,
            maxLifeTime: p.maxLifeTime
        })) : [],
        powerUpCountdown: gameState.powerUpCountdown !== undefined ? gameState.powerUpCountdown : 15,
        chronoTimer: gameState.chronoTimer || 0,
        superMagnetTimer: gameState.superMagnetTimer || 0
    };
    localStorage.setItem('floor_escape_active_run', JSON.stringify(runData));
}

function loadActiveRun() {
    try {
        const saved = JSON.parse(localStorage.getItem('floor_escape_active_run'));
        if (saved && saved.hasActiveRun) {
            gameState.floor = Math.max(1, parseInt(saved.floor) || 1);
            gameState.gold = Math.max(0, parseFloat(saved.gold) || 75);
            gameState.scoreProgress = Math.max(0, parseInt(saved.scoreProgress) || 0);
            gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
            gameState.borderOpen = !!saved.borderOpen;
            gameState.inGameSpeedLvl = Math.max(0, parseInt(saved.inGameSpeedLvl) || 0);
            gameState.inGameMagnetLvl = Math.max(0, parseInt(saved.inGameMagnetLvl) || 0);
            gameState.magnetRadius = getBaseMagnetRadius() + gameState.inGameMagnetLvl * 25;
            gameState.totalTrapsPlaced = parseInt(saved.totalTrapsPlaced) || 0;
            gameState.totalTrapsDestroyed = parseInt(saved.totalTrapsDestroyed) || 0;
            gameState.maxCombo = parseInt(saved.maxCombo) || 0;
            gameState.combo = parseInt(saved.combo) || 0;
            if (saved.floorTime !== undefined) gameState.floorTime = parseFloat(saved.floorTime) || 0;
            if (saved.coinCountdown !== undefined) gameState.coinCountdown = parseFloat(saved.coinCountdown) || getCoinSpawnInterval();
            if (saved.bulletUsage) {
                gameState.bulletUsage = { ...saved.bulletUsage };
            } else {
                gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };
            }

            const currentWorldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : (typeof canvasHeight !== 'undefined' ? canvasHeight : 680);

            // Lavanı bərpa edirik
            if (typeof monster !== 'undefined' && monster && saved.monsterY !== undefined && saved.monsterY !== null) {
                let mY = parseFloat(saved.monsterY);
                // Əgər köhnə saxlanmış dəyər yeni şaquli dünyaya uyğun deyilsə və ya yuxarıdadırsa düzəldirik
                if (isNaN(mY) || mY < currentWorldH * 0.35) {
                    mY = currentWorldH + 50;
                }
                monster.y = mY;
                monster.slowTimer = parseInt(saved.monsterSlowTimer) || 0;
                monster.stunTimer = parseInt(saved.monsterStunTimer) || 0;
                monster.plasmaTimer = parseInt(saved.monsterPlasmaTimer) || 0;
                monster.baseSpeed = 0.22 + (gameState.floor - 1) * 0.06;
                monster.speed = monster.slowTimer > 0 ? monster.baseSpeed * 0.45 : monster.baseSpeed;

                // Boss dalğası və canını bərpa edirik
                if (saved.monsterBossWave !== undefined) {
                    monster.currentBossWave = parseInt(saved.monsterBossWave) || 1;
                    monster.totalBossWaves = parseInt(saved.monsterTotalWaves) || ((gameState.floor % 10 === 0) ? 4 : 3);
                    monster.maxHp = parseInt(saved.monsterMaxHp) || 1500;
                    monster.hp = parseInt(saved.monsterHp) !== undefined ? parseInt(saved.monsterHp) : monster.maxHp;
                    monster.displayHp = monster.hp;
                    monster.isDefeated = !!saved.monsterIsDefeated;
                }
            }

            // Oyunçunu, Qalxanını və Kvant Sıçrayışını bərpa edirik
            if (typeof player !== 'undefined' && player) {
                if (saved.playerX !== undefined && saved.playerY !== undefined && saved.playerX !== null && saved.playerY !== null) {
                    player.x = parseFloat(saved.playerX);
                    let pY = parseFloat(saved.playerY);
                    // Əgər saxlanmış Y köhnə 680px hündürlüyündən qalıbsa və qapı açılmayıbsa
                    if (isNaN(pY) || (pY < currentWorldH - 450 && !gameState.borderOpen)) {
                        pY = currentWorldH - 180;
                    }
                    player.y = pY;
                }
                // Hər ehtimala qarşı: canavar oyunçudan ən az 150px aşağıda olmalıdır ki, ani ölüm olmasın
                if (typeof monster !== 'undefined' && monster && monster.y <= player.y + 120) {
                    monster.y = player.y + 240;
                }
                gameState.dashInvulnerable = 90; // Yüklənərkən 1.5s təhlükəsizlik
                player.hasShield = !!saved.playerHasShield;
                player.hasHyperJump = !!saved.playerHasHyperJump;
                if (saved.playerLifeFlowers !== undefined) {
                    player.lifeFlowers = parseInt(saved.playerLifeFlowers, 10);
                    player.maxLifeFlowers = parseInt(saved.playerMaxLifeFlowers || 1, 10);
                    player.lifeFlowerState = saved.playerLifeFlowerState || (player.lifeFlowers > 0 ? 'active' : 'none');
                    player.hasLifeFlower = player.lifeFlowers > 0;
                }
            }

            // Gücləndirici taymerləri
            if (saved.powerUpCountdown !== undefined) gameState.powerUpCountdown = parseFloat(saved.powerUpCountdown);
            if (saved.chronoTimer !== undefined) gameState.chronoTimer = parseInt(saved.chronoTimer) || 0;
            if (saved.superMagnetTimer !== undefined) gameState.superMagnetTimer = parseInt(saved.superMagnetTimer) || 0;

            // Sikkələri bərpa edirik (Saved massiv nədirsə DƏQİQ O BƏRPA OLUNUR - əgər boşdursa boş qalır!)
            if (typeof Coin !== 'undefined' && saved.coins && Array.isArray(saved.coins)) {
                coins = saved.coins.map(c => {
                    const coin = new Coin(c.x, c.y);
                    if (c.value) coin.value = c.value;
                    return coin;
                });
            }

            // Gücləndiriciləri (Power-Up) bərpa edirik (Əgər götürülübsə BOŞ QALIR, əlavə yaranmır!)
            if (typeof PowerUp !== 'undefined' && saved.powerUps && Array.isArray(saved.powerUps)) {
                powerUps = saved.powerUps.map(p => {
                    const pup = new PowerUp(p.x, p.y, p.type);
                    if (p.lifeTime !== undefined) pup.lifeTime = p.lifeTime;
                    if (p.maxLifeTime !== undefined) pup.maxLifeTime = p.maxLifeTime;
                    return pup;
                });
            } else if (saved.powerUps && Array.isArray(saved.powerUps) && saved.powerUps.length === 0) {
                powerUps = [];
            }

            return true;
        }
    } catch (e) {
        console.error('Aktiv oyun bərpa edilərkən xəta:', e);
    }
    return false;
}

function clearActiveRun() {
    localStorage.removeItem('floor_escape_active_run');
}
