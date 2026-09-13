// ============================================================================
// 📜 KEÇİD KAĞIZI (ESCAPE PASS / CIPHER SCROLL) SİNİFİ
// 3-cü (və ya sonuncu) Boss məhv edildikdə arenaya düşür.
// Oyunçu toxunduqda sərhəd qapısını dərhal açır!
// ============================================================================

class EscapePass {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 300;
        this.baseY = this.y;
        this.radius = 22;
        this.t = 0;
        this.collected = false;
        this.sparkleTimer = 0;
        this.scale = 0; // Doğuluş böyüməsi
    }

    update(dt = 0.016) {
        if (this.collected) return;

        this.t += dt;
        if (this.scale < 1.0) {
            this.scale = Math.min(1.0, this.scale + dt * 3.5);
        }

        // Zərif havada süzülmə (Hovering)
        this.y = this.baseY + Math.sin(this.t * 3.2) * 9;

        // Qızılı və kiber parıltı zərrəcikləri
        this.sparkleTimer += dt;
        if (this.sparkleTimer > 0.08 && typeof particles !== 'undefined') {
            this.sparkleTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 22;
            particles.push(new Particle(
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist,
                Math.random() < 0.6 ? '#fcd34d' : '#38bdf8',
                2.5
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
            gameState.borderOpen = true;
        }

        if (typeof audio !== 'undefined' && typeof audio.playDoorOpen === 'function') {
            audio.playDoorOpen();
        } else if (typeof audio !== 'undefined' && typeof audio.playDiamond === 'function') {
            audio.playDiamond();
        }

        // Təntənəli partlayış zərrəcikləri
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 45; i++) {
                particles.push(new Particle(
                    this.x,
                    this.y,
                    ['#fcd34d', '#f59e0b', '#38bdf8', '#4ade80'][i % 4],
                    4.5
                ));
            }
        }

        if (typeof showToast === 'function') {
            showToast('📜 KEÇİD KAĞIZI ALINDI! Sərhəd qapısı açıldı, yuxarı qalxın!', 'success');
        }

        if (typeof addFloatingText === 'function') {
            addFloatingText(this.x, this.y - 30, '📜 SƏRHƏD AÇILDI!', '#fcd34d', 20);
        }

        if (typeof saveActiveRun === 'function') {
            saveActiveRun();
        }
    }

    draw(ctx) {
        if (this.collected) return;
        const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
        if (!c) return;

        c.save();
        c.translate(this.x, this.y);
        c.scale(this.scale, this.scale);

        // 1. Xarici Dairəvi Parıltı Aurası (Pulsing Glow)
        const pulse = 0.85 + Math.sin(this.t * 4.5) * 0.15;
        const auraGrad = c.createRadialGradient(0, 0, 4, 0, 0, 36 * pulse);
        auraGrad.addColorStop(0, 'rgba(252, 211, 77, 0.45)');
        auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.20)');
        auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(0, 0, 36 * pulse, 0, Math.PI * 2);
        c.fill();

        // 2. Fırlanan Kiber Sehrli Həlqə (Rotating Rune Ring)
        c.save();
        c.rotate(this.t * 1.8);
        c.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        c.lineWidth = 1.5;
        c.setLineDash([6, 5]);
        c.beginPath();
        c.arc(0, 0, 26, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // 3. Kağız / Parçament Bədəni (Scroll Body)
        c.save();
        c.rotate(Math.sin(this.t * 2.2) * 0.08); // Zərif yellənmə

        // Əsas bükülmüş kağız vərəqi
        c.fillStyle = '#fef3c7'; // Qədim parıldayan kağız
        c.strokeStyle = '#d97706';
        c.lineWidth = 2;
        c.shadowColor = '#fbbf24';
        c.shadowBlur = 15;

        // Vərəq düzbucaqlısı
        c.beginPath();
        c.roundRect(-16, -12, 32, 24, 4);
        c.fill();
        c.stroke();

        // Kağızın yuxarı və aşağı bükülən silindr kənarları (Scroll Rollers)
        c.fillStyle = '#b45309';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 1.5;

        // Yuxarı qulpu
        c.beginPath();
        c.roundRect(-19, -15, 38, 5, 2.5);
        c.fill();
        c.stroke();

        // Aşağı qulpu
        c.beginPath();
        c.roundRect(-19, 10, 38, 5, 2.5);
        c.fill();
        c.stroke();

        // Kağız üzərindəki sirli kiber yazılar / cizgilər
        c.strokeStyle = '#d97706';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(-10, -5);
        c.lineTo(8, -5);
        c.moveTo(-8, -0.5);
        c.lineTo(10, -0.5);
        c.moveTo(-10, 4);
        c.lineTo(4, 4);
        c.stroke();

        // Parıldayan Mərkəzi Kiber Möhür (Cyan Seal)
        c.fillStyle = '#06b6d4';
        c.shadowColor = '#22d3ee';
        c.shadowBlur = 10;
        c.beginPath();
        c.arc(7, 4, 3, 0, Math.PI * 2);
        c.fill();

        c.restore();

        // 4. Başlıq Etiketi: "📜 KEÇİD KAĞIZI"
        c.font = '900 10px Orbitron, sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#fef08a';
        c.shadowColor = '#f59e0b';
        c.shadowBlur = 10;
        c.fillText('📜 KEÇİD KAĞIZI', 0, -23);

        c.restore();
    }
}

// Qlobal menecer
let activeEscapePass = null;

function spawnEscapePass(x, y) {
    activeEscapePass = new EscapePass(x, y);
}
window.spawnEscapePass = spawnEscapePass;

function updateEscapePass(dt) {
    if (activeEscapePass) {
        activeEscapePass.update(dt);
        if (activeEscapePass.collected) {
            activeEscapePass = null;
        }
    }
}
window.updateEscapePass = updateEscapePass;

function drawEscapePass(ctx) {
    if (activeEscapePass) {
        activeEscapePass.draw(ctx);
    }
}
window.drawEscapePass = drawEscapePass;

function clearEscapePass() {
    activeEscapePass = null;
}
window.clearEscapePass = clearEscapePass;
