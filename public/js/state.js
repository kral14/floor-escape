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
    return lvl * 0.20; // Hər səviyyə 20% azaldır (Lv.5 = -100% sabit)
}

function getBulletCost(type) {
    const base = BASE_BULLET_PRICES[type] || 30;
    const usage = (gameState.bulletUsage && gameState.bulletUsage[type]) || 0;
    const baseGrowth = BULLET_BASE_GROWTH_RATE[type] || 0.15;
    const reduction = getBulletReductionPct(type);
    const effectiveGrowth = baseGrowth * (1 - reduction);
    return Math.round(base * (1 + usage * effectiveGrowth));
}

const DEFAULT_PERM_UPGRADES = {
    speedLvl: 1,          // Baza sürət (Lv.1 - Lv.10)
    magnetLvl: 1,         // Baza maqnit (Lv.1 - Lv.10)
    coinValLvl: 1,        // Sikkə dəyəri (Lv.1 - Lv.10)
    coinRateLvl: 1,       // Sikkə çıxış vaxtı (Lv.1 - Lv.10)
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
    return 55 + (permUpgrades.magnetLvl - 1) * 15;
}

function getCoinBonusValue() {
    return (permUpgrades.coinValLvl - 1) * 3;
}

function getCoinSpawnInterval() {
    return Math.max(2.0, 5.0 - (permUpgrades.coinRateLvl - 1) * 0.3);
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
        // Oyunçunun koordinatları
        playerX: typeof player !== 'undefined' && player ? player.x : null,
        playerY: typeof player !== 'undefined' && player ? player.y : null,
        // Meydandakı sikkələr
        coins: typeof coins !== 'undefined' && coins ? coins.map(c => ({ x: c.x, y: c.y, value: c.value })) : []
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

            // Oyunçunu bərpa edirik
            if (typeof player !== 'undefined' && player && saved.playerX !== undefined && saved.playerY !== undefined && saved.playerX !== null && saved.playerY !== null) {
                player.x = parseFloat(saved.playerX);
                player.y = parseFloat(saved.playerY);
            }

            // Sikkələri bərpa edirik
            if (typeof Coin !== 'undefined' && saved.coins && Array.isArray(saved.coins) && saved.coins.length > 0) {
                coins = saved.coins.map(c => {
                    const coin = new Coin(c.x, c.y);
                    if (c.value) coin.value = c.value;
                    return coin;
                });
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
