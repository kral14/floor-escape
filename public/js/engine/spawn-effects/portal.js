// ============================================================================
// 🌀 DOĞULUŞ ANİMASİYASI 1: HOLOQRAMDAN DOĞULUŞ (MONS / SUMMON SEQUENCE)
// İstifadəçinin təqdim etdiyi orijinal riyazi və vizual kod DƏYİŞMƏDƏN
// ============================================================================

const PortalSpawnEffect = {
    id: 'portal',
    name: 'Holoqramdan Doğuluş',
    title: 'Holo-Portal',
    icon: 'fa-atom',
    color: '#65dfff',
    glowColor: '#72ddff',
    badge: '🌀 Standart Holoqram',
    desc: 'Portal açılır, orbital qəfəs və komet quyruqları toplanır, Mons meydana çıxır.',
    costType: 'redDiamonds',
    cost: 5,
    duration: 6.0,

    draw(ctx, w, h, t, drawMonster) {
        const c = ctx;
        function S(a, b, val) {
            const x = Math.max(0, Math.min(1, (val - a) / (b - a)));
            return x * x * (3 - 2 * x);
        }

        const scale = Math.min(w / 650, h / 460);
        const cx = w / 2;
        const base = h * 0.77;

        if (t < 0.65) return;
        t -= 0.65;

        c.save();
        c.translate(cx, base);
        c.scale(scale, scale);

        const boot = S(0, 0.85, t);
        const emerge = S(2.05, 4.25, t);
        const settle = S(4.2, 5.3, t);
        const beam = S(1.35, 2.05, t) * (1 - S(4, 5.2, t));

        const ring = (rx, ry, y, alpha, color = '#65dfff', rotation = 0) => {
            c.save();
            c.translate(0, y);
            c.scale(1, ry / rx);
            c.rotate(rotation);
            c.globalAlpha = Math.max(0, Math.min(1, alpha));
            c.strokeStyle = color;
            c.lineWidth = 1.6;
            c.beginPath();
            c.ellipse(0, 0, rx, rx, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        };

        // Cinematic orbital lattice and sparks gathering around the portal.
        const charge = S(0.8, 2.05, t) * (1 - S(4.2, 5.3, t));
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 3; j++) {
            c.save();
            const appear = S(0.75 + j * 0.36, 1.18 + j * 0.36, t);
            c.globalAlpha = appear * (charge * 0.65 + settle * 0.13);
            c.strokeStyle = j === 1 ? '#ffb47d' : '#72ddff';
            const spin = t * 0.4 + j * Math.PI / 3, tilt = 0.4 + j * 0.7;
            function orbit(a) {
                const x = Math.cos(a) * 153;
                const y = Math.sin(a) * 153 * Math.cos(tilt);
                const z = Math.sin(a) * 153 * Math.sin(tilt);
                const xx = x * Math.cos(spin) + z * Math.sin(spin);
                const zz = -x * Math.sin(spin) + z * Math.cos(spin);
                const k = 480 / (480 - zz);
                return [xx * k, -115 + y * k, zz];
            }
            for (let k = 0; k < Math.floor(100 * appear); k++) {
                const A = orbit(k * Math.PI / 50);
                const B = orbit((k + 1) * Math.PI / 50);
                c.lineWidth = A[2] > 0 ? 1.8 : 0.65;
                c.beginPath();
                c.moveTo(A[0], A[1]);
                c.lineTo(B[0], B[1]);
                c.stroke();
            }
            c.restore();
        }

        // Comet trails spiral inward, then dissolve into the summoned creature.
        for (let i = 0; i < 28; i++) {
            const p = (t * 0.30 + i * 0.071) % 1;
            const a = i * 2.399 + t * 1.6 + p * 3;
            const r = 180 * (1 - p) + 20;
            c.globalAlpha = charge * Math.sin(p * Math.PI) * 0.65;
            c.strokeStyle = i % 4 === 0 ? '#ffc995' : '#84e8ff';
            c.lineWidth = 1.4;
            c.beginPath();
            for (let k = 0; k < 9; k++) {
                const aa = a - k * 0.035;
                const rr = r + k * 1.4;
                const x = Math.cos(aa) * rr;
                const y = -100 + Math.sin(aa) * rr * 0.7;
                k ? c.lineTo(x, y) : c.moveTo(x, y);
            }
            c.stroke();
        }
        c.restore();

        // Soft light on the ground, under concentric holographic rings.
        c.save();
        c.scale(1, 0.23);
        const pool = c.createRadialGradient(0, 0, 0, 0, 0, 190);
        pool.addColorStop(0, 'rgba(82, 220, 255, 0.2)');
        pool.addColorStop(0.55, 'rgba(66, 117, 220, 0.08)');
        pool.addColorStop(1, 'rgba(77, 223, 255, 0)');
        c.fillStyle = pool;
        c.globalAlpha = boot * (1 - settle * 0.5);
        c.fillRect(-190, -190, 380, 380);
        c.restore();

        ring(130 * boot, 29 * boot, 0, boot * (0.7 - settle * 0.4));
        const second = S(0.35, 1.05, t);
        ring(103 * second, 22 * second, 0, second * 0.7);
        c.setLineDash([8, 8]);
        ring(165 * S(0.65, 1.3, t), 37 * S(0.65, 1.3, t), 0, S(0.65, 1.3, t) * 0.5, '#61c7eb', t * 0.2);
        c.setLineDash([]);

        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6 + t * 0.16;
            const x = Math.cos(a) * 146;
            const y = Math.sin(a) * 33;
            c.globalAlpha = boot * 0.65;
            c.fillStyle = '#8beeff';
            c.fillRect(x - 2, y - 2, 4, 4);
        }
        c.globalAlpha = 1;

        if (beam > 0) {
            const g = c.createLinearGradient(0, -270, 0, 0);
            g.addColorStop(0, 'rgba(97, 223, 255, 0)');
            g.addColorStop(0.7, 'rgba(97, 223, 255, 0.06)');
            g.addColorStop(1, 'rgba(97, 223, 255, 0.27)');
            c.globalAlpha = beam;
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(-100, 0);
            c.lineTo(-66, -270);
            c.lineTo(66, -270);
            c.lineTo(100, 0);
            c.closePath();
            c.fill();
            for (let i = 0; i < 7; i++) {
                const x = -90 + i * 30;
                c.strokeStyle = '#7de7ff';
                c.globalAlpha = beam * 0.12;
                c.beginPath();
                c.moveTo(x, 0);
                c.lineTo(x * 0.65, -245);
                c.stroke();
            }
            for (let i = 0; i < 4; i++) {
                const y = -((t * 75 + i * 65) % 260);
                ring(100 + y * 0.12, 21 + y * 0.025, y, beam * 0.22);
            }
        }

        // Rising energy motes converge into the creature.
        for (let i = 0; i < 44; i++) {
            const p = ((t * 0.32 + i * 0.618) % 1);
            const a = i * 2.399 + t * 0.5;
            const r = (1 - p) * 135 + 12;
            c.globalAlpha = boot * (1 - settle * 0.9) * Math.sin(p * Math.PI) * 0.7;
            c.fillStyle = i % 4 === 0 ? '#ffb177' : '#9aefff';
            const x = Math.cos(a) * r;
            const y = -p * 250;
            c.fillRect(x, y, 1.5 + i % 2, 1.5 + i % 2);
        }
        c.globalAlpha = 1;

        const float = Math.sin(t * 2) * 4;
        const monsterY = 35 - emerge * 170 + settle * float;

        if (t > 1.8) {
            c.save();
            c.beginPath();
            c.rect(-240, -400, 480, 394);
            c.clip();
            c.translate(0, monsterY);
            c.scale(0.68 + emerge * 0.32, 0.68 + emerge * 0.32);

            // Materialization: solid creature is revealed from its head downwards.
            const reveal = S(1.8, 4.1, t);
            c.save();
            c.beginPath();
            c.rect(-130, -120, 260, 240 * reveal);
            c.clip();
            c.globalAlpha = S(1.8, 2.5, t);
            if (typeof drawMonster === 'function') {
                drawMonster(c, t);
            }
            c.restore();

            // Scan lines share the same creature motion and fade as it becomes solid.
            if (settle < 1) {
                c.save();
                c.beginPath();
                c.ellipse(0, 0, 55, 61, 0, 0, Math.PI * 2);
                c.clip();
                c.globalAlpha = (1 - settle) * 0.4;
                c.fillStyle = '#82eaff';
                for (let y = -80; y < 80; y += 6) c.fillRect(-60, y + (t * 23) % 6, 120, 1);
                c.restore();
                const sy = -110 + reveal * 210;
                c.strokeStyle = '#b3faff';
                c.lineWidth = 2;
                c.globalAlpha = (1 - settle) * 0.8;
                c.shadowColor = '#83e9ff';
                c.shadowBlur = 0;
                c.beginPath();
                c.moveTo(-56, sy);
                c.lineTo(56, sy);
                c.stroke();
                c.shadowBlur =0;
            }
            c.restore();
        }

        // A short, soft release of light instead of a full-screen flash.
        const burst = S(4.05, 4.28, t) * (1 - S(4.28, 5.15, t));
        if (burst > 0) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            const bloom = c.createRadialGradient(0, -135, 0, 0, -135, 210);
            bloom.addColorStop(0, 'rgba(255, 240, 197, 0.4)');
            bloom.addColorStop(0.25, 'rgba(255, 185, 127, 0.13)');
            bloom.addColorStop(1, 'rgba(116, 207, 255, 0)');
            c.globalAlpha = burst;
            c.fillStyle = bloom;
            c.fillRect(-220, -355, 440, 440);

            for (let i = 0; i < 20; i++) {
                const a = i * Math.PI / 10 + 0.13;
                const r = 45 + (t - 4.1) * 150;
                c.globalAlpha = burst * 0.5;
                c.strokeStyle = i % 3 ? '#83eaff' : '#ffe0ad';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(Math.cos(a) * r, -135 + Math.sin(a) * r * 0.75);
                c.lineTo(Math.cos(a) * (r + 20), -135 + Math.sin(a) * (r + 20) * 0.75);
                c.stroke();
            }
            c.restore();
        }

        // Tiny drifting stars keep the finished scene alive.
        for (let i = 0; i < 20; i++) {
            const a = i * 2.4 + t * 0.10;
            const r = 95 + (i % 5) * 17;
            const x = Math.cos(a) * r;
            const y = -128 + Math.sin(a) * r * 0.65;
            const shimmer = 0.25 + 0.75 * Math.pow(Math.sin(t * 1.6 + i), 6);
            c.save();
            c.globalAlpha = settle * shimmer * 0.55;
            c.strokeStyle = i % 3 ? '#96dbf5' : '#ffd399';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x - 3, y);
            c.lineTo(x + 3, y);
            c.moveTo(x, y - 3);
            c.lineTo(x, y + 3);
            c.stroke();
            c.restore();
        }

        // Front edge of the portal sits in front of the emerging creature.
        c.globalAlpha = boot * (0.7 - settle * 0.4);
        c.strokeStyle = '#a3f0ff';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, 0, 103, 22, 0, 0, Math.PI);
        c.stroke();
        c.globalAlpha = 1;

        const pulse = S(4.1, 4.35, t) * (1 - S(4.35, 5, t));
        if (pulse > 0) ring(130 + (t - 4.1) * 100, 29 + (t - 4.1) * 22, 0, pulse * 0.65, '#ffd0ad');

        c.restore();
    }
};

if (typeof window !== 'undefined') {
    window.PortalSpawnEffect = PortalSpawnEffect;
}
