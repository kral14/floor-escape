// SAĞ VƏ SOL AVTOMATİK ƏKİZ QÜLLƏLƏR (TWIN TURRETS) SİNİFİ

const TURRET_PRICES = {
    wall: 30,
    ice: 50,
    shock: 90,
    mine: 140,
    plasma: 190,
    none: 0
};

class TwinTurrets {
    constructor() {
        this.leftX = 18;
        this.rightX = 782; // canvasWidth = 800 olduqda
        this.y = 175;
        this.cooldown = 0;
        this.recoilLeft = 0;
        this.recoilRight = 0;
        this.glowPhase = 0;
    }

    reset() {
        const interval = typeof getTurretInterval === 'function' ? getTurretInterval() : (permUpgrades.turretInterval || 7.0);
        this.cooldown = interval;
        this.recoilLeft = 0;
        this.recoilRight = 0;
    }

    update() {
        if (!permUpgrades.hasTwinTurrets || !permUpgrades.turretEnabled) return;
        if (gameState.gameOver || gameState.paused || gameState.transitioning) return;

        this.glowPhase += permUpgrades.turretAwakened ? 0.09 : 0.05;
        if (this.recoilLeft > 0) this.recoilLeft *= 0.85;
        if (this.recoilRight > 0) this.recoilRight *= 0.85;

        // Sayğacın azaldılması
        this.cooldown -= 1 / 60;

        if (this.cooldown <= 0) {
            this.fire();
            const interval = typeof getTurretInterval === 'function' ? getTurretInterval() : 7.0;
            this.cooldown = interval;
        }
    }

    fire() {
        const leftType = permUpgrades.turretLeftType || 'none';
        const rightType = permUpgrades.turretRightType || 'none';

        if (leftType === 'none' && rightType === 'none') return;

        // Hər iki qüllənin cari dəyərini yoxlayırıq
        const candidates = [];
        if (leftType !== 'none') {
            candidates.push({ side: 'left', type: leftType, cost: getBulletCost(leftType) });
        }
        if (rightType !== 'none') {
            candidates.push({ side: 'right', type: rightType, cost: getBulletCost(rightType) });
        }

        if (candidates.length === 0) return;

        // Qayda: Əvvəlcə qiyməti ən aşağı olan mərmiyə üstünlük verilir (ucuzdan bahaya sıralanır)
        candidates.sort((a, b) => a.cost - b.cost);

        const firedSides = { left: false, right: false };
        let anyFired = false;

        if (!gameState.bulletUsage) gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };

        for (const cand of candidates) {
            if (gameState.gold >= cand.cost) {
                gameState.gold -= cand.cost;
                firedSides[cand.side] = true;
                gameState.bulletUsage[cand.type] = (gameState.bulletUsage[cand.type] || 0) + 1;
                anyFired = true;
            }
        }

        // Əgər heç birinə qızıl çatmadısa:
        if (!anyFired) {
            const minCost = candidates[0].cost;
            showToast(`⚠️ Qüllələr üçün Qızıl Çatmır! (Min: ${minCost} 🪙)`, 'error');
            return;
        }

        updateUI();

        const leftX = 28;
        const rightX = canvasWidth - 28;
        const startY = this.y + 15;

        const colors = {
            wall: '#ffd700',
            ice: '#00ffff',
            shock: '#c084fc',
            mine: '#f43f5e',
            plasma: '#34d399',
            none: '#475569'
        };

        // Sol qüllə atəşi (əgər qızıl çatdısa)
        if (firedSides.left) {
            bullets.push(new Bullet(leftType, leftX, startY, 9.5, 1.2));
            this.recoilLeft = 8;
            gameState.totalTrapsPlaced++;
            for (let i = 0; i < 7; i++) {
                particles.push(new Particle(leftX, startY, colors[leftType] || '#00ffcc', 3));
            }
        }

        // Sağ qüllə atəşi (əgər qızıl çatdısa)
        if (firedSides.right) {
            bullets.push(new Bullet(rightType, rightX, startY, 9.5, -1.2));
            this.recoilRight = 8;
            gameState.totalTrapsPlaced++;
            for (let i = 0; i < 7; i++) {
                particles.push(new Particle(rightX, startY, colors[rightType] || '#00ffcc', 3));
            }
        }

        audio.playTurretShot();
        saveActiveRun();
    }

    draw() {
        if (!permUpgrades.hasTwinTurrets || !permUpgrades.turretEnabled) return;

        const leftX = 18;
        const rightX = canvasWidth - 18;
        const leftType = permUpgrades.turretLeftType || 'none';
        const rightType = permUpgrades.turretRightType || 'none';

        const colors = {
            wall: '#ffd700',
            ice: '#00ffff',
            shock: '#c084fc',
            mine: '#f43f5e',
            plasma: '#34d399',
            none: '#475569'
        };

        // Sol Qüllə
        this.drawTurretUnit(leftX, this.y, 1, this.recoilLeft, colors[leftType] || '#475569', leftType === 'none');

        // Sağ Qüllə
        this.drawTurretUnit(rightX, this.y, -1, this.recoilRight, colors[rightType] || '#475569', rightType === 'none');
    }

    drawTurretUnit(x, y, dir, recoil, activeColor, isDisabled = false) {
        ctx.save();
        if (isDisabled) ctx.globalAlpha = 0.45;
        ctx.translate(x, y);

        // Baza korpusu (divara bərkidilmiş lövhə)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = permUpgrades.turretAwakened ? '#f43f5e' : '#334155';
        ctx.lineWidth = permUpgrades.turretAwakened ? 2.5 : 2;
        ctx.beginPath();
        ctx.roundRect(dir === 1 ? -18 : -6, -24, 24, 48, 6);
        ctx.fill();
        ctx.stroke();

        // Oyanış (Awakened) Xüsusi Enerji Sahəsi
        if (permUpgrades.turretAwakened) {
            ctx.save();
            ctx.shadowBlur = 18 + Math.sin(this.glowPhase * 2) * 6;
            ctx.shadowColor = '#ff0055';
            ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(dir === 1 ? -6 : 6, 0, 20 + Math.sin(this.glowPhase * 3) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Enerji nüvəsi (seçilmiş mərmi rəngində parıltı)
        ctx.shadowBlur = (permUpgrades.turretAwakened ? 20 : 12) + Math.sin(this.glowPhase) * 4;
        ctx.shadowColor = permUpgrades.turretAwakened ? '#ff0055' : activeColor;
        ctx.fillStyle = permUpgrades.turretAwakened ? '#ff0055' : activeColor;
        ctx.beginPath();
        ctx.arc(dir === 1 ? -2 : 2, 0, permUpgrades.turretAwakened ? 6 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fırlanan/aşağı tuşlanan lülə
        ctx.save();
        ctx.translate(dir === 1 ? 4 : -4, 0);
        // Aşağı-mərkəzə doğru yönəlmə bucağı
        const angle = dir === 1 ? Math.PI * 0.38 : Math.PI * 0.62;
        ctx.rotate(angle);

        // Lülə geri təpmə (recoil)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = permUpgrades.turretAwakened ? '#ff0055' : activeColor;
        ctx.lineWidth = permUpgrades.turretAwakened ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(-4 - recoil, -3.5, 18, 7, 2);
        ctx.fill();
        ctx.stroke();

        // Lülə ucluğu
        ctx.fillStyle = permUpgrades.turretAwakened ? '#ffe4e6' : activeColor;
        ctx.fillRect(12 - recoil, -4.5, 3, 9);
        ctx.restore();

        // Taymer göstəricisi (hər iki qüllənin üstündə kiçik rəqəm)
        if (!gameState.gameOver) {
            ctx.font = 'bold 9px Orbitron';
            ctx.fillStyle = permUpgrades.turretAwakened ? '#ff0055' : activeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const badge = permUpgrades.turretAwakened ? '🔥 ' : '';
            ctx.fillText(`${badge}${Math.max(0, this.cooldown).toFixed(1)}s`, dir === 1 ? 12 : -12, -26);
        }

        ctx.restore();
    }
}

const twinTurrets = new TwinTurrets();
