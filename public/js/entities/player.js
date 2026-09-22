// OYUNÇU VƏ HİSSƏCİK (PARTICLE) SİNİFLƏRİ

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 16;
        this.glacialSlots = Array(6).fill(true);
        this.glacialCharge = 0;
        this.speed = getBaseSpeed(); // Qalıcı laboratoriyadan başlayır
        this.color = '#00ffcc';
        this.trailColor = 'rgba(0, 255, 204,';
        this.glowColor = '#00ffcc';
        this.trail = [];
        this.facing = -Math.PI / 2;
        this.visualAngle = 0; // İlk doğanda şaquli düz durur
        this.hasShield = false;
        this.shieldAngle = 0;
        this.maxHp = 3;
        this.hp = 3;
        this.hasHyperJump = false; // 🚀 Ehtiyat Kvant Sıçrayışı (Lava yaxınlaşdıqda avtomatik atır)

        this.flapPhase = 0;
        this.draculaDust = [];
        this.dustBudget = 0;
        const isSeedEquipped = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed');
        const maxCapacity = (typeof getMaxLifeFlowers === 'function') ? getMaxLifeFlowers() : ((permUpgrades && permUpgrades.seedLifeLvl) || 1);
        this.maxLifeFlowers = Math.max(1, Math.min(3, maxCapacity));
        this.lifeFlowers = isSeedEquipped ? this.maxLifeFlowers : 0;
        this.hasLifeFlower = this.lifeFlowers > 0;
        this.lifeFlowerState = this.hasLifeFlower ? 'active' : 'none';
        this.lifeFlowerWitherAge = 0;
        this.lifeFlowerTrail = [];
        this.lifeFlowerBudget = 0;
        this.hasSingularity = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'singularity');
        this.singularityAngles = { r1: 0, r2: 0, r3: 0 };
        this.singularityRot = { rx: 0, ry: 0, rz: 0 };
        this.vx = 0;
        this.vy = 0;
        this.singleBlinkTimer = 46;
        this.applySkin();
    }

    applySkin() {
        const skinId = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
        const skin = (typeof SKINS !== 'undefined' && SKINS[skinId]) ? SKINS[skinId] : null;
        if (skin) {
            this.color = skin.color || '#00ffcc';
            this.trailColor = skin.trailColor || 'rgba(0, 255, 204,';
            this.glowColor = skin.glowColor || '#00ffcc';
        } else {
            this.color = '#00ffcc';
            this.trailColor = 'rgba(0, 255, 204,';
            this.glowColor = '#00ffcc';
        }
    }

    reset(isNewRun = true) {
        if (window.GlacialSpawnEffect) window.GlacialSpawnEffect.resetGame();
        if (window.TesseractSpawnEffect) window.TesseractSpawnEffect.resetGame();
        if (isNewRun) {
            const glacCap = (typeof getGlacialCapacity === 'function') ? getGlacialCapacity() : 6;
            this.glacialSlots = Array(6).fill(false);
            for (let i = 0; i < glacCap; i++) this.glacialSlots[i] = true;
            this.glacialCharge = 0;
            const tessCap = (typeof getTesseractAmmoCap === 'function') ? getTesseractAmmoCap() : 1;
            this.tesseractSlots = Array(tessCap).fill(true);
        }
        this.x = canvasWidth / 2;
        const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
        this.y = worldH - 180;
        this.speed = getBaseSpeed();
        this.maxHp = 3;
        if (isNewRun || this.hp === undefined || this.hp <= 0) {
            this.hp = 3;
        }
        this.trail = [];

        this.facing = -Math.PI / 2;
        this.visualAngle = 0; // İlk doğanda şaquli düz durur
        this.canPassBorder = false;
        this.singleBlinkTimer = 46;
        this.hasHyperJump = false;
        this.flapPhase = 0;
        this.draculaDust = [];
        this.dustBudget = 0;
        this.singularityAngles = { r1: 0, r2: 0, r3: 0 };
        this.singularityRot = { rx: 0, ry: 0, rz: 0 };
        this.hasSingularity = (typeof permUpgrades !== 'undefined' && ['singularity', 'supernova', 'synapse', 'abyssal'].includes(permUpgrades.equippedSpawnAnim));
        this.singularityTheme = this.hasSingularity ? permUpgrades.equippedSpawnAnim : null;
        this.starDropCooldown = 1.0;
        this._eKeyLocked = false;

        const isSeedEquipped = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed');
        const maxCapacity = (typeof getMaxLifeFlowers === 'function') ? getMaxLifeFlowers() : ((permUpgrades && permUpgrades.seedLifeLvl) || 1);
        this.maxLifeFlowers = Math.max(1, Math.min(3, maxCapacity));

        if (isSeedEquipped) {
            // Əgər Yaşam Çiçəyi aktivdirsə, yeni oyunda və ya can sıfırlandıqda həmişə tam bərpa edilir
            if (isNewRun || this.lifeFlowers === undefined || this.lifeFlowers <= 0 || !this.hasLifeFlower) {
                this.lifeFlowers = this.maxLifeFlowers;
                this.hasLifeFlower = true;
                this.lifeFlowerState = 'active';
                this.lifeFlowerWitherAge = 0;
                this.lifeFlowerTrail = [];
                this.lifeFlowerBudget = 0;
                if (typeof SeedSpawnEffect !== 'undefined' && typeof SeedSpawnEffect.resetLifeFlower === 'function') {
                    SeedSpawnEffect.resetLifeFlower();
                }
            } else {
                this.hasLifeFlower = (this.lifeFlowers > 0);
                this.lifeFlowerState = this.hasLifeFlower ? 'active' : 'removed';
            }
        } else {
            this.lifeFlowers = 0;
            this.hasLifeFlower = false;
            this.lifeFlowerState = 'none';
        }
        this.vx = 0;
        this.vy = 0;
        this.applySkin();
    }

    update(keys) {
        if (gameState.transitioning) return;

        // Canavarın Zərbə Qışqırığı (Stun)
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.x += (Math.random() - 0.5) * 2;
            return;
        }

        // 💫 Yanıb-sönmə taymeri (hərəkət dondurulmur, oyunçu sərbəst hərəkət edə bilər)
        if (this.singleBlinkTimer > 0) {
            this.singleBlinkTimer--;
        }

        // 🔥 ÇOXİSTİQAMƏTLİ LAVA VƏ CANAVAR TƏHLÜKƏ SENSORU
        const dirDangers = (typeof getLavaDirectionalDangers === 'function') 
            ? getLavaDirectionalDangers(this) 
            : { right: 0, left: 0, bottom: 0, top: 0 };

        this.dangerRight = (this.dangerRight || 0) * 0.65 + (dirDangers.right || 0) * 0.35;
        this.dangerLeft = (this.dangerLeft || 0) * 0.65 + (dirDangers.left || 0) * 0.35;
        this.dangerBottom = (this.dangerBottom || 0) * 0.65 + (dirDangers.bottom || 0) * 0.35;
        this.dangerTop = (this.dangerTop || 0) * 0.65 + (dirDangers.top || 0) * 0.35;

        if (this.dangerRight < 0.005) this.dangerRight = 0;
        if (this.dangerLeft < 0.005) this.dangerLeft = 0;
        if (this.dangerBottom < 0.005) this.dangerBottom = 0;
        if (this.dangerTop < 0.005) this.dangerTop = 0;

        this.lavaDanger = Math.max(this.dangerRight, this.dangerLeft, this.dangerBottom, this.dangerTop);

        // Sürət = Qalıcı Baza Sürət + Oyundaxili Əlavə
        let baseSpeed = getBaseSpeed() + gameState.inGameSpeedLvl * 0.5;

        // ⚡ Kvant Qığılcımı (Spark) Dərisi Bonusu: +10% Hərəkət Sürəti
        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'spark') {
            baseSpeed *= 1.10;
        }

        // Ay Qravitasiyası anomaliyası zamanı süzülən sürət
        if (typeof gameState !== 'undefined' && gameState.activeModifier === 'gravity') {
            baseSpeed *= 1.25;
        }

        const isWallA = (typeof keybinds !== 'undefined' && (keybinds.wall === 'a' || keybinds.wall === 'keya'));

        const isUp = !!(keys['w'] || keys['keyw'] || keys['arrowup'] || keys['up'] || keys['touch_up'] || keys['ц']);
        const isDown = !!(keys['s'] || keys['keys'] || keys['arrowdown'] || keys['down'] || keys['touch_down'] || keys['ы']);
        const isLeft = !!((keys['a'] || keys['keya'] || keys['arrowleft'] || keys['left'] || keys['touch_left'] || keys['ф']) && !isWallA);
        const isRight = !!(keys['d'] || keys['keyd'] || keys['arrowright'] || keys['right'] || keys['touch_right'] || keys['в']);

        // 🎯 TƏK KLİK ADDIMI VƏ ORTAQ SÜRƏT BALANSI (Fair Tap Step System)
        if (!this.keyHoldFrames) {
            this.keyHoldFrames = { up: 0, down: 0, left: 0, right: 0 };
        }
        this.keyHoldFrames.up = isUp ? (this.keyHoldFrames.up + 1) : 0;
        this.keyHoldFrames.down = isDown ? (this.keyHoldFrames.down + 1) : 0;
        this.keyHoldFrames.left = isLeft ? (this.keyHoldFrames.left + 1) : 0;
        this.keyHoldFrames.right = isRight ? (this.keyHoldFrames.right + 1) : 0;

        const maxHold = Math.max(
            this.keyHoldFrames.up,
            this.keyHoldFrames.down,
            this.keyHoldFrames.left,
            this.keyHoldFrames.right
        );

        // Ayarlardan seçilmiş tək klik məsafəsi (Defolt: 10px)
        const rawTapDistance = (typeof window.tapStepDistance === 'number' && window.tapStepDistance > 0)
            ? window.tapStepDistance
            : (parseInt(localStorage.getItem('floor_escape_tap_step'), 10) || 10);

        // ⚖️ ORTAQ BALANS: Ayardakı tək klik addımı heç vaxt cari baza sürətin təbii həddindən çox ola bilməz!
        // Yəni sürət azdırsa, ayardan artırmaqla oyunda sürətlənmək MÜMKÜN DEYİL!
        // Maksimum tək klik həddi = cari baza sürətin 1.6 qatı ilə məhdudlaşdırılır.
        const maxPermittedTap = Math.max(5, baseSpeed * 1.6);
        const effectiveTapDistance = Math.min(rawTapDistance, maxPermittedTap);

        let speedMultiplier = 1.0;
        if (maxHold > 0 && maxHold <= 7) {
            // Tək klik mərhələsi (~110ms): yalnız təhlükəsiz mikro-addım atır (lavaya düşməmək üçün)
            const tapFrameSpeed = effectiveTapDistance / 7;
            speedMultiplier = Math.min(0.85, tapFrameSpeed / Math.max(1, baseSpeed));
        } else if (maxHold > 7 && maxHold <= 22) {
            // Basıb saxladıqda rəvan sürətlənmə
            const holdProgress = (maxHold - 7) / 15;
            const tapFrameSpeed = effectiveTapDistance / 7;
            const startMult = Math.min(0.85, tapFrameSpeed / Math.max(1, baseSpeed));
            speedMultiplier = startMult + (1.0 - startMult) * holdProgress;
        } else {
            // Basılı saxlayanda tam təbii sürət
            speedMultiplier = 1.0;
        }

        // QƏTİYYƏN 1.0-DAN YUXARI ÇIXA BİLMƏZ (Oyundaxili təbii sürət həddi qorunur)
        speedMultiplier = Math.min(1.0, Math.max(0.15, speedMultiplier));
        const currentSpeed = baseSpeed * speedMultiplier;

        let dx = 0, dy = 0;
        if (isUp) dy = -currentSpeed;
        if (isDown) dy = currentSpeed;
        if (isLeft) dx = -currentSpeed;
        if (isRight) dx = currentSpeed;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        if (dx !== 0 || dy !== 0) {
            this.facing = Math.atan2(dy, dx);
        }

        // 🦇 MONS BAŞININ MEYLLƏNMƏSİ VƏ DÜZ DAYANMASI (İstifadəçinin verdiyi koda tam uyğun):
        // Baş daha hərəkət istiqamətinə (360 dərəcə) əyilmir!
        // Yalnız üfüqi hərəkət zamanı bir az bucaqla (~16 dərəcə) çevrilir.
        // Hərəkət dayandıqda isə dərhal və hamar şəkildə şaquli düz dayanır (0 bucaq).
        const maxBank = 0.28; // ~16 dərəcə zərif meyllənmə
        const targetBank = (currentSpeed > 0 && dx !== 0) ? (dx / currentSpeed) * maxBank : 0;
        this.visualAngle = (typeof this.visualAngle === 'number') ? this.visualAngle : 0;
        this.visualAngle += (targetBank - this.visualAngle) * 0.20;
        if (Math.abs(this.visualAngle) < 0.003) {
            this.visualAngle = 0;
        }

        this.vx = dx;
        this.vy = dy;

        // 🦇 HƏRƏKƏTƏ UYĞUN QANAD ÇIRPINMASI (İstifadəçinin verdiyi kod alqoritmi ilə)
        const speedLen = Math.hypot(dx, dy);
        const speedRatio = Math.min(1, speedLen / (currentSpeed || 1));
        const dt = 1 / 60;
        if (permUpgrades.equippedSpawnAnim === 'glacial' && window.GlacialSpawnEffect) window.GlacialSpawnEffect.updateGame(dt, this);
        if (permUpgrades.equippedSpawnAnim === 'tesseract' && window.TesseractSpawnEffect) window.TesseractSpawnEffect.updateGame(dt, this);
        this.flapPhase = (this.flapPhase || 0) + dt * (2.5 + speedRatio * 7.0);

        // 🦇 DRAKULA QANADLARINDAN TÖKÜLƏN QIZILI, BƏNÖVŞƏYİ VƏ FİRUZƏYİ TOZ ZƏRRƏCİKLƏRİ:
        if (this.draculaDust && this.draculaDust.length > 0) {
            for (const p of this.draculaDust) {
                p.life -= dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 14 * dt;
                p.angle += p.spin * dt;
            }
            this.draculaDust = this.draculaDust.filter(p => p.life > 0);
        }

        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'dracula' && typeof getIngameWingDustPoint === 'function') {
            const beat = 0.5 + 0.5 * Math.cos(this.flapPhase);
            this.dustBudget = (this.dustBudget || 0) + dt * (8 + speedRatio * 16 + beat * 8);
            while (this.dustBudget >= 1 && this.draculaDust.length < 35) {
                this.dustBudget--;
                for (const side of [-1, 1]) {
                    const pos = getIngameWingDustPoint(side, this);
                    const life = 0.5 + Math.random() * 0.4;
                    this.draculaDust.push({
                        x: pos.x,
                        y: pos.y,
                        vx: side * (2 + Math.random() * 4) + this.vx * 0.2,
                        vy: 8 + Math.random() * 10 + this.vy * 0.1,
                        life,
                        maxLife: life,
                        size: 0.8 + Math.random() * 1.3,
                        angle: Math.random() * 6.28,
                        spin: (Math.random() - 0.5) * 2,
                        star: Math.random() < 0.2,
                        color: ['#ffe5b4', '#d8bdff', '#c3f3ef'][Math.floor(Math.random() * 3)]
                    });
                }
            }
            if (this.draculaDust.length > 35) this.draculaDust.splice(0, this.draculaDust.length - 35);
        }

        // 🌸 Yaşam Çiçəyinin Solma və Ləçək İzi İdarəetməsi
        if (this.lifeFlowerState === 'withering') {
            this.lifeFlowerWitherAge += dt;
            if (this.lifeFlowerWitherAge >= 2.8) {
                this.lifeFlowerWitherAge = 2.8;
                this.lifeFlowerState = 'removed';
            }
        }

        if (this.lifeFlowerTrail && this.lifeFlowerTrail.length > 0) {
            for (const p of this.lifeFlowerTrail) {
                p.life -= dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.angle += p.spin * dt;
            }
            this.lifeFlowerTrail = this.lifeFlowerTrail.filter(p => p.life > 0);
        }

        if (this.hasLifeFlower && (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed')) {
            const isMoving = speedRatio > 0.08;
            this.lifeFlowerBudget = (this.lifeFlowerBudget || 0) + dt * (isMoving ? 28 : 10);
            while (this.lifeFlowerBudget >= 1) {
                this.lifeFlowerBudget--;
                const a = Math.random() * Math.PI * 2;
                const rDist = (this.radius || 16) * (0.8 + Math.random() * 0.8);
                const life = 0.7 + Math.random() * 0.5;
                this.lifeFlowerTrail.push({
                    x: this.x + Math.cos(a) * rDist,
                    y: this.y + Math.sin(a) * rDist,
                    vx: -this.vx * 0.15 + (Math.random() - 0.5) * 14,
                    vy: 12 + Math.random() * 14,
                    life,
                    max: life,
                    angle: Math.random() * 6.28,
                    spin: (Math.random() - 0.5) * 3,
                    petal: Math.random() < 0.65
                });
            }
            if (this.lifeFlowerTrail.length > 100) this.lifeFlowerTrail.splice(0, this.lifeFlowerTrail.length - 100);
        }

        // 🌀 Kvant Laboratoriyası / 4 Mövzu (Kiber Sinqulyarlıq, Plazma Supernova, Kvant Sinapsı, Dərin Abiss)
        const quantumThemes = ['singularity', 'supernova', 'synapse', 'abyssal'];
        const equippedQuantumAnim = (typeof permUpgrades !== 'undefined') ? permUpgrades.equippedSpawnAnim : null;
        if (quantumThemes.includes(equippedQuantumAnim)) {
            this.hasSingularity = true;
            this.singularityTheme = equippedQuantumAnim;

            // ⚡ Ulduz Atışı və lavaya/canavara zərbə vurması
            if (typeof SingularitySpawnEffect !== 'undefined') {
                SingularitySpawnEffect.updateInGame(dt, this);
            }

            // Hərəkət zamanı tematik parıltı hissəcikləri (yalnız kvant aktiv olduqda)
            if (speedRatio > 0.15 && Math.random() < 0.28 && typeof particles !== 'undefined') {
                const colorsByTheme = {
                    singularity: ['#38bdf8', '#06b6d4', '#e0f2fe'],
                    supernova: ['#fbbf24', '#f97316', '#fffbeb'],
                    synapse: ['#c084fc', '#a855f7', '#faf5ff'],
                    abyssal: ['#2dd4bf', '#14b8a6', '#f0fdfa']
                };
                const themePalette = colorsByTheme[equippedQuantumAnim] || colorsByTheme.singularity;
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    themePalette[Math.floor(Math.random() * themePalette.length)],
                    2.8
                ));
            }
        } else {
            this.hasSingularity = false;
            this.singularityTheme = null;
        }

        this.x += dx;
        this.y += dy;

        const borderY = 55;
        const currentH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
        if (gameState.borderOpen) {
            this.canPassBorder = true;
            this.y = Math.max(10, Math.min(currentH - this.radius - 10, this.y));
        } else {
            this.canPassBorder = false;
            this.y = Math.max(borderY + this.radius + 5, Math.min(currentH - this.radius - 10, this.y));
        }

        // 🧱 Fiziki Barrikada Dayağı: Barrikada aktivdirsə, oyunçu onun üstündə təhlükəsiz dayanır
        if (typeof monster !== 'undefined' && monster && monster.wallTimer > 0) {
            const wallTopY = (monster.y + (monster.shockShake || 0)) - 16;
            if (this.y + this.radius > wallTopY) {
                this.y = wallTopY - this.radius;
            }
        }

        this.x = Math.max(this.radius + 10, Math.min(canvasWidth - this.radius - 10, this.x));

        this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
        if (this.trail.length > 12) this.trail.shift();
    }

    // 🛡️ QALXANIN BƏRPASI (1 DƏFƏLİK MÜDAFİƏ)
    restoreShield() {
        this.hasShield = true;
    }

    // 🛡️ QALXANIN ZƏRBƏNİ 1 DƏFƏ BLOKLAYARAQ PARÇALANMASI
    breakShield() {
        if (!this.hasShield) return;
        this.hasShield = false;
        let invulnDuration = 80; // 1.35 saniyəlik toxunulmazlıq

        // 🛡️ Titan Zirehli (Aegis) Dərisi Bonusu: +1.5s (90 kadr) əlavə toxunulmazlıq
        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'aegis') {
            invulnDuration = 140;
        }

        if (typeof gameState !== 'undefined') {
            gameState.dashInvulnerable = invulnDuration;
        }
        // [YERİNDƏ QALMA]: Dəqiq 1 dəfə yanıb-sönür və bu zaman hərəkət dondurulur
        this.singleBlinkTimer = 46;
        this.vx = 0;
        this.vy = 0;
        // [YERİNDƏ QALMA]: Koordinat dəyişmir, oyunçu yerində qalır
        
        if (typeof audio !== 'undefined' && audio.playShieldBreak) {
            audio.playShieldBreak();
        }
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(this.x, this.y, Math.random() < 0.5 ? '#00f0ff' : '#ffffff', 4));
            }
        }
        if (typeof addFloatingText === 'function') {
            addFloatingText(this.x, this.y - 25, '🛡️ QALXAN BLOKLADI VƏ PARÇALANDI!', '#00f0ff', 20);
        }
        if (typeof showToast === 'function') {
            showToast('🛡️ ENERJİ QALXANI SİZİ 1 DƏFƏ ZƏRƏRDƏN QORUYARAQ PARÇALANDI!', 'success');
        }
    }

    // 🛡️ Geriyə uyğunluq üçün damageShield: Qalxan 1 dəfə üçün aktivdir və dərhal parçalanır!
    damageShield(amount = 1, source = 'generic') {
        if (!this.hasShield) return false;
        this.breakShield();
        return false; // Artıq qalxan parçalandı
    }

    // ❤️ MONSUN CAN ALMASI (PLAYER HP) VƏ YA ZƏRƏRDƏN QORUNMASI
    takeDamage(amount = 1, source = 'generic') {
        if (typeof gameState !== 'undefined' && (gameState.dashInvulnerable > 0 || gameState.transitioning || gameState.gameOver)) {
            return false;
        }

        // 1. Əgər Qalxan varsa, 1 DƏFƏ zərərdən qoruyur və qalxan parçalanır!
        if (this.hasShield) {
            this.breakShield();
            return false; // Can getmədi
        }

        // 2. Əgər Yaşam Çiçəyi varsa, o qoruyur
        if (this.hasLifeFlower && typeof this.consumeLifeFlower === 'function') {
            this.consumeLifeFlower();
            return false; // Can getmədi
        }

        // 3. Qalxan və çiçək yoxdursa -> MONSUN CANI AZALIR!
        this.hp = Math.max(0, (this.hp !== undefined ? this.hp : (this.maxHp || 3)) - amount);

        if (typeof updateHpUI === 'function') {
            updateHpUI();
        }

        // Zərbə səsi
        if (typeof audio !== 'undefined') {
            if (typeof audio.playExplosion === 'function') audio.playExplosion();
            else if (typeof audio.playShieldBreak === 'function') audio.playShieldBreak();
        }

        // Ekran qırmızı pulsasiyası və silkələnməsi
        if (typeof screenPulse !== 'undefined') {
            screenPulse.color = 'rgba(239, 68, 68, 0.6)';
            screenPulse.alpha = 0.9;
        }
        const mainView = (typeof document !== 'undefined') ? document.getElementById('main-view') : null;
        if (mainView) {
            mainView.classList.add('shake');
            setTimeout(() => mainView.classList.remove('shake'), 280);
        }


        // Zərbə hissəcikləri
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 25; i++) {
                particles.push(new Particle(this.x, this.y, Math.random() < 0.5 ? '#ef4444' : '#f97316', 4));
            }
        }

        if (this.hp <= 0) {
            // Can bitdi -> Oyun bitir!
            if (typeof addFloatingText === 'function') {
                addFloatingText(this.x, this.y - 25, '💀 MONSUN CANI BİTDİ!', '#ef4444', 24);
            }
            if (typeof showToast === 'function') {
                showToast('💀 MONSUN BÜTÜN CANLARI TÜKƏNDİ!', 'danger');
            }
            if (typeof triggerGameOver === 'function') {
                triggerGameOver();
            }
            return true;
        } else {
            // Hələ canı var -> Təhlükəsiz zonaya atır və toxunulmazlıq verir!
            let invuln = 90; // 1.5 saniyə toxunulmazlıq
            if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'aegis') {
                invuln = 130;
            }
            if (typeof gameState !== 'undefined') {
                gameState.dashInvulnerable = invuln;
            }
            // [YERİNDƏ QALMA]: Başqa yerə tullanmır, yerində qalır!
            // Hərəkət dondurulur
            this.singleBlinkTimer = 46; // Dəqiq 1 dəfə yanıb-sönmə
            this.vx = 0;
            this.vy = 0;
            // [YERİNDƏ QALMA]: Koordinat dəyişmir, oyunçu yerində qalır

            if (typeof addFloatingText === 'function') {
                addFloatingText(this.x, this.y - 25, `💔 -1 CAN! [${this.hp}/${this.maxHp || 3}]`, '#ef4444', 22);
            }
            if (typeof showToast === 'function') {
                showToast(`💔 MONS ZƏRƏR ALDI! Qalan Can: ${this.hp}/${this.maxHp || 3}`, 'warning');
            }
            if (typeof saveActiveRun === 'function') {
                saveActiveRun();
            }
            return false;
        }
    }



    // 🌸 YAŞAM ÇİÇƏYİ BONUS CANININ SƏRF EDİLMƏSİ VƏ XİLAS OLUNMA
    consumeLifeFlower() {
        if (!this.hasLifeFlower || (this.lifeFlowers || 0) <= 0) return false;

        this.lifeFlowers = Math.max(0, (this.lifeFlowers || 0) - 1);
        this.hasLifeFlower = (this.lifeFlowers > 0);

        if (this.lifeFlowers === 0) {
            this.lifeFlowerState = 'withering';
            this.lifeFlowerWitherAge = 0;
            if (typeof SeedSpawnEffect !== 'undefined' && typeof SeedSpawnEffect.consumeLifeFlower === 'function') {
                SeedSpawnEffect.consumeLifeFlower();
            }
            if (typeof showToast === 'function') {
                showToast('🥀 BÜTÜN YAŞAM ÇİÇƏKLƏRİ SOLDU! (Qalan Can: 0)', 'error');
            }
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('life-flower-removed', { detail: { source: 'life-flower' } }));
            }
        } else {
            this.lifeFlowerState = 'active';
            if (typeof showToast === 'function') {
                showToast(`🌸 YAŞAM ÇİÇƏYİ SİZİ XİLAS ETDİ! (Qalan Can: ${this.lifeFlowers}/${this.maxLifeFlowers})`, 'warning');
            }
        }

        let invulnDuration = 90; // 1.5 saniyəlik toxunulmazlıq
        if (typeof gameState !== 'undefined') {
            gameState.dashInvulnerable = invulnDuration;
        }
        // [YERİNDƏ QALMA]: Dəqiq 1 dəfə yanıb-sönür və bu zaman hərəkət dondurulur
        this.singleBlinkTimer = 46;
        this.vx = 0;
        this.vy = 0;
        // [YERİNDƏ QALMA]: Koordinat dəyişmir, oyunçu yerində qalır

        if (typeof audio !== 'undefined' && audio.playShieldBreak) {
            audio.playShieldBreak();
        }
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 35; i++) {
                particles.push(new Particle(this.x, this.y, ['#62e6a0', '#d8ffba', '#ffe3a0', '#ffffff'][Math.floor(Math.random() * 4)], 4.5));
            }
        }
        return true;
    }

    // 🌸 İTİRİLMİŞ YAŞAM ÇİÇƏYİ CANININ BƏRPA EDİLMƏSİ (ARENADAN YIĞILDIQDA)
    addLifeFlower() {
        const isSeedEquipped = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed');
        if (!isSeedEquipped) return false;

        const maxCap = this.maxLifeFlowers || 1;
        if ((this.lifeFlowers || 0) >= maxCap) {
            return false; // Artıq maksimumdur
        }

        this.lifeFlowers = Math.min(maxCap, (this.lifeFlowers || 0) + 1);
        this.hasLifeFlower = true;
        this.lifeFlowerState = 'active';
        this.lifeFlowerWitherAge = 0;

        if (typeof SeedSpawnEffect !== 'undefined') {
            SeedSpawnEffect.flowerState = 'active';
            SeedSpawnEffect.witherAge = 0;
            SeedSpawnEffect.healthGranted = true;
        }

        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 25; i++) {
                particles.push(new Particle(this.x, this.y, ['#62e6a0', '#ffe3a0', '#ffffff'][Math.floor(Math.random() * 3)], 3.8));
            }
        }
        return true;
    }

    // 🚀 KVANT SIÇRAYIŞI (REAKTİV İMPULS)
    hyperJump() {
        this.hasHyperJump = false;
        // [YERİNDƏ QALMA]: Kvant Sıçrayışı da oyunçunu başqa yerə tullamır, yerində qoruyur!
        this.singleBlinkTimer = 46;
        this.vx = 0;
        this.vy = 0;
        if (typeof gameState !== 'undefined') {
            gameState.dashInvulnerable = 60;
        }
        this.dashCooldown = 0;
        if (typeof audio !== 'undefined' && audio.playDash) {
            audio.playDash();
        }
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(this.x, this.y, Math.random() < 0.5 ? '#f59e0b' : '#fde047', 4));
            }
        }
        if (typeof showToast === 'function') {
            showToast('🚀 TƏCİLİ KVANT SIÇRAYIŞI! Sizi lavadan xilas etdi!', 'warning');
        }
    }

    dash() {
        if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
        if (gameState.dashCooldown <= 0) {
            let maxCd = gameState.dashMaxCooldown;

            // 👑 Void Hökmdarı Bonusu: Dash soyuma müddəti 20% azalır
            if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'void') {
                maxCd = Math.round(maxCd * 0.8);
            }
            gameState.dashCooldown = maxCd;
            gameState.dashInvulnerable = 20;

            const dashDistance = 85;
            this.x += Math.cos(this.facing) * dashDistance;
            this.y += Math.sin(this.facing) * dashDistance;

            const borderY = 55;
            const currentH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
            const minY = gameState.borderOpen ? 10 : borderY + this.radius + 5;
            this.y = Math.max(minY, Math.min(currentH - this.radius - 10, this.y));
            this.x = Math.max(this.radius + 10, Math.min(canvasWidth - this.radius - 10, this.x));

            audio.playDash();
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(this.x, this.y, '#00ffff', 4));
            }
            if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'singularity') {
                if (typeof SingularitySpawnEffect !== 'undefined' && SingularitySpawnEffect.themes) {
                    SingularitySpawnEffect.themes.singularity.triggerBurst();
                }
            }
            showToast('⚡ DASH!', 'info');
        }
    }

    draw() {
        // 💫 Can itirəndə dəqiq 2 DƏFƏ zərif sönüb-yanma (Double Blink)
        const prevAlpha = ctx.globalAlpha;
        if (this.singleBlinkTimer > 0) {
            const progress = this.singleBlinkTimer / 46; // 1.0 -> 0.0
            // Dəqiq 2 tam dövr: 0 -> 1 -> 0 -> 1 -> 0
            const fade = Math.abs(Math.sin((1 - progress) * 2 * Math.PI));
            ctx.globalAlpha = Math.max(0.15, 1.0 - (fade * 0.85));
        } else if (typeof gameState !== 'undefined' && gameState.isDashing) {
            ctx.globalAlpha = 0.65;
        }

        this.trail.forEach((t, i) => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * (i / this.trail.length) * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = `${this.trailColor || 'rgba(0, 255, 204,'}${t.alpha * 0.25})`;
            ctx.fill();
        });

        // Xarici Geniş Radial Neon Aura
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = gameState.dashInvulnerable > 0 ? '#ffffff' : (this.glowColor || '#00ffcc');
        
        const danger = this.lavaDanger || 0;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.0);
        if (gameState.dashInvulnerable > 0) {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else if (danger > 0.05) {
            grad.addColorStop(0, `rgba(239, 68, 68, ${0.25 + danger * 0.55})`);
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
            grad.addColorStop(0, `${this.trailColor || 'rgba(0, 255, 204,'} 0.25)`);
            grad.addColorStop(1, `${this.trailColor || 'rgba(0, 255, 204,'} 0)`);
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // 🕒 Ümumi Animasiya Zamanı
        const animTime = performance.now() * 0.003;

        // 🦇 Drakula qanad tozlarının oyunda canlı axışı
        if (typeof drawIngameWingDust === 'function' && this.draculaDust && this.draculaDust.length > 0) {
            drawIngameWingDust(ctx, this.draculaDust);
        }

        // 🌸 Yaşam Çiçəyinin Ləçək Və Köz İzi
        if (this.lifeFlowerTrail && this.lifeFlowerTrail.length > 0) {
            for (const p of this.lifeFlowerTrail) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.globalAlpha = Math.pow(p.life / p.max, 1.3);
                ctx.fillStyle = p.petal ? '#c4ecab' : '#b6ffce';
                ctx.shadowColor = '#93e9a5';
                ctx.shadowBlur = 0;
                if (p.petal) {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 3.8, 1.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-2.5, -0.6, 5, 1.2);
                    ctx.fillRect(-0.6, -2.5, 1.2, 5);
                }
                ctx.restore();
            }
        }

        // 🌸 Yaşam Çiçəkləri və Sarmaşıq Beşiyi (Arxa Plan)
        if (typeof drawIngameLifeFlowers === 'function') {
            drawIngameLifeFlowers(ctx, this, animTime, false);
        }

        // 🌀 Kvant Laboratoriyası 3D Halqaları və Zərif Enerji Aurası (DƏQİQ 1-ci AÇILIŞDAKI FORMA)
        // Oyunçu bədənindən əvvəl arxa planda çəkilir ki, oyunçunun üzünü və dərisini örtməsin!
        const quantumThemes = ['singularity', 'supernova', 'synapse', 'abyssal'];
        const activeSpawnAnim = (typeof permUpgrades !== 'undefined') ? permUpgrades.equippedSpawnAnim : null;
        if (quantumThemes.includes(activeSpawnAnim)) {
            const SingularityModule = (typeof SingularitySpawnEffect !== 'undefined') ? SingularitySpawnEffect : null;
            if (SingularityModule) {
                if (typeof SingularityModule.renderIngamePlayerHalo === 'function') {
                    SingularityModule.renderIngamePlayerHalo(ctx, this, animTime);
                }
            }
        }

        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'glacial' && window.GlacialSpawnEffect) {
            window.GlacialSpawnEffect.drawPlayer(ctx, this);
        }

        if (permUpgrades.equippedSpawnAnim === 'tesseract' && window.TesseractSpawnEffect) window.TesseractSpawnEffect.drawPlayer(ctx,this);

        // Xüsusi Kiber Dəri Modeli (Ninja Vizor, Elektrik Spikelər, Mecha Lövhələr, Alov Buynuzları, Kiber Tac)
        const skinId = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
        const drawAngle = (typeof this.visualAngle === 'number') ? this.visualAngle : 0;
        if (typeof drawSkinModel === 'function') {
            drawSkinModel(ctx, this.x, this.y, this.radius, skinId, drawAngle, animTime, gameState.dashInvulnerable > 0, this);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gameState.dashInvulnerable > 0 ? '#ffffff' : this.color;
            ctx.fill();
        }

        // 🔥 ÇOXİSTİQAMƏTLİ TƏHLÜKƏ SƏRHƏDİ (HANSI TƏRƏF TƏHLÜKƏDƏDİRSƏ, MƏHZ HƏMİN TƏRƏF QIZARIR!)
        const dangerDirections = [
            { key: 'right', angle: 0, danger: this.dangerRight || 0 },
            { key: 'bottom', angle: Math.PI / 2, danger: this.dangerBottom || 0 },
            { key: 'left', angle: Math.PI, danger: this.dangerLeft || 0 },
            { key: 'top', angle: -Math.PI / 2, danger: this.dangerTop || 0 }
        ];

        for (let dIdx = 0; dIdx < dangerDirections.length; dIdx++) {
            const dir = dangerDirections[dIdx];
            if (dir.danger > 0.05) {
                ctx.save();
                const ang = dir.angle;
                const dVal = dir.danger;
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);

                // 1. Gövdənin məhz həmin tərəfinin qırmızılaşması (Yönlü Qradiyent)
                const gradX1 = this.x - cosA * this.radius;
                const gradY1 = this.y - sinA * this.radius;
                const gradX2 = this.x + cosA * this.radius;
                const gradY2 = this.y + sinA * this.radius;

                const dirGrad = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
                dirGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
                dirGrad.addColorStop(0.45, 'rgba(239, 68, 68, 0)');
                dirGrad.addColorStop(0.75, `rgba(239, 68, 68, ${dVal * 0.45})`);
                dirGrad.addColorStop(1.0, `rgba(239, 68, 68, ${dVal * 0.90})`);

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 1.2, 0, Math.PI * 2);
                ctx.fillStyle = dirGrad;
                ctx.fill();

                // 2. YÖNLÜ SƏRHƏD QÖVSÜ: Məhz həmin təhlükə tərəfində daralan qırmızı kiber qövs (~105 dərəcə)
                const arcSpread = Math.PI * 0.29;
                const warnPulse = 1 + Math.sin(animTime * 22) * 0.07 * dVal;
                const ringRadius = (this.radius + 3 + (1 - dVal) * 14) * warnPulse;

                ctx.beginPath();
                ctx.arc(this.x, this.y, ringRadius, ang - arcSpread, ang + arcSpread);
                ctx.strokeStyle = dVal > 0.8 ? '#ef4444' : `rgba(239, 68, 68, ${0.4 + dVal * 0.6})`;
                ctx.lineWidth = dVal > 0.8 ? 3.0 : 2.0;
                ctx.setLineDash(dVal > 0.7 ? [6, 3] : [4, 4]);
                ctx.stroke();

                // 3. KRİTİK LİMİT NİŞANI: Məhz həmin tərəfdə qırmızı limit nöqtələri
                if (dVal > 0.72) {
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ef4444';
                    const tipX = this.x + cosA * (ringRadius + 3);
                    const tipY = this.y + sinA * (ringRadius + 3);
                    ctx.beginPath();
                    ctx.arc(tipX, tipY, 3.0, 0, Math.PI * 2);
                    ctx.fill();

                    const leftX = this.x + Math.cos(ang - arcSpread) * ringRadius;
                    const leftY = this.y + Math.sin(ang - arcSpread) * ringRadius;
                    const rightX = this.x + Math.cos(ang + arcSpread) * ringRadius;
                    const rightY = this.y + Math.sin(ang + arcSpread) * ringRadius;
                    ctx.beginPath();
                    ctx.arc(leftX, leftY, 2.0, 0, Math.PI * 2);
                    ctx.arc(rightX, rightY, 2.0, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        // 🌸 Yaşam Çiçəkləri (Ön Plan)
        if (typeof drawIngameLifeFlowers === 'function') {
            drawIngameLifeFlowers(ctx, this, animTime, true);
        }

        // Aşağıya doğru atılan ulduzlar və lavada/döşəmədə parçalanan kristal qəlpələr
        if (quantumThemes.includes(activeSpawnAnim)) {
            const SingularityModule = (typeof SingularitySpawnEffect !== 'undefined') ? SingularitySpawnEffect : null;
            if (SingularityModule && typeof SingularityModule.drawInGameProjectiles === 'function') {
                SingularityModule.drawInGameProjectiles(ctx);
            }
        }

        // 🚀 AKTİV KVANT SIÇRAYIŞI HAZIRLIĞI (EMERGENCY QUANTUM HYPER-JUMP WINGS & THRUSTERS)
        // Lavaya toxunmağa az qalmış oyunçunu yuxarı fırladacaq reaktiv kvant sistemi
        if (this.hasHyperJump) {
            ctx.save();
            const qTime = animTime * 8;
            const wingPulse = Math.sin(qTime) * 3;
            const glowPulse = 16 + Math.sin(qTime * 1.5) * 6;

            ctx.shadowBlur = 0;
            ctx.shadowColor = '#f59e0b';

            // 1. İki Böyük Reaktiv Kvant Qanadı (Sol və Sağda yuxarı açılan kiber qanadlar)
            ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.8;

            // Sol Qanad
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius * 0.7, this.y + this.radius * 0.3);
            ctx.quadraticCurveTo(this.x - this.radius * 1.8 - wingPulse, this.y - this.radius * 0.2, this.x - this.radius * 1.6, this.y - this.radius * 1.05);
            ctx.lineTo(this.x - this.radius * 1.15, this.y - this.radius * 0.35);
            ctx.lineTo(this.x - this.radius * 1.65 - wingPulse, this.y + this.radius * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sağ Qanad
            ctx.beginPath();
            ctx.moveTo(this.x + this.radius * 0.7, this.y + this.radius * 0.3);
            ctx.quadraticCurveTo(this.x + this.radius * 1.8 + wingPulse, this.y - this.radius * 0.2, this.x + this.radius * 1.6, this.y - this.radius * 1.05);
            ctx.lineTo(this.x + this.radius * 1.15, this.y - this.radius * 0.35);
            ctx.lineTo(this.x + this.radius * 1.65 + wingPulse, this.y + this.radius * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Oyunçunun Altında Yuxarı Təkan Verən Reaktiv Plazma Alovu
            const flameLen = this.radius * 0.75 + Math.sin(qTime * 2) * (this.radius * 0.3);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius * 0.4, this.y + this.radius * 0.8);
            ctx.lineTo(this.x, this.y + this.radius * 0.95 + flameLen);
            ctx.lineTo(this.x + this.radius * 0.4, this.y + this.radius * 0.8);
            ctx.closePath();
            ctx.fill();

            // Daxili Ağ Qızmar Nüvə
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius * 0.2, this.y + this.radius * 0.8);
            ctx.lineTo(this.x, this.y + this.radius * 0.9 + flameLen * 0.6);
            ctx.lineTo(this.x + this.radius * 0.2, this.y + this.radius * 0.8);
            ctx.closePath();
            ctx.fill();

            // 3. Yuxarıya Doğru Süzülən Kvant Təkan İndikatorları (Kiber Şevronlar ▲▲)
            for (let k = 0; k < 2; k++) {
                const chevProgress = ((animTime * 2.2 + k * 0.5) % 1);
                const chevY = this.y - this.radius * 0.95 - chevProgress * (this.radius * 1.1);
                const chevAlpha = Math.sin(chevProgress * Math.PI) * 0.9;
                ctx.strokeStyle = `rgba(254, 240, 138, ${chevAlpha})`;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(this.x - 6, chevY + 4);
                ctx.lineTo(this.x, chevY);
                ctx.lineTo(this.x + 6, chevY + 4);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 🛡️ AKTİV ENERJİ QALXANI (AEGIS SHIELD AURA & ROTATING DEFLECTOR)
        // TƏKCƏ KƏNARLARDA DÖVR EDİR - OYUNÇUNUN ÜZƏRİNİ QƏTİYYƏN ÖRTMÜR (MƏRKƏZ 100% ŞƏFFAFDIR)
        if (this.hasShield) {
            ctx.save();
            this.shieldAngle = (this.shieldAngle || 0) + 0.035;
            const shieldPulse = 1 + Math.sin(animTime * 5) * 0.04;
            // Radius daha genişdir ki, buynuzları və auranı sıxmasın və kəsməsin
            const shieldRad = (this.radius * 1.55 + 5) * shieldPulse;

            // 1. Xarici Zərif Neon Qübbə Xətti
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00f0ff';
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.95)';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, shieldRad, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Fırlanan Kəsik-Kəsik Kiber Deflektor Halqası
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.shieldAngle);
            ctx.setLineDash([10, 7]);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRad + 3.5, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Fırlanan 3 Ədəd Parlaq Kiber Orbital Düyün (Enerji Generatorları)
            for (let s = 0; s < 3; s++) {
                ctx.rotate((Math.PI * 2) / 3);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.shadowColor = '#00f0ff';
                ctx.beginPath();
                ctx.arc(shieldRad + 3.5, 0, 3, 0, Math.PI * 2);
                ctx.fill();

                // Düyün daxili neon mərkəzi
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(shieldRad + 3.5, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            ctx.restore();
        }

        // 🏷️ Animasiya Üzərindəki Status Badge-i (Ulduz, Kvant Buz Zirehi və s.)
        this.drawAnimBadge(ctx);
        ctx.globalAlpha = prevAlpha;
    }

    // ❤️ Can artıq yuxarı HUD panelində (stat-hp-panel) göstərilir, Monsun üzərində çəkilmir
    drawHealthBar(ctx) {
        // Deaktiv edilib: can artıq yuxarı paneldə əks olunur
    }

    // 🏷️ Doğuluş Animasiyası Resurs & Status Göstəricisi (Ulduz, Kvant Buz Zirehi, Tesserakt, Yaşam Çiçəyi)
    drawAnimBadge(ctx) {
        if (typeof gameState !== 'undefined' && gameState.gameOver) return;

        const anim = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'default';
        let icon = null;
        let text = null;
        let color = '#38bdf8';
        let glowColor = '#00f0ff';
        let borderColor = 'rgba(56, 189, 248, 0.6)';
        let isZero = false;

        // 1. Kiber Ulduz Animasiyaları (Singularity, Supernova, Synapse, Abyssal, Stellar)
        if (['singularity', 'supernova', 'synapse', 'abyssal', 'stellar'].includes(anim)) {
            const count = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') ? permUpgrades.cyberStars : 0;
            icon = '⭐';
            text = `${count}`;
            isZero = count <= 0;
            color = isZero ? '#f87171' : '#facc15';
            glowColor = isZero ? '#ef4444' : '#eab308';
            borderColor = isZero ? 'rgba(239, 68, 68, 0.7)' : 'rgba(250, 204, 21, 0.7)';
        }
        // 2. Kvant Buz Zirehi (Glacial)
        else if (anim === 'glacial') {
            const slots = this.glacialSlots || [true, true, true, true, true, true];
            const count = slots.filter(Boolean).length;
            icon = '❄';
            text = `${count}/6`;
            isZero = count <= 0;
            color = isZero ? '#f87171' : '#38bdf8';
            glowColor = isZero ? '#ef4444' : '#0ea5e9';
            borderColor = isZero ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.7)';
        }
        // 3. 4D Kvant Tesseraktı (Tesseract)
        else if (anim === 'tesseract') {
            const tessCap = (typeof getTesseractAmmoCap === 'function') ? getTesseractAmmoCap() : 1;
            const slots = this.tesseractSlots || Array(tessCap).fill(true);
            const count = slots.filter(Boolean).length;
            icon = '⚛';
            text = `${count}/${tessCap}`;
            isZero = count <= 0;
            color = isZero ? '#f87171' : '#c084fc';
            glowColor = isZero ? '#ef4444' : '#a855f7';
            borderColor = isZero ? 'rgba(239, 68, 68, 0.7)' : 'rgba(192, 132, 252, 0.7)';
        }
        // 4. Yaşam Çiçəyi (Seed)
        else if (anim === 'seed') {
            if (typeof SeedSpawnEffect !== 'undefined' && SeedSpawnEffect.flowerState === 'active') {
                icon = '🌸';
                text = '1';
                color = '#f472b6';
                glowColor = '#ec4899';
                borderColor = 'rgba(244, 114, 182, 0.7)';
            }
        }

        if (!icon || text === null) return;

        // Futuristik Sci-Fi Badge (Oyunçunun və animasiyanın üzərində: y + 36px)
        ctx.save();
        const bx = Math.round(this.x);
        const by = Math.round(this.y + this.radius + 13);

        ctx.font = 'bold 11px "Orbitron", -apple-system, sans-serif';
        const label = `${icon} ${text}`;
        const textW = ctx.measureText(label).width;
        const padX = 14;
        const bw = Math.max(40, textW + padX);
        const bh = 18;

        // Arxa Fon Kapsulu (Tünd şüşə efekti)
        ctx.fillStyle = 'rgba(8, 14, 28, 0.88)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.3;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 9);
        ctx.fill();
        ctx.stroke();

        // Daxili Mətn və İkon
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx, by + 0.5);

        ctx.restore();
    }

}

class Particle {
    constructor(x, y, color, size = 3) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 7;
        this.vy = (Math.random() - 0.5) * 7 - 1;
        this.radius = Math.random() * size + 1;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.028 + 0.015;
        this.gravity = 0.05;
        this.isGold = color === '#ffd700' || color === '#ffaa00';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= this.decay;
        this.radius *= 0.995;
    }

    draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
