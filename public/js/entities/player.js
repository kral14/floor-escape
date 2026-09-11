// OYUNÇU VƏ HİSSƏCİK (PARTICLE) SİNİFLƏRİ

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 16;
        this.speed = getBaseSpeed(); // Qalıcı laboratoriyadan başlayır
        this.color = '#00ffcc';
        this.trailColor = 'rgba(0, 255, 204,';
        this.glowColor = '#00ffcc';
        this.trail = [];
        this.facing = Math.PI / 2;
        this.canPassBorder = false;
        this.hasShield = false;
        this.shieldAngle = 0;
        this.hasHyperJump = false; // 🚀 Ehtiyat Kvant Sıçrayışı (Lava yaxınlaşdıqda avtomatik atır)
        this.stunTimer = 0;
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

    reset() {
        this.x = canvasWidth / 2;
        this.y = 120;
        this.speed = getBaseSpeed();
        this.trail = [];
        this.facing = Math.PI / 2;
        this.canPassBorder = false;
        this.hasHyperJump = false;
        this.stunTimer = 0;
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

        this.x += dx;
        this.y += dy;

        const borderY = 55;
        if (gameState.borderOpen) {
            this.canPassBorder = true;
            this.y = Math.max(10, Math.min(canvasHeight - this.radius - 10, this.y));
        } else {
            this.canPassBorder = false;
            this.y = Math.max(borderY + this.radius + 5, Math.min(canvasHeight - this.radius - 10, this.y));
        }
        this.x = Math.max(this.radius + 10, Math.min(canvasWidth - this.radius - 10, this.x));

        this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
        if (this.trail.length > 12) this.trail.shift();
    }

    // 🛡️ QALXANIN SINMASI VƏ OYUNÇUNUN XİLAS OLUNMASI
    breakShield() {
        this.hasShield = false;
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
            const minY = gameState.borderOpen ? 10 : borderY + this.radius + 5;
            this.y = Math.max(minY, Math.min(canvasHeight - this.radius - 10, this.y));
            this.x = Math.max(this.radius + 10, Math.min(canvasWidth - this.radius - 10, this.x));

            audio.playDash();
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(this.x, this.y, '#00ffff', 4));
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

        // Xüsusi Kiber Dəri Modeli (Ninja Vizor, Elektrik Spikelər, Mecha Lövhələr, Alov Buynuzları, Kiber Tac)
        const skinId = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
        const animTime = performance.now() * 0.003;
        if (typeof drawSkinModel === 'function') {
            drawSkinModel(ctx, this.x, this.y, this.radius, skinId, this.facing, animTime, gameState.dashInvulnerable > 0);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gameState.dashInvulnerable > 0 ? '#ffffff' : this.color;
            ctx.fill();
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

            // DİQQƏT: Daxili ctx.fill() TAMAMİLƏ LƏĞV EDİLDİ! Kostyumun üzəri 100% təmiz qalır!
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
