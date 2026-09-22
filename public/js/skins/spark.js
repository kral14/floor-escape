// ============================================================================
// ⚡ DƏRİ: KVANT QIĞILCIMI (SPARK)
// Elektrik plazma ulduzu, 4 itiuclu generator spaykı və canlı şimşək qövsləri
// ============================================================================

(function() {
    const config = {
        name: 'Kvant Qığılcımı',
        title: 'Quantum Spark',
        icon: 'fa-bolt',
        color: '#facc15',
        trailColor: 'rgba(250, 204, 21,',
        glowColor: '#facc15',
        badge: '⚡ +10% Hərəkət Sürəti',
        perk: 'Bütün qatlarda daimi +10% hərəkət sürəti təmin edir.',
        desc: 'Yüksək gərginlikli cəldlik və ildırım parıltısı.',
        costType: 'redDiamonds',
        cost: 10
    };

    function render(c, r, skin, facing = 0, time = 0, isInvuln = false) {
        const baseColor = isInvuln ? '#ffffff' : (skin.color || '#facc15');
        const glow = isInvuln ? '#ffffff' : (skin.glowColor || '#facc15');

        c.rotate(facing || 0);

        // 1. Canlı Şimşək Qövsləri (Elektrik Cərəyanları)
        c.save();
        c.strokeStyle = '#fef08a';
        c.lineWidth = 1.5;
        c.shadowBlur = 0;
        c.shadowColor = '#facc15';
        for (let j = 0; j < 3; j++) {
            const seedAngle = time * 8 + j * 2.1;
            const startDist = r * 0.5;
            const endDist = r * 1.6 + Math.sin(time * 12 + j) * 4;
            const arcAngle = seedAngle;
            c.beginPath();
            c.moveTo(Math.cos(arcAngle) * startDist, Math.sin(arcAngle) * startDist);
            const midX = Math.cos(arcAngle + 0.3) * (startDist + (endDist - startDist) * 0.5);
            const midY = Math.sin(arcAngle + 0.3) * (startDist + (endDist - startDist) * 0.5);
            c.lineTo(midX, midY);
            c.lineTo(Math.cos(arcAngle) * endDist, Math.sin(arcAngle) * endDist);
            c.stroke();
        }
        c.restore();

        // 2. 4 Ədəd İti Elektrik Qanadı / Generator Spikeləri
        c.shadowBlur = 0;
        c.shadowColor = glow;
        for (let i = 0; i < 4; i++) {
            c.save();
            c.rotate((i * Math.PI) / 2);
            c.fillStyle = '#ca8a04';
            c.beginPath();
            c.moveTo(r * 1.85, 0);
            c.lineTo(r * 0.5, -r * 0.45);
            c.lineTo(r * 0.2, 0);
            c.lineTo(r * 0.5, r * 0.45);
            c.closePath();
            c.fill();

            c.fillStyle = '#fef08a';
            c.beginPath();
            c.moveTo(r * 1.65, 0);
            c.lineTo(r * 0.6, -r * 0.25);
            c.lineTo(r * 0.6, r * 0.25);
            c.closePath();
            c.fill();
            c.restore();
        }

        // 3. Daxili Enerji Romb Korpusu
        c.beginPath();
        c.moveTo(0, -r * 0.95);
        c.lineTo(r * 0.95, 0);
        c.lineTo(0, r * 0.95);
        c.lineTo(-r * 0.95, 0);
        c.closePath();
        c.fillStyle = '#1e1b4b';
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = baseColor;
        c.stroke();

        // 4. Parlaq Ağ-Sarı Şimşək Nüvəsi (⚡)
        c.shadowBlur = 0;
        c.shadowColor = '#ffffff';
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(r * 0.15, -r * 0.65);
        c.lineTo(-r * 0.45, r * 0.05);
        c.lineTo(r * 0.1, r * 0.05);
        c.lineTo(-r * 0.2, r * 0.65);
        c.lineTo(r * 0.45, -r * 0.05);
        c.lineTo(-r * 0.05, -r * 0.05);
        c.closePath();
        c.fill();
    }

    if (typeof SkinRegistry !== 'undefined') {
        SkinRegistry.register('spark', config, render);
    }
})();
