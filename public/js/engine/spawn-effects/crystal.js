// ============================================================================
// 💎 DOĞULUŞ ANİMASİYASI 2: KRİSTAL YARIĞI (MONS / CRYSTAL RIFT)
// İstifadəçinin təqdim etdiyi orijinal riyazi və vizual kod DƏYİŞMƏDƏN
// ============================================================================

const CrystalSpawnEffect = {
    id: 'crystal',
    name: 'Kristal Yarığı',
    title: 'Crystal Rift',
    icon: 'fa-gem',
    color: '#b899ff',
    glowColor: '#d9c5ff',
    badge: '💎 Kristal Yarığı',
    desc: 'İşıq çatı açılır, kristallar ayrılır, şimşək çaxır və Mons meydana çıxır.',
    costType: 'redDiamonds',
    cost: 15,
    duration: 7.6,

    draw(ctx, w, h, t, drawMonster) {
        const c = ctx;
        function S(a, b, val) {
            const x = Math.max(0, Math.min(1, (val - a) / (b - a)));
            return x * x * (3 - 2 * x);
        }

        if (t < 0.55) return;

        const scale = Math.min(w / 650, h / 460);
        const cx = w / 2;
        const cy = h * 0.47;

        c.save();
        c.translate(cx, cy);
        c.scale(scale, scale);

        const fracture = S(0.55, 2.65, t);
        const open = S(3.25, 4.25, t);
        const arrive = S(4.1, 5.95, t);
        const fade = 1 - S(6, 7.4, t);
        const breathe = Math.sin(t * 2) * 3;

        function line(points, color, width, alpha) {
            c.save();
            c.globalAlpha = Math.max(0, Math.min(1, alpha));
            c.strokeStyle = color;
            c.lineWidth = width;
            c.lineJoin = 'round';
            c.lineCap = 'round';
            c.beginPath();
            points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p));
            c.stroke();
            c.restore();
        }

        // A single vertical fracture grows out of empty space.
        const crack = [
            [0, -132], [-9, -102], [7, -75], [-5, -48],
            [9, -13], [-7, 19], [5, 52], [-8, 82], [0, 126]
        ];

        c.save();
        c.beginPath();
        c.rect(-220, -132, 440, 258 * fracture);
        c.clip();
        c.shadowColor = '#b899ff';
        c.shadowBlur = 0;
        for (const side of [-1, 1]) {
            line(crack.map(([x, y]) => [x + side * open * 68, y]), '#d9c5ff', 2.3, fade);
        }
        c.shadowBlur =0;
        c.restore();

        // The split reveals a deep, luminous opening;
        if (open > 0 && fade > 0) {
            c.save();
            c.globalAlpha = fade;
            const g = c.createRadialGradient(0, 0, 2, 0, 0, 150);
            g.addColorStop(0, '#372b64');
            g.addColorStop(0.65, '#100f28');
            g.addColorStop(1, 'rgba(175, 119, 245, 0)');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(-open * 68, -132);
            c.lineTo(open * 68, -132);
            c.lineTo(open * 82, 0);
            c.lineTo(open * 68, 126);
            c.lineTo(-open * 68, 126);
            c.lineTo(-open * 82, 0);
            c.closePath();
            c.fill();

            for (let j = 0; j < 12; j++) {
                const y = ((t * 70 + j * 29) % 258) - 132;
                c.globalAlpha = fade * 0.2;
                c.strokeStyle = '#b7a4ff';
                c.beginPath();
                c.moveTo(-open * 65, y);
                c.lineTo(0, y * 0.55);
                c.lineTo(open * 65, y);
                c.stroke();
            }
            c.restore();
        }

        // Perspective shards peel away from the seam and tumble outwards.
        const release = S(3.25, 4.8, t);
        for (let i = 0; i < 22; i++) {
            const side = i % 2 ? 1 : -1;
            const row = Math.floor(i / 2);
            const y = -120 + row * 24;
            const x = side * (8 + release * (95 + (i % 4) * 17));
            const z = Math.sin(i * 2.1 + t * 1.4) * release * 95;
            const k = 420 / (420 - z);
            const angle = i * 0.9 + release * (side * 2.8);
            const born = S(0.55 + row * 0.17, 0.88 + row * 0.17, t);
            if (born <= 0) continue;

            const size = (12 + (i % 4) * 5) * born;
            c.save();
            c.globalAlpha = born * fade;
            c.translate(x * k, (y + Math.sin(i * 3) * release * 23) * k);
            c.rotate(angle);
            c.scale(k * Math.max(0.14, Math.abs(Math.cos(i + release * t * 0.7))), k);

            const g = c.createLinearGradient(-size, -size, size, size);
            g.addColorStop(0, '#d5c5ff');
            g.addColorStop(0.4, '#67508f');
            g.addColorStop(1, '#241c40');
            c.fillStyle = g;
            c.strokeStyle = '#c4a5ff';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(-size, -size * 0.4);
            c.lineTo(size * 0.5, -size);
            c.lineTo(size, size * 0.5);
            c.lineTo(-size * 0.6, size);
            c.closePath();
            c.fill();
            c.stroke();
            line([[-size, -size * 0.4], [size * 0.15, 0], [size, size * 0.5]], '#f0dbff', 0.8, 0.6);
            c.restore();
        }

        // Lightning hits only after every shard has finished materializing.
        const strike = S(2.88, 2.96, t) * (1 - S(3.17, 3.4, t));
        if (strike > 0) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            c.shadowColor = '#b49dff';
            c.shadowBlur = 0;
            const bolt = [
                [12, -h / scale], [-6, -198], [13, -172], [-15, -148],
                [4, -121], [-9, -83], [10, -49], [-6, -12],
                [8, 28], [-4, 77], [0, 125]
            ];
            line(bolt, '#9675ff', 9, strike * 0.35);
            line(bolt, '#d9cbff', 4, strike);
            line(bolt, '#ffffff', 1.5, strike);
            line([[-6, -12], [-41, 3], [-23, 16], [-55, 39]], '#d2c2ff', 1.5, strike * 0.7);
            line([[4, -121], [35, -103], [25, -82], [49, -65]], '#d2c2ff', 1.5, strike * 0.7);
            c.shadowBlur =0;

            const glow = c.createRadialGradient(0, 0, 1, 0, 0, 145);
            glow.addColorStop(0, 'rgba(187, 165, 255, 0.27)');
            glow.addColorStop(1, 'rgba(187, 165, 255, 0)');
            c.globalAlpha = strike;
            c.fillStyle = glow;
            c.fillRect(-145, -145, 290, 290);
            c.restore();
        }

        // Spark trails fly clear as the creature crosses the opening.
        const impact = S(4.8, 5.05, t) * (1 - S(5.05, 6.2, t));
        for (let i = 0; i < 34; i++) {
            const a = i * 2.399;
            const r = 55 + Math.max(0, t - 4.8) * (85 + (i % 5) * 13);
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r * 0.85;
            line([[x, y], [x + Math.cos(a) * 9, y + Math.sin(a) * 9]], i % 3 ? '#c5b5ff' : '#ffd39c', 1.5, impact * 0.7);
        }

        if (arrive > 0) {
            c.save();
            const k = 0.48 + arrive * 0.52;
            c.translate(0, 22 * (1 - arrive) + arrive * breathe);
            c.scale(k, k);
            c.globalAlpha = arrive;
            c.beginPath();
            c.rect(-120, -120, 240, 240);
            c.clip();
            if (typeof drawMonster === 'function') {
                drawMonster(c, t);
            }
            c.restore();
        }

        // The rift seals behind the creature, leaving a few quiet embers.
        const after = S(5.95, 7.4, t);
        for (let i = 0; i < 14; i++) {
            const a = i * 2.399 + t * 0.12;
            const r = 82 + (i % 4) * 17;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            c.globalAlpha = after * (0.2 + 0.2 * Math.sin(t + i));
            c.fillStyle = (i % 3) ? '#c2b3ef' : '#eab88e';
            c.fillRect(x, y, 2, 2);
        }
        c.globalAlpha = 1;

        c.save();
        c.translate(0, 126);
        c.scale(1, 0.19);
        const shadow = c.createRadialGradient(0, 0, 0, 0, 0, 85);
        shadow.addColorStop(0, 'rgba(162, 123, 244, 0.2)');
        shadow.addColorStop(1, 'rgba(162, 123, 244, 0)');
        c.globalAlpha = arrive;
        c.fillStyle = shadow;
        c.fillRect(-85, -85, 170, 170);
        c.restore();

        c.restore();
    }
};

if (typeof window !== 'undefined') {
    window.CrystalSpawnEffect = CrystalSpawnEffect;
}
