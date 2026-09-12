// ============================================================================
// 🌟 DOĞULUŞ ANİMASİYASI 3: ULDUZ NÜVƏSİ (MONS / STELLAR BLOOM)
// İstifadəçinin təqdim etdiyi orijinal riyazi və vizual kod DƏYİŞMƏDƏN
// ============================================================================

const StellarSpawnEffect = {
    id: 'stellar',
    name: 'Ulduz Nüvəsi',
    title: 'Stellar Bloom',
    icon: 'fa-sun',
    color: '#54d8cf',
    glowColor: '#f8d49a',
    badge: '🌟 Ulduz Nüvəsi',
    desc: 'Enerji toplanır, 3D axın lentləri fəzanı yarır, ulduz nüvəsi açılır və Mons doğulur.',
    costType: 'redDiamonds',
    cost: 25,
    duration: 7.6,

    draw(ctx, w, h, t, drawMonster) {
        const c = ctx;
        function S(a, b, val) {
            const x = Math.max(0, Math.min(1, (val - a) / (b - a)));
            return x * x * (3 - 2 * x);
        }

        if (t < 0.55) return;

        const scale = Math.min(w / 720, h / 510);
        c.save();
        c.translate(w / 2, h * 0.49);
        c.scale(scale, scale);

        const gather = S(0.55, 2.5, t);
        const shell = S(1.7, 3.1, t);
        const unfold = S(3.4, 4.35, t);
        const vanish = 1 - S(4.15, 4.45, t);
        const born = S(4.45, 5.45, t);
        const rest = S(5.6, 7.6, t);
        const spin = t * 0.24, tilt = 0.28;

        function project(x, y, z) {
            const X = x * Math.cos(spin) + z * Math.sin(spin);
            const Z = -x * Math.sin(spin) + z * Math.cos(spin);
            const Y = y * Math.cos(tilt) - Z * Math.sin(tilt);
            const D = y * Math.sin(tilt) + Z * Math.cos(tilt);
            const k = 570 / (570 - D);
            return { x: X * k, y: Y * k, z: D, k };
        }

        function stroke(points, color, width, alpha) {
            c.save();
            c.globalAlpha = Math.max(0, Math.min(1, alpha));
            c.strokeStyle = color;
            c.lineWidth = width;
            c.lineCap = 'round';
            c.lineJoin = 'round';
            c.beginPath();
            points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
            c.stroke();
            c.restore();
        }

        function glow(x, y, r, color, alpha) {
            if (alpha <= 0) return;
            c.save();
            c.globalAlpha = alpha;
            const g = c.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, color);
            g.addColorStop(1, '#00000000');
            c.fillStyle = g;
            c.fillRect(x - r, y - r, r * 2, r * 2);
            c.restore();
        }

        // Stage 1: a silent point, then hundreds of curved paths converge in space.
        glow(0, 0, 110 + gather * 65, '#54d8cf30', gather * vanish);
        const influx = S(0.65, 1.4, t) * (1 - S(2.65, 3.25, t));
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 100; i++) {
            const p = ((t - 0.55) * 0.43 + i * 0.037) % 1;
            if (p < 0) continue;
            const radius = 265 * Math.pow(1 - p, 1.35) + 8;
            const az = i * 2.399 + p * 2.8;
            const el = Math.sin(i * 1.73) * 1.12;
            const points = [];
            for (let j = 0; j < 7; j++) {
                const r = radius + j * 2.7;
                const A = az - j * 0.018;
                points.push(project(Math.cos(A) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(A) * Math.cos(el) * r));
            }
            stroke(points, i % 5 === 0 ? '#f8d49a' : '#78e8de', 1, influx * Math.sin(p * Math.PI) * 0.6);
            const P = points[0];
            c.globalAlpha = influx * 0.7;
            c.fillStyle = '#dcfff6';
            c.fillRect(P.x, P.y, 1.8 * P.k, 1.8 * P.k);
        }
        c.restore();

        // Living energy: open, flowing ribbons with depth, no solid grid shell.
        const energy = S(1.65, 2.8, t) * (1 - S(4.25, 4.65, t));
        const streams = [];
        const heartbeat = 1 + 0.09 * Math.sin(t * 8) + 0.035 * Math.sin(t * 17);
        const squeeze = 1 - unfold * 0.93;

        for (let j = 0; j < 11; j++) {
            const points = [];
            const phase = t * (1.55 + j * 0.065) + j * 2.399;
            for (let k = 0; k < 62; k++) {
                const u = k / 61;
                const A = phase + u * Math.PI * 1.55;
                const wobble = Math.sin(A * 3 + t * 3 + j) * 9 + Math.sin(u * 10 - t * 5) * 5;
                const r = (70 + j % 3 * 12 + wobble) * heartbeat * squeeze;
                const x = Math.cos(A) * r;
                const y = (Math.sin(A * 0.74 + j) * 62 + Math.sin(A * 2 + t) * 13) * squeeze;
                const z = Math.sin(A) * r;
                points.push(project(x, y, z));
            }
            streams.push({ points, z: points.reduce((n, p) => n + p.z, 0) / points.length, j });
        }
        streams.sort((a, b) => a.z - b.z);

        function ribbons(front) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            for (const flow of streams) {
                if ((flow.z >= 0) !== front) continue;
                const color = flow.j % 3 === 0 ? '#ffc780' : flow.j % 3 === 1 ? '#64ebdc' : '#b6acff';
                for (let k = 1; k < flow.points.length; k++) {
                    const taper = Math.sin(k / flow.points.length * Math.PI);
                    const pair = [flow.points[k - 1], flow.points[k]];
                    stroke(pair, color, 8 * taper, energy * 0.035);
                    stroke(pair, color, (1.2 + flow.j % 3 * 0.5) * taper, energy * (front ? 0.72 : 0.32) * taper);
                }
                const head = flow.points[flow.points.length - 8];
                glow(head.x, head.y, 13, '#b7fff688', energy * 0.6);
            }
            c.restore();
        }

        ribbons(false);
        glow(0, 0, (90 + Math.sin(t * 7) * 10) * Math.max(0.3, squeeze), '#62ead740', energy);
        glow(Math.sin(t * 4) * 12 * squeeze, Math.cos(t * 3) * 8 * squeeze, 30 * Math.max(0.3, squeeze), '#fff0b87a', energy * 0.65);

        // Small bright knots race along changing paths, leaving brief trails.
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 48; i++) {
            const A = t * (2 + i % 4 * 0.25) + i * 2.399;
            const r = (55 + i % 7 * 7) * squeeze;
            const P = project(Math.cos(A) * r, Math.sin(A * 1.3 + i) * r * 0.8, Math.sin(A) * r);
            const Q = project(Math.cos(A - 0.06) * r, Math.sin((A - 0.06) * 1.3 + i) * r * 0.8, Math.sin(A - 0.06) * r);
            stroke([Q, P], i % 4 ? '#a3ffed' : '#ffe2a8', 1.4, energy * (0.45 + 0.35 * Math.sin(t * 5 + i)));
        }
        c.restore();

        const pulse = S(3.45, 4.3, t) * (1 - S(4.45, 5.1, t));
        glow(0, 0, 90 - unfold * 45, '#fff1b9bb', pulse);
        glow(0, 0, 180, '#86ead82b', pulse);

        if (born > 0) {
            c.save();
            c.globalAlpha = born;
            const k = 0.64 + born * 0.36;
            c.translate(0, 26 * (1 - born) + Math.sin(t * 1.7) * 3 * rest);
            c.scale(k, k);
            if (typeof drawMonster === 'function') {
                drawMonster(c, t);
            }
            c.restore();
        }

        ribbons(true);

        // Broken spatial seams replace the continuous expanding ring.
        const fracture = S(4.35, 4.58, t) * (1 - S(5.05, 5.8, t));
        if (fracture > 0) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            const spread = S(4.35, 5.5, t);
            for (let i = 0; i < 9; i++) {
                const angle = i * 2.399;
                const r = 89 + spread * (60 + i % 3 * 19);
                const points = [];
                for (let j = 0; j < 18; j++) {
                    const u = j / 17;
                    const A = angle + (u - 0.5) * 0.45;
                    const rr = r + Math.sin(u * Math.PI * 3 + i) * 11 + u * 19;
                    points.push(project(Math.cos(A) * rr, Math.sin(A) * rr * 0.86, Math.sin(i * 1.7) * 55));
                }
                const color = i % 3 === 0 ? '#fbd5a4' : i % 3 === 1 ? '#9af6e6' : '#ccb8ff';
                stroke(points, color, 7, fracture * 0.06);
                stroke(points, color, 1.6, fracture * 0.7);
                const mid = points[8];
                stroke([mid, { x: mid.x + Math.cos(angle + 0.8) * 13, y: mid.y + Math.sin(angle + 0.8) * 13 }, { x: mid.x + Math.cos(angle) * 25, y: mid.y + Math.sin(angle) * 25 }], color, 0.8, fracture * 0.45);
                for (let k = 0; k < 3; k++) {
                    const p = points[3 + k * 5];
                    const fly = spread * 16;
                    c.save();
                    c.globalAlpha = fracture * 0.65;
                    c.translate(p.x + Math.cos(angle) * fly, p.y + Math.sin(angle) * fly);
                    c.rotate(angle + t * 0.5);
                    c.fillStyle = color;
                    c.beginPath();
                    c.moveTo(-2, 0);
                    c.lineTo(0, -4);
                    c.lineTo(2, 0);
                    c.lineTo(0, 4);
                    c.closePath();
                    c.fill();
                    c.restore();
                }
            }
            c.restore();
        }

        // Detached fragments become gold embers; they do not leave a permanent shell.
        const embers = S(4.45, 4.8, t) * (1 - S(6.1, 7.6, t));
        for (let i = 0; i < 58; i++) {
            const A = i * 2.399;
            const r = 10 + Math.max(0, t - 4.45) * (70 + i % 9 * 9);
            const P = project(Math.cos(A) * r, Math.sin(i * 4.1) * r * 0.65, Math.sin(A) * r);
            c.save();
            c.globalAlpha = embers * (0.3 + 0.5 * Math.pow(Math.sin(t * 2 + i), 2));
            c.translate(P.x, P.y);
            c.rotate(A + t * 0.4);
            c.fillStyle = i % 4 ? '#a7e6d5' : '#ffd492';
            c.fillRect(-1, -1, (i % 3 + 1) * P.k, 1.5 * P.k);
            c.restore();
        }

        c.save();
        c.translate(0, 137);
        c.scale(1, 0.18);
        glow(0, 0, 95, '#79bcbd33', born);
        c.restore();

        // Restrained idle effect after the entrance has finished.
        for (let i = 0; i < 9; i++) {
            const A = i * 2.4 + t * 0.13;
            const r = 94 + (i % 3) * 16;
            const x = Math.cos(A) * r;
            const y = Math.sin(A) * r;
            c.globalAlpha = rest * 0.18 * (1 + Math.sin(t + i));
            c.fillStyle = '#e3c699';
            c.fillRect(x, y, 1.5, 1.5);
        }
        c.globalAlpha = 1;
        c.restore();
    }
};

// Qlobal qeydiyyat
if (typeof window !== 'undefined') {
    window.StellarSpawnEffect = StellarSpawnEffect;
    if (window.SpawnEffectRegistry) {
        window.SpawnEffectRegistry.register('stellar', StellarSpawnEffect);
    }
}
