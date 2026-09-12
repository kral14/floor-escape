// ============================================================================
// 🟩 DOĞULUŞ ANİMASİYASI: KİBER MATRİS ŞƏLALƏSİ (BINARY MATRIX)
// Yaşıl neon ikili kod şəlaləsi, rəqəmsal kiber tor və deşifrə lazeri
// ============================================================================

const MatrixSpawnEffect = {
    id: 'matrix',
    name: 'Kiber Matris Şəlaləsi',
    title: 'Binary Matrix',
    icon: 'fa-code',
    color: '#22c55e',
    glowColor: '#4ade80',
    badge: '🟩 Rəqəmsal Kod',
    desc: 'Yuxarıdan axan neon yaşıl ikili kod yağışı, rəqəmsal kiber tor və personajın deşifrələnməsi.',
    costType: 'redDiamonds',
    cost: 12,

    drawFX(c, t, S, skinColor, glowColor, mode = 'in') {
        const stream = (mode === 'out') ? S(0, 2.5, t) : S(0.3, 1.4, t);
        const fade = (mode === 'out') ? 1 : (1 - S(3.5, 4.6, t));

        // Zəmində kiber neon yaşıl şəbəkə
        c.save();
        c.scale(1, 0.28);
        const pool = c.createRadialGradient(0, 0, 0, 0, 0, 160);
        pool.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
        pool.addColorStop(0.5, 'rgba(21, 128, 61, 0.25)');
        pool.addColorStop(1, 'transparent');
        c.fillStyle = pool;
        c.globalAlpha = Math.min(1, stream * fade + 0.1);
        c.fillRect(-160, -160, 320, 320);

        // Rəqəmsal tor xətləri (Grid mesh)
        c.strokeStyle = 'rgba(74, 222, 128, 0.4)';
        c.lineWidth = 1.2;
        for (let g = -120; g <= 120; g += 30) {
            c.beginPath();
            c.moveTo(g, -120); c.lineTo(g, 120);
            c.moveTo(-120, g); c.lineTo(120, g);
            c.stroke();
        }
        c.restore();

        // Yuxarıdan axan neon ikili kod sütunları (Binary raindrops)
        c.save();
        c.font = 'bold 11px monospace';
        c.fillStyle = '#4ade80';
        c.shadowBlur = 10;
        c.shadowColor = '#22c55e';
        c.globalAlpha = Math.min(1, stream * fade + 0.2);

        const cols = [-50, -32, -16, 0, 16, 32, 50];
        cols.forEach((cx, idx) => {
            const seed = (t * 8 + idx * 3.4) % 12;
            for (let row = 0; row < 7; row++) {
                const cy = -200 + ((seed * 18 + row * 24) % 210);
                const char = (Math.sin(idx * 7 + row * 11 + t * 4) > 0) ? '1' : '0';
                c.fillText(char, cx, cy);
            }
        });
        c.restore();
    }
};

window.MatrixSpawnEffect = MatrixSpawnEffect;
