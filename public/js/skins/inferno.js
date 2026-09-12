// ============================================================================
// 🔥 DƏRİ: LAVA CƏLLADI (INFERNO)
// Obsidian buynuzlar, qaynayan canlı magma nəfəsi və dalğalanan alov şölələri
// ============================================================================

(function() {
    const config = {
        name: 'Lava Cəlladı',
        title: 'Inferno Slayer',
        icon: 'fa-fire-flame-curved',
        color: '#ef4444',
        trailColor: 'rgba(239, 68, 68,',
        glowColor: '#ef4444',
        badge: '🔥 +25% Qızıl Qazancı',
        perk: 'Yığılan bütün sikkələrdən qızıl qazancını +25% artırır.',
        desc: 'Lava qorxusunu məhv edən qəzəbli alovlu döyüşçü.',
        costType: 'redDiamonds',
        cost: 20
    };

    function render(c, r, skin, facing = 0, time = 0, isInvuln = false) {
        c.rotate(facing || 0);

        // 1. Canlı Qopan Magma Qığılcımları (Uçuşan Lava Embers)
        c.save();
        for (let i = 0; i < 4; i++) {
            const seed = i * 1.57;
            const emberProgress = ((time * 1.8 + seed) % 2.5) / 2.5;
            const emberX = Math.sin(time * 3 + seed) * (r * 1.35) + (i % 2 === 0 ? -r * 0.3 : r * 0.3);
            const emberY = (r * 0.8) - emberProgress * (r * 2.5);
            const emberAlpha = Math.sin(emberProgress * Math.PI);
            const emberSize = (1.5 + (i % 2) * 1.2) * (1 - emberProgress * 0.4);

            c.shadowBlur = 10;
            c.shadowColor = '#f97316';
            c.fillStyle = `rgba(254, 240, 138, ${emberAlpha})`;
            c.beginPath();
            c.arc(emberX, emberY, Math.max(0.5, emberSize), 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        // 2. Dinamik Dalğalanan Canlı Alov Şölələri
        c.save();
        const flameWave1 = Math.sin(time * 9) * (r * 0.22);
        const flameWave2 = Math.cos(time * 11) * (r * 0.18);
        const flameWave3 = Math.sin(time * 7 + 1.2) * (r * 0.15);

        // Mərkəzi böyük alov dili
        c.fillStyle = '#f97316';
        c.shadowBlur = 22;
        c.shadowColor = '#ef4444';
        c.beginPath();
        c.moveTo(-r * 0.55, -r * 0.6);
        c.quadraticCurveTo(flameWave3 * 0.5, -r * 1.55 - flameWave1, r * 0.55, -r * 0.6);
        c.quadraticCurveTo(0, -r * 0.3, -r * 0.55, -r * 0.6);
        c.fill();

        // Sol alov qıvrımı
        c.fillStyle = '#ef4444';
        c.beginPath();
        c.moveTo(-r * 0.6, -r * 0.4);
        c.quadraticCurveTo(-r * 1.1 + flameWave2, -r * 1.3, -r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();

        // Sağ alov qıvrımı
        c.beginPath();
        c.moveTo(r * 0.6, -r * 0.4);
        c.quadraticCurveTo(r * 1.1 - flameWave2, -r * 1.3, r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.restore();

        // 3. İki Böyük Obsidian Alov Buynuzu
        const hornTipWaveL = Math.sin(time * 8) * (r * 0.08);
        const hornTipWaveR = Math.cos(time * 8) * (r * 0.08);

        c.shadowBlur = 22;
        c.shadowColor = '#dc2626';

        // Sol Buynuz
        c.fillStyle = '#7f1d1d';
        c.strokeStyle = '#f87171';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.5, -r * 0.4);
        c.quadraticCurveTo(-r * 1.5, -r * 1.2, -r * 0.6 + hornTipWaveL, -r * 1.5 + Math.abs(hornTipWaveL));
        c.quadraticCurveTo(-r * 0.8, -r * 0.8, -r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.stroke();

        // Sol buynuz damarı
        c.strokeStyle = '#f97316';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-r * 0.35, -r * 0.6);
        c.quadraticCurveTo(-r * 1.0, -r * 1.1, -r * 0.65 + hornTipWaveL, -r * 1.4);
        c.stroke();

        // Sağ Buynuz
        c.fillStyle = '#7f1d1d';
        c.strokeStyle = '#f87171';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(r * 0.5, -r * 0.4);
        c.quadraticCurveTo(r * 1.5, -r * 1.2, r * 0.6 + hornTipWaveR, -r * 1.5 + Math.abs(hornTipWaveR));
        c.quadraticCurveTo(r * 0.8, -r * 0.8, r * 0.2, -r * 0.7);
        c.closePath();
        c.fill();
        c.stroke();

        // Sağ buynuz damarı
        c.strokeStyle = '#f97316';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(r * 0.35, -r * 0.6);
        c.quadraticCurveTo(r * 1.0, -r * 1.1, r * 0.65 + hornTipWaveR, -r * 1.4);
        c.stroke();

        // 4. Magma Alov Körpüsü
        const bodyPulse = Math.sin(time * 6) * (r * 0.05);
        c.beginPath();
        c.arc(0, 0, r * 1.05 + bodyPulse, 0, Math.PI * 2);
        c.fillStyle = '#dc2626';
        c.shadowBlur = 24 + Math.sin(time * 8) * 8;
        c.shadowColor = '#ef4444';
        c.fill();

        // Obsidian Qara Çatlı Qabıq
        c.beginPath();
        c.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        c.fillStyle = '#18181b';
        c.fill();

        // 5. Parıldayan Qəzəbli Gözlər
        const eyePulse = Math.sin(time * 12) * 4;
        c.shadowBlur = 14 + eyePulse;
        c.shadowColor = '#facc15';
        c.fillStyle = eyePulse > 1 ? '#ffffff' : '#fef08a';

        // Sol Göz
        c.beginPath();
        c.moveTo(-r * 0.55, -r * 0.1);
        c.lineTo(-r * 0.15, -r * 0.25);
        c.lineTo(-r * 0.2, 0.05);
        c.closePath();
        c.fill();

        // Sağ Göz
        c.beginPath();
        c.moveTo(r * 0.55, -r * 0.1);
        c.lineTo(r * 0.15, -r * 0.25);
        c.lineTo(r * 0.2, 0.05);
        c.closePath();
        c.fill();

        // 6. Ağızda Qaynayan Magma Yarığı
        const mouthGlow = Math.sin(time * 7) * (r * 0.03);
        c.strokeStyle = '#f97316';
        c.lineWidth = 2.2;
        c.shadowBlur = 10;
        c.shadowColor = '#f97316';
        c.beginPath();
        c.moveTo(-r * 0.35, r * 0.35);
        c.lineTo(0, r * 0.5 + mouthGlow);
        c.lineTo(r * 0.35, r * 0.35);
        c.stroke();
    }

    if (typeof SkinRegistry !== 'undefined') {
        SkinRegistry.register('inferno', config, render);
    }
})();
