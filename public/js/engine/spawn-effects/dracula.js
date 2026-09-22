// ============================================================================
// 🦇 DOĞULUŞ ANİMASİYASI 4: DRAKULA (MONS / DRACULA)
// İstifadəçinin artırılmış hərəkət bucağı, dinamik qanad çırpınması və toz sistemi
// Xüsusiyyət: Monsa yarasa qanadları bəxş edir və +1 Hərəkət Sürəti artırır!
// ============================================================================

const DraculaSpawnEffect = {
    id: 'dracula',
    name: 'Drakula',
    title: 'Dracula',
    icon: 'fa-bat',
    fallbackIcon: 'fa-feather',
    color: '#ba7886',
    glowColor: '#9774be',
    badge: '🦇 Yarasa Qanadları (+1 Sürət)',
    desc: 'Qaranlıq oyanır, bənövşəyi mürəkkəb damlasından nəhəng qanadlar açılır və Monsa +1 sürət verir.',
    costType: 'redDiamonds',
    cost: 35,
    duration: 7.6,

    // İdarəetmə, fizika və toz zərrəcikləri
    vx: 0,
    vy: 0,
    x: 0,
    y: 0,
    interactive: false,
    flapPhase: 0,
    dust: [],
    dustBudget: 0,
    keys: {},
    _controlsSetup: false,
    _lastT: 0,

    resetFlight() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.keys = {};
        this.dust = [];
        this.dustBudget = 0;
        this.flapPhase = 0;
        this._lastT = 0;
    },

    setupControls() {
        if (this._controlsSetup) return;
        this._controlsSetup = true;
        window.addEventListener('keydown', (e) => {
            if (!this.interactive) return;
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
                this.keys[e.code] = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (!this.interactive) {
                this.keys = {};
                return;
            }
            this.keys[e.code] = false;
        });
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },

    move(dt, t, w, h) {
        if (!this.interactive) {
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.keys = {};
            this.flapPhase += dt * 2.5;
            return;
        }
        let x = (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) - (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0);
        let y = (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0) - (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0);
        if (t < 5.25) {
            x = 0;
            y = 0;
        }
        const len = Math.hypot(x, y) || 1;
        x /= len;
        y /= len;
        const ease = 1 - Math.exp(-dt * 9);
        this.vx += (x * 155 - this.vx) * ease;
        this.vy += (y * 155 - this.vy) * ease;
        const scale = Math.min(w / 700, h / 500);
        const limitX = Math.max(0, w / scale / 2 - 185);
        const limitY = Math.max(0, h / scale * 0.43 - 95);
        this.x = Math.max(-limitX, Math.min(limitX, this.x + this.vx * dt));
        this.y = Math.max(-limitY, Math.min(limitY, this.y + this.vy * dt));
        this.flapPhase += dt * (2.5 + Math.hypot(this.vx, this.vy) / 155 * 7);
    },

    staticSmooth(a, b, t) {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
    },

    wingDustPoint(side, t) {
        const S = this.staticSmooth;
        const emerge = S(3.35, 5.15, t);
        const rest = S(5.8, 7.6, t);
        const wingOpen = S(3.4, 5.25, t);
        const speed = Math.min(1, Math.hypot(this.vx, this.vy) / 155);
        const bank = side * this.vx / 155;
        const flap = Math.sin(this.flapPhase + bank * 0.4) * rest;
        const tipX = 130 + flap * (9 + speed * 10);
        const tipY = -60 + flap * (19 + speed * 28) + bank * 20;

        // Qanad konturundan nümunə götürmək
        const curves = [
            [[tipX, tipY], [96, -29], [115, 15]],
            [[115, 15], [88, -10], [76, 40]],
            [[76, 40], [50, 9], [37, 54]]
        ];
        const [A, B, C] = curves[Math.floor(Math.random() * 3)];
        const u = Math.random(), v = 1 - u;
        let x = v * v * A[0] + 2 * v * u * B[0] + u * u * C[0];
        let y = v * v * A[1] + 2 * v * u * B[1] + u * u * C[1];
        x *= (0.15 + wingOpen * 0.85) * (1 + flap * 0.10) * (1 - Math.max(0, bank) * 0.32 + Math.max(0, -bank) * 0.08);

        const angle = -(0.25 + speed * 0.30) * flap - bank * 0.46 + this.vy / 155 * 0.12;
        const rx = x * Math.cos(angle) - y * Math.sin(angle);
        const ry = x * Math.sin(angle) + y * Math.cos(angle);
        const bodyScale = 0.84 + 0.16 * emerge;
        x = side * (rx + 37) * bodyScale * (1 - Math.abs(this.vx) / 155 * 0.08);
        y = (ry + 8) * bodyScale;

        const curVx = this.interactive ? this.vx : 0;
        const curVy = this.interactive ? this.vy : 0;
        const curX = this.interactive ? this.x : 0;
        const curY = this.interactive ? this.y : 0;
        const tilt = curVx / 155 * 0.30;
        const bob = Math.sin(t * 1.8) * 3 * rest - Math.sin(this.flapPhase) * Math.hypot(curVx, curVy) / 155 * 3;
        return {
            x: curX + x * Math.cos(tilt) - y * Math.sin(tilt),
            y: curY + 10 * (1 - emerge) + bob + x * Math.sin(tilt) + y * Math.cos(tilt)
        };
    },

    updateDust(dt, t) {
        for (let i = this.dust.length - 1; i >= 0; i--) {
            const p = this.dust[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.dust.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 10 * dt;
            p.angle += p.spin * dt;
        }
        if (t < 5.25) return;

        const speed = Math.min(1, Math.hypot(this.vx, this.vy) / 155);
        const beat = 0.5 + 0.5 * Math.cos(this.flapPhase);
        this.dustBudget += dt * (12 + speed * 16 + beat * 12);

        while (this.dustBudget >= 1 && this.dust.length < 45) {
            this.dustBudget--;
            for (const side of [-1, 1]) {
                const pos = this.wingDustPoint(side, t);
                const life = 0.6 + Math.random() * 0.5;
                this.dust.push({
                    x: pos.x,
                    y: pos.y,
                    vx: side * (3 + Math.random() * 5),
                    vy: 10 + Math.random() * 12,
                    life,
                    maxLife: life,
                    size: 0.8 + Math.random() * 1.4,
                    angle: Math.random() * 6.28,
                    spin: (Math.random() - 0.5) * 2,
                    star: Math.random() < 0.2,
                    color: ['#ffe5b4', '#d8bdff', '#c3f3ef'][Math.floor(Math.random() * 3)]
                });
            }
        }
        if (this.dust.length > 45) this.dust.splice(0, this.dust.length - 45);
    },

    drawDust(c, t) {
        if (!this.dust || this.dust.length === 0) return;
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.dust.length; i++) {
            const p = this.dust[i];
            const age = 1 - p.life / p.maxLife;
            const alpha = Math.min(1, age * 10) * Math.pow(1 - age, 1.3);
            if (alpha <= 0.01) continue;

            const r = p.size * (0.65 + 0.35 * Math.sin(age * 8 + p.angle));
            c.globalAlpha = alpha;
            c.fillStyle = p.color;

            c.beginPath();
            if (p.star) {
                // Yüngül 4-bucaqlı parlaq ulduz (save/restore olmadan birbaşa mərkəzdən)
                const s1 = r * 2.0;
                const s2 = r * 0.5;
                c.moveTo(p.x, p.y - s1);
                c.lineTo(p.x + s2, p.y - s2);
                c.lineTo(p.x + s1, p.y);
                c.lineTo(p.x + s2, p.y + s2);
                c.lineTo(p.x, p.y + s1);
                c.lineTo(p.x - s2, p.y + s2);
                c.lineTo(p.x - s1, p.y);
                c.lineTo(p.x - s2, p.y - s2);
                c.closePath();
            } else {
                c.arc(p.x, p.y, r, 0, Math.PI * 2);
            }
            c.fill();
        }
        c.restore();
    },

    draw(ctx, w, h, t, drawMonster, isIngame = false) {
        const c = ctx;
        const S = this.staticSmooth;

        if (t < 0.5 && !isIngame) return;

        if (isIngame) {
            this.interactive = false;
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
        }

        if (!this._controlsSetup) this.setupControls();
        const dt = this._lastT !== undefined ? Math.min(0.04, Math.max(0, Math.abs(t - this._lastT))) : 0.016;
        this._lastT = t;
        if (t < 0.2 || isIngame) {
            if (!this.interactive) {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
                this.dust = [];
                this.dustBudget = 0;
            }
        }
        this.move(dt, t, w, h);
        this.updateDust(dt, t);

        const curX = this.interactive ? this.x : 0;
        const curY = this.interactive ? this.y : 0;
        const curVx = this.interactive ? this.vx : 0;
        const curVy = this.interactive ? this.vy : 0;

        const scale = Math.min(w / 700, h / 500);
        c.save();
        c.translate(w / 2, h * 0.47);
        c.scale(scale, scale);

        const drop = S(0.5, 1.25, t);
        const spread = S(1.2, 2.7, t);
        const eyes = S(2.5, 2.85, t);
        const emerge = S(3.35, 5.15, t);
        const dissolve = S(4.7, 6.7, t);
        const rest = S(5.8, 7.6, t);
        const opacity = 1 - dissolve;
        const tear = S(3.2, 4.75, t);

        function project(x, y, z) {
            const k = 500 / (500 - z);
            return { x: x * k, y: y * k, z, k };
        }

        function line(P, color, width, alpha) {
            c.save();
            c.globalAlpha = Math.max(0, Math.min(1, alpha));
            c.strokeStyle = color;
            c.lineWidth = width;
            c.lineCap = 'round';
            c.lineJoin = 'round';
            c.beginPath();
            P.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
            c.stroke();
            c.restore();
        }

        // A falling droplet becomes an irregular ink mass edged by violet light.
        const radius = (7 + spread * 84) * drop;
        const centerY = -145 * (1 - drop) + Math.sin(drop * Math.PI) * 14;
        if (opacity > 0) {
            c.save();
            c.translate(0, centerY);
            c.globalAlpha = opacity;
            c.shadowColor = '#9774be';
            c.shadowBlur = 0;
            c.beginPath();
            for (let j = 0; j <= 40; j++) {
                const A = j * Math.PI / 20;
                const r = radius * (1 + 0.08 * Math.sin(A * 3 + t * 2.6) * spread + 0.045 * Math.cos(A * 7 - t * 1.8) * spread);
                const x = Math.cos(A) * r, y = Math.sin(A) * r * 1.13;
                j ? c.lineTo(x, y) : c.moveTo(x, y);
            }
            const ink = c.createRadialGradient(-20, -30, 1, 0, 0, 120);
            ink.addColorStop(0, '#292235');
            ink.addColorStop(0.45, '#100e1b');
            ink.addColorStop(1, '#03040b');
            c.fillStyle = ink;
            c.fill();
            c.strokeStyle = '#80688e';
            c.lineWidth = 1.2;
            c.stroke();
            c.shadowBlur =0;
            c.restore();
        }

        // Whispering filaments curl toward the shadow before it awakens.
        const whisper = S(0.9, 1.7, t) * (1 - S(3.4, 4.3, t));
        if (whisper > 0.01) {
            for (let i = 0; i < 16; i++) {
                const A = i * 2.399 + t * 0.24, cycle = (t * 0.36 + i * 0.071) % 1, r = 48 + (1 - cycle) * 128;
                const P = [];
                for (let j = 0; j < 6; j++) {
                    const a = A - j * 0.035;
                    P.push(project(Math.cos(a) * (r + j * 2), Math.sin(a) * (r + j * 2) * 0.8, Math.sin(i) * 40));
                }
                line(P, i % 5 ? '#9781b5' : '#e6ae83', 0.8, whisper * Math.sin(cycle * Math.PI) * 0.3);
            }
        }

        // An impact ripple remains irregular and breaks apart instead of forming a ring.
        const landing = S(1.1, 1.3, t) * (1 - S(1.4, 2, t));
        if (landing > 0.01) {
            for (let i = 0; i < 6; i++) {
                const P = [];
                for (let j = 0; j < 8; j++) {
                    const A = i * 0.91 + j * 0.035, r = 25 + (t - 1.1) * 100;
                    P.push({ x: Math.cos(A) * r, y: Math.sin(A) * r * 0.35 + 18 });
                }
                line(P, '#a18db6', 1.2, landing * 0.45);
            }
        }

        // Each ribbon has depth. Near ribbons pass in front, far ribbons behind.
        const ribbons = [];
        if (spread * opacity > 0.01) {
            for (let i = 0; i < 10; i++) {
                const P = [], angle = i * Math.PI / 5 + t * 0.19;
                for (let j = 0; j <= 18; j++) {
                    const u = j / 18, r = (22 + u * (80 + emerge * 115)) * spread;
                    const A = angle + u * 1.7 + Math.sin(t * 1.6 + i) * u * 0.25;
                    P.push(project(Math.cos(A) * r, Math.sin(A) * r * 0.73 + Math.sin(u * 5 + t * 2 + i) * 10 * spread, Math.sin(angle + u * 3) * 65));
                }
                ribbons.push({ P, i, z: P[9].z });
            }
            ribbons.sort((a, b) => a.z - b.z);
        }

        function drawRibbons(front) {
            const ribbonAlpha = spread * opacity;
            if (ribbonAlpha <= 0.01) return;
            for (const { P, i, z } of ribbons) {
                if ((z >= 0) !== front || P.length < 2) continue;
                c.save();
                c.lineCap = 'round';
                c.lineJoin = 'round';

                // Bütöv ribbon xətləri (batch stroke)
                c.globalAlpha = Math.min(1, ribbonAlpha * 0.45);
                c.strokeStyle = '#78617f';
                c.lineWidth = Math.max(1, 7 * P[0].k);
                c.beginPath();
                P.forEach((p, idx) => idx ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
                c.stroke();

                c.globalAlpha = Math.min(1, ribbonAlpha * 0.95);
                c.strokeStyle = '#100e1c';
                c.lineWidth = Math.max(0.6, 4.5 * P[0].k);
                c.beginPath();
                P.forEach((p, idx) => idx ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
                c.stroke();

                if (i % 3 === 0) {
                    c.globalAlpha = Math.min(1, ribbonAlpha * 0.6);
                    c.strokeStyle = '#b388a5';
                    c.lineWidth = 1;
                    c.beginPath();
                    P.forEach((p, idx) => idx ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
                    c.stroke();
                }
                c.restore();
            }
        }
        drawRibbons(false);
        this.drawDust(c, t);

        // Bat wings attach behind the body and remain after the entrance.
        const wingOpen = S(3.4, 5.25, t);
        if (wingOpen > 0) {
            c.save();
            c.translate(curX, curY + 10 * (1 - emerge) + Math.sin(t * 1.8) * 3 * rest - Math.sin(this.flapPhase) * Math.hypot(curVx, curVy) / 155 * 3);
            c.rotate(curVx / 155 * 0.30);
            c.scale(1 - Math.abs(curVx) / 155 * 0.08, 1);
            const bodyScale = 0.84 + 0.16 * emerge;
            c.scale(bodyScale, bodyScale);

            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                const flap = Math.sin(this.flapPhase + side * curVx / 155 * 0.4) * rest;
                c.translate(37, 8);
                const speed = Math.min(1, Math.hypot(curVx, curVy) / 155);
                const bank = side * curVx / 155;

                // TƏKMİLLƏŞDİRİLMİŞ ARTIRILMIŞ HƏRƏKƏT BUCAĞI VƏ QANAD PİTÇİ:
                c.rotate(-(0.25 + speed * 0.30) * flap - bank * 0.46 + curVy / 155 * 0.12);
                c.scale((0.15 + wingOpen * 0.85) * (1 + flap * 0.10) * (1 - Math.max(0, bank) * 0.32 + Math.max(0, -bank) * 0.08), 1);

                const tipX = 130 + flap * (9 + speed * 10);
                const tipY = -60 + flap * (19 + speed * 28) + bank * 20;
                const skin = c.createLinearGradient(0, -55, 100, 58);
                skin.addColorStop(0, '#593040');
                skin.addColorStop(0.55, '#2c182d');
                skin.addColorStop(1, '#100e1d');

                c.globalAlpha = wingOpen;
                c.fillStyle = skin;
                c.strokeStyle = '#ba7886';
                c.lineWidth = 1.5;
                c.lineJoin = 'round';
                c.shadowColor = '#9c5265';
                c.shadowBlur = 0;

                c.beginPath();
                c.moveTo(0, 0);
                c.quadraticCurveTo(36, -57, tipX, tipY);
                c.quadraticCurveTo(96, -29, 115, 15);
                c.quadraticCurveTo(88, -10, 76, 40);
                c.quadraticCurveTo(50, 9, 37, 54);
                c.quadraticCurveTo(21, 25, 0, 20);
                c.closePath();
                c.fill();
                c.stroke();
                c.shadowBlur =0;

                c.strokeStyle = '#925564';
                c.lineWidth = 1.5;
                for (const [px, py] of [[tipX, tipY], [115, 15], [76, 40], [37, 54]]) {
                    c.beginPath();
                    c.moveTo(0, 6);
                    c.quadraticCurveTo(33, -24, px, py);
                    c.stroke();
                }

                c.strokeStyle = '#e9b3a1';
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(0, 0);
                c.quadraticCurveTo(36, -57, tipX, tipY);
                c.stroke();

                c.restore();
            }
            c.restore();
        }

        // The exact monster sprite is revealed gradually, while eyes appear first.
        if (emerge > 0) {
            c.save();
            c.globalAlpha = emerge;
            const k = 0.84 + 0.16 * emerge;
            c.translate(curX, curY + 10 * (1 - emerge) + Math.sin(t * 1.8) * 3 * rest - Math.sin(this.flapPhase) * Math.hypot(curVx, curVy) / 155 * 3);
            c.rotate(curVx / 155 * 0.30);
            c.scale(1 - Math.abs(curVx) / 155 * 0.08, 1);
            c.scale(k * (1 + Math.sin(emerge * Math.PI) * 0.065), k * (1 - Math.sin(emerge * Math.PI) * 0.035));
            if (typeof drawMonster === 'function') {
                drawMonster(c, t);
            }
            c.restore();
        }

        if (eyes > 0 && emerge < 1) {
            c.save();
            c.globalAlpha = eyes * (1 - emerge);
            c.scale(0.84, 0.84);
            c.translate(0, 10);
            c.shadowColor = '#ffc26d';
            c.shadowBlur = 0;
            c.fillStyle = '#fff0a2';
            for (const side of [-1, 1]) {
                c.beginPath();
                c.moveTo(side * 32, -6);
                c.lineTo(side * 10, -15);
                c.lineTo(side * 13, -1);
                c.closePath();
                c.fill();
            }
            c.restore();
        }

        // Two ragged curtains peel away from the face as the monster steps forward.
        if (tear > 0 && tear < 1) {
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                c.globalAlpha = (1 - tear) * 0.8;
                c.fillStyle = '#080913';
                c.strokeStyle = '#b07da0';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(tear * 104, -80);
                for (let j = 0; j <= 16; j++) {
                    const y = -80 + j * 10, x = tear * 104 + Math.sin(j * 1.9 + t * 5) * 6;
                    c.lineTo(x, y);
                }
                c.quadraticCurveTo(132, 100, 130, -60);
                c.closePath();
                c.fill();
                c.stroke();
                c.restore();
            }
        }

        drawRibbons(true);

        // Molten threads briefly trace the departing shadow tips.
        const flare = S(4, 4.6, t) * (1 - S(5.1, 5.9, t));
        for (let i = 0; i < 12; i++) {
            const A = i * Math.PI / 6 + t * 0.19, r = 110 + emerge * 85;
            const P = [];
            for (let j = 0; j < 10; j++) {
                const u = j / 9;
                P.push(project(Math.cos(A + u * 0.3) * (r + u * 17), Math.sin(A + u * 0.3) * (r + u * 17) * 0.73, Math.sin(A) * 65));
            }
            line(P, i % 3 ? '#ac7b91' : '#f8ca8d', 1.4, flare * 0.5);
        }

        // Dissolving shadows turn to warm embers, travelling outward and upward.
        const ash = S(4.5, 5.25, t) * (1 - S(6.2, 7.6, t));
        for (let i = 0; i < 65; i++) {
            const A = i * 2.399, age = Math.max(0, t - 4.5), r = 65 + age * (12 + i % 7 * 4);
            const P = project(Math.cos(A) * r, Math.sin(A) * r * 0.65 - age * 13, Math.sin(A) * 50);
            c.save();
            c.globalAlpha = ash * (0.2 + 0.6 * Math.pow(Math.sin(i + t * 2), 2));
            c.translate(P.x, P.y);
            c.rotate(A + age);
            c.fillStyle = i % 4 ? '#bc7d76' : '#ffd59b';
            c.fillRect(-1, -1, 1.3 + i % 3, 1.4);
            c.restore();
        }

        c.save();
        c.translate(curX, 136 + curY * 0.25);
        c.scale(1, 0.17);
        c.globalAlpha = emerge;
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 95);
        g.addColorStop(0, '#bd867329');
        g.addColorStop(1, '#00000000');
        c.fillStyle = g;
        c.fillRect(-95, -95, 190, 190);
        c.restore();
        c.restore();
    }
};

// ============================================================================
// 🦇 OYUNDAXİLİ MONS QANADLARININ ÇƏKİLMƏSİ (Drakula Animasiyası Təchiz Edildikdə)
// ============================================================================
function drawDraculaBatWings(c, r, facing = 0, time = 0, player = null) {
    c.save();
    // Hərəkətə uyğun çırpınma fazası (hərəkət edərkən 4 qat sürətli çırpınır)
    const flapPhase = (player && typeof player.flapPhase === 'number') ? player.flapPhase : (time * 6.0);
    const speedRatio = (player && player.speed) ? Math.min(1, Math.hypot(player.vx || 0, player.vy || 0) / player.speed) : 0;
    const vyRatio = (player && player.speed) ? (player.vy || 0) / player.speed : 0;
    const flap = Math.sin(flapPhase);
    const bodyScale = r / 26;
    c.scale(bodyScale, bodyScale);

    // İstifadəçinin kodundakı artırılmış meyllənmə (bank) nisbəti
    const bankNorm = Math.max(-1, Math.min(1, facing / 0.30));

    for (const side of [-1, 1]) {
        c.save();
        c.scale(side, 1);
        const wingFlap = Math.sin(flapPhase + side * bankNorm * 0.4);
        c.translate(22, 6);
        const wingBank = side * bankNorm;

        // TƏKMİLLƏŞDİRİLMİŞ BUCAQ VƏ ASİMMETRİK PİTÇ
        c.rotate(-(0.25 + speedRatio * 0.30) * wingFlap - wingBank * 0.46 + vyRatio * 0.12);
        c.scale((1 + wingFlap * 0.10) * (1 - Math.max(0, wingBank) * 0.32 + Math.max(0, -wingBank) * 0.08), 1);

        const tipX = 90 + wingFlap * (9 + speedRatio * 10);
        const tipY = -45 + wingFlap * (19 + speedRatio * 28) + wingBank * 20;

        const skin = c.createLinearGradient(0, -40, 80, 45);
        skin.addColorStop(0, '#593040');
        skin.addColorStop(0.55, '#2c182d');
        skin.addColorStop(1, '#100e1d');

        c.fillStyle = skin;
        c.strokeStyle = '#ba7886';
        c.lineWidth = 1.6;
        c.lineJoin = 'round';

        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(28, -45, tipX, tipY);
        c.quadraticCurveTo(75, -22, 92, 12);
        c.quadraticCurveTo(70, -8, 60, 32);
        c.quadraticCurveTo(40, 7, 29, 42);
        c.quadraticCurveTo(16, 19, 0, 15);
        c.closePath();
        c.fill();
        c.stroke();

        // Qanad qabırğaları
        c.strokeStyle = '#925564';
        c.lineWidth = 1.3;
        for (const [px, py] of [[tipX, tipY], [92, 12], [60, 32], [29, 42]]) {
            c.beginPath();
            c.moveTo(0, 5);
            c.quadraticCurveTo(26, -18, px, py);
            c.stroke();
        }

        // Qanadın yuxarı qızılı kənarı
        c.strokeStyle = '#e9b3a1';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(28, -45, tipX, tipY);
        c.stroke();

        c.restore();
    }
    c.restore();
}

// 🌟 OYUNDAXİLİ QANADLARDAN TÖKÜLƏN TOZ VƏ ULDUZ ZƏRRƏCİKLƏRİ
function getIngameWingDustPoint(side, player) {
    const r = player.radius || 16;
    const bodyScale = r / 26;
    const flapPhase = player.flapPhase || 0;
    const speed = player.speed ? Math.min(1, Math.hypot(player.vx || 0, player.vy || 0) / player.speed) : 0;
    const vyRatio = player.speed ? (player.vy || 0) / player.speed : 0;
    const bank = side * (player.visualAngle || 0) / 0.30;
    const flap = Math.sin(flapPhase + bank * 0.4);
    const tipX = 90 + flap * (9 + speed * 10);
    const tipY = -45 + flap * (19 + speed * 28) + bank * 20;

    const curves = [
        [[tipX, tipY], [75, -22], [92, 12]],
        [[92, 12], [70, -8], [60, 32]],
        [[60, 32], [40, 7], [29, 42]]
    ];
    const [A, B, C] = curves[Math.floor(Math.random() * 3)];
    const u = Math.random(), v = 1 - u;
    let lx = v * v * A[0] + 2 * v * u * B[0] + u * u * C[0];
    let ly = v * v * A[1] + 2 * v * u * B[1] + u * u * C[1];
    lx *= (1 + flap * 0.10) * (1 - Math.max(0, bank) * 0.32 + Math.max(0, -bank) * 0.08);

    const angle = -(0.25 + speed * 0.30) * flap - bank * 0.46 + vyRatio * 0.12;
    const rx = lx * Math.cos(angle) - ly * Math.sin(angle);
    const ry = lx * Math.sin(angle) + ly * Math.cos(angle);

    const fx = side * (rx + 22) * bodyScale;
    const fy = (ry + 6) * bodyScale;

    const tilt = player.visualAngle || 0;
    return {
        x: player.x + fx * Math.cos(tilt) - fy * Math.sin(tilt),
        y: player.y + fx * Math.sin(tilt) + fy * Math.cos(tilt)
    };
}

function drawIngameWingDust(c, dustList) {
    if (!dustList || dustList.length === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < dustList.length; i++) {
        const p = dustList[i];
        const age = 1 - p.life / p.maxLife;
        const alpha = Math.min(1, age * 10) * Math.pow(1 - age, 1.3);
        if (alpha <= 0.01) continue;

        const r = p.size * (0.65 + 0.35 * Math.sin(age * 8 + p.angle));
        c.globalAlpha = alpha;
        c.fillStyle = p.color;

        c.beginPath();
        if (p.star) {
            const s1 = r * 2.0;
            const s2 = r * 0.5;
            c.moveTo(p.x, p.y - s1);
            c.lineTo(p.x + s2, p.y - s2);
            c.lineTo(p.x + s1, p.y);
            c.lineTo(p.x + s2, p.y + s2);
            c.lineTo(p.x, p.y + s1);
            c.lineTo(p.x - s2, p.y + s2);
            c.lineTo(p.x - s1, p.y);
            c.lineTo(p.x - s2, p.y - s2);
            c.closePath();
        } else {
            c.arc(p.x, p.y, r, 0, Math.PI * 2);
        }
        c.fill();
    }
    c.restore();
}

// Qlobal qeydiyyat
if (typeof window !== 'undefined') {
    window.DraculaSpawnEffect = DraculaSpawnEffect;
    window.drawDraculaBatWings = drawDraculaBatWings;
    window.getIngameWingDustPoint = getIngameWingDustPoint;
    window.drawIngameWingDust = drawIngameWingDust;
    if (window.SpawnEffectRegistry) {
        window.SpawnEffectRegistry.register('dracula', DraculaSpawnEffect);
    }
}
