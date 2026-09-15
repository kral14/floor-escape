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
        this.maxShieldDefense = 10;
        this.shieldDefense = 10;
        this.shieldAngle = 0;
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
        if (isNewRun) { this.glacialSlots = Array(6).fill(true); this.glacialCharge = 0; }
        this.x = canvasWidth / 2;
        const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
        this.y = worldH - 180;
        this.speed = getBaseSpeed();
        this.trail = [];
        this.facing = -Math.PI / 2;
        this.visualAngle = 0; // İlk doğanda şaquli düz durur
        this.canPassBorder = false;
        this.hasHyperJump = false;
        this.flapPhase = 0;
        this.draculaDust = [];
        this.dustBudget = 0;
        this.singularityAngles = { r1: 0, r2: 0, r3: 0 };
        this.singularityRot = { rx: 0, ry: 0, rz: 0 };
        this.starDropCooldown = 1.0;
        this._eKeyLocked = false;

        const isSeedEquipped = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed');
        const maxCapacity = (typeof getMaxLifeFlowers === 'function') ? getMaxLifeFlowers() : ((permUpgrades && permUpgrades.seedLifeLvl) || 1);
        this.maxLifeFlowers = Math.max(1, Math.min(3, maxCapacity));

        if (isNewRun || !isSeedEquipped) {
            // Yalnız yeni oyunda tam bərpa olunur
            this.lifeFlowers = isSeedEquipped ? this.maxLifeFlowers : 0;
            this.hasLifeFlower = this.lifeFlowers > 0;
            this.lifeFlowerState = this.hasLifeFlower ? 'active' : 'none';
            this.lifeFlowerWitherAge = 0;
            this.lifeFlowerTrail = [];
            this.lifeFlowerBudget = 0;
            if (typeof SeedSpawnEffect !== 'undefined' && typeof SeedSpawnEffect.resetLifeFlower === 'function') {
                SeedSpawnEffect.resetLifeFlower();
            }
        } else {
            // Qat keçidində mövcud can statusu QALICIDIR (qorunur):
            // Əgər can bitibsə və ya solub yox olubsa, qat keçəndə geri qayıtmır!
            this.hasLifeFlower = ((this.lifeFlowers || 0) > 0);
            if (!this.hasLifeFlower && this.lifeFlowerState !== 'withering') {
                this.lifeFlowerState = 'removed';
            }
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

        // Sürət = Qalıcı Baza Sürət + Oyundaxili Əlavə
        let currentSpeed = getBaseSpeed() + gameState.inGameSpeedLvl * 0.5;

        // ⚡ Kvant Qığılcımı (Spark) Dərisi Bonusu: +10% Hərəkət Sürəti
        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'spark') {
            currentSpeed *= 1.10;
        }

        // Ay Qravitasiyası anomaliyası zamanı süzülən sürət
        if (typeof gameState !== 'undefined' && gameState.activeModifier === 'gravity') {
            currentSpeed *= 1.25;
        }

        let dx = 0, dy = 0;

        const isWallA = keybinds.wall === 'a';
        const isMoveLeft = keys['arrowleft'] || keys['touch_left'] || (keys['a'] && !isWallA);

        if (keys['w'] || keys['arrowup'] || keys['touch_up']) dy = -currentSpeed;
        if (keys['s'] || keys['arrowdown'] || keys['touch_down']) dy = currentSpeed;
        if (isMoveLeft) dx = -currentSpeed;
        if (keys['d'] || keys['arrowright'] || keys['touch_right']) dx = currentSpeed;

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
            this.dustBudget = (this.dustBudget || 0) + dt * (16 + speedRatio * 32 + beat * 22);
            while (this.dustBudget >= 1) {
                this.dustBudget--;
                for (const side of [-1, 1]) {
                    const pos = getIngameWingDustPoint(side, this);
                    const life = 0.7 + Math.random() * 0.6;
                    this.draculaDust.push({
                        x: pos.x,
                        y: pos.y,
                        vx: side * (3 + Math.random() * 6) + this.vx * 0.25,
                        vy: 12 + Math.random() * 16 + this.vy * 0.15,
                        life,
                        maxLife: life,
                        size: 0.7 + Math.random() * 1.5,
                        angle: Math.random() * 6.28,
                        spin: (Math.random() - 0.5) * 2,
                        star: Math.random() < 0.22,
                        color: ['#ffe5b4', '#d8bdff', '#c3f3ef'][Math.floor(Math.random() * 3)]
                    });
                }
            }
            if (this.draculaDust.length > 150) this.draculaDust.splice(0, this.draculaDust.length - 150);
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

            // Hərəkət zamanı tematik parıltı hissəcikləri
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

    // 🛡️ QALXANIN BƏRPASI (YENİDƏN 10 DEFANS)
    restoreShield() {
        this.hasShield = true;
        this.shieldDefense = this.maxShieldDefense; // 10 defans
    }

    // 🛡️ QALXANIN DEFANS ALMASI VƏ ZƏRBƏNİ UDMAQ (Lava: -3, Meteor: -5, Canavar: -10)
    damageShield(amount = 1, source = 'generic') {
        if (!this.hasShield) return false;

        this.shieldDefense = Math.max(0, (this.shieldDefense !== undefined ? this.shieldDefense : 10) - amount);

        // Zərbə hissəcikləri
        if (typeof particles !== 'undefined') {
            const pCount = Math.min(18, amount * 3);
            for (let i = 0; i < pCount; i++) {
                particles.push(new Particle(this.x, this.y, '#00f0ff', 3.2));
            }
        }

        // Qısa toxunulmazlıq (i-frame) veririk ki, ardıcıl kadrlarda zərər dərhal təkrar olunmasın
        if (typeof gameState !== 'undefined') {
            gameState.dashInvulnerable = Math.max(gameState.dashInvulnerable || 0, 36); // ~0.6 saniyə toxunulmazlıq
        }

        if (this.shieldDefense <= 0) {
            // Defans tükəndi - Qalxan sınır!
            this.breakShield();
            return false; // Qalxan qırıldı
        } else {
            // Defans azaldı, qalxan hələ sağdır!
            if (typeof audio !== 'undefined') {
                if (typeof audio.playShieldBlock === 'function') {
                    audio.playShieldBlock();
                } else if (typeof audio.playExplosion === 'function') {
                    audio.playExplosion();
                }
            }
            return true; // Qalxan hələ aktivdir
        }
    }

    // 🛡️ QALXANIN SINMASI VƏ OYUNÇUNUN XİLAS OLUNMASI
    breakShield() {
        this.hasShield = false;
        this.shieldDefense = 0;
        let invulnDuration = 75; // 1.25 saniyəlik baza toxunulmazlıq

        // 🛡️ Titan Zirehli (Aegis) Dərisi Bonusu: +1.5s (90 kadr) əlavə toxunulmazlıq
        if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin === 'aegis') {
            invulnDuration = 140;
        }

        if (typeof gameState !== 'undefined') {
            gameState.dashInvulnerable = invulnDuration;
        }
        this.y = Math.max(70, this.y - 160); // Təhlükəsiz zonaya fırladır
        
        if (typeof audio !== 'undefined' && audio.playShieldBreak) {
            audio.playShieldBreak();
        }
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(this.x, this.y, Math.random() < 0.5 ? '#00f0ff' : '#ffffff', 4));
            }
        }
        if (typeof showToast === 'function') {
            showToast('🛡️ ENERJİ QALXANI SİZİ LAVADAN XİLAS ETDİ!', 'success');
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
        this.y = Math.max(70, this.y - 170); // Təhlükəsiz zonaya fırladır

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
        this.y = Math.max(65, this.y - 190);
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
        this.trail.forEach((t, i) => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * (i / this.trail.length) * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = `${this.trailColor || 'rgba(0, 255, 204,'}${t.alpha * 0.25})`;
            ctx.fill();
        });

        // Xarici Geniş Radial Neon Aura
        ctx.save();
        ctx.shadowBlur = gameState.dashInvulnerable > 0 ? 30 : 20;
        ctx.shadowColor = gameState.dashInvulnerable > 0 ? '#ffffff' : (this.glowColor || '#00ffcc');
        
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.0);
        grad.addColorStop(0, gameState.dashInvulnerable > 0 ? 'rgba(255, 255, 255, 0.4)' : `${this.trailColor || 'rgba(0, 255, 204,'} 0.25)`);
        grad.addColorStop(1, `${this.trailColor || 'rgba(0, 255, 204,'} 0)`);
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
                ctx.shadowBlur = p.petal ? 0 : 6;
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

            ctx.shadowBlur = glowPulse;
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
            ctx.shadowBlur = 18;
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
                ctx.shadowBlur = 12;
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

            // 4. Qalxan Defans İndikatoru (10 xanalı neon müdafiə barı)
            const curDef = Math.max(0, this.shieldDefense !== undefined ? this.shieldDefense : 10);
            const barW = 44;
            const barH = 5;
            const barX = this.x - barW / 2;
            const barY = this.y - shieldRad - 14;

            // Arxa fon
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
            ctx.fill();
            ctx.stroke();

            // 10 Seqmentli Defans Hücrələri
            const segW = (barW - 9) / 10;
            for (let d = 0; d < 10; d++) {
                const segX = barX + d * (segW + 1);
                if (d < curDef) {
                    ctx.fillStyle = curDef > 5 ? '#00f0ff' : (curDef > 3 ? '#facc15' : '#f97316');
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 6;
                } else {
                    ctx.fillStyle = 'rgba(51, 65, 85, 0.5)';
                    ctx.shadowBlur = 0;
                }
                ctx.beginPath();
                ctx.roundRect(segX, barY, segW, barH, 1.5);
                ctx.fill();
            }

            ctx.restore();
        }
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
