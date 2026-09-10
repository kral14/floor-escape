// OYUNÇU VƏ HİSSƏCİK (PARTICLE) SİNİFLƏRİ

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 14;
        this.speed = getBaseSpeed(); // Qalıcı laboratoriyadan başlayır
        this.color = '#00ffcc';
        this.trail = [];
        this.facing = Math.PI / 2;
        this.canPassBorder = false;
    }

    reset() {
        this.x = canvasWidth / 2;
        this.y = 120;
        this.speed = getBaseSpeed();
        this.trail = [];
        this.facing = Math.PI / 2;
        this.canPassBorder = false;
    }

    update(keys) {
        if (gameState.transitioning) return;
        // Sürət = Qalıcı Baza Sürət + Oyundaxili Əlavə
        const currentSpeed = getBaseSpeed() + gameState.inGameSpeedLvl * 0.5;
        let dx = 0, dy = 0;

        const isWallA = keybinds.wall === 'a';
        const isMoveLeft = keys['arrowleft'] || keys['touch_left'] || (keys['a'] && !isWallA);

        if (keys['w'] || keys['arrowup'] || keys['touch_up']) dy = -currentSpeed;
        if (keys['s'] || keys['arrowdown'] || keys['touch_down']) dy = currentSpeed;
        if (isMoveLeft) dx = -currentSpeed;
        if (keys['d'] || keys['arrowright'] || keys['touch_right']) dx = currentSpeed;

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

    dash() {
        if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
        if (gameState.dashCooldown <= 0) {
            gameState.dashCooldown = gameState.dashMaxCooldown;
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
            ctx.fillStyle = `rgba(0, 255, 204, ${t.alpha * 0.25})`;
            ctx.fill();
        });

        ctx.save();
        ctx.shadowBlur = gameState.dashInvulnerable > 0 ? 30 : 20;
        ctx.shadowColor = gameState.dashInvulnerable > 0 ? '#ffffff' : '#00ffcc';
        
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.8);
        grad.addColorStop(0, gameState.dashInvulnerable > 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 255, 204, 0.2)');
        grad.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gameState.dashInvulnerable > 0 ? '#ffffff' : this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 4, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();

        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.facing);
        ctx.beginPath();
        ctx.moveTo(this.radius + 7, 0);
        ctx.lineTo(this.radius - 2, -4);
        ctx.lineTo(this.radius - 2, 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 204, 0.75)';
        ctx.fill();
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
