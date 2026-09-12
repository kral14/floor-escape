// DAŞBORD CANLI OYUN PREVIEW ANİMASİYASI (REAL OYUN SİMULYASİYASI)

let previewAnimId = null;
let previewState = {
    player: { x: 320, y: 110, vx: 1.8, vy: 0.6, radius: 12, facing: Math.PI / 2, trail: [], dashTimer: 0, shootTimer: 0 },
    lavaY: 225,
    lavaSpeed: 0.16,
    lavaWave: 0,
    lavaIceTimer: 0,
    lavaShockTimer: 0,
    lavaWallTimer: 0,
    borderOpen: false,
    scoreProgress: 0,
    scoreReq: 5,
    bullets: [],
    coins: [],
    particles: [],
    turretShootTimer: 0
};

function initPreviewEntities(W, H) {
    previewState.player.x = W / 2;
    previewState.player.y = 90;
    previewState.lavaY = H - 35;
    previewState.borderOpen = false;
    previewState.scoreProgress = 0;
    previewState.bullets = [];
    previewState.particles = [];

    // Sikkələr
    previewState.coins = [];
    for (let i = 0; i < 7; i++) {
        previewState.coins.push({
            x: 50 + Math.random() * (W - 100),
            y: 55 + Math.random() * (H - 120),
            collected: false
        });
    }
}

function startDashboardPreviewAnimation() {
    if (previewAnimId) cancelAnimationFrame(previewAnimId);

    const canvas = document.getElementById('dash-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    initPreviewEntities(W, H);

    function renderLoop() {
        const isActive = typeof isDashboardActive !== 'undefined' ? isDashboardActive : true;
        const curPage = typeof currentNavPage !== 'undefined' ? currentNavPage : 'home';

        if (!isActive || curPage !== 'home') {
            previewAnimId = null;
            return;
        }

        // 1. MEYDAN FONU (Real oyundakı kiber grid)
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Mərkəzi Qat Nişanı (Şəffaf Orbitron rəqəmi)
        const currentFloorNum = (typeof gameState !== 'undefined' && gameState.bestFloor) ? gameState.bestFloor : 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.font = 'bold 90px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentFloorNum, W / 2, H / 2 + 5);

        // 2. YUXARI SƏRHƏD QAPISI (BORDER LINE)
        const borderY = 32;
        ctx.save();
        if (previewState.borderOpen) {
            ctx.strokeStyle = '#00ff66';
            ctx.shadowColor = '#00ff66';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(15, borderY);
            ctx.lineTo(W - 15, borderY);
            ctx.stroke();

            ctx.fillStyle = '#00ff66';
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('🚪 SƏRHƏD AÇIQDIR! NÖVBƏTİ QATA KEÇ!', W / 2, borderY - 8);
        } else {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(15, borderY);
            ctx.lineTo(W - 15, borderY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 9px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`🔒 SƏRHƏD [${previewState.scoreProgress}/${previewState.scoreReq} TƏLƏB]`, W / 2, borderY - 8);
        }
        ctx.restore();

        // 2.1 ŞAQUİLİ DİVAR XƏTLƏRİ
        ctx.save();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(18, H);
        ctx.moveTo(W - 18, 0); ctx.lineTo(W - 18, H);
        ctx.stroke();
        ctx.restore();

        // 3. ƏKİZ AVTOMATİK QÜLLƏLƏR
        if (!previewState.turretCooldown) previewState.turretCooldown = 5.0;
        if (previewState.turretRecoilLeft === undefined) previewState.turretRecoilLeft = 0;
        if (previewState.turretRecoilRight === undefined) previewState.turretRecoilRight = 0;

        previewState.turretCooldown -= 0.016;
        if (previewState.turretRecoilLeft > 0.1) previewState.turretRecoilLeft *= 0.85;
        if (previewState.turretRecoilRight > 0.1) previewState.turretRecoilRight *= 0.85;

        const turretY = 100;
        const turretLeftColor = '#00ffcc';
        const turretRightColor = '#00ffcc';

        if (previewState.turretCooldown <= 0) {
            previewState.turretCooldown = 5.0;
            previewState.turretRecoilLeft = 6;
            previewState.turretRecoilRight = 6;

            const angleL = Math.PI * 0.38;
            previewState.bullets.push({
                x: 18 + Math.cos(angleL) * 16,
                y: turretY + Math.sin(angleL) * 16,
                vx: Math.cos(angleL) * 4.5,
                vy: Math.sin(angleL) * 4.5,
                type: 'ice',
                color: '#00ffff'
            });

            const angleR = Math.PI * 0.62;
            previewState.bullets.push({
                x: (W - 18) + Math.cos(angleR) * 16,
                y: turretY + Math.sin(angleR) * 16,
                vx: Math.cos(angleR) * 4.5,
                vy: Math.sin(angleR) * 4.5,
                type: 'shock',
                color: '#c084fc'
            });
        }

        function drawDashTurretUnit(tx, ty, dir, recoil, activeColor, cdText) {
            ctx.save();
            ctx.translate(tx, ty);

            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(dir === 1 ? -18 : -6, -24, 24, 48, 6);
            } else {
                ctx.rect(dir === 1 ? -18 : -6, -24, 24, 48);
            }
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 12;
            ctx.shadowColor = activeColor;
            ctx.fillStyle = activeColor;
            ctx.beginPath();
            ctx.arc(dir === 1 ? -2 : 2, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.save();
            ctx.translate(dir === 1 ? 4 : -4, 0);
            const angle = dir === 1 ? Math.PI * 0.38 : Math.PI * 0.62;
            ctx.rotate(angle);

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-4 - recoil, -3.5, 18, 7, 2);
            } else {
                ctx.rect(-4 - recoil, -3.5, 18, 7);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = activeColor;
            ctx.fillRect(12 - recoil, -4.5, 3, 9);
            ctx.restore();

            ctx.font = 'bold 9px Orbitron';
            ctx.fillStyle = activeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(cdText, dir === 1 ? 12 : -12, -26);

            ctx.restore();
        }

        const cdStr = `${Math.max(0, previewState.turretCooldown).toFixed(1)}s`;
        drawDashTurretUnit(18, turretY, 1, previewState.turretRecoilLeft, turretLeftColor, cdStr);
        drawDashTurretUnit(W - 18, turretY, -1, previewState.turretRecoilRight, turretRightColor, cdStr);

        // 4. SİKKƏLƏR
        const coinTime = Date.now() * 0.005;
        previewState.coins.forEach(c => {
            if (c.collected) return;
            const coinScale = Math.cos(coinTime + c.x * 0.03);
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(Math.abs(coinScale) < 0.2 ? 0.2 : coinScale, 1);
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        });

        // 5. OYUNÇU HƏRƏKƏTİ VƏ FİZİKASI
        const pl = previewState.player;
        pl.x += pl.vx;
        pl.y += pl.vy;

        if (pl.x < 36) { pl.x = 36; pl.vx = Math.abs(pl.vx); }
        if (pl.x > W - 36) { pl.x = W - 36; pl.vx = -Math.abs(pl.vx); }
        if (pl.y < (previewState.borderOpen ? 15 : borderY + pl.radius + 4)) {
            pl.y = previewState.borderOpen ? 15 : borderY + pl.radius + 4;
            pl.vy = Math.abs(pl.vy);
            if (previewState.borderOpen) {
                initPreviewEntities(W, H);
            }
        }
        if (pl.y > previewState.lavaY - 35) {
            pl.y = previewState.lavaY - 35;
            pl.vy = -Math.abs(pl.vy);
        }

        pl.trail.push({ x: pl.x, y: pl.y, alpha: 0.6 });
        if (pl.trail.length > 8) pl.trail.shift();

        previewState.coins.forEach(c => {
            if (c.collected) return;
            const dist = Math.hypot(pl.x - c.x, pl.y - c.y);
            if (dist < 55) {
                c.x += (pl.x - c.x) * 0.15;
                c.y += (pl.y - c.y) * 0.15;
            }
            if (dist < pl.radius + 6) {
                c.collected = true;
                for (let i = 0; i < 4; i++) {
                    previewState.particles.push({
                        x: c.x, y: c.y,
                        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                        color: '#fbbf24', life: 1, decay: 0.03
                    });
                }
            }
        });

        pl.dashTimer++;
        if (pl.dashTimer > 180) {
            pl.dashTimer = 0;
            pl.x += (pl.vx > 0 ? 1 : -1) * 35;
            for (let i = 0; i < 10; i++) {
                previewState.particles.push({
                    x: pl.x, y: pl.y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    color: '#00ffff', life: 1, decay: 0.04
                });
            }
        }

        pl.shootTimer++;
        if (pl.shootTimer > 60) {
            pl.shootTimer = 0;
            const types = ['ice', 'shock', 'wall', 'mine'];
            const chosenType = types[Math.floor(Math.random() * types.length)];
            const colors = { ice: '#38bdf8', shock: '#c084fc', wall: '#f59e0b', mine: '#f43f5e' };

            previewState.bullets.push({
                x: pl.x,
                y: pl.y + pl.radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 4.8,
                type: chosenType,
                color: colors[chosenType]
            });
        }

        pl.trail.forEach((t, i) => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, pl.radius * (i / pl.trail.length) * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 204, ${t.alpha * 0.25})`;
            ctx.fill();
        });

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';

        const grad = ctx.createRadialGradient(pl.x, pl.y, 0, pl.x, pl.y, pl.radius * 1.8);
        grad.addColorStop(0, 'rgba(0, 255, 204, 0.2)');
        grad.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pl.x - 3.5, pl.y - 4, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fill();

        ctx.restore();

        ctx.save();
        ctx.translate(pl.x, pl.y);
        const facingAngle = Math.atan2(pl.vy, pl.vx) || (Math.PI / 2);
        ctx.rotate(facingAngle);
        ctx.beginPath();
        ctx.moveTo(pl.radius + 7, 0);
        ctx.lineTo(pl.radius - 2, -4);
        ctx.lineTo(pl.radius - 2, 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 204, 0.85)';
        ctx.fill();
        ctx.restore();

        // 6. MƏRMİLƏR
        for (let i = previewState.bullets.length - 1; i >= 0; i--) {
            const b = previewState.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (b.y >= previewState.lavaY - 8) {
                previewState.scoreProgress++;
                if (previewState.scoreProgress >= previewState.scoreReq) {
                    previewState.borderOpen = true;
                }

                if (b.type === 'ice') {
                    previewState.lavaIceTimer = 80;
                } else if (b.type === 'shock') {
                    previewState.lavaShockTimer = 90;
                } else if (b.type === 'wall') {
                    previewState.lavaWallTimer = 100;
                } else if (b.type === 'mine') {
                    previewState.lavaY = Math.min(H - 20, previewState.lavaY + 16);
                }

                for (let p = 0; p < 8; p++) {
                    previewState.particles.push({
                        x: b.x, y: previewState.lavaY,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 3 - 0.5,
                        color: b.color,
                        life: 1,
                        decay: 0.035
                    });
                }
                previewState.bullets.splice(i, 1);
            }
        }

        // 7. QALXAN LAVA
        if (previewState.lavaWallTimer > 0) previewState.lavaWallTimer--;
        if (previewState.lavaShockTimer > 0) previewState.lavaShockTimer--;
        if (previewState.lavaIceTimer > 0) previewState.lavaIceTimer--;

        if (previewState.lavaWallTimer === 0 && previewState.lavaShockTimer === 0) {
            const currentLavaSpeed = previewState.lavaIceTimer > 0 ? previewState.lavaSpeed * 0.25 : previewState.lavaSpeed;
            previewState.lavaY -= currentLavaSpeed;
            if (previewState.lavaY < 130) {
                previewState.lavaY = H - 35;
            }
        }

        previewState.lavaWave += 0.04;
        const shockShakeX = previewState.lavaShockTimer > 0 ? (Math.random() - 0.5) * 4 : 0;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, previewState.lavaY);

        for (let x = 0; x <= W; x += 16) {
            const wave = Math.sin(x * 0.04 + previewState.lavaWave) * 5;
            ctx.lineTo(x + shockShakeX, previewState.lavaY + wave);
        }
        ctx.lineTo(W, H);
        ctx.closePath();

        let lavaColorTop = '#f97316';
        let lavaColorMid = '#ef4444';
        if (previewState.lavaIceTimer > 0) {
            lavaColorTop = '#38bdf8';
            lavaColorMid = '#0284c7';
        } else if (previewState.lavaShockTimer > 0) {
            lavaColorTop = '#c084fc';
            lavaColorMid = '#7e22ce';
        }

        const lavaGrad = ctx.createLinearGradient(0, previewState.lavaY - 10, 0, H);
        lavaGrad.addColorStop(0, lavaColorTop);
        lavaGrad.addColorStop(0.4, lavaColorMid);
        lavaGrad.addColorStop(1, '#450a0a');
        ctx.fillStyle = lavaGrad;
        ctx.shadowColor = lavaColorTop;
        ctx.shadowBlur = 18;
        ctx.fill();

        ctx.strokeStyle = previewState.lavaIceTimer > 0 ? '#bae6fd' : '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (previewState.lavaWallTimer > 0) {
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.fillRect(15, previewState.lavaY - 6, W - 30, 6);
        }

        ctx.fillStyle = previewState.lavaIceTimer > 0 ? '#e0f2fe' : '#fef08a';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(W / 2 - 35, previewState.lavaY + 22, 9, 6, -0.2, 0, Math.PI * 2);
        ctx.ellipse(W / 2 + 35, previewState.lavaY + 22, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(W / 2 - 35, previewState.lavaY + 22, 3.5, 0, Math.PI * 2);
        ctx.arc(W / 2 + 35, previewState.lavaY + 22, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 8. HİSSƏCİKLƏR
        for (let i = previewState.particles.length - 1; i >= 0; i--) {
            const p = previewState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= (p.decay || 0.03);

            if (p.life <= 0) {
                previewState.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        previewAnimId = requestAnimationFrame(renderLoop);
    }

    renderLoop();
}
window.startDashboardPreviewAnimation = startDashboardPreviewAnimation;
