// ============================================================================
// 👑 DƏRİ: VOİD HÖKMDARI (VOID)
// Ali qızılı kiber tac, 3 orbital qara kürə və mərkəzi sirli void gözü
// ============================================================================

(function() {
    const config = {
        name: 'Void Hökmdarı',
        title: 'Void Sovereign',
        icon: 'fa-crown',
        color: '#c084fc',
        trailColor: 'rgba(192, 132, 252,',
        glowColor: '#c084fc',
        badge: '👑 -20% Dash CD & +35px Maqnit',
        perk: 'Dash soyuma müddətini 20% azaldır və sikkə çəkmə sahəsini +35px genişləndirir.',
        desc: 'Qaranlıq anomaliyaları ram edən ali kibernetik forma.',
        costType: 'redDiamonds',
        cost: 30
    };

    function render(c, r, skin, facing = 0, time = 0, isInvuln = false) {
        const glow = isInvuln ? '#ffffff' : (skin.glowColor || '#c084fc');

        // 1. Ətrafında Fırlanan 3 Orbital Qara Materiya Peyki
        const orbDist = r * 1.65;
        for (let i = 0; i < 3; i++) {
            const angle = (time * 2.8) + (i * (Math.PI * 2)) / 3;
            const ox = Math.cos(angle) * orbDist;
            const oy = Math.sin(angle) * orbDist;
            c.save();
            c.beginPath();
            c.arc(ox, oy, 5, 0, Math.PI * 2);
            c.fillStyle = '#e879f9';
            c.shadowBlur = 14;
            c.shadowColor = '#c084fc';
            c.fill();

            c.beginPath();
            c.arc(ox, oy, 2.5, 0, Math.PI * 2);
            c.fillStyle = '#3b0764';
            c.fill();
            c.restore();
        }

        // 2. Kosmik Qara Dəlik, Əzəmətli Tac və Void Gözü
        c.save();
        c.rotate(facing || 0);

        c.shadowBlur = 25;
        c.shadowColor = glow;
        c.beginPath();
        c.arc(0, 0, r * 1.1, 0, Math.PI * 2);
        c.fillStyle = '#581c87';
        c.fill();

        c.beginPath();
        c.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        c.fillStyle = '#090212';
        c.fill();

        // 3. ƏZƏMƏTLİ QIZILI KİBER TAC
        c.save();
        c.shadowBlur = 16;
        c.shadowColor = '#facc15';
        c.fillStyle = '#f59e0b';
        c.strokeStyle = '#fef08a';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-r * 0.7, -r * 0.4);
        c.lineTo(-r * 0.85, -r * 1.35); // Sol qüllə
        c.lineTo(-r * 0.35, -r * 0.85);
        c.lineTo(0, -r * 1.55);          // Mərkəzi ali tac qülləsi
        c.lineTo(r * 0.35, -r * 0.85);
        c.lineTo(r * 0.85, -r * 1.35);  // Sağ qüllə
        c.lineTo(r * 0.7, -r * 0.4);
        c.closePath();
        c.fill();
        c.stroke();

        // Tacın yaqut kristalları
        c.fillStyle = '#c084fc';
        c.beginPath();
        c.arc(0, -r * 1.1, 2.8, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 4. Mərkəzi Sirli Void Gözü
        c.shadowBlur = 14;
        c.shadowColor = '#ffffff';
        c.fillStyle = '#c084fc';
        c.beginPath();
        c.ellipse(0, 0, r * 0.45, r * 0.28, 0, 0, Math.PI * 2);
        c.fill();

        // Göz bəbəyi
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(0, -r * 0.08, 3, 0, Math.PI * 2);
        c.fill();

        c.restore();
    }

    if (typeof SkinRegistry !== 'undefined') {
        SkinRegistry.register('void', config, render);
    }
})();
