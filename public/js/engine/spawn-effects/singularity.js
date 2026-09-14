// ============================================================================
// 🌀 KİBER SİNQULYARLIQ (CYBER SINGULARITY) — RƏSMİ MÜHƏRRİK
// İstifadəçinin orijinal 3D Euler perspektiv, RingFX, Stellar Missile və
// Sıfırdan Doğuluş (Zero-to-Hero Singularity Birth) Tam Arxitekturası
// ============================================================================

(function() {
    /* 1. Web Audio Sound Synthesizer (Zero External Assets) */
    class CyberAudioEngine {
        constructor() {
            this.ctx = null;
        }
        init() {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) this.ctx = new AudioContextClass();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
        playSpark() {
            if (!this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, t);
                osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.15);
            } catch (e) {}
        }
        playRingLock() {
            if (!this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(540, t);
                osc.frequency.exponentialRampToValueAtTime(1080, t + 0.22);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.22);
            } catch (e) {}
        }
        playStarDetach() {
            if (!this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(750, t);
                osc.frequency.exponentialRampToValueAtTime(220, t + 0.24);
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.24);
            } catch (e) {}
        }
        playShatter() {
            if (!this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
                noise.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(t);
            } catch (e) {}
        }
    }
    const cyberAudio = new CyberAudioEngine();

    /* 2. Mathematical Utilities & 3D Euler Perspective */
    const MathUtils = {
        clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
        smooth: (a, b, t) => {
            if (a === b) return t >= b ? 1 : 0;
            const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
            return x * x * (3 - 2 * x);
        },
        randomRange: (min, max) => min + Math.random() * (max - min),
        lerp: (a, b, t) => a + (b - a) * t
    };
    if (typeof window !== 'undefined') window.MathUtils = MathUtils;
    if (typeof global !== 'undefined') global.MathUtils = MathUtils;

    const Math3D = {
        fov: 460,
        project(x, y, z, rx, ry, rz) {
            // Pitch (X)
            const cosX = Math.cos(rx), sinX = Math.sin(rx);
            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            // Roll / Yaw (Y)
            const cosY = Math.cos(ry), sinY = Math.sin(ry);
            const x2 = x * cosY + z1 * sinY;
            const z2 = -x * sinY + z1 * cosY;
            // Bank (Z)
            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
            const x3 = x2 * cosZ - y1 * sinZ;
            const y3 = x2 * sinZ + y1 * cosZ;
            // Perspective foreshortening
            const depth = this.fov + z2;
            const k = depth > 20 ? this.fov / depth : 1;
            return { x: x3 * k, y: y3 * k, z: z2, k };
        }
    };

    /* 3. Cyber Ring Renderer (3D Wings, Hollow Frame, Dials, Crystals) */
    const THEME_PALETTES = {
        singularity: { glow: '#38bdf8', core: '#00f0ff', base: 'rgba(6, 182, 212, 0.7)', accent: '#e0f2fe', trail: '#0284c7' },
        supernova:   { glow: '#fbbf24', core: '#f59e0b', base: 'rgba(245, 158, 11, 0.7)', accent: '#fffbeb', trail: '#ea580c' },
        synapse:     { glow: '#c084fc', core: '#a855f7', base: 'rgba(168, 85, 247, 0.7)', accent: '#faf5ff', trail: '#7e22ce' },
        abyssal:     { glow: '#2dd4bf', core: '#14b8a6', base: 'rgba(20, 184, 166, 0.7)', accent: '#f0fdfa', trail: '#0f766e' }
    };

    const ReferenceRingFX = {
      draw3DRing(ctx, radius, rx, ry, rz, color, glow, lineWidth, dash = [], alpha = 1, segments = 56) {
        const pts = [];
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const px = Math.cos(a) * radius;
          const py = Math.sin(a) * radius;
          pts.push(Math3D.project(px, py, 0, rx, ry, rz));
        }

        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 10;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        if (dash.length) ctx.setLineDash(dash);

        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();
      },

      drawRings(ctx, time, config, speedFactor = 0, ringAngles = null, rot3D = { rx: 0, ry: 0, rz: 0 }) {
        ctx.save();
        const { baseColor, glowColor, accentColor } = config;
        const speed = Math.max(0, Math.min(1.2, speedFactor));
        const { rx, ry, rz } = rot3D;

        const rAngle1 = ringAngles ? ringAngles.r1 : time * 0.5;
        const rAngle2 = ringAngles ? ringAngles.r2 : -time * 0.35;
        const rAngle3 = ringAngles ? ringAngles.r3 : time * 0.2;

        const glowBoost = speed * 24;
        const extraW = speed * 1.5;

        // Dynamic 3D Flight Wingtips (projects in true 3D to show orientation)
        const leftWingTip = Math3D.project(-180 - speed * 20, 0, 0, rx, ry, rz);
        const leftWingBase = Math3D.project(-135, 0, 0, rx, ry, rz);
        const rightWingTip = Math3D.project(180 + speed * 20, 0, 0, rx, ry, rz);
        const rightWingBase = Math3D.project(135, 0, 0, rx, ry, rz);
        const noseVector = Math3D.project(0, -165, 0, rx, ry, rz);

        ctx.save();
        ctx.strokeStyle = accentColor || '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 + glowBoost;
        ctx.lineWidth = (2 + extraW) * leftWingTip.k;
        ctx.globalAlpha = Math.min(0.95, 0.45 + speed * 0.4);

        ctx.beginPath();
        ctx.moveTo(leftWingTip.x, leftWingTip.y);
        ctx.lineTo(leftWingBase.x, leftWingBase.y);
        ctx.stroke();

        ctx.lineWidth = (2 + extraW) * rightWingTip.k;
        ctx.beginPath();
        ctx.moveTo(rightWingTip.x, rightWingTip.y);
        ctx.lineTo(rightWingBase.x, rightWingBase.y);
        ctx.stroke();

        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(noseVector.x, noseVector.y, (3.5 + speed * 2) * noseVector.k, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 1. Inner fast-spinning 3D notched telemetry ring
        this.draw3DRing(ctx, 54, rx, ry, rz + rAngle1, baseColor, glowColor, (1.4 + extraW), [8, 6, 2, 6], 0.65 + speed * 0.3);

        // 8 Radial tick marks in 3D
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + rAngle1;
          const p1 = Math3D.project(Math.cos(a) * 50, Math.sin(a) * 50, 0, rx, ry, rz);
          const p2 = Math3D.project(Math.cos(a) * (58 + speed * 5), Math.sin(a) * (58 + speed * 5), 0, rx, ry, rz);
          ctx.save();
          ctx.strokeStyle = baseColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 4 + glowBoost * 0.5;
          ctx.lineWidth = (1.5 + extraW) * p1.k;
          ctx.globalAlpha = Math.min(1, 0.75 + speed * 0.25);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Mid-orbit 3D counter-rotating segmented compass ring
        this.draw3DRing(ctx, 105, rx, ry, rz + rAngle2, glowColor, glowColor, (1.8 + extraW), [28, 14, 8, 14], 0.7 + speed * 0.3);

        // 4 Cardinal 3D Diamond Beads
        const beadSize = (6.5 + speed * 3.5);
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2 + rAngle2;
          const bead = Math3D.project(Math.cos(a) * 105, Math.sin(a) * 105, 0, rx, ry, rz);
          ctx.save();
          ctx.fillStyle = accentColor || '#ffffff';
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12 + glowBoost;
          ctx.globalAlpha = Math.min(1, 0.8 + speed * 0.2);
          ctx.beginPath();
          const sz = beadSize * bead.k;
          ctx.moveTo(bead.x, bead.y - sz);
          ctx.lineTo(bead.x + sz, bead.y);
          ctx.lineTo(bead.x, bead.y + sz);
          ctx.lineTo(bead.x - sz, bead.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // 3. Outer delicate 3D celestial coordinate ring
        this.draw3DRing(ctx, 162, rx, ry, rz + rAngle3, baseColor, glowColor, (1.0 + extraW * 0.6), [48, 14, 14, 14], 0.45 + speed * 0.35);

        // 24 perimeter dials projected in 3D
        for (let k = 0; k < 24; k++) {
          const a = (k * Math.PI) / 12 + rAngle3;
          const isMajor = k % 6 === 0;
          const len = (isMajor ? 8 : 4) + speed * 3;
          const p1 = Math3D.project(Math.cos(a) * (162 - len), Math.sin(a) * (162 - len), 0, rx, ry, rz);
          const p2 = Math3D.project(Math.cos(a) * (162 + len), Math.sin(a) * (162 + len), 0, rx, ry, rz);
          ctx.save();
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = (1 + extraW * 0.4) * p1.k;
          ctx.globalAlpha = Math.min(0.9, 0.4 + speed * 0.4);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }
    };

    const CyberRingRenderer = {
        draw3DPolyline(ctx, pts, color, glow, lineWidth, dash = [], alpha = 1) {
            if (!pts || !pts.length) return;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.shadowColor = glow;
            ctx.shadowBlur = 10;
            ctx.lineWidth = Math.max(0.5, lineWidth);
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            if (dash && dash.length) ctx.setLineDash(dash);
            ctx.beginPath();
            pts.forEach((p, idx) => {
                if (idx === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.restore();
        },

        draw3DRingArc(ctx, radius, rx, ry, rz, startAngle, endAngle, color, glow, lineWidth, dash = [], alpha = 1, segs = 36) {
            const pts = [];
            for (let i = 0; i <= segs; i++) {
                const a = startAngle + (i / segs) * (endAngle - startAngle);
                const px = Math.cos(a) * radius;
                const py = Math.sin(a) * radius;
                pts.push(Math3D.project(px, py, 0, rx, ry, rz));
            }
            this.draw3DPolyline(ctx, pts, color, glow, lineWidth, dash, alpha);
        },

        renderSystem(ctx, t, rot3D, speedFactor, ringAngles, assemblyRatio, themeKey = 'singularity') {
            const pal = THEME_PALETTES[themeKey] || THEME_PALETTES.singularity;
            const progress = MathUtils.clamp(assemblyRatio, 0, 1);
            if (progress <= 0) return;
            ctx.save();
            ctx.scale(progress, progress);
            ReferenceRingFX.drawRings(ctx, t, {
                baseColor: pal.base, glowColor: pal.glow, accentColor: pal.accent
            }, speedFactor, ringAngles, rot3D);
            // Keep the reference photon ring hollow so the equipped skin stays visible.
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.strokeStyle = pal.glow;
            ctx.shadowColor = pal.glow;
            ctx.shadowBlur = 18;
            ctx.lineWidth = 3.5;
            ctx.stroke();
            ctx.restore();
        }
    };

    /* 4. Stellar Missile Drop & Floor Shatter System */
    class StellarDropSystem {
        constructor() {
            this.stars = [];
            this.fragments = [];
            this.impactRings = [];
            this.autoDropTimer = 2.0;
        }

        reset() {
            this.stars = [];
            this.fragments = [];
            this.impactRings = [];
            this.autoDropTimer = MathUtils.randomRange(1.8, 2.8);
        }

        launchStarFromOrbit(cx, cy, rot3D, orbitParticles, themeKey = 'singularity', isIngame = false, scale = 1) {
            // Əgər animasiyanın orbitində hissəcik yoxdursa, KƏNARDAN ATILA BİLMƏZ!
            if (!orbitParticles || orbitParticles.length === 0) {
                return false;
            }

            // Animasiyanın içindəki fırlanan real hissəciklərdən biri qoparılır və atılır
            const idx = Math.floor(Math.random() * orbitParticles.length);
            const [p] = orbitParticles.splice(idx, 1);

            // Həmin hissəciyin fəzadakı dəqiq anlıq 3D koordinatı hesablanır
            const lx = Math.cos(p.angle) * p.radius;
            const ly = Math.sin(p.angle) * (p.radius * 0.42);
            const lz = p.z || 0;
            const proj = Math3D.project(lx, ly, lz, rot3D.rx, rot3D.ry, rot3D.rz);
            const origin = { x: cx + proj.x * scale, y: cy + proj.y * scale };

            const pal = THEME_PALETTES[themeKey] || THEME_PALETTES.singularity;

            this.impactRings.push({
                x: origin.x,
                y: origin.y,
                radius: 3,
                maxRadius: 24,
                alpha: 1.0,
                color: pal.accent
            });

            // Downward trajectory to floor/lava
            const vx = isIngame ? MathUtils.randomRange(-45, 45) : MathUtils.randomRange(-70, 70);
            const vy = isIngame ? MathUtils.randomRange(550, 750) : MathUtils.randomRange(240, 380);

            this.stars.push({
                x: origin.x,
                y: origin.y,
                vx,
                vy,
                gravity: isIngame ? MathUtils.randomRange(750, 950) : MathUtils.randomRange(680, 920),
                size: MathUtils.randomRange(7.0, 10.5),
                spin: MathUtils.randomRange(-8, 8),
                angle: 0,
                tail: [],
                colorCore: '#f0fdfa',
                colorGlow: pal.glow,
                colorTrail: pal.trail,
                isIngame,
                themeKey
            });

            cyberAudio.init();
            cyberAudio.playStarDetach();
            return true;
        }

        triggerFloorShatter(x, y, themeKey = 'singularity') {
            const pal = THEME_PALETTES[themeKey] || THEME_PALETTES.singularity;
            const count = Math.floor(MathUtils.randomRange(20, 30));
            for (let i = 0; i < count; i++) {
                const spreadAngle = -Math.PI / 2 + MathUtils.randomRange(-Math.PI * 0.46, Math.PI * 0.46);
                const speed = MathUtils.randomRange(180, 480);
                this.fragments.push({
                    x,
                    y,
                    vx: Math.cos(spreadAngle) * speed + MathUtils.randomRange(-25, 25),
                    vy: Math.sin(spreadAngle) * speed,
                    gravity: 780,
                    friction: 0.965,
                    size: MathUtils.randomRange(2.8, 5.5),
                    angle: Math.random() * Math.PI * 2,
                    spin: MathUtils.randomRange(-14, 14),
                    alpha: 1.0,
                    decay: MathUtils.randomRange(0.85, 1.7),
                    color: Math.random() > 0.4 ? pal.glow : pal.accent
                });
            }

            this.impactRings.push({
                x,
                y,
                radius: 4,
                maxRadius: 52,
                alpha: 1.0,
                color: pal.glow
            });

            cyberAudio.init();
            cyberAudio.playShatter();
        }

        update(dt, floorY = 480, monster = null) {
            const activeMonster = monster || (typeof window !== 'undefined' ? window.monster : null);
            const worldH = (typeof getFloorWorldHeight === 'function' && typeof gameState !== 'undefined') 
                ? getFloorWorldHeight(gameState.floor || 1) 
                : 2200;

            // Falling stars
            for (let i = this.stars.length - 1; i >= 0; i--) {
                const s = this.stars[i];
                s.tail.push({ x: s.x, y: s.y, size: s.size });
                if (s.tail.length > 14) s.tail.shift();

                s.vy += s.gravity * dt;
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.angle += s.spin * dt;

                // Oyundaxili Lava ilə toqquşma
                if (s.isIngame && activeMonster && typeof activeMonster.y === 'number') {
                    const lavaY = (typeof activeMonster.surface === 'function') ? activeMonster.surface(s.x, activeMonster.y) : activeMonster.y;
                    if (s.y >= lavaY - 20) {
                        this.triggerFloorShatter(s.x, Math.min(s.y, lavaY), s.themeKey);
                        activeMonster.y = Math.min(worldH + 60, activeMonster.y + 50);
                        if (typeof activeMonster.takeDamage === 'function') {
                            activeMonster.takeDamage(300, 'ice', s.x, lavaY);
                        }
                        if (typeof addFloatingText === 'function') {
                            addFloatingText(s.x, lavaY - 35, '❄️ LAVA SOYUDULDU! -50px', s.colorGlow, 18);
                        }
                        this.stars.splice(i, 1);
                        continue;
                    }
                }

                // Impact on floor/stage bottom
                if (s.y >= floorY) {
                    this.triggerFloorShatter(s.x, floorY, s.themeKey);
                    this.stars.splice(i, 1);
                    continue;
                }
            }

            // Shatter fragments
            for (let i = this.fragments.length - 1; i >= 0; i--) {
                const f = this.fragments[i];
                f.vx *= f.friction;
                f.vy += f.gravity * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.angle += f.spin * dt;
                f.alpha -= f.decay * dt;

                if (f.y >= floorY) {
                    f.y = floorY;
                    f.vy = -Math.abs(f.vy) * 0.35;
                    f.vx *= 0.8;
                }

                if (f.alpha <= 0) this.fragments.splice(i, 1);
            }

            // Shockwaves
            for (let i = this.impactRings.length - 1; i >= 0; i--) {
                const ring = this.impactRings[i];
                ring.radius += (ring.maxRadius - ring.radius) * 12 * dt;
                ring.alpha -= 2.2 * dt;
                if (ring.alpha <= 0) this.impactRings.splice(i, 1);
            }
        }

        render(ctx) {
            ctx.save();
            // Shockwave rings
            for (const ring of this.impactRings) {
                ctx.beginPath();
                ctx.arc(ring.x, ring.y, Math.max(0.1, ring.radius), 0, Math.PI * 2);
                ctx.strokeStyle = ring.color;
                ctx.lineWidth = 2.2;
                ctx.globalAlpha = Math.max(0, ring.alpha);
                ctx.stroke();
            }

            // Falling stars with trail
            for (const s of this.stars) {
                for (let j = 0; j < s.tail.length; j++) {
                    const pt = s.tail[j];
                    const ratio = j / s.tail.length;
                    ctx.fillStyle = s.colorTrail;
                    ctx.globalAlpha = ratio * 0.45;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, Math.max(0.5, (pt.size * 0.5) * ratio), 0, Math.PI * 2);
                    ctx.fill();
                }

                // 4-Point Star Core
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.globalAlpha = 1.0;
                ctx.shadowColor = s.colorGlow;
                ctx.shadowBlur = 16;
                ctx.fillStyle = s.colorCore;
                ctx.beginPath();
                const spikes = 4, outerR = s.size, innerR = s.size * 0.34;
                for (let sp = 0; sp < spikes * 2; sp++) {
                    const r = sp % 2 === 0 ? outerR : innerR;
                    const a = (sp * Math.PI) / spikes;
                    if (sp === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Fragments
            for (const f of this.fragments) {
                ctx.save();
                ctx.translate(f.x, f.y);
                ctx.rotate(f.angle);
                ctx.globalAlpha = Math.max(0, f.alpha);
                ctx.fillStyle = f.color;
                ctx.shadowColor = f.color;
                ctx.shadowBlur = 7;
                ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size * 1.4);
                ctx.restore();
            }
            ctx.restore();
        }
    }

    /* 5. Mons Character Renderer (Horned Mons strictly INSIDE 46px Hollow Frame) */
    const MonsCharacterRenderer = {
        drawDefaultMons(ctx, t, alpha = 1.0) {
            if (alpha <= 0.01) return;
            ctx.save();
            ctx.globalAlpha = MathUtils.clamp(alpha, 0, 1);

            const breathing = Math.sin(t * 3.5) * 1.8;

            // Ambient soft halo behind monster
            const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
            halo.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.fill();

            // Dual Horns
            for (const side of [-1, 1]) {
                ctx.save();
                ctx.scale(side, 1);
                ctx.fillStyle = '#0f766e';
                ctx.strokeStyle = '#5eead4';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(12, -14);
                ctx.bezierCurveTo(24, -22, 28, -34, 18, -40);
                ctx.bezierCurveTo(19, -30, 11, -26, 10, -14);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // Mons Body Shell (fits gracefully in the hollow ring)
            const bodyGrad = ctx.createRadialGradient(-6, -8, 2, 0, 0, 28);
            bodyGrad.addColorStop(0, '#065f46');
            bodyGrad.addColorStop(0.7, '#042f2e');
            bodyGrad.addColorStop(1, '#115e59');
            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#14b8a6';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(0, breathing * 0.5, 23, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Face Visor / Hologram Screen
            ctx.fillStyle = '#021815';
            ctx.beginPath();
            ctx.ellipse(0, 1 + breathing * 0.5, 18, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            // Glowing Bioluminescent / Cyber Eyes
            const eyeGlow = '#67e8f9';
            ctx.fillStyle = eyeGlow;
            ctx.shadowColor = eyeGlow;
            ctx.shadowBlur = 8;
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(side * 11, -3 + breathing * 0.3);
                ctx.lineTo(side * 4, -6 + breathing * 0.3);
                ctx.lineTo(side * 5, 0 + breathing * 0.3);
                ctx.closePath();
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            // Digital smile line
            ctx.strokeStyle = '#5eead4';
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-6, 8 + breathing * 0.3);
            ctx.lineTo(0, 11 + breathing * 0.3);
            ctx.lineTo(6, 8 + breathing * 0.3);
            ctx.stroke();

            ctx.restore();
        }
    };

    /* 6. Universal Singularity Simulation Engine (KiberMonsIntroEngine Architecture) */
    class SingularitySimulationEngine {
        constructor(themeKey = 'singularity') {
            this.themeKey = themeKey;
            this.rot3D = { rx: 0, ry: 0, rz: 0 };
            this.speedFactor = 0;
            this.ringAngles = { r1: 0, r2: 0, r3: 0 };
            this.timeline = 0;
            this.duration = 7.0;
            this.currentPhase = 1;

            this.orbitParticles = [];
            this.maxOrbitParticles = 100; // İstifadəçi tələbi: Maksimum 100 hissəcik saxlaya bilər
            this.stellarSystem = new StellarDropSystem();

            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this._ringLockPlayed = false;

            // Başlanğıcda oyunçunun ulduz sayı qədər hissəcik doldururuq (sayına görə bərabər olmalıdır)
            const initialCount = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') 
                ? Math.max(0, Math.min(100, permUpgrades.cyberStars)) 
                : 5;
            this.syncWithStarCount(initialCount);
        }

        syncWithStarCount(targetCount) {
            const count = Math.max(0, Math.min(this.maxOrbitParticles, targetCount));
            if (this.orbitParticles.length > count) {
                // Artıq olan hissəcikləri kəsirik ki, ulduz sayına DƏQİQ bərabər olsun
                this.orbitParticles.length = count;
            } else if (this.orbitParticles.length < count) {
                const diff = count - this.orbitParticles.length;
                for (let i = 0; i < diff; i++) {
                    const r = MathUtils.randomRange(52, 175);
                    this.orbitParticles.push({
                        radius: r,
                        angle: Math.random() * Math.PI * 2,
                        speed: (1.5 / Math.sqrt(r)) * 14 * (Math.random() > 0.08 ? 1 : -1),
                        size: MathUtils.randomRange(2.0, 4.0),
                        z: MathUtils.randomRange(-16, 16),
                        hue: this.themeKey === 'supernova' ? MathUtils.randomRange(35, 55) : (this.themeKey === 'synapse' ? MathUtils.randomRange(270, 295) : (this.themeKey === 'abyssal' ? MathUtils.randomRange(160, 180) : MathUtils.randomRange(175, 205))),
                        alpha: MathUtils.randomRange(0.4, 0.95)
                    });
                }
            }
        }

        populateOrbitParticles(count = 100) {
            this.syncWithStarCount(count);
        }

        reset() {
            this.timeline = 0;
            this.currentPhase = 1;
            this.rot3D = { rx: 0, ry: 0, rz: 0 };
            this.speedFactor = 0;
            this.ringAngles = { r1: 0, r2: 0, r3: 0 };
            this.stellarSystem.reset();
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this._ringLockPlayed = false;

            const targetStars = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') 
                ? Math.max(0, Math.min(100, permUpgrades.cyberStars)) 
                : 5;
            this.syncWithStarCount(targetStars);

            cyberAudio.init();
            cyberAudio.playSpark();
        }

        step(dt, customVx = null, customVy = null, isIngame = false) {
            this.timeline += dt;

            // Phase Checkpoints
            let newPhase = 1;
            if (this.timeline >= 5.6) newPhase = 4;
            else if (this.timeline >= 3.6) newPhase = 3;
            else if (this.timeline >= 1.6) newPhase = 2;

            if (newPhase !== this.currentPhase) {
                this.currentPhase = newPhase;
                if (newPhase === 3 && !this._ringLockPlayed) {
                    this._ringLockPlayed = true;
                    cyberAudio.playRingLock();
                }
            }

            // Oyunda animasiyadakı hissəciklərin sayı real ulduz sayına DƏQİQ bərabər saxlanılır (Maks 100)
            if (isIngame && typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') {
                const targetStars = Math.max(0, Math.min(this.maxOrbitParticles, permUpgrades.cyberStars));
                if (this.orbitParticles.length !== targetStars) {
                    this.syncWithStarCount(targetStars);
                }
            } else if (!isIngame && this.timeline >= 1.6 && this.timeline < 5.6 && this.orbitParticles.length < this.maxOrbitParticles) {
                this.syncWithStarCount(Math.min(this.maxOrbitParticles, this.orbitParticles.length + 2));
            }

            // Orbit hissəciklərinin fırlanması
            for (const p of this.orbitParticles) {
                p.angle += p.speed * dt;
            }

            // Dinamik sürət / Meyl idarəetməsi
            if (customVx !== null && customVy !== null) {
                this.vx = customVx;
                this.vy = customVy;
            }

            const curSpeed = Math.hypot(this.vx, this.vy);
            const targetSpeedFactor = Math.min(1.0, curSpeed / 180);
            this.speedFactor += (targetSpeedFactor - this.speedFactor) * Math.min(1, 10 * dt);

            // Halqaların fırlanması: Sərbəst fırlanma + uçuşda sürətli fırlanma (spinBoost)
            const spinBoost = this.speedFactor * 4.2;
            this.ringAngles.r1 += (0.42 + spinBoost * 2.0) * dt;
            this.ringAngles.r2 -= (0.28 + spinBoost * 1.6) * dt;
            this.ringAngles.r3 += (0.15 + spinBoost * 1.1) * dt;

            // Dəqiq 3D Euler Meyli (Roll, Yaw və Pitch)
            const targetRy = Math.max(-0.68, Math.min(0.68, -(this.vx / 260) * 0.65));
            const targetRx = Math.max(-0.55, Math.min(0.55, (this.vy / 260) * 0.5));
            const targetRz = Math.max(-0.25, Math.min(0.25, (this.vx / 260) * 0.2));

            const lerpSpeed = Math.min(1, 8.5 * dt);
            this.rot3D.rx += (targetRx - this.rot3D.rx) * lerpSpeed;
            this.rot3D.ry += (targetRy - this.rot3D.ry) * lerpSpeed;
            this.rot3D.rz += (targetRz - this.rot3D.rz) * lerpSpeed;

            // Əgər oyun içində deyilsə, stellar drop yenilənir
            if (!isIngame) {
                this.stellarSystem.update(dt, 500);
            }
        }

        render(ctx, cx, cy, scale = 0.56, drawCustomMonster = null, isIngame = false, forcedAssemblyRatio = null) {
            const nowSec = performance.now() / 1000;
            const pal = THEME_PALETTES[this.themeKey] || THEME_PALETTES.singularity;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);

            // 1. PHASE 01: Microscopic Initial Spark Birth (t < 1.8s)
            if (!isIngame && forcedAssemblyRatio === null && this.timeline < 1.8) {
                const sparkFade = 1.0 - MathUtils.smooth(1.4, 1.8, this.timeline);
                const pulse = (Math.sin(nowSec * 16) * 0.5 + 0.5) * 6;
                ctx.save();
                ctx.shadowColor = pal.glow;
                ctx.shadowBlur = 18;
                ctx.fillStyle = '#f0fdfa';
                ctx.beginPath();
                ctx.arc(0, 0, 4 + pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 2. Ambient Cyber Singularity Glow
            const ringAssembleRatio = (forcedAssemblyRatio !== null) 
                ? forcedAssemblyRatio 
                : (isIngame ? 1.0 : MathUtils.smooth(3.6, 5.6, this.timeline));

            if (isIngame || forcedAssemblyRatio !== null || this.timeline >= 1.6) {
                const glowAlpha = (forcedAssemblyRatio !== null || isIngame)
                    ? (0.28 + this.speedFactor * 0.2)
                    : MathUtils.smooth(1.6, 3.6, this.timeline) * (0.24 + this.speedFactor * 0.2);

                const glowRadius = 220 + this.speedFactor * 45;
                const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
                bgGrad.addColorStop(0, `rgba(6, 182, 212, ${glowAlpha})`);
                bgGrad.addColorStop(0.5, `rgba(14, 165, 233, ${glowAlpha * 0.4})`);
                bgGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
            }

            // 3. Render 3D Celestial Rings & The Hollow Central Bezel
            CyberRingRenderer.renderSystem(ctx, nowSec, this.rot3D, this.speedFactor, this.ringAngles, ringAssembleRatio, this.themeKey);

            // 4. 3D Depth Sorted Particles (Acquires true orbit around the bezel)
            if (this.orbitParticles.length > 0) {
                const sorted = [];
                for (const p of this.orbitParticles) {
                    const lx = Math.cos(p.angle) * p.radius;
                    const ly = Math.sin(p.angle) * (p.radius * 0.42);
                    const lz = p.z || 0;
                    const proj = Math3D.project(lx, ly, lz, this.rot3D.rx, this.rot3D.ry, this.rot3D.rz);
                    sorted.push({ p, proj });
                }
                sorted.sort((a, b) => a.proj.z - b.proj.z);

                for (const item of sorted) {
                    const { p, proj } = item;
                    const depthRatio = Math.max(0.3, Math.min(1.4, proj.k));
                    ctx.save();
                    ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, ${p.alpha * depthRatio})`;
                    ctx.shadowColor = pal.glow;
                    ctx.shadowBlur = 6 * depthRatio;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, Math.max(0.6, p.size * depthRatio), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 5. MONS CHARACTER EMBEDDED DIRECTLY IN THE HOLLOW RING
            // Əgər oyun içindədirsə, oyunçu özü çəkilir; Vitrində və ya önbaxışda isə Mons çəkilir
            if (!isIngame) {
                const monsEmergence = (forcedAssemblyRatio !== null) ? 1.0 : MathUtils.smooth(5.2, 6.2, this.timeline);
                if (monsEmergence > 0) {
                    const coreProj = Math3D.project(0, 0, 0, this.rot3D.rx, this.rot3D.ry, this.rot3D.rz);
                    ctx.save();
                    ctx.translate(coreProj.x, coreProj.y);
                    ctx.scale(coreProj.k, coreProj.k);

                    if (drawCustomMonster) {
                        drawCustomMonster(ctx, nowSec, monsEmergence);
                    } else {
                        MonsCharacterRenderer.drawDefaultMons(ctx, nowSec, monsEmergence);
                    }
                    ctx.restore();
                }
            }

            ctx.restore();

            // 6. Stellar Missile Projectiles & Floor Shatter Crystals (Önbaxış rejimi üçün)
            if (!isIngame) {
                this.stellarSystem.render(ctx);
            }
        }
    }

    // Qlobal tək instansiyalar (Oyun və Mağaza üçün)
    const engines = {
        singularity: new SingularitySimulationEngine('singularity'),
        supernova:   new SingularitySimulationEngine('supernova'),
        synapse:     new SingularitySimulationEngine('synapse'),
        abyssal:     new SingularitySimulationEngine('abyssal')
    };

    /* 7. Əsas İnteqrasiya İnterfeysi */
    const SingularitySpawnEffect = {
        id: 'singularity',
        name: 'Kiber Sinqulyarlıq',
        duration: 7.0,
        engines,
        cyberAudio,
        MathUtils,
        Math3D,
        CyberRingRenderer,
        MonsCharacterRenderer,

        currentTheme: 'singularity',
        themes: {
            singularity: {
                triggerBurst: () => {
                    if (engines.singularity) engines.singularity.speedFactor = 1.0;
                }
            },
            supernova: {
                triggerBurst: () => {
                    if (engines.supernova) engines.supernova.speedFactor = 1.0;
                }
            },
            synapse: {
                triggerBurst: () => {
                    if (engines.synapse) engines.synapse.speedFactor = 1.0;
                }
            },
            abyssal: {
                triggerBurst: () => {
                    if (engines.abyssal) engines.abyssal.speedFactor = 1.0;
                }
            }
        },

        setTheme(key = 'singularity') {
            if (engines[key]) {
                this.currentTheme = key;
            }
        },

        getActiveEngine(key = null) {
            const chosen = key || this.currentTheme || 'singularity';
            return engines[chosen] || engines.singularity;
        },

        resetFlight(key = null) {
            const eng = this.getActiveEngine(key);
            eng.reset();
        },

        // Oyundaxili Oyunçu Ətrafındakı 3D Kiber Halqalar (Hərəkət zamanı əyilmə, sürətlə fırlanma və parıldama)
        renderIngamePlayerHalo(ctx, player, animTime) {
            if (!player) return;
            const chosen = player.equippedSpawnAnim || (typeof permUpgrades !== 'undefined' ? permUpgrades.equippedSpawnAnim : null);
            const themeKey = (chosen && engines[chosen]) ? chosen : 'singularity';
            const eng = this.getActiveEngine(themeKey);

            // Oyunçunun real hərəkət sürəti və bucaqları ötürülür
            // Simulation advances in updateInGame, never in the render pass.

            // Oyunçu bədəninin arxasında çəkilir (Mons içində maneəsiz görünür)
            // scale 0.54 oyunçunun radiusu ilə (24px) 46px-lik mərkəzi halqanı mükəmməl uzlaşdırır
            eng.render(ctx, player.x, player.y, 0.54, null, true, 1.0);
        },

        // [E] düyməsi ilə ulduz atışı: Animasiyanın içindəki hissəcik qoparılıb atılır
        launchInGameStar(player, isManual = false) {
            if (!player) return false;
            const chosen = player.equippedSpawnAnim || (typeof permUpgrades !== 'undefined' ? permUpgrades.equippedSpawnAnim : null);
            const themeKey = (chosen && engines[chosen]) ? chosen : 'singularity';
            const eng = this.getActiveEngine(themeKey);

            // İstifadəçi tələbi: Animasiyamızın içindəki hissəciki atmalıyıq, kənardan atıla bilməz!
            const curStars = (typeof permUpgrades !== 'undefined' && typeof permUpgrades.cyberStars === 'number') 
                ? permUpgrades.cyberStars 
                : eng.orbitParticles.length;

            if (curStars <= 0 || !eng.orbitParticles || eng.orbitParticles.length === 0) {
                if (isManual && typeof showToast === 'function') {
                    showToast('⚡ Kiber Hissəciklər tükəndi (0/100)! Animasiyada atmağa hissəcik yoxdur.', 'warning');
                }
                return false;
            }

            // Animasiya daxilində fırlanan real hissəcik orbitdən qoparılır və lavaya şığıyır
            const fired = eng.stellarSystem.launchStarFromOrbit(player.x, player.y, eng.rot3D, eng.orbitParticles, themeKey, true, 0.54);
            if (fired) {
                // Atdıqca hissəciklər real olaraq azalır və ulduz sayı qalan hissəcik sayına bərabər olur
                if (typeof permUpgrades !== 'undefined') {
                    permUpgrades.cyberStars = eng.orbitParticles.length;
                    if (typeof savePermanentData === 'function') savePermanentData();
                    if (typeof updateCyberStarsHUD === 'function') updateCyberStarsHUD();
                }
                return true;
            }
            return false;
        },

        // Hissəciklərin sayını ulduz sayı ilə sinxronlaşdırır (Maks 100)
        syncAllEnginesWithStars(count) {
            const safeCount = Math.max(0, Math.min(100, count));
            Object.keys(engines).forEach(key => {
                if (engines[key] && typeof engines[key].syncWithStarCount === 'function') {
                    engines[key].syncWithStarCount(safeCount);
                }
            });
        },

        // Oyundaxili ulduzların hərəkəti və lavaya zərəri
        updateInGame(dt, player) {
            if (player) {
                const chosen = player.equippedSpawnAnim || (typeof permUpgrades !== 'undefined' ? permUpgrades.equippedSpawnAnim : null);
                // Player physics stores velocity in pixels per 60 Hz tick; FX uses pixels/second.
                this.getActiveEngine(chosen).step(dt, (player.vx || 0) * 60, (player.vy || 0) * 60, true);
            }
            const worldH = (typeof getFloorWorldHeight === 'function' && typeof gameState !== 'undefined') 
                ? getFloorWorldHeight(gameState.floor || 1) 
                : 2200;
            const activeMonster = (typeof window !== 'undefined' ? window.monster : null);

            for (const key of Object.keys(engines)) {
                engines[key].stellarSystem.update(dt, worldH, activeMonster);
            }
        },

        drawInGameProjectiles(ctx) {
            for (const key of Object.keys(engines)) {
                engines[key].stellarSystem.render(ctx);
            }
        },

        // Mağaza mini kartı və vitrin üçün xüsusi render funksiyası
        draw(ctx, w, h, t, drawMonster, isIngame = false, explicitTheme = 'singularity') {
            const themeKey = explicitTheme || 'singularity';
            const eng = this.getActiveEngine(themeKey);
            eng.timeline = t;
            eng.step(0.016, null, null, isIngame);

            // Mini kart üçün (160x160) xüsusi optimallaşdırılmış miqyas
            let scale;
            let forcedRatio = null;
            if (w <= 200 && h <= 200) {
                scale = 0.44; // 160x160 pəncərədə halqalar tam, parlaq və aydın görünür!
                forcedRatio = 1.0; // Mini kartda halqalar tam açılmış formada nümayiş olunur
                // Zərif dönmə effekti veririk
                eng.rot3D.ry = Math.sin(t * 1.5) * 0.35;
                eng.rot3D.rx = Math.cos(t * 1.2) * 0.25;
            } else {
                scale = Math.min(w / 720, h / 510) * (isIngame ? 0.54 : 0.76);
            }

            eng.render(ctx, w / 2, h / 2, scale, drawMonster, isIngame, forcedRatio);
        }
    };

    // Reyestr üçün variant köməkçisi
    function createVariantEntry(id, name, title, color) {
        return {
            id,
            name,
            title,
            color,
            duration: 7.0,
            draw(ctx, w, h, t, drawMonster, isIngame = false) {
                SingularitySpawnEffect.draw(ctx, w, h, t, drawMonster, isIngame, id);
            },
            resetFlight() {
                SingularitySpawnEffect.resetFlight(id);
            }
        };
    }

    const SingularityEffects = {
        singularity: createVariantEntry('singularity', 'Kiber Sinqulyarlıq', 'Cyber Singularity', '#38bdf8'),
        supernova:   createVariantEntry('supernova',   'Plazma Supernova',   'Plasma Supernova',   '#fbbf24'),
        synapse:     createVariantEntry('synapse',     'Kvant Sinapsı',      'Quantum Synapse',    '#c084fc'),
        abyssal:     createVariantEntry('abyssal',     'Dərin Abiss',        'Deep Abyssal',        '#2dd4bf')
    };

    if (typeof window !== 'undefined') {
        window.CyberAudioEngine = CyberAudioEngine;
        window.CyberRingRenderer = CyberRingRenderer;
        window.MonsCharacterRenderer = MonsCharacterRenderer;
        window.StellarDropSystem = StellarDropSystem;
        window.SingularitySpawnEffect = SingularitySpawnEffect;
        window.SingularityEffects = SingularityEffects;
        if (window.SpawnEffectRegistry) {
            Object.keys(SingularityEffects).forEach(id => {
                window.SpawnEffectRegistry.register(id, SingularityEffects[id]);
            });
        }
    }
    if (typeof global !== 'undefined') {
        global.SingularitySpawnEffect = SingularitySpawnEffect;
        global.SingularityEffects = SingularityEffects;
    }
})();
