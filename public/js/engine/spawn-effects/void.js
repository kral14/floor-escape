// ============================================================================
// 🔮 DOĞULUŞ ANİMASİYASI: VOID SİNQULYARLIĞI (COSMIC ABYSS)
// Məkanı əyən spiral qara dəlik burulğanı və kosmik materiya cazibə şüası
// ============================================================================

const VoidSpawnEffect = {
    id: 'void',
    name: 'Void Sinqulyarlığı',
    title: 'Cosmic Abyss',
    icon: 'fa-circle-dot',
    color: '#c084fc',
    glowColor: '#e879f9',
    badge: '🔮 Fəza Burulğanı',
    desc: 'Qara dəliyin fırlanan cazibə burulğanı, kosmik bənövşəyi materiya dalğaları və sinqulyarlıq partlayışı.',
    costType: 'redDiamonds',
    cost: 20,

    drawFX(c, t, S, skinColor, glowColor, mode = 'in') {
        const abyss = (mode === 'out') ? S(0, 2.5, t) : S(0.3, 1.5, t);
        const vortexSpin = t * 4.5;
        const fade = (mode === 'out') ? 1 : (1 - S(3.5, 4.6, t));

        // Kosmik qara dəlik burulğanı (spiral dumanlıq)
        c.save();
        c.scale(1, 0.32);
        const pool = c.createRadialGradient(0, 0, 0, 0, 0, 160);
        pool.addColorStop(0, '#581c87');
        pool.addColorStop(0.5, '#1e1b4b');
        pool.addColorStop(1, 'transparent');
        c.fillStyle = pool;
        c.globalAlpha = Math.min(1, abyss * fade * 0.9 + 0.1);
        c.fillRect(-160, -160, 320, 320);

        // Fırlanan spiral qollar
        c.rotate(vortexSpin);
        c.strokeStyle = '#c084fc';
        c.lineWidth = 2.2;
        c.shadowBlur = 0;
        c.shadowColor = '#e879f9';
        for (let arm = 0; arm < 3; arm++) {
            c.save();
            c.rotate((arm * Math.PI * 2) / 3);
            c.beginPath();
            for (let r = 10; r < 140 * abyss; r += 6) {
                const theta = r * 0.06;
                const px = Math.cos(theta) * r;
                const py = Math.sin(theta) * r;
                r === 10 ? c.moveTo(px, py) : c.lineTo(px, py);
            }
            c.stroke();
            c.restore();
        }
        c.restore();

        // Mərkəzi qaranlıq materiya şüası
        const beam = (mode === 'out') ? S(0.5, 3.5, t) : (S(0.9, 1.8, t) * fade);
        if (beam > 0.05) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = Math.min(1, beam * 0.75);
            const bg = c.createLinearGradient(0, 0, 0, -200);
            bg.addColorStop(0, '#e879f9');
            bg.addColorStop(0.5, '#7e22ce');
            bg.addColorStop(1, 'transparent');
            c.fillStyle = bg;
            c.beginPath();
            c.moveTo(-28, 0);
            c.lineTo(28, 0);
            c.lineTo(12, -200);
            c.lineTo(-12, -200);
            c.closePath();
            c.fill();
            c.restore();
        }
    }
};

window.VoidSpawnEffect = VoidSpawnEffect;
