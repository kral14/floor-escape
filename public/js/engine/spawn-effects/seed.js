// ============================================================================
// 🌸 DOĞULUŞ ANİMASİYASI 5: YAŞAM ÇİÇƏYİ (MONS / TIME SEED)
// İstifadəçinin təqdim etdiyi orijinal riyazi və vizual kod DƏYİŞMƏDƏN
// Xüsusiyyət: Monsa +1 Əlavə Can (Life Flower Perk) və qoruyucu aura bəxş edir!
// ============================================================================

const SeedSpawnEffect = {
    id: 'seed',
    name: 'Yaşam Çiçəyi',
    title: 'Time Seed',
    icon: 'fa-seedling',
    fallbackIcon: 'fa-leaf',
    color: '#62e6a0',
    glowColor: '#ffe3a0',
    badge: '🌸 Yaşam Çiçəyi (+1 Can)',
    desc: 'Zaman toxumu cücərir, qoruyucu sarmaşıqlar və yaşam çiçəkləri Monsu əhatəyə alaraq +1 əlavə can bəxş edir.',
    costType: 'redDiamonds',
    cost: 45,
    duration: 8.6,

    // İdarəetmə, fizika, çiçək vəziyyəti və ləçək zərrəcikləri
    vx: 0,
    vy: 0,
    x: 0,
    y: 0,
    interactive: false,
    trail: [],
    budget: 0,
    keys: {},
    flowerState: 'active', // 'active' | 'withering' | 'removed'
    witherAge: 0,
    frozenFlowerTime: 0,
    effectTime: 0,
    healthGranted: false,
    _controlsSetup: false,
    _lastT: 0,

    resetFlight() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.keys = {};
        this.trail = [];
        this.budget = 0;
        this._lastT = 0;
    },

    resetLifeFlower() {
        this.flowerState = 'active';
        this.witherAge = 0;
        this.frozenFlowerTime = 0;
        this.effectTime = 0;
        this.healthGranted = false;
        this.resetFlight();
    },

    // === LIFE FLOWER REMOVAL API (İstifadəçinin tələb etdiyi solma mexanizmi) ===
    consumeLifeFlower() {
        if (!this.healthGranted || this.flowerState !== 'active') {
            // Hələ bonus verilməyibsə də oyundaxili zərbə anında aktiv et
            if (this.flowerState === 'active') {
                this.healthGranted = true;
            } else {
                return false;
            }
        }
        this.flowerState = 'withering';
        this.witherAge = 0;
        this.frozenFlowerTime = this.effectTime || 7.0;
        this.trail = [];
        return true;
    },

    updateLifeFlower(dt) {
        if (this.flowerState !== 'withering') return;
        this.witherAge += dt;
        if (this.witherAge >= 2.8) {
            this.witherAge = 2.8;
            this.flowerState = 'removed';
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('life-flower-removed', { detail: { source: 'life-flower' } }));
            }
        }
    },

    flowerDecay() {
        return this.flowerState === 'active' ? 0 : Math.min(1, this.witherAge / 2.8);
    },

    setupControls() {
        if (this._controlsSetup) return;
        this._controlsSetup = true;
        window.addEventListener('keydown', (e) => {
            if (!this.interactive) return;
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
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

    flowerPose(i, t) {
        if (this.flowerState !== 'active') t = this.frozenFlowerTime;
        const clock = Math.max(0, t - 5.65);
        const curVx = this.interactive ? this.vx : 0;
        const curVy = this.interactive ? this.vy : 0;
        const speed = Math.min(1, Math.hypot(curVx, curVy) / 145);
        const orbit = i * Math.PI / 2 + clock * 0.48;
        const gust = Math.sin(clock * 1.15 + i * 0.8) * Math.sin(clock * 0.43 + 1.2);
        const radius = 99 + Math.sin(clock * 0.85 + i * 1.7) * 13 + gust * (9 + speed * 9);
        const driftX = Math.sin(clock * 1.6 + i * 2.1) * 7 - curVx / 145 * 12;
        const driftY = Math.cos(clock * 1.35 + i) * 8 - curVy / 145 * 7;
        const depth = Math.sin(orbit), k = 1 + depth * 0.12;
        return {
            x: Math.cos(orbit) * radius + driftX,
            y: 12 + Math.sin(orbit) * radius * 0.63 + driftY + this.flowerDecay() * 27,
            depth,
            scale: k,
            wind: gust,
            angle: this.flowerDecay() * 0.9 + Math.sin(clock * 1.8 + i) * 0.24 + gust * 0.25 + curVx / 145 * 0.13
        };
    },

    flowerWorld(i, t) {
        const p = this.flowerPose(i, t);
        const curVx = this.interactive ? this.vx : 0;
        const a = curVx / 145 * 0.13;
        const bob = Math.sin(t * 1.8) * 3;
        const curX = this.interactive ? this.x : 0;
        const curY = this.interactive ? this.y : 0;
        return {
            x: curX + p.x * Math.cos(a) - p.y * Math.sin(a),
            y: curY + bob + p.x * Math.sin(a) + p.y * Math.cos(a)
        };
    },

    updateFlight(dt, t, w, h) {
        if (!this.interactive) {
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.keys = {};
            this.trail = [];
            return;
        }
        let dx = (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) - (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0);
        let dy = (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0) - (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0);
        if (t < 6.2) dx = dy = 0;
        const len = Math.hypot(dx, dy) || 1;
        const e = 1 - Math.exp(-dt * 8);
        this.vx += (dx / len * 145 - this.vx) * e;
        this.vy += (dy / len * 145 - this.vy) * e;

        const scale = Math.min(w / 700, h / 510);
        const lx = Math.max(0, w / scale / 2 - 150);
        const ly = Math.max(0, h / scale * 0.44 - 110);
        const oldX = this.x, oldY = this.y;
        this.x = Math.max(-lx, Math.min(lx, this.x + this.vx * dt));
        this.y = Math.max(-ly, Math.min(ly, this.y + this.vy * dt));

        for (const p of this.trail) {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.angle += dt * p.spin;
        }
        this.trail = this.trail.filter(p => p.life > 0);

        const speed = dt ? Math.hypot(this.x - oldX, this.y - oldY) / dt : 0;
        if (this.flowerState === 'active' && t >= 6.2 && speed > 5) {
            this.budget += dt * 35 * Math.min(1, speed / 145);
            while (this.budget >= 1) {
                this.budget--;
                const angle = Math.random() * Math.PI * 2;
                const life = 0.8 + Math.random() * 0.6;
                const tip = this.flowerWorld(Math.floor(Math.random() * 4), t);
                this.trail.push({
                    x: tip.x + Math.cos(angle) * 9,
                    y: tip.y + Math.sin(angle) * 9,
                    vx: -this.vx * 0.1 + (Math.random() - 0.5) * 12,
                    vy: 10 + Math.random() * 13,
                    life,
                    max: life,
                    angle,
                    spin: (Math.random() - 0.5) * 3,
                    petal: Math.random() < 0.65
                });
            }
        } else {
            this.budget = 0;
        }
        if (this.trail.length > 90) this.trail.splice(0, this.trail.length - 90);
    },

    staticSmooth(a, b, t) {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
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
        this.effectTime = t;

        if (t < 0.2 || isIngame) {
            if (!this.interactive) {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
                this.trail = [];
                this.budget = 0;
            }
        }

        this.updateLifeFlower(dt);
        this.updateFlight(dt, t, w, h);

        // +1 Can hadisəsi (t >= 6.2 çatdıqda 1 dəfə verilir)
        if (t >= 6.2 && !this.healthGranted) {
            this.healthGranted = true;
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('mons-health-bonus', { detail: { amount: 1, source: 'life-flower' } }));
            }
        }

        const curX = this.interactive ? this.x : 0;
        const curY = this.interactive ? this.y : 0;
        const curVx = this.interactive ? this.vx : 0;
        const curVy = this.interactive ? this.vy : 0;

        const sc = Math.min(w / 700, h / 510);
        c.save();
        c.translate(w / 2, h * 0.49);
        c.scale(sc, sc);

        const seed = S(0.5, 1.3, t);
        const roots = S(1.2, 2.7, t);
        const bud = S(2.1, 3.6, t);
        const opening = S(4.25, 5.8, t);
        const change = S(5.55, 6.8, t);
        const arrival = S(5.15, 6.1, t);

        function project(x, y, z) {
            const angle = 0.25 + Math.sin(t * 0.24) * 0.12;
            const X = x * Math.cos(angle) + z * Math.sin(angle);
            const Z = -x * Math.sin(angle) + z * Math.cos(angle);
            const k = 550 / (550 - Z);
            return { x: X * k, y: y * k, z: Z, k };
        }

        function line(P, col, lw, alpha) {
            c.save();
            c.globalAlpha = Math.max(0, alpha);
            c.strokeStyle = col;
            c.lineWidth = lw;
            c.lineCap = 'round';
            c.beginPath();
            P.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
            c.stroke();
            c.restore();
        }

        function glow(x, y, r, col, alpha) {
            c.save();
            c.globalAlpha = alpha;
            const g = c.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, col);
            g.addColorStop(1, '#00000000');
            c.fillStyle = g;
            c.fillRect(x - r, y - r, 2 * r, 2 * r);
            c.restore();
        }

        const sy = -150 + seed * 245;
        glow(0, sy, 24, '#ffe08e99', 1 - S(2.4, 3.2, t));
        c.save();
        c.globalAlpha = 1 - S(2.4, 3.2, t);
        c.translate(0, sy);
        c.rotate(seed * 1.7);
        c.fillStyle = '#ffe3a0';
        c.beginPath();
        c.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // Branching roots grow along curves, never appearing all at once.
        for (let i = 0; i < 9; i++) {
            const growth = S(1.2 + i * 0.055, 2.4 + i * 0.05, t);
            const P = [];
            const A = i * 2.399;
            for (let j = 0; j <= 48 * growth; j++) {
                const u = j / 48, r = u * 160;
                P.push(project(Math.cos(A + u * 0.7) * r, 95 + Math.sin(u * 4 + i) * u * 17, Math.sin(A + u * 0.7) * r));
            }
            if (P.length) {
                line(P, '#3fab7b', 2, roots * (1 - change));
                line(P, '#dfd28a', 0.65, roots * (1 - change));
                const tip = P[P.length - 1];
                glow(tip.x, tip.y, 6, '#dfffcaaa', roots * (1 - growth));
            }
            for (let k = 1; k < 4; k++) {
                const g = S(1.65 + k * 0.15, 2.5 + k * 0.12, t);
                if (g <= 0) continue;
                const r = k * 29, branch = [];
                for (let j = 0; j <= 12 * g; j++) {
                    const u = j / 12;
                    branch.push(project(Math.cos(A + 0.3) * r + Math.cos(A + 1) * u * 24, 95 + u * 8, Math.sin(A + 0.3) * r + Math.sin(A + 1) * u * 24));
                }
                line(branch, '#89c688', 0.7, (1 - change) * 0.6);
            }
        }

        const pulse = (Math.exp(-Math.pow((t - 3.65) / 0.14, 2)) + Math.exp(-Math.pow((t - 4.05) / 0.14, 2))) * 0.5;
        glow(0, 0, 120, '#62e6a03c', bud * (1 - change) + pulse);

        // Eight translucent curved petals are projected and ordered by depth.
        const petals = [];
        for (let i = 0; i < 8; i++) {
            const A = i * Math.PI / 4, open = S(4.25 + i * 0.09, 5.25 + i * 0.08, t), grow = S(2.1 + i * 0.075, 3.3 + i * 0.035, t), P = [];
            function petal(u, v) {
                const width = Math.pow(Math.sin(u * Math.PI), 0.72) * 48, rad = 12 + Math.sin(u * Math.PI) * 61 + open * u * 99, y = 96 - u * 195 * (1 - open * 0.65);
                return project(Math.cos(A) * rad + Math.cos(A + Math.PI / 2) * v * width, y, Math.sin(A) * rad + Math.sin(A + Math.PI / 2) * v * width);
            }
            for (let j = 0; j < 20; j++) {
                if (j / 20 > grow) continue;
                const u = j / 20, v = Math.min(grow, (j + 1) / 20);
                P.push([petal(u, -1), petal(u, 1), petal(v, 1), petal(v, -1)]);
            }
            petals.push({ P, i, z: Math.sin(A), open, petal, grow });
        }
        petals.sort((a, b) => a.z - b.z);

        function drawPetals(front) {
            for (const f of petals) {
                if ((f.z >= 0) !== front) continue;
                c.save();
                c.globalAlpha = bud * (1 - change);
                const gradient = c.createLinearGradient(0, -110, 0, 130);
                gradient.addColorStop(0, '#ffe9b1');
                gradient.addColorStop(0.26, front ? '#b9e9aa' : '#83bd94');
                gradient.addColorStop(0.65, front ? '#57a879' : '#34745e');
                gradient.addColorStop(1, '#193f38');
                const outline = [];
                for (let j = 0; j <= 48 * f.grow; j++) outline.push(f.petal(j / 48, -1));
                for (let j = Math.floor(48 * f.grow); j >= 0; j--) outline.push(f.petal(j / 48, 1));
                c.fillStyle = gradient;
                c.beginPath();
                outline.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
                c.closePath();
                c.fill();
                line(outline, '#caedaf', 0.7, bud * (1 - change) * 0.45);
                for (const v of [-0.48, 0, 0.48]) {
                    const vein = [];
                    for (let j = 0; j <= 36 * f.grow; j++) vein.push(f.petal(j / 36, v * Math.sin(j / 36 * Math.PI)));
                    line(vein, '#e3f4be', 0.65, bud * (1 - change) * 0.17);
                }
                c.restore();
            }
        }

        // Life flowers remain around the monster; depth controls which pass behind it.
        const decay = this.flowerDecay();
        const blessing = S(5.65, 6.6, t) * (1 - S(0.62, 1, decay));
        const dryColor = (fresh, dry) => {
            const u = S(0, 0.65, decay);
            const a = fresh.match(/\w\w/g).map(x => parseInt(x, 16));
            const b = dry.match(/\w\w/g).map(x => parseInt(x, 16));
            return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',') + ')';
        };

        const self = this;
        function lifeFlowers(front) {
            c.save();
            c.translate(curX, curY + Math.sin(t * 1.8) * 3);
            c.rotate(curVx / 145 * 0.13);
            c.globalAlpha = blessing;
            if (!front) {
                // A woven cradle directly supports the bottom of the monster.
                for (let j = 0; j < 4; j++) {
                    c.strokeStyle = j % 2 ? dryColor('#82bb70', '#8b7150') : dryColor('#397e58', '#51412f');
                    c.lineWidth = j % 2 ? 2 : 4;
                    c.beginPath();
                    c.moveTo(-65, 58 + j * 3);
                    c.bezierCurveTo(-38, 76 - j * 3, 35, 76 + j * 2, 65, 58 + j * 3);
                    c.stroke();
                }
                for (let i = 0; i < 4; i++) {
                    const p = self.flowerPose(i, t), side = p.x < 0 ? -1 : 1;
                    c.strokeStyle = dryColor('#438a5c', '#6b5237');
                    c.lineWidth = 3;
                    c.beginPath();
                    c.moveTo(side * 30, 66);
                    c.bezierCurveTo(side * (68 + p.wind * 12), 94 + p.wind * 9, p.x - side * 26 + p.wind * 15, p.y + 30, p.x, p.y);
                    c.stroke();
                    c.strokeStyle = '#a9d38a';
                    c.lineWidth = 0.8;
                    c.stroke();
                    c.save();
                    c.translate(side * 64, 67);
                    c.rotate(side * 0.35);
                    c.fillStyle = dryColor('#73b775', '#806744');
                    c.beginPath();
                    c.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
                    c.fill();
                    c.restore();
                }
            }
            for (let i = 0; i < 4; i++) {
                const p = self.flowerPose(i, t);
                if ((p.depth >= 0) !== front) continue;
                c.save();
                c.translate(p.x, p.y);
                c.scale(p.scale, p.scale);
                c.rotate(p.angle);
                for (let j = 0; j < 6; j++) {
                    c.save();
                    c.rotate(j * Math.PI / 3);
                    c.translate(0, decay * 12);
                    c.scale(1 - decay * 0.6, 1 - decay * 0.35);
                    const g = c.createLinearGradient(0, 0, 0, -19);
                    g.addColorStop(0, dryColor('#eed28d', '#765536'));
                    g.addColorStop(0.45, dryColor('#f1f2c7', '#a08558'));
                    g.addColorStop(1, dryColor('#a9e4b2', '#624934'));
                    c.fillStyle = g;
                    c.beginPath();
                    c.ellipse(0, -9, 5.5, 10, 0, 0, Math.PI * 2);
                    c.fill();
                    c.restore();
                }
                c.shadowColor = '#ffdf87';
                c.shadowBlur = 8 * (1 - decay);
                c.fillStyle = dryColor('#ffe09a', '#785332');
                c.beginPath();
                c.arc(0, 0, 4, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }
            c.restore();
        }

        // Petals and healing sparks detach from the moving flower aura.
        for (const p of this.trail) {
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.angle);
            c.globalAlpha = Math.pow(p.life / p.max, 1.3);
            c.fillStyle = p.petal ? '#c4ecab' : '#b6ffce';
            c.shadowColor = '#93e9a5';
            c.shadowBlur = p.petal ? 0 : 7;
            if (p.petal) {
                c.beginPath();
                c.ellipse(0, 0, 4.5, 2, 0, 0, Math.PI * 2);
                c.fill();
            } else {
                c.fillRect(-3, -0.7, 6, 1.4);
                c.fillRect(-0.7, -3, 1.4, 6);
            }
            c.restore();
        }

        lifeFlowers(false);
        drawPetals(false);

        if (arrival > 0) {
            c.save();
            c.globalAlpha = arrival;
            const k = 0.6 + arrival * 0.4;
            c.translate(curX, curY + 20 * (1 - arrival) + Math.sin(t * 1.8) * 3 * arrival);
            c.rotate(curVx / 145 * 0.13);
            c.scale(k, k);
            if (typeof drawMonster === 'function') {
                drawMonster(c, t);
            }
            c.restore();
        }

        drawPetals(true);
        lifeFlowers(true);

        // +1, +2 və ya +3 CAN UÇAN PARLAQ MƏTNİ
        const bonus = S(6.05, 6.3, t) * (1 - S(7.3, 8.2, t));
        if (bonus > 0 && this.flowerState === 'active') {
            const bonusCount = (typeof getMaxLifeFlowers === 'function') ? getMaxLifeFlowers() : (typeof permUpgrades !== 'undefined' && permUpgrades.seedLifeLvl ? permUpgrades.seedLifeLvl : 1);
            c.save();
            c.globalAlpha = bonus;
            c.font = "600 19px system-ui, -apple-system, sans-serif";
            c.textAlign = "center";
            c.fillStyle = "#d8ffba";
            c.shadowColor = "#85eb95";
            c.shadowBlur = 12;
            c.fillText(`+${bonusCount} CAN`, curX, curY - 108 - Math.max(0, t - 6.1) * 13);
            c.restore();
        }

        // Open petals turn into golden-green butterflies and fly away in depth.
        for (let i = 0; i < 8; i++) {
            const born = S(5.55 + i * 0.07, 6.15 + i * 0.07, t);
            if (born <= 0) continue;
            const age = Math.max(0, t - 5.55 - i * 0.07);
            const A = i * Math.PI / 4, r = 115 + age * 37;
            const P = project(Math.cos(A) * r, 18 - age * (28 + i % 3 * 8) + Math.sin(t * 2 + i) * 9, Math.sin(A) * r);
            c.save();
            c.globalAlpha = born * (1 - S(7, 8.5, t));
            c.translate(P.x, P.y);
            c.rotate(Math.sin(A) * 0.4);
            c.scale(P.k, P.k);
            const flap = 0.22 + 0.78 * Math.abs(Math.sin(t * 9 + i));
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side * flap, 1);
                c.fillStyle = i % 2 ? '#e4ca85' : '#8befb6';
                c.shadowColor = '#d3ffc3';
                c.shadowBlur = 7;
                c.beginPath();
                c.moveTo(0, 0);
                c.bezierCurveTo(15, -22, 28, -13, 19, 1);
                c.bezierCurveTo(25, 18, 6, 17, 0, 0);
                c.fill();
                c.restore();
            }
            c.fillStyle = '#f9e8ba';
            c.fillRect(-1, -5, 2, 13);
            c.restore();
        }

        for (let i = 0; i < 35; i++) {
            const age = Math.max(0, t - 5.7);
            const A = i * 2.399, r = 85 + age * 20;
            c.globalAlpha = S(5.7, 6.3, t) * (1 - S(7, 8.5, t)) * 0.5;
            c.fillStyle = '#e6da9c';
            c.fillRect(Math.cos(A) * r, Math.sin(A) * r * 0.65 - age * 17, 1.5, 1.5);
        }

        c.restore();
    }
};

// ============================================================================
// 🌸 OYUNDAXİLİ MONS ƏTRAFINDA YAŞAM ÇİÇƏKLƏRİ VƏ BEŞİK (front / back)
// ============================================================================
function drawIngameLifeFlowers(c, player, time, front) {
    if (!player) return;
    const isEquipped = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'seed');
    if (!isEquipped && !player.hasLifeFlower && player.lifeFlowerState !== 'withering') return;

    const decay = (player.lifeFlowerState === 'withering') ? Math.min(1, (player.lifeFlowerWitherAge || 0) / 2.8) : (player.hasLifeFlower ? 0 : 1);
    if (decay >= 1) return; // Tam solub yox olub

    const alpha = (1 - decay * 0.85);
    const S = (a, b, val) => {
        const x = Math.max(0, Math.min(1, (val - a) / (b - a)));
        return x * x * (3 - 2 * x);
    };
    const dryColor = (fresh, dry) => {
        const u = S(0, 0.65, decay);
        const a = fresh.match(/\w\w/g).map(x => parseInt(x, 16));
        const b = dry.match(/\w\w/g).map(x => parseInt(x, 16));
        return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',') + ')';
    };

    const r = player.radius || 16;
    const bodyScale = r / 26;
    const speedRatio = (player.speed) ? Math.min(1, Math.hypot(player.vx || 0, player.vy || 0) / player.speed) : 0;
    const tilt = player.visualAngle || 0;
    const clock = time * 1.5;

    c.save();
    c.translate(player.x, player.y);
    c.rotate(tilt);
    c.scale(bodyScale, bodyScale);
    c.globalAlpha = alpha;

    if (!front) {
        // Qoruyucu sarmaşıq beşiyi (arxa plan)
        for (let j = 0; j < 4; j++) {
            c.strokeStyle = j % 2 ? dryColor('#82bb70', '#8b7150') : dryColor('#397e58', '#51412f');
            c.lineWidth = (j % 2 ? 1.8 : 3.2) * (1 - decay * 0.4);
            c.beginPath();
            c.moveTo(-48, 38 + j * 2.5);
            c.bezierCurveTo(-28, 52 - j * 2.5, 26, 52 + j * 1.8, 48, 38 + j * 2.5);
            c.stroke();
        }
        for (let i = 0; i < 4; i++) {
            const orbit = i * Math.PI / 2 + clock * 0.48;
            const fx = Math.cos(orbit) * 65;
            const fy = 10 + Math.sin(orbit) * 38 + decay * 20;
            const side = fx < 0 ? -1 : 1;
            c.strokeStyle = dryColor('#438a5c', '#6b5237');
            c.lineWidth = 2.4 * (1 - decay * 0.3);
            c.beginPath();
            c.moveTo(side * 22, 46);
            c.bezierCurveTo(side * 48, 64, fx - side * 18, fy + 20, fx, fy);
            c.stroke();
            c.strokeStyle = '#a9d38a';
            c.lineWidth = 0.7;
            c.stroke();
        }
    }

    // 4 Ədəd Zəngin Orbital Yaşam Çiçəyi (Orijinal estetik qorunur)
    for (let i = 0; i < 4; i++) {
        const orbit = i * Math.PI / 2 + clock * 0.48;
        const depth = Math.sin(orbit);
        if ((depth >= 0) !== front) continue;

        const fx = Math.cos(orbit) * (65 + Math.sin(clock * 1.7 + i) * 6);
        const fy = 10 + Math.sin(orbit) * 38 + decay * 20;
        const scale = (1 + depth * 0.12) * (1 - decay * 0.4);
        const flowerAngle = decay * 0.9 + Math.sin(clock * 1.8 + i) * 0.24 + tilt * 0.5;

        c.save();
        c.translate(fx, fy);
        c.scale(scale, scale);
        c.rotate(flowerAngle);

        for (let j = 0; j < 6; j++) {
            c.save();
            c.rotate(j * Math.PI / 3);
            c.translate(0, decay * 8);
            c.scale(1 - decay * 0.55, 1 - decay * 0.35);
            const g = c.createLinearGradient(0, 0, 0, -15);
            g.addColorStop(0, dryColor('#eed28d', '#765536'));
            g.addColorStop(0.45, dryColor('#f1f2c7', '#a08558'));
            g.addColorStop(1, dryColor('#a9e4b2', '#624934'));
            c.fillStyle = g;
            c.beginPath();
            c.ellipse(0, -7, 4.2, 7.5, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
        c.shadowColor = '#ffdf87';
        c.shadowBlur = 6 * (1 - decay);
        c.fillStyle = dryColor('#ffe09a', '#785332');
        c.beginPath();
        c.arc(0, 0, 3.2, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    c.restore();
}

// Qlobal qeydiyyat
if (typeof window !== 'undefined') {
    window.SeedSpawnEffect = SeedSpawnEffect;
    window.TimeSeedSpawnEffect = SeedSpawnEffect;
    window.drawIngameLifeFlowers = drawIngameLifeFlowers;
    if (window.SpawnEffectRegistry) {
        window.SpawnEffectRegistry.register('seed', SeedSpawnEffect);
    }
}
