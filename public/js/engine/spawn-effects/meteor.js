// ============================================================================
// ☄️ DOĞULUŞ ANİMASİYASI: LAVA METEORU (MAGMA IMPACT)
// Odlu meteorit zərbəsi, qaynayan magma krateri və alov dalğası
// ============================================================================

const MeteorSpawnEffect = {
    id: 'meteor',
    name: 'Lava Meteoru',
    title: 'Magma Impact',
    icon: 'fa-meteor',
    color: '#ef4444',
    glowColor: '#f97316',
    badge: '☄️ Qızmar Zərbə',
    desc: 'Göydən enən odlu meteorit izi, zəmində alov dalğası və qığılcım partlayışı ilə Monsun doğuluşu.',
    costType: 'redDiamonds',
    cost: 15,

    drawFX(c, t, S, skinColor, glowColor, mode = 'in') {
        const fall = S(0.3, 1.3, t);
        const heat = S(1.2, 4.4, t) * (1 - S(3.8, 4.8, t));

        // Meteor eniş trayektoriyası
        if (t < 1.4 && mode !== 'out') {
            const meteorY = -240 + fall * 240;
            c.save();
            c.shadowBlur = 0;
            c.shadowColor = '#ef4444';

            // Odlu quyruq
            const tail = c.createLinearGradient(0, meteorY - 90, 0, meteorY);
            tail.addColorStop(0, 'transparent');
            tail.addColorStop(0.6, 'rgba(239, 68, 68, 0.6)');
            tail.addColorStop(1, '#fef08a');
            c.fillStyle = tail;
            c.beginPath();
            c.moveTo(-18, meteorY - 90);
            c.lineTo(18, meteorY - 90);
            c.lineTo(0, meteorY + 10);
            c.closePath();
            c.fill();

            // Meteorit nüvəsi
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(0, meteorY, 14, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }

        // Zərbə anında zəmində qaynayan magma krateri
        if (t >= 1.0 || mode === 'out') {
            c.save();
            c.scale(1, 0.26);
            const pool = c.createRadialGradient(0, 0, 0, 0, 0, 165);
            pool.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
            pool.addColorStop(0.4, 'rgba(239, 68, 68, 0.5)');
            pool.addColorStop(1, 'transparent');
            c.fillStyle = pool;
            c.globalAlpha = Math.min(1, heat * 0.9 + 0.2);
            c.fillRect(-165, -165, 330, 330);
            c.restore();

            // Krater qığılcım çatları
            c.save();
            c.strokeStyle = '#f97316';
            c.lineWidth = 2.4;
            c.shadowBlur = 0;
            c.shadowColor = '#ef4444';
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const dist = 50 * heat;
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(Math.cos(angle) * dist, Math.sin(angle) * (dist * 0.35));
                c.stroke();
            }
            c.restore();

            // Alov dalğası
            const wave = S(1.2, 2.5, t);
            if (wave < 1 && mode !== 'out') {
                c.save();
                c.scale(1, 0.3);
                c.beginPath();
                c.arc(0, 0, wave * 170, 0, Math.PI * 2);
                c.strokeStyle = '#ef4444';
                c.lineWidth = (1 - wave) * 5;
                c.globalAlpha = (1 - wave);
                c.stroke();
                c.restore();
            }
        }
    }
};

window.MeteorSpawnEffect = MeteorSpawnEffect;
