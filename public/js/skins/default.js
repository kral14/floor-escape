// ============================================================================
// 💠 DƏRİ: KİBER QAÇIŞÇI (DEFAULT)
// Kiber ninja vizoru, qulaqlıqlar və dinamik dalğalanan neon lentlər
// ============================================================================

(function() {
    const config = {
        name: 'Kiber Qaçışçı',
        title: 'Cyber Runner',
        icon: 'fa-user-ninja',
        color: '#00ffcc',
        trailColor: 'rgba(0, 255, 204,',
        glowColor: '#00ffcc',
        badge: '⚖️ Standart Forma',
        perk: 'Standart balanslaşdırılmış kiber-qaçışçı forması.',
        desc: 'Standart balanslaşdırılmış kiber-qaçışçı forması.',
        costType: 'free',
        cost: 0
    };

    function render(c, r, skin, facing = 0, time = 0, isInvuln = false) {
        const baseColor = isInvuln ? '#ffffff' : (skin.color || '#00ffcc');
        const glow = isInvuln ? '#ffffff' : (skin.glowColor || '#00ffcc');

        c.rotate(facing || 0);

        // 1. Arxada Dinamik Dalğalanan İkili Neon Kiber Lentlər
        c.fillStyle = 'rgba(0, 255, 204, 0.85)';
        c.shadowBlur = 0;
        c.shadowColor = '#00ffcc';

        const wave1 = Math.sin(time * 8) * 4;
        const wave2 = Math.cos(time * 8) * 4;

        // Sol lent
        c.beginPath();
        c.moveTo(-r * 0.4, r * 0.7);
        c.quadraticCurveTo(-r * 0.9, r * 1.3 + wave1, -r * 1.35, r * 1.85);
        c.lineTo(-r * 1.0, r * 1.5);
        c.lineTo(-r * 0.15, r * 0.85);
        c.closePath();
        c.fill();

        // Sağ lent
        c.beginPath();
        c.moveTo(r * 0.4, r * 0.7);
        c.quadraticCurveTo(r * 0.9, r * 1.3 + wave2, r * 1.35, r * 1.85);
        c.lineTo(r * 1.0, r * 1.5);
        c.lineTo(r * 0.15, r * 0.85);
        c.closePath();
        c.fill();

        // 2. Kiber-Ninja Dəbilqə Korpusu
        c.shadowBlur = 0;
        c.shadowColor = glow;
        c.beginPath();
        c.arc(0, 0, r * 1.05, 0, Math.PI * 2);
        c.fillStyle = baseColor;
        c.fill();

        // Yan Kiber Qulaqlıqlar (Earpieces)
        c.fillStyle = '#0f172a';
        c.beginPath();
        c.rect(-r * 1.15, -r * 0.35, r * 0.25, r * 0.7);
        c.rect(r * 0.9, -r * 0.35, r * 0.25, r * 0.7);
        c.fill();

        // Qara Ninja Maska Qoruyucusu
        c.fillStyle = '#090d16';
        c.beginPath();
        c.ellipse(0, -1, r * 0.92, r * 0.45, 0, 0, Math.PI * 2);
        c.fill();

        // 3. Parlaq Kiber-Vizor (HUD Eynək)
        c.fillStyle = '#00ffcc';
        c.shadowBlur = 0;
        c.shadowColor = '#00ffcc';
        c.beginPath();
        if (c.roundRect) c.roundRect(-r * 0.7, -4.5, r * 1.4, 8, 3.5);
        else c.rect(-r * 0.7, -4.5, r * 1.4, 8);
        c.fill();

        // Vizor İşıq Parıltısı
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(-r * 0.32, -1.5, 2.8, 0, Math.PI * 2);
        c.fill();
    }

    if (typeof SkinRegistry !== 'undefined') {
        SkinRegistry.register('default', config, render);
    }
})();
