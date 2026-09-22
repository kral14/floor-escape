// ============================================================================
// 🛡️ DƏRİ: TİTAN ZİREHLİ (AEGIS)
// Ağır altıbucaqlı mecha zireh və ətrafında fırlanan ikili mühafizə sipərləri
// ============================================================================

(function() {
    const config = {
        name: 'Titan Zirehli',
        title: 'Titan Aegis',
        icon: 'fa-shield-halved',
        color: '#38bdf8',
        trailColor: 'rgba(56, 189, 248,',
        glowColor: '#38bdf8',
        badge: '🛡️ +1.5s Zireh Qoruması',
        perk: 'Qalxan qırıldıqda və dash zamanı toxunulmazlıq vaxtını 1.5 saniyə uzadır.',
        desc: 'Polad-mavi enerji aurası və dayanıqlı kiber-qoruyucu.',
        costType: 'redDiamonds',
        cost: 15
    };

    function render(c, r, skin, facing = 0, time = 0, isInvuln = false) {
        const baseColor = isInvuln ? '#ffffff' : (skin.color || '#38bdf8');
        const glow = isInvuln ? '#ffffff' : (skin.glowColor || '#38bdf8');

        // 1. Ətrafında Fırlanan İkili Mühafizə Sipəri (Deflector Orbitals)
        const shieldOrbTime = time * 2.5;
        for (let i = 0; i < 2; i++) {
            const shAngle = shieldOrbTime + i * Math.PI;
            const shDist = r * 1.65;
            const sx = Math.cos(shAngle) * shDist;
            const sy = Math.sin(shAngle) * shDist;
            c.save();
            c.translate(sx, sy);
            c.rotate(shAngle + Math.PI / 2);
            c.fillStyle = '#38bdf8';
            c.shadowBlur = 0;
            c.shadowColor = '#38bdf8';
            c.beginPath();
            if (c.roundRect) c.roundRect(-r * 0.45, -2.5, r * 0.9, 5, 2);
            else c.rect(-r * 0.45, -2.5, r * 0.9, 5);
            c.fill();
            c.restore();
        }

        c.rotate(facing || 0);

        // 2. Altıbucaqlı Möhkəm Mecha Korpus (Hexagonal Armor Plate)
        c.shadowBlur = 0;
        c.shadowColor = glow;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * (r * 1.22);
            const py = Math.sin(a) * (r * 1.22);
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = '#0f172a';
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = baseColor;
        c.stroke();

        // 3. Daxili Zireh Qatı və Pərçimlər
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * (r * 0.85);
            const py = Math.sin(a) * (r * 0.85);
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = '#1e293b';
        c.fill();
        c.lineWidth = 1.5;
        c.strokeStyle = '#0284c7';
        c.stroke();

        // Künc Pərçimləri
        c.fillStyle = '#bae6fd';
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            c.beginPath();
            c.arc(Math.cos(a) * (r * 1.0), Math.sin(a) * (r * 1.0), 2.2, 0, Math.PI * 2);
            c.fill();
        }

        // 4. Mərkəzi Foton Reaktor
        c.beginPath();
        c.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        c.fillStyle = '#0284c7';
        c.shadowBlur = 0;
        c.shadowColor = '#38bdf8';
        c.fill();

        c.beginPath();
        c.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        c.fillStyle = '#ffffff';
        c.fill();
    }

    if (typeof SkinRegistry !== 'undefined') {
        SkinRegistry.register('aegis', config, render);
    }
})();
