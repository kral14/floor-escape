// ============================================================================
// ⚡ DOĞULUŞ ANİMASİYASI: KVANT İLDIRIM ZƏRBƏSİ (TESLA THUNDER)
// Göydən çaxan dinamik ziqzaq şimşəklər, zəmində plazma zərbə dalğası və elektrik qövsləri
// ============================================================================

const LightningSpawnEffect = {
    id: 'lightning',
    name: 'Kvant İldırım Zərbəsi',
    title: 'Tesla Thunder',
    icon: 'fa-bolt-lightning',
    color: '#facc15',
    glowColor: '#fef08a',
    badge: '⚡ Yüksək Gərginlik',
    desc: 'Buluddan enən parlaq ziqzaq şimşəklər, zəmində plazma partlayış halqaları və elektrik qövsləri.',
    costType: 'redDiamonds',
    cost: 10,

    drawFX(c, t, S, skinColor, glowColor, mode = 'in') {
        const strike = S(0.8, 1.4, t) * (1 - S(3.6, 4.6, t));
        const afterglow = S(1.2, 4.2, t);

        // Zəmində sarı-ağ plazma hovuzu
        c.save();
        c.scale(1, 0.25);
        const pool = c.createRadialGradient(0, 0, 0, 0, 0, 170);
        pool.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
        pool.addColorStop(0.4, 'rgba(250, 204, 21, 0.35)');
        pool.addColorStop(1, 'transparent');
        c.fillStyle = pool;
        c.globalAlpha = Math.min(1, strike + afterglow * 0.3);
        c.fillRect(-170, -170, 340, 340);
        c.restore();

        // Plazma zərbə halqaları
        const shockWave = S(1.0, 2.2, t);
        if (shockWave > 0 && shockWave < 1) {
            c.save();
            c.scale(1, 0.3);
            c.beginPath();
            c.arc(0, 0, shockWave * 160, 0, Math.PI * 2);
            c.strokeStyle = '#ffffff';
            c.lineWidth = (1 - shockWave) * 4;
            c.globalAlpha = (1 - shockWave) * 0.9;
            c.stroke();
            c.restore();
        }

        // Göydən enən dinamik ziqzaq şimşəklər (Lightning bolts)
        if (t > 0.6 && t < 3.5) {
            c.save();
            c.strokeStyle = '#ffffff';
            c.lineWidth = 3.2;
            c.shadowColor = '#facc15';
            c.shadowBlur = 20;

            for (let b = 0; b < 2; b++) {
                const seed = Math.sin(t * 22 + b * 5.1);
                c.beginPath();
                c.moveTo(b === 0 ? -12 : 12, -220);
                let cx = b === 0 ? -10 : 10;
                let cy = -220;
                for (let seg = 1; seg <= 6; seg++) {
                    const nextY = -220 + seg * 35;
                    const nextX = cx + Math.sin(seg * 3.7 + seed * 4) * 22;
                    c.lineTo(nextX, nextY);
                    cx = nextX;
                    cy = nextY;
                }
                c.lineTo(0, 0);
                c.stroke();
            }

            // Elektrik qövsləri (Tesla coils)
            c.strokeStyle = '#fef08a';
            c.lineWidth = 1.6;
            for (let a = 0; a < 3; a++) {
                const arcAngle = t * 14 + a * 2.1;
                c.beginPath();
                c.arc(0, -65, 45 + Math.sin(arcAngle) * 8, arcAngle, arcAngle + 1.2);
                c.stroke();
            }
            c.restore();
        }
    }
};

window.LightningSpawnEffect = LightningSpawnEffect;
