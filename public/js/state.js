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
        costType: 'diamonds',
        cost: 15,
        altCost: 600,
        altType: 'gold'
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
        costType: 'diamonds',
        cost: 25,
        altCost: 1200,
        altType: 'gold'
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
        cost: 20,
        altCost: 2500,
        altType: 'gold'
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
        cost: 35,
        altCost: 4000,
        altType: 'gold'
    }
};
if (typeof window !== 'undefined') {
    window.SKINS = SKINS;
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
    // Əkiz Qüllələr (Twin Turrets)
    hasTwinTurrets: false,
    turretLeftType: 'wall',   // 'wall', 'ice', 'shock', 'mine', 'plasma', 'none'
    turretRightType: 'wall',  // 'wall', 'ice', 'shock', 'mine', 'plasma', 'none'
    turretInterval: 5,        // saniyə: 3, 5, 7, 10
    turretEnabled: true,
    // Mərmi Qiymət Artımı Qənaəti (Tab 2: Qırmızı Almazla)
    bulletWallEconLvl: 0,
    bulletIceEconLvl: 0,
    bulletShockEconLvl: 0,
    bulletMineEconLvl: 0,
    bulletPlasmaEconLvl: 0
};

let permUpgrades = { ...DEFAULT_PERM_UPGRADES };
let diamonds = 0;          // Mavi Almaz (Normal laboratoriya üçün)
let redDiamonds = 0;       // Qırmızı Almaz (Xüsusi silahlar və sandıqlar üçün)
let claimedChests = [];    // Açılmış 10-cu qat sandıqları [10, 20, 30...]

function loadPermanentData() {
    try {
        const savedUpgrades = localStorage.getItem('floor_escape_perm_upgrades');
        if (savedUpgrades) {
            permUpgrades = { ...DEFAULT_PERM_UPGRADES, ...JSON.parse(savedUpgrades) };
            if (!Array.isArray(permUpgrades.ownedSkins) || permUpgrades.ownedSkins.length === 0) {
                permUpgrades.ownedSkins = ['default'];
            }
            if (!permUpgrades.equippedSkin || !SKINS[permUpgrades.equippedSkin]) {
                permUpgrades.equippedSkin = 'default';
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
        localStorage.setItem('floor_escape_perm_upgrades', JSON.stringify(permUpgrades));
        localStorage.setItem('floor_escape_diamonds', diamonds.toString());
        localStorage.setItem('floor_escape_red_diamonds', redDiamonds.toString());
        localStorage.setItem('floor_escape_claimed_chests', JSON.stringify(claimedChests));

        if (typeof syncPlayerDataCloud === 'function') {
            syncPlayerDataCloud(false);
        }
    } catch (e) {
        console.error('Daimi məlumatlar saxlanılarkən xəta:', e);
    }
}

function getBaseSpeed() {
    return 3.5 + (permUpgrades.speedLvl - 1) * 0.35;
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
    c.save();
    c.translate(x, y);

    const skin = (typeof SKINS !== 'undefined' && SKINS[skinId]) ? SKINS[skinId] : { color: '#00ffcc', glowColor: '#00ffcc' };
    const baseColor = isInvuln ? '#ffffff' : (skin.color || '#00ffcc');
    const glow = isInvuln ? '#ffffff' : (skin.glowColor || '#00ffcc');

    if (skinId === 'spark') {
        // =========================================================================
        // ========== ⚡ KVANT QIĞILCIMI: ELEKTRİK PLAZMA ULDUZU VƏ CƏRƏYAN QANADLARI ==========
        // =========================================================================
        c.rotate(facing || (time * 2.0));

        // 1. Canlı Şimşək Qövsləri (Elektrik Cərəyanları)
        c.save();
        c.strokeStyle = '#fef08a';
        c.lineWidth = 1.5;
        c.shadowBlur = 12;
        c.shadowColor = '#facc15';
        for (let j = 0; j < 3; j++) {
            const seedAngle = time * 8 + j * 2.1;
            const startDist = r * 0.5;
            const endDist = r * 1.6 + Math.sin(time * 12 + j) * 4;
            const arcAngle = seedAngle;
            c.beginPath();
            c.moveTo(Math.cos(arcAngle) * startDist, Math.sin(arcAngle) * startDist);
            const midX = Math.cos(arcAngle + 0.3) * (startDist + (endDist - startDist) * 0.5);
            const midY = Math.sin(arcAngle + 0.3) * (startDist + (endDist - startDist) * 0.5);
            c.lineTo(midX, midY);
            c.lineTo(Math.cos(arcAngle) * endDist, Math.sin(arcAngle) * endDist);
            c.stroke();
        }
        c.restore();

        // 2. 4 Ədəd İti Elektrik Qanadı / Generator Spikeləri
        c.shadowBlur = 22;
        c.shadowColor = glow;
        for (let i = 0; i < 4; i++) {
            c.save();
            c.rotate((i * Math.PI) / 2);
            // Qanadın xarici qızmar hissəsi
            c.fillStyle = '#ca8a04';
            c.beginPath();
            c.moveTo(r * 1.85, 0);
            c.lineTo(r * 0.5, -r * 0.45);
            c.lineTo(r * 0.2, 0);
            c.lineTo(r * 0.5, r * 0.45);
            c.closePath();
            c.fill();

            // Qanadın daxili parlaq neon tikanı
            c.fillStyle = '#fef08a';
            c.beginPath();
            c.moveTo(r * 1.65, 0);
            c.lineTo(r * 0.6, -r * 0.25);
            c.lineTo(r * 0.6, r * 0.25);
            c.closePath();
            c.fill();
            c.restore();
        }

        // 3. Daxili Enerji Romb Korpusu
        c.beginPath();
        c.moveTo(0, -r * 0.95);
        c.lineTo(r * 0.95, 0);
        c.lineTo(0, r * 0.95);
        c.lineTo(-r * 0.95, 0);
        c.closePath();
        c.fillStyle = '#1e1b4b';
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = baseColor;
        c.stroke();

        // 4. Parlaq Ağ-Sarı Şimşək Nüvəsi (⚡)
        c.shadowBlur = 15;
        c.shadowColor = '#ffffff';
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(r * 0.15, -r * 0.65);
        c.lineTo(-r * 0.45, r * 0.05);
        c.lineTo(r * 0.1, r * 0.05);
        c.lineTo(-r * 0.2, r * 0.65);
        c.lineTo(r * 0.45, -r * 0.05);
        c.lineTo(-r * 0.05, -r * 0.05);
        c.closePath();
        c.fill();

    } else if (skinId === 'aegis') {
        // =========================================================================
        // ========== 🛡️ TİTAN ZİREHLİ: AĞIR ALTIBUCAQLI MECHA TANK VƏ ORBİT SİPƏRLƏRİ ==========
        // =========================================================================
        // 1. Ətrafında Fırlanan İkili Mühafizə Sipəri (Deflector Orbitals)
        const shieldOrbTime = time * 2.5;
        for (let i = 0; i < 2; i++) {
            const shAngle = shieldOrbTime + i * Math.PI;
            const shDist = r * 1.65;
            const sx = Math.cos(shAngle) * shDist;
            const sy = Math.sin(shAngle) * shDist;
            c.save();
            c.translate(sx, sy);
            c.rotate(shAngle + Math.PI / 2);
            c.fillStyle = '#38bdf8';
            c.shadowBlur = 12;
            c.shadowColor = '#38bdf8';
            // Sipər qövsü
            c.beginPath();
            if (c.roundRect) c.roundRect(-r * 0.45, -2.5, r * 0.9, 5, 2);
            else c.rect(-r * 0.45, -2.5, r * 0.9, 5);
            c.fill();
            c.restore();
        }

        c.rotate(facing || 0);

        // 2. Altıbucaqlı Möhkəm Mecha Korpus (Hexagonal Armor Plate)
        c.shadowBlur = 20;
        c.shadowColor = glow;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * (r * 1.22);
            const py = Math.sin(a) * (r * 1.22);
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = '#0f172a';
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = baseColor;
        c.stroke();

        // 3. Daxili Zireh Katı və Pərçimlər
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * (r * 0.85);
            const py = Math.sin(a) * (r * 0.85);
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = '#1e293b';
        c.fill();
        c.lineWidth = 1.5;
        c.strokeStyle = '#0284c7';
        c.stroke();

        // Künc Pərçimləri
        c.fillStyle = '#bae6fd';
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            c.beginPath();
            c.arc(Math.cos(a) * (r * 1.0), Math.sin(a) * (r * 1.0), 2.2, 0, Math.PI * 2);
            c.fill();
        }

        // 4. Mərkəzi Foton Reaktor
        c.beginPath();
        c.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        c.fillStyle = '#0284c7';
        c.shadowBlur = 14;
        c.shadowColor = '#38bdf8';
        c.fill();

        c.beginPath();
        c.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        c.fillStyle = '#ffffff';
        c.fill();

    } else if (skinId === 'inferno') {
        // =========================================================================
        // ========== 🔥 LAVA CƏLLADI: DİNAMİK ALOVLANAN BUYNIZLAR VƏ QAYNAYAN MAGMA ==========
        // ========== (HƏMİŞƏ ŞAQULİ DÜZ YUXARI DURUR - CANLI ALOV VƏ NƏFƏS ANİMASİYASI) ==========
        // =========================================================================

        // 1. Canlı Qopan Magma Qığılcımları (Uçuşan Lava Embers)
        c.save();
        for (let i = 0; i < 4; i++) {
            const seed = i * 1.57;
            const emberProgress = ((time * 1.8 + seed) % 2.5) / 2.5; // 0..1
            const emberX = Math.sin(time * 3 + seed) * (r * 1.35) + (i % 2 === 0 ? -r * 0.3 : r * 0.3);
            const emberY = (r * 0.8) - emberProgress * (r * 2.5); // Aşağıdan yuxarı uçur
            const emberAlpha = Math.sin(emberProgress * Math.PI);
            const emberSize = (1.5 + (i % 2) * 1.2) * (1 - emberProgress * 0.4);

            c.shadowBlur = 10;
            c.shadowColor = '#f97316';
            c.fillStyle = `rgba(254, 240, 138, ${emberAlpha})`;
            c.beginPath();
            c.arc(emberX, emberY, Math.max(0.5, emberSize), 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        // 2. Dinamik Dalğalanan Canlı Alov Şölələri (Arxada qıvrılan alov dilləri)
        c.save();
        const flameWave1 = Math.sin(time * 9) * (r * 0.22);
        const flameWave2 = Math.cos(time * 11) * (r * 0.18);
        const flameWave3 = Math.sin(time * 7 + 1.2) * (r * 0.15);

        // Mərkəzi böyük alov dili
        c.fillStyle = '#f97316';
        c.shadowBlur = 22;
        c.shadowColor = '#ef4444';
        c.beginPath();
        c.moveTo(-r * 0.55, -r * 0.6);
        c.quadraticCurveTo(flameWave3 * 0.5, -r * 1.55 - flameWave1, r * 0.55, -r * 0.6);
        c.quadraticCurveTo(0, -r * 0.3, -r * 0.55, -r * 0.6);
        c.fill();

        // Sol alov qıvrımı
        c.fillStyle = '#ef4444';
        c.beginPath();
        c.moveTo(-r * 0.6, -r * 0.4);
        c.quadraticCurveTo(-r * 1.1 + flameWave2, -r * 1.3, -r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();

        // Sağ alov qıvrımı
        c.beginPath();
        c.moveTo(r * 0.6, -r * 0.4);
        c.quadraticCurveTo(r * 1.1 - flameWave2, -r * 1.3, r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.restore();

        // 3. İki Böyük Obsidian Alov Buynuzu (Ucları canlı alov kimi dalğalanır)
        const hornTipWaveL = Math.sin(time * 8) * (r * 0.08);
        const hornTipWaveR = Math.cos(time * 8) * (r * 0.08);

        c.shadowBlur = 22;
        c.shadowColor = '#dc2626';

        // Sol Buynuz
        c.fillStyle = '#7f1d1d';
        c.strokeStyle = '#f87171';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.5, -r * 0.4);
        c.quadraticCurveTo(-r * 1.5, -r * 1.2, -r * 0.6 + hornTipWaveL, -r * 1.5 + Math.abs(hornTipWaveL));
        c.quadraticCurveTo(-r * 0.8, -r * 0.8, -r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.stroke();

        // Sol buynuzun daxili odlu damarı (Neon titrəyiş)
        c.strokeStyle = '#f97316';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-r * 0.35, -r * 0.6);
        c.quadraticCurveTo(-r * 1.0, -r * 1.1, -r * 0.65 + hornTipWaveL, -r * 1.4);
        c.stroke();

        // Sağ Buynuz
        c.fillStyle = '#7f1d1d';
        c.strokeStyle = '#f87171';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(r * 0.5, -r * 0.4);
        c.quadraticCurveTo(r * 1.5, -r * 1.2, r * 0.6 + hornTipWaveR, -r * 1.5 + Math.abs(hornTipWaveR));
        c.quadraticCurveTo(r * 0.8, -r * 0.8, r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.stroke();

        // Sağ buynuzun daxili odlu damarı (Neon titrəyiş)
        c.strokeStyle = '#f97316';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(r * 0.35, -r * 0.6);
        c.quadraticCurveTo(r * 1.0, -r * 1.1, r * 0.65 + hornTipWaveR, -r * 1.4);
        c.stroke();

        // 4. Magma Alov Kürəsi (Lava Body - Nəfəs alan canlı qızmar halqa)
        const bodyPulse = Math.sin(time * 6) * (r * 0.05);
        c.beginPath();
        c.arc(0, 0, r * 1.05 + bodyPulse, 0, Math.PI * 2);
        c.fillStyle = '#dc2626';
        c.shadowBlur = 24 + Math.sin(time * 8) * 8;
        c.shadowColor = '#ef4444';
        c.fill();

        // Obsidian Qara Çatlı Qabıq
        c.beginPath();
        c.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        c.fillStyle = '#18181b';
        c.fill();

        // 5. Parıldayan Qəzəbli Alovlu Göz Yarıqları (Canlı alov parıltısı və titrəyiş)
        const eyePulse = Math.sin(time * 12) * 4;
        c.shadowBlur = 14 + eyePulse;
        c.shadowColor = '#facc15';
        c.fillStyle = eyePulse > 1 ? '#ffffff' : '#fef08a';

        // Sol Göz
        c.beginPath();
        c.moveTo(-r * 0.55, -r * 0.1);
        c.lineTo(-r * 0.15, -r * 0.25);
        c.lineTo(-r * 0.2, 0.05);
        c.closePath();
        c.fill();

        // Sağ Göz
        c.beginPath();
        c.moveTo(r * 0.55, -r * 0.1);
        c.lineTo(r * 0.15, -r * 0.25);
        c.lineTo(r * 0.2, 0.05);
        c.closePath();
        c.fill();

        // 6. Ağızda Qaynayan Magma Yarığı (Dinamik nəfəs alma)
        const mouthGlow = Math.sin(time * 7) * (r * 0.03);
        c.strokeStyle = '#f97316';
        c.lineWidth = 2.2;
        c.shadowBlur = 10;
        c.shadowColor = '#f97316';
        c.beginPath();
        c.moveTo(-r * 0.35, r * 0.35);
        c.lineTo(0, r * 0.5 + mouthGlow);
        c.lineTo(r * 0.35, r * 0.35);
        c.stroke();

    } else if (skinId === 'void') {
        // =========================================================================
        // ========== 👑 VOİD HÖKMDARI: ALİ KİBER TAC VƏ 3 ORBİTAL QARA KÜRƏ ==========
        // =========================================================================
        // 1. Ətrafında Fırlanan 3 Orbital Qara Materiya Peyki
        const orbDist = r * 1.65;
        for (let i = 0; i < 3; i++) {
            const angle = (time * 2.8) + (i * (Math.PI * 2)) / 3;
            const ox = Math.cos(angle) * orbDist;
            const oy = Math.sin(angle) * orbDist;
            c.save();
            c.beginPath();
            c.arc(ox, oy, 5, 0, Math.PI * 2);
            c.fillStyle = '#e879f9';
            c.shadowBlur = 14;
            c.shadowColor = '#c084fc';
            c.fill();

            // Mini qara mərkəz
            c.beginPath();
            c.arc(ox, oy, 2.5, 0, Math.PI * 2);
            c.fillStyle = '#3b0764';
            c.fill();
            c.restore();
        }

        // 2. Kosmik Qara Dəlik Burulğanı (Void Singularity) - Simmetrik Dairə
        c.shadowBlur = 25;
        c.shadowColor = glow;
        c.beginPath();
        c.arc(0, 0, r * 1.1, 0, Math.PI * 2);
        c.fillStyle = '#581c87';
        c.fill();

        c.beginPath();
        c.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        c.fillStyle = '#090212';
        c.fill();

        // 3. ƏZƏMƏTLİ QIZILI KİBER TAC (HƏMİŞƏ ŞAQULİ YUXARI BAXIR - HEÇ VAXT YANA ƏYİLMİR)
        c.save();
        c.shadowBlur = 16;
        c.shadowColor = '#facc15';
        c.fillStyle = '#f59e0b';
        c.strokeStyle = '#fef08a';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-r * 0.7, -r * 0.4);
        c.lineTo(-r * 0.85, -r * 1.35); // Sol qüllə
        c.lineTo(-r * 0.35, -r * 0.85);
        c.lineTo(0, -r * 1.55);          // Mərkəzi ali tac qülləsi (Düz yuxarı)
        c.lineTo(r * 0.35, -r * 0.85);
        c.lineTo(r * 0.85, -r * 1.35);  // Sağ qüllə
        c.lineTo(r * 0.7, -r * 0.4);
        c.closePath();
        c.fill();
        c.stroke();

        // Tacın yaqut kristalları
        c.fillStyle = '#c084fc';
        c.beginPath();
        c.arc(0, -r * 1.1, 2.8, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 4. Mərkəzi Sirli Void Gözü (Bəbək hərəkət istiqamətinə zərif baxır)
        c.shadowBlur = 14;
        c.shadowColor = '#ffffff';
        c.fillStyle = '#c084fc';
        c.beginPath();
        c.ellipse(0, 0, r * 0.45, r * 0.28, 0, 0, Math.PI * 2);
        c.fill();

        // Göz bəbəyinin hərəkət istiqaməti
        const pupilDist = r * 0.18;
        const lookX = Math.cos(facing || 0) * pupilDist;
        const lookY = Math.sin(facing || 0) * pupilDist;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(lookX, lookY, 3, 0, Math.PI * 2);
        c.fill();

    } else {
        // =========================================================================
        // ========== 💠 KİBER QAÇIŞÇI (DEFAULT): KİBER NİNJA KASKI VƏ DALĞALANAN LENTLƏR ==========
        // =========================================================================
        c.rotate(facing || 0);

        // 1. Arxada Dinamik Dalğalanan İkili Neon Kiber Lentlər
        c.fillStyle = 'rgba(0, 255, 204, 0.85)';
        c.shadowBlur = 12;
        c.shadowColor = '#00ffcc';

        const wave1 = Math.sin(time * 8) * 4;
        const wave2 = Math.cos(time * 8) * 4;

        // Sol lent
        c.beginPath();
        c.moveTo(-r * 0.4, r * 0.7);
        c.quadraticCurveTo(-r * 0.9, r * 1.3 + wave1, -r * 1.35, r * 1.85);
        c.lineTo(-r * 1.0, r * 1.5);
        c.lineTo(-r * 0.15, r * 0.85);
        c.closePath();
        c.fill();

        // Sağ lent
        c.beginPath();
        c.moveTo(r * 0.4, r * 0.7);
        c.quadraticCurveTo(r * 0.9, r * 1.3 + wave2, r * 1.35, r * 1.85);
        c.lineTo(r * 1.0, r * 1.5);
        c.lineTo(r * 0.15, r * 0.85);
        c.closePath();
        c.fill();

        // 2. Kiber-Ninja Dəbilqə Korpusu
        c.shadowBlur = 22;
        c.shadowColor = glow;
        c.beginPath();
        c.arc(0, 0, r * 1.05, 0, Math.PI * 2);
        c.fillStyle = baseColor;
        c.fill();

        // Yan Kiber Qulaqlıqlar (Earpieces)
        c.fillStyle = '#0f172a';
        c.beginPath();
        c.rect(-r * 1.15, -r * 0.35, r * 0.25, r * 0.7);
        c.rect(r * 0.9, -r * 0.35, r * 0.25, r * 0.7);
        c.fill();

        // Qara Ninja Maska Qoruyucusu
        c.fillStyle = '#090d16';
        c.beginPath();
        c.ellipse(0, -1, r * 0.92, r * 0.45, 0, 0, Math.PI * 2);
        c.fill();

        // 3. Parlaq Kiber-Vizor (HUD Eynək)
        c.fillStyle = '#00ffcc';
        c.shadowBlur = 12;
        c.shadowColor = '#00ffcc';
        c.beginPath();
        if (c.roundRect) c.roundRect(-r * 0.7, -4.5, r * 1.4, 8, 3.5);
        else c.rect(-r * 0.7, -4.5, r * 1.4, 8);
        c.fill();

        // Vizor İşıq Parıltısı
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(-r * 0.32, -1.5, 2.8, 0, Math.PI * 2);
        c.fill();
    }

    c.restore();
}
if (typeof window !== 'undefined') {
    window.drawSkinModel = drawSkinModel;
}

// AKTİV OYUNUN VƏZİYYƏTİ
let gameState = {
    gold: 75,
    floor: 1,
    bestFloor: parseInt(localStorage.getItem('floor_escape_best_floor')) || 1,
    scoreProgress: 0,
    scoreReq: 3,
    borderOpen: false,
    gameOver: false,
    paused: false,
    transitioning: false,
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

            // Lavanı bərpa edirik
            if (typeof monster !== 'undefined' && monster && saved.monsterY !== undefined && saved.monsterY !== null) {
                monster.y = parseFloat(saved.monsterY);
                monster.slowTimer = parseInt(saved.monsterSlowTimer) || 0;
                monster.stunTimer = parseInt(saved.monsterStunTimer) || 0;
                monster.plasmaTimer = parseInt(saved.monsterPlasmaTimer) || 0;
                monster.baseSpeed = 0.22 + (gameState.floor - 1) * 0.06;
                monster.speed = monster.slowTimer > 0 ? monster.baseSpeed * 0.45 : monster.baseSpeed;
            }

            // Oyunçunu, Qalxanını və Kvant Sıçrayışını bərpa edirik
            if (typeof player !== 'undefined' && player) {
                if (saved.playerX !== undefined && saved.playerY !== undefined && saved.playerX !== null && saved.playerY !== null) {
                    player.x = parseFloat(saved.playerX);
                    player.y = parseFloat(saved.playerY);
                }
                player.hasShield = !!saved.playerHasShield;
                player.hasHyperJump = !!saved.playerHasHyperJump;
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
