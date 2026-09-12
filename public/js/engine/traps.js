// TƏLƏLƏR, MƏRMİLƏR VƏ SƏRHƏD SİSTEMİ (TRAPS & PROJECTILES)

let bullets = [];

function clearBullets() {
    bullets.length = 0;
}

function fireBullet(type) {
    if (typeof gameState === 'undefined' || gameState.gameOver || gameState.paused || gameState.transitioning) return;
    if (typeof audio !== 'undefined') audio.init();

    const price = typeof getBulletCost === 'function' ? getBulletCost(type) : 30;

    if (gameState.gold >= price) {
        gameState.gold -= price;
        gameState.totalTrapsPlaced++;
        if (!gameState.bulletUsage) gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };
        gameState.bulletUsage[type] = (gameState.bulletUsage[type] || 0) + 1;

        if (typeof Bullet !== 'undefined' && typeof player !== 'undefined') {
            bullets.push(new Bullet(type, player.x, player.y + 15));
        }
        if (typeof audio !== 'undefined' && audio.playShoot) audio.playShoot();

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveActiveRun === 'function') saveActiveRun();
    } else {
        if (typeof showToast === 'function') {
            showToast(`Qızıl Çatmır! (${price} 🪙 tələb olunur)`, 'error');
        }
    }
}

function updateBullets() {
    const canvasHeight = 680;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update();

        const monsterTop = monster.surface ? monster.surface(b.x, monster.y) : monster.y;
        if (b.y >= monsterTop - 12) {
            if (monster.flash !== undefined) monster.flash = 0.1;
            if (typeof audio !== 'undefined' && audio.playImpact) audio.playImpact();
            gameState.totalTrapsDestroyed++;

            const scores = { wall: 1, ice: 2, shock: 3, mine: 4, plasma: 5 };
            const baseTrapScore = scores[b.type] || 1;
            const trapMult = gameState.combo >= 5 ? 2.0 : (gameState.combo >= 3 ? 1.5 : 1.0);
            const trapScore = Math.round(baseTrapScore * trapMult);
            gameState.scoreProgress += trapScore;
            if (typeof checkBorderUnlock === 'function') checkBorderUnlock();

            const rewards = { wall: 6, ice: 10, shock: 14, mine: 22, plasma: 32 };
            const reward = Math.round((rewards[b.type] || 6) * trapMult);
            gameState.gold += reward;
            if (typeof showGoldToast === 'function') showGoldToast(reward);

            if (b.type === 'mine') {
                if (typeof addFloatingText === 'function') addFloatingText(b.x, monster.y - 25, '💥 MONSTER CRUSH!', '#f43f5e', 16);
            } else if (b.type === 'shock') {
                if (typeof addFloatingText === 'function') addFloatingText(b.x, monster.y - 25, '⚡ SHOCK PARALYSIS!', '#c084fc', 15);
            }

            if (b.type === 'wall') {
                if (typeof audio !== 'undefined' && audio.playBarricade) audio.playBarricade();
                monster.wallTimer = Math.max(monster.wallTimer, 180);
                for (let p = 0; p < 14; p++) {
                    particles.push(new Particle(b.x + (Math.random() - 0.5) * 40, monster.y, '#f59e0b', 4));
                }
            } else if (b.type === 'ice') {
                if (typeof audio !== 'undefined' && audio.playIce) audio.playIce();
                monster.iceTimer = Math.max(monster.iceTimer, 210);
                for (let p = 0; p < 14; p++) {
                    particles.push(new Particle(b.x + (Math.random() - 0.5) * 40, monster.y, '#00ffff', 4));
                }
            } else if (b.type === 'shock') {
                if (typeof audio !== 'undefined' && audio.playShock) audio.playShock();
                monster.shockTimer = Math.max(monster.shockTimer, 240);
                for (let p = 0; p < 18; p++) {
                    particles.push(new Particle(b.x + (Math.random() - 0.5) * 50, monster.y, '#c084fc', 4.5));
                }
            } else if (b.type === 'mine') {
                if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion();
                monster.y = Math.min(canvasHeight + 40, monster.y + 35);
                monster.mineStunTimer = Math.max(monster.mineStunTimer, 80);
                for (let p = 0; p < 25; p++) {
                    particles.push(new Particle(b.x + (Math.random() - 0.5) * 60, monster.y, '#f43f5e', 5));
                }
            } else if (b.type === 'plasma') {
                if (typeof audio !== 'undefined' && audio.playPlasma) audio.playPlasma();
                monster.plasmaTimer = Math.max(monster.plasmaTimer, 300);
                for (let p = 0; p < 18; p++) {
                    particles.push(new Particle(b.x + (Math.random() - 0.5) * 50, monster.y, '#34d399', 4.5));
                }
            }

            bullets.splice(i, 1);
            if (typeof updateUI === 'function') updateUI();
            continue;
        }

        if (b.y > canvasHeight + 50) {
            bullets.splice(i, 1);
        }
    }
}

function drawBorderLine() {
    const borderY = 55;
    const canvasWidth = 800;
    const isOpen = gameState.borderOpen;

    ctx.save();
    const grad = ctx.createLinearGradient(0, borderY - 15, 0, borderY + 15);
    if (isOpen) {
        grad.addColorStop(0, 'rgba(0, 255, 100, 0)');
        grad.addColorStop(0.3, 'rgba(0, 255, 100, 0.3)');
        grad.addColorStop(0.5, 'rgba(0, 255, 100, 0.6)');
        grad.addColorStop(0.7, 'rgba(0, 255, 100, 0.3)');
        grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
    } else {
        grad.addColorStop(0, 'rgba(255, 0, 80, 0)');
        grad.addColorStop(0.5, 'rgba(255, 0, 80, 0.45)');
        grad.addColorStop(1, 'rgba(255, 0, 80, 0)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, borderY - 15, canvasWidth, 30);

    ctx.beginPath();
    ctx.moveTo(0, borderY);
    ctx.lineTo(canvasWidth, borderY);

    if (isOpen) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3.2;
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#00ff88';
        ctx.lineDashOffset = -performance.now() * 0.025;
        ctx.setLineDash([14, 8]);
    } else {
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff0055';
        ctx.lineDashOffset = 0;
        ctx.setLineDash([8, 8]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.shadowBlur = 0;

    ctx.restore();
}

window.bullets = bullets;
window.clearBullets = clearBullets;
window.fireBullet = fireBullet;
window.updateBullets = updateBullets;
window.drawBorderLine = drawBorderLine;
