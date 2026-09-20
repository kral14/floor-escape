// ============================================================================
// 🛡️ QAT QORUMA KAĞIZI (FLOOR PROTECTION SCROLL / RESURRECTION CIPHER) SİNİFİ
// Qat sonu Boss məhv edildikdə Keçid Kağızının yanında çıxma şansı var.
// Oyunçu toxunduqda toplayır: həmin qatda ölərsə, 1-ci qata qayıtmır, cari qatdan davam edir!
// ============================================================================

class FloorProtectionScroll {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 300;
        this.baseY = this.y;
        this.radius = 24;
        this.t = 0;
        this.collected = false;
        this.sparkleTimer = 0;
        this.scale = 0;
    }

    update(dt = 0.016) {
        if (this.collected) return;

        this.t += dt;
        if (this.scale < 1.0) {
            this.scale = Math.min(1.0, this.scale + dt * 3.5);
        }

        // Zərif havada süzülmə (Hovering)
        this.y = this.baseY + Math.sin(this.t * 3.5) * 10;

        // Zümrüd və yaşıl qoruyucu parıltı zərrəcikləri
        this.sparkleTimer += dt;
        if (this.sparkleTimer > 0.07 && typeof particles !== 'undefined') {
            this.sparkleTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = 16 + Math.random() * 24;
            particles.push(new Particle(
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist,
                Math.random() < 0.6 ? '#10b981' : '#34d399',
                2.6
            ));
        }

        // Oyunçu ilə toqquşma
        if (typeof player !== 'undefined' && player) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < player.radius + this.radius) {
                this.collect();
            }
        }
    }

    collect() {
        if (this.collected) return;
        this.collected = true;

        if (typeof gameState !== 'undefined') {
            gameState.floorProtection = (gameState.floorProtection || 0) + 1;
        }

        if (typeof audio !== 'undefined' && typeof audio.playDiamond === 'function') {
            audio.playDiamond();
        }

        // Zümrüd təntənəli partlayış zərrəcikləri
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(
                    this.x,
                    this.y,
                    ['#10b981', '#34d399', '#6ee7b7', '#fcd34d', '#38bdf8'][i % 5],
                    4.8
                ));
            }
        }

        if (typeof showToast === 'function') {
            showToast('🛡️ QAT QORUMA KAĞIZI ALINDI! Bu qatda ölsəniz, həmin qatdan davam edəcəksiniz!', 'success');
        }

        if (typeof addFloatingText === 'function') {
            addFloatingText(this.x, this.y - 32, '🛡️ QAT QORUMASI AKTİV!', '#34d399', 22);
        }

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveActiveRun === 'function') saveActiveRun();
    }

    draw(ctx) {
        if (this.collected) return;
        const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
        if (!c) return;

        c.save();
        c.translate(this.x, this.y);
        c.scale(this.scale, this.scale);

        // 1. Zümrüd Aura Parıltısı (Pulsing Emerald Glow)
        const pulse = 0.85 + Math.sin(this.t * 4.5) * 0.15;
        const auraGrad = c.createRadialGradient(0, 0, 4, 0, 0, 38 * pulse);
        auraGrad.addColorStop(0, 'rgba(16, 185, 129, 0.50)');
        auraGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.22)');
        auraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(0, 0, 38 * pulse, 0, Math.PI * 2);
        c.fill();

        // 2. Fırlanan Zümrüd Qoruyucu Həlqə (Rotating Shield Hexagon/Rune)
        c.save();
        c.rotate(this.t * -2.0);
        c.strokeStyle = 'rgba(52, 211, 153, 0.7)';
        c.lineWidth = 1.6;
        c.setLineDash([5, 4]);
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI / 3);
            const rx = Math.cos(a) * 28;
            const ry = Math.sin(a) * 28;
            if (i === 0) c.moveTo(rx, ry);
            else c.lineTo(rx, ry);
        }
        c.closePath();
        c.stroke();
        c.restore();

        // 3. Kağız / Parçament Bədəni (Emerald Scroll Body)
        c.save();
        c.rotate(Math.sin(this.t * 2.5) * 0.08);

        // Yaşıl-qızılı parıldayan qoruyucu kağız
        c.fillStyle = '#ecfdf5';
        c.strokeStyle = '#059669';
        c.lineWidth = 2;
        c.shadowColor = '#34d399';
        c.shadowBlur = 16;

        c.beginPath();
        c.roundRect(-16, -13, 32, 26, 4);
        c.fill();
        c.stroke();

        // Qızılı/zümrüd rulon kənarları
        c.fillStyle = '#047857';
        c.strokeStyle = '#10b981';
        c.lineWidth = 1.5;

        c.beginPath();
        c.roundRect(-19, -16, 38, 5, 2.5);
        c.fill();
        c.stroke();

        c.beginPath();
        c.roundRect(-19, 11, 38, 5, 2.5);
        c.fill();
        c.stroke();

        // Mərkəzdə Qalxan Rünü (Shield Emblem)
        c.fillStyle = '#10b981';
        c.strokeStyle = '#047857';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, -6);
        c.lineTo(7, -2);
        c.lineTo(5, 5);
        c.lineTo(0, 8);
        c.lineTo(-5, 5);
        c.lineTo(-7, -2);
        c.closePath();
        c.fill();
        c.stroke();

        // Qalxan içi parlaq zümrüd nöqtə
        c.fillStyle = '#a7f3d0';
        c.beginPath();
        c.arc(0, 1, 2, 0, Math.PI * 2);
        c.fill();

        c.restore();

        // 4. Başlıq Etiketi: "🛡️ QAT QORUMASI"
        c.font = '900 10px Orbitron, sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#6ee7b7';
        c.shadowColor = '#059669';
        c.shadowBlur = 10;
        c.fillText('🛡️ QAT QORUMASI', 0, -25);

        c.restore();
    }
}

// Qlobal menecer
let activeFloorProtection = null;

function spawnFloorProtection(x, y) {
    activeFloorProtection = new FloorProtectionScroll(x, y);
}
window.spawnFloorProtection = spawnFloorProtection;

function updateFloorProtection(dt) {
    if (activeFloorProtection) {
        activeFloorProtection.update(dt);
        if (activeFloorProtection.collected) {
            activeFloorProtection = null;
        }
    }
}
window.updateFloorProtection = updateFloorProtection;

function drawFloorProtection(ctx) {
    if (activeFloorProtection) {
        activeFloorProtection.draw(ctx);
    }
}
window.drawFloorProtection = drawFloorProtection;

function clearFloorProtection() {
    activeFloorProtection = null;
}
window.clearFloorProtection = clearFloorProtection;
