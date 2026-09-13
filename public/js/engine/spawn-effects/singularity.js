// ============================================================================
// 🌀 DOĞULUŞ ANİMASİYASI 6: KİBER SİNQULYARLIQ (KVANT FİZİKASI SİMULYATORU & FX)
// İstifadəçinin təqdim etdiyi 3D Euler perspektiv proyeksiya, RingFX,
// Düşən ulduzların qəlpələrə parçalanması (Stellar Missile Shatter) və Kvant Laboratoriyası
// ============================================================================

(function() {
    // 1. SƏS SİNTEZATORU (WEB AUDIO SYNTHESIZER)
    class SynthesizerEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (this.ctx) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            } catch (e) {}
        }

        isShop() {
            if (typeof window === 'undefined') return false;
            // Mağaza modalı, mağaza önbaxışı və ya mağaza səhifəsi olduqda səsi bağla
            const fsModal = document.getElementById('spawn-anim-fullscreen-modal');
            if (fsModal && !fsModal.classList.contains('hidden')) return true;
            const shopModal = document.getElementById('skins-shop-modal');
            if (shopModal && !shopModal.classList.contains('hidden')) return true;
            if (window.location && window.location.pathname && (window.location.pathname.includes('shop') || window.location.pathname.includes('index'))) {
                // Əgər oyunda deyiliksə, mağaza səsini susdur
                if (typeof gameState === 'undefined' || !gameState.gameRunning) return true;
            }
            return false;
        }

        playStarLaunch() {
            if (!this.enabled || this.isShop()) return;
            this.init();
            if (!this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(620, t);
                osc.frequency.exponentialRampToValueAtTime(140, t + 0.28);
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.28);
            } catch (e) {}
        }

        playShatter() {
            if (!this.enabled || this.isShop()) return;
            this.init();
            if (!this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const t = this.ctx.currentTime;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(1200, t);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(t);

                // Crystal ping
                const ping = this.ctx.createOscillator();
                const pingGain = this.ctx.createGain();
                ping.type = 'sine';
                ping.frequency.setValueAtTime(1400 + Math.random() * 800, t);
                ping.frequency.exponentialRampToValueAtTime(300, t + 0.22);
                pingGain.gain.setValueAtTime(0.08, t);
                pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                ping.connect(pingGain);
                pingGain.connect(this.ctx.destination);
                ping.start(t);
                ping.stop(t + 0.22);
            } catch (e) {}
        }

        playPulse() {
            if (!this.enabled || this.isShop()) return;
            this.init();
            if (!this.ctx) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(110, t);
                osc.frequency.exponentialRampToValueAtTime(45, t + 0.4);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.4);
            } catch (e) {}
        }
    }
    const quantumAudio = new SynthesizerEngine();

    // 2. RİYAZİ VƏ 3D EULER PROYERSİYA SİSTEMİ
    const MathUtils = {
        randomRange: (min, max) => min + Math.random() * (max - min),
        lerp: (a, b, t) => a + (b - a) * t,
        clamp: (val, min, max) => Math.max(min, Math.min(max, val))
    };

    const Math3D = {
        fov: 460,
        project(x, y, z, rx, ry, rz) {
            // 1. X oxu ətrafında fırlanma (Pitch - Yuxarı/Aşağı maillik)
            const cosX = Math.cos(rx), sinX = Math.sin(rx);
            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;

            // 2. Y oxu ətrafında fırlanma (Roll/Yaw - Dərinliyə dönmə)
            const cosY = Math.cos(ry), sinY = Math.sin(ry);
            const x2 = x * cosY + z1 * sinY;
            const z2 = -x * sinY + z1 * cosY;

            // 3. Z oxu ətrafında fırlanma (Banking)
            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
            const x3 = x2 * cosZ - y1 * sinZ;
            const y3 = x2 * sinZ + y1 * cosZ;

            // Dərinlik perspektiv sıxılması
            const depth = this.fov + z2;
            const k = depth > 30 ? this.fov / depth : 1;
            return {
                x: x3 * k,
                y: y3 * k,
                z: z2,
                k: k
            };
        }
    };

    // 3. 3D HALQALAR VƏ UÇUŞ QANADUCLARI (RING FX)
    const RingFX = {
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

        drawRings(ctx, time, config, speedFactor = 0, ringAngles = null, rot3D = { rx: 0, ry: 0, rz: 0 }, scaleMult = 1) {
            ctx.save();
            const { baseColor, glowColor, accentColor } = config;
            const speed = Math.max(0, Math.min(1.2, speedFactor));
            const { rx, ry, rz } = rot3D;

            const rAngle1 = ringAngles ? ringAngles.r1 : time * 0.5;
            const rAngle2 = ringAngles ? ringAngles.r2 : -time * 0.35;
            const rAngle3 = ringAngles ? ringAngles.r3 : time * 0.2;

            const glowBoost = speed * 24;
            const extraW = speed * 1.5;

            // Dinamik 3D Uçuş Qanadları (3D orientasiyanı real göstərir)
            const sm = (scaleMult !== undefined && scaleMult !== null) ? scaleMult : 1;
            const leftWingTip = Math3D.project((-180 - speed * 20) * sm, 0, 0, rx, ry, rz);
            const leftWingBase = Math3D.project(-135 * sm, 0, 0, rx, ry, rz);
            const rightWingTip = Math3D.project((180 + speed * 20) * sm, 0, 0, rx, ry, rz);
            const rightWingBase = Math3D.project(135 * sm, 0, 0, rx, ry, rz);
            const noseVector = Math3D.project(0, -165 * sm, 0, rx, ry, rz);

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

            // 1. Daxili sürətli fırlanan 3D telemetriya halqası
            this.draw3DRing(ctx, 54 * sm, rx, ry, rz + rAngle1, baseColor, glowColor, (1.4 + extraW), [8, 6, 2, 6], 0.65 + speed * 0.3);

            // 8 Radial koordinat xətti
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4 + rAngle1;
                const p1 = Math3D.project(Math.cos(a) * 50 * sm, Math.sin(a) * 50 * sm, 0, rx, ry, rz);
                const p2 = Math3D.project(Math.cos(a) * (58 + speed * 5) * sm, Math.sin(a) * (58 + speed * 5) * sm, 0, rx, ry, rz);
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

            // 2. Orta orbitdə əks-fırlanan kompas halqası
            this.draw3DRing(ctx, 105 * sm, rx, ry, rz + rAngle2, glowColor, glowColor, (1.8 + extraW), [28, 14, 8, 14], 0.7 + speed * 0.3);

            // 4 Kardinal 3D Almaz kristalı
            const beadSize = (6.5 + speed * 3.5);
            for (let j = 0; j < 4; j++) {
                const a = (j * Math.PI) / 2 + rAngle2;
                const bead = Math3D.project(Math.cos(a) * 105 * sm, Math.sin(a) * 105 * sm, 0, rx, ry, rz);
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

            // 3. Xarici zərif 3D kosmik koordinat halqası
            this.draw3DRing(ctx, 162 * sm, rx, ry, rz + rAngle3, baseColor, glowColor, (1.0 + extraW * 0.6), [48, 14, 14, 14], 0.45 + speed * 0.35);

            // 24 Perimetr siferblat xətti
            for (let k = 0; k < 24; k++) {
                const a = (k * Math.PI) / 12 + rAngle3;
                const isMajor = k % 6 === 0;
                const len = ((isMajor ? 8 : 4) + speed * 3) * sm;
                const p1 = Math3D.project(Math.cos(a) * (162 * sm - len), Math.sin(a) * (162 * sm - len), 0, rx, ry, rz);
                const p2 = Math3D.project(Math.cos(a) * (162 * sm + len), Math.sin(a) * (162 * sm + len), 0, rx, ry, rz);
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

    // 4. DÜŞƏN ULDUZLAR VƏ QƏLPƏLƏRƏ PARÇALANMA (STELLAR MISSILE SYSTEM)
    class StellarMissileSystem {
        constructor() {
            this.stars = [];
            this.fragments = [];
            this.impactRings = [];
            this.autoTimer = 1.0;
        }

        reset() {
            this.stars = [];
            this.fragments = [];
            this.impactRings = [];
            this.autoTimer = MathUtils.randomRange(1.2, 2.0);
        }

        getThemeColors(key = 'singularity') {
            if (key === 'singularity') {
                return { core: '#e0f2fe', glow: '#38bdf8', trail: '#0284c7', shard: '#7dd3fc' };
            } else if (key === 'supernova') {
                return { core: '#fffbeb', glow: '#fbbf24', trail: '#ea580c', shard: '#f97316' };
            } else if (key === 'synapse') {
                return { core: '#faf5ff', glow: '#d8b4fe', trail: '#9333ea', shard: '#c084fc' };
            } else {
                return { core: '#f0fdfa', glow: '#5eead4', trail: '#0d9488', shard: '#2dd4bf' };
            }
        }

        getDetachingParticlePosition(theme, key, cx, cy, rot = { rx: 0, ry: 0, rz: 0 }, scaleMult = 1) {
            if (!theme) return { x: cx, y: cy };
            let lx = 0, ly = 0, lz = 0;
            let found = false;

            if (key === 'singularity' && theme.particles && theme.particles.length > 0) {
                const nonBurstIndices = [];
                for (let i = 0; i < theme.particles.length; i++) {
                    if (!theme.particles[i].burst) nonBurstIndices.push(i);
                }
                if (nonBurstIndices.length > 0) {
                    const targetIdx = nonBurstIndices[Math.floor(Math.random() * nonBurstIndices.length)];
                    const [p] = theme.particles.splice(targetIdx, 1);
                    const r = p.radius * scaleMult;
                    lx = Math.cos(p.angle) * r;
                    ly = Math.sin(p.angle) * (r * 0.42);
                    lz = (p.z || 0) * scaleMult;
                    found = true;
                }
            } else if (key === 'supernova' && theme.sparks && theme.sparks.length > 0) {
                const idx = Math.floor(Math.random() * theme.sparks.length);
                const [s] = theme.sparks.splice(idx, 1);
                lx = Math.cos(s.angle) * s.distance * scaleMult;
                ly = Math.sin(s.angle) * s.distance * scaleMult;
                lz = (s.z || 0) * scaleMult;
                found = true;
            } else if (key === 'synapse' && theme.nodes && theme.nodes.length > 0) {
                const idx = Math.floor(Math.random() * theme.nodes.length);
                const [n] = theme.nodes.splice(idx, 1);
                lx = n.x * scaleMult;
                ly = n.y * scaleMult;
                lz = (n.z || 0) * scaleMult;
                found = true;
            } else if (key === 'abyssal' && theme.spores && theme.spores.length > 0) {
                const idx = Math.floor(Math.random() * theme.spores.length);
                const [sp] = theme.spores.splice(idx, 1);
                lx = sp.x * scaleMult;
                ly = sp.y * scaleMult;
                lz = (sp.z || 0) * scaleMult;
                found = true;
            }

            if (!found) {
                const a = Math.random() * Math.PI * 2;
                const r = 90 * scaleMult;
                lx = Math.cos(a) * r;
                ly = Math.sin(a) * (r * 0.42);
            }

            const projected = Math3D.project(lx, ly, lz, rot.rx, rot.ry, rot.rz);
            return { x: cx + projected.x, y: cy + projected.y };
        }

        launchStar(originX, originY, themeKey = 'singularity', themeObj = null, rot = { rx: 0, ry: 0, rz: 0 }, scaleMult = 1) {
            const colors = this.getThemeColors(themeKey);
            const scale = Math.max(0.25, Math.min(1.4, scaleMult || 1));
            const pos = themeObj ? this.getDetachingParticlePosition(themeObj, themeKey, originX, originY, rot, scale) : { x: originX, y: originY };

            this.impactRings.push({
                x: pos.x,
                y: pos.y,
                radius: 2 * scale,
                maxRadius: 20 * scale,
                alpha: 1.0,
                color: colors.core
            });

            // İstifadəçinin kodundakı tam fizikalar (-70..70 vx, 240..380 vy, 650..920 gravity)
            const vx = MathUtils.randomRange(-70, 70) * scale;
            const vy = MathUtils.randomRange(240, 380) * scale;

            this.stars.push({
                x: pos.x,
                y: pos.y,
                vx,
                vy,
                gravity: MathUtils.randomRange(650, 920) * scale,
                size: MathUtils.randomRange(6, 9) * scale,
                spin: MathUtils.randomRange(-8, 8),
                angle: 0,
                scale,
                tail: [],
                colors
            });

            quantumAudio.playStarLaunch();
        }

        triggerShatter(x, y, colors, scaleMult = 1) {
            const scale = Math.max(0.25, Math.min(1.4, scaleMult || 1));
            // İstifadəçinin kodundakı 18..28 qəlpə sayı və yayılma bucaqları
            const count = Math.floor(MathUtils.randomRange(18, 28));
            for (let i = 0; i < count; i++) {
                const spreadAngle = -Math.PI / 2 + MathUtils.randomRange(-Math.PI * 0.42, Math.PI * 0.42);
                const speed = MathUtils.randomRange(160, 480) * scale;
                const fvx = Math.cos(spreadAngle) * speed + MathUtils.randomRange(-30, 30) * scale;
                const fvy = Math.sin(spreadAngle) * speed;

                this.fragments.push({
                    x,
                    y,
                    vx: fvx,
                    vy: fvy,
                    gravity: 750 * scale,
                    friction: 0.965,
                    size: MathUtils.randomRange(2.5, 5.5) * scale,
                    angle: Math.random() * Math.PI * 2,
                    spin: MathUtils.randomRange(-14, 14),
                    alpha: 1.0,
                    decay: MathUtils.randomRange(0.9, 1.8),
                    color: Math.random() > 0.4 ? colors.shard : colors.core
                });
            }

            this.impactRings.push({
                x,
                y,
                radius: 4 * scale,
                maxRadius: MathUtils.randomRange(36, 58) * scale,
                alpha: 1.0,
                color: colors.glow
            });

            quantumAudio.playShatter();
        }

        update(dt, floorY = 400, monster = null, lavaFalls = null) {
            const activeMonster = monster || (typeof window !== 'undefined' ? window.monster : null);
            const activeLavaFalls = lavaFalls || (typeof currentLavaFalls !== 'undefined' ? currentLavaFalls : []);
            const worldH = (typeof getFloorWorldHeight === 'function' && typeof gameState !== 'undefined') 
                ? getFloorWorldHeight(gameState.floor || 1) 
                : (typeof canvasHeight !== 'undefined' ? canvasHeight : 680);

            // Ulduzların hərəkəti və lavaya/döşəməyə dəyməsi
            for (let i = this.stars.length - 1; i >= 0; i--) {
                const s = this.stars[i];
                s.tail.push({ x: s.x, y: s.y, alpha: 0.75, size: s.size });
                if (s.tail.length > 14) s.tail.shift();

                s.vy += s.gravity * dt;
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.angle += s.spin * dt;

                let hit = false;

                // 1. 🔥 YÜKSƏLƏN LAVA VƏ CANAVARLA TOQQUŞMA ("bu lava deyende lava zerer vermelidi")
                if (activeMonster && typeof activeMonster.y === 'number') {
                    const lavaY = activeMonster.y;
                    // Əgər ulduz lavanın səthinə çatdısa
                    if (s.y >= lavaY - 18) {
                        hit = true;
                        // Lavada dərhal kristal şatır partlayışı
                        this.triggerShatter(s.x, Math.min(s.y, lavaY), s.colors);

                        // ❄️ LAVANI GÜCLÜ ŞƏKİLDƏ SOYUDUR VƏ GERİYƏ İTƏLƏYİR (+45px)
                        activeMonster.y = Math.min(worldH + 60, activeMonster.y + 45);

                        // 👾 CANAVARA BÖYÜK KVANT ZƏDƏSİ VURUR (-250 HP)
                        if (typeof activeMonster.takeDamage === 'function') {
                            activeMonster.takeDamage(250, 'ice', s.x, lavaY);
                        }

                        // Uçan zədə mətni
                        if (typeof addFloatingText === 'function') {
                            addFloatingText(s.x, lavaY - 35, '❄️ LAVA SOYUDULDU! -45px', '#38bdf8', 18);
                        }

                        this.stars.splice(i, 1);
                        continue;
                    }
                }

                // 2. 🔥 AXAN LAVA ŞƏLALƏLƏRİ VƏ BÖLMƏLƏRİ İLƏ TOQQUŞMA
                if (activeLavaFalls && activeLavaFalls.length > 0) {
                    for (const fall of activeLavaFalls) {
                        if (s.x >= fall.x - 12 && s.x <= fall.x + fall.w + 12 &&
                            s.y >= fall.y && s.y <= fall.y + fall.h) {
                            hit = true;
                            this.triggerShatter(s.x, s.y, s.colors);
                            if (typeof addFloatingText === 'function') {
                                addFloatingText(s.x, s.y - 20, '❄️ LAVA DONDURULDU!', '#38bdf8', 15);
                            }
                            this.stars.splice(i, 1);
                            break;
                        }
                    }
                    if (hit) continue;
                }

                // 3. QAYA PLATFORMALARI İLƏ TOQQUŞMA
                if (typeof currentRocks !== 'undefined' && currentRocks.length > 0) {
                    for (const rock of currentRocks) {
                        if (s.x >= rock.x && s.x <= rock.x + rock.w &&
                            s.y >= rock.y && s.y <= rock.y + 24) {
                            hit = true;
                            this.triggerShatter(s.x, rock.y, s.colors);
                            this.stars.splice(i, 1);
                            break;
                        }
                    }
                    if (hit) continue;
                }

                // 4. ƏSAS DÖŞƏMƏ İLƏ TOQQUŞMA
                if (s.y >= floorY) {
                    this.triggerShatter(s.x, floorY, s.colors);
                    this.stars.splice(i, 1);
                }
            }

            // Qəlpələrin parçalanması
            for (let i = this.fragments.length - 1; i >= 0; i--) {
                const f = this.fragments[i];
                f.vx *= f.friction;
                f.vy += f.gravity * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.angle += f.spin * dt;
                f.alpha -= f.decay * dt;

                const limitY = (activeMonster && typeof activeMonster.y === 'number') ? Math.min(floorY, activeMonster.y) : floorY;
                if (f.y >= limitY) {
                    f.y = limitY;
                    f.vy = -Math.abs(f.vy) * 0.35;
                    f.vx *= 0.8;
                }

                if (f.alpha <= 0) {
                    this.fragments.splice(i, 1);
                }
            }

            // Şok dalğaları
            for (let i = this.impactRings.length - 1; i >= 0; i--) {
                const ring = this.impactRings[i];
                ring.radius += (ring.maxRadius - ring.radius) * 12 * dt;
                ring.alpha -= 2.2 * dt;
                if (ring.alpha <= 0) {
                    this.impactRings.splice(i, 1);
                }
            }
        }

        render(ctx) {
            ctx.save();

            // Şok halqaları
            for (const ring of this.impactRings) {
                ctx.beginPath();
                ctx.arc(ring.x, ring.y, Math.max(0.1, ring.radius), 0, Math.PI * 2);
                ctx.strokeStyle = ring.color;
                ctx.lineWidth = 2.2;
                ctx.globalAlpha = Math.max(0, ring.alpha);
                ctx.stroke();
            }

            // Düşən ulduzlar və komet izləri
            for (const s of this.stars) {
                for (let j = 0; j < s.tail.length; j++) {
                    const pt = s.tail[j];
                    const ratio = j / s.tail.length;
                    ctx.fillStyle = s.colors.trail;
                    ctx.globalAlpha = ratio * 0.45;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, Math.max(0.5, (pt.size * 0.5) * ratio), 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.globalAlpha = 1.0;
                ctx.shadowColor = s.colors.glow;
                ctx.shadowBlur = 15;

                ctx.fillStyle = s.colors.core;
                ctx.beginPath();
                const spikes = 4;
                const outerR = s.size;
                const innerR = s.size * 0.32;
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

            // Qəlpə kristalları
            for (const f of this.fragments) {
                ctx.save();
                ctx.translate(f.x, f.y);
                ctx.rotate(f.angle);
                ctx.globalAlpha = Math.max(0, f.alpha);
                ctx.fillStyle = f.color;
                ctx.shadowColor = f.color;
                ctx.shadowBlur = 8;
                ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size * 1.5);
                ctx.restore();
            }

            ctx.restore();
        }
    }

    // 5. PROSEDURAL MÖVZULAR (THEMES)
    class SingularityTheme {
        constructor() {
            this.particles = [];
            this.shockwaves = [];
            this.reset();
        }

        getParticleCount() {
            return this.particles.filter(p => !p.burst).length;
        }

        reset() {
            this.particles = [];
            this.shockwaves = [];
            const count = 150;
            for (let i = 0; i < count; i++) {
                const r = MathUtils.randomRange(45, 185);
                this.particles.push({
                    radius: r,
                    angle: Math.random() * Math.PI * 2,
                    speed: (1.5 / Math.sqrt(r)) * 14 * (Math.random() > 0.08 ? 1 : -1),
                    size: MathUtils.randomRange(1.8, 3.8),
                    z: MathUtils.randomRange(-15, 15),
                    hue: MathUtils.randomRange(175, 205),
                    alpha: MathUtils.randomRange(0.4, 0.9),
                    burst: false
                });
            }
        }

        triggerBurst(x = 0, y = 0) {
            this.shockwaves.push({ r: 5, maxR: 220, alpha: 1.0 });
            for (let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = MathUtils.randomRange(120, 340);
                this.particles.push({
                    radius: 5,
                    x: Math.cos(a) * 5,
                    y: Math.sin(a) * 5,
                    z: MathUtils.randomRange(-25, 25),
                    vx: Math.cos(a) * s,
                    vy: Math.sin(a) * s,
                    size: MathUtils.randomRange(2, 4.5),
                    hue: 195,
                    alpha: 1.0,
                    burst: true,
                    life: MathUtils.randomRange(0.5, 1.2)
                });
            }
            quantumAudio.playPulse();
        }

        update(dt) {
            // Hissəciklərin axıcı şəkildə bərpası (Orbit heç vaxt tam tükənmir)
            if (this.particles.filter(p => !p.burst).length < 150) {
                const r = MathUtils.randomRange(45, 185);
                this.particles.push({
                    radius: r,
                    angle: Math.random() * Math.PI * 2,
                    speed: (1.5 / Math.sqrt(r)) * 14 * (Math.random() > 0.08 ? 1 : -1),
                    size: MathUtils.randomRange(1.8, 3.8),
                    z: MathUtils.randomRange(-15, 15),
                    hue: MathUtils.randomRange(175, 205),
                    alpha: 0.05,
                    targetAlpha: MathUtils.randomRange(0.4, 0.9),
                    burst: false
                });
            }

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                if (p.burst) {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vx *= 0.96;
                    p.vy *= 0.96;
                    p.life -= dt;
                    p.alpha = Math.max(0, p.life);
                    if (p.life <= 0) this.particles.splice(i, 1);
                } else {
                    p.angle += p.speed * dt;
                    if (p.targetAlpha && p.alpha < p.targetAlpha) {
                        p.alpha = Math.min(p.targetAlpha, p.alpha + dt * 0.8);
                    }
                }
            }

            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.r += (sw.maxR - sw.r) * 6 * dt;
                sw.alpha -= 1.8 * dt;
                if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
            }
        }

        render(ctx, cx, cy, time, rot3D, speedFactor, ringAngles, scaleMult = 1) {
            ctx.save();
            ctx.translate(cx, cy);
            const { rx, ry, rz } = rot3D;

            // Qara dəlik aurası (Event Horizon Ambient Glow in 3D)
            const glowRadius = (240 + speedFactor * 50) * scaleMult;
            const bgGrad = ctx.createRadialGradient(0, 0, 10 * scaleMult, 0, 0, glowRadius);
            bgGrad.addColorStop(0, `rgba(6, 182, 212, ${0.28 + speedFactor * 0.22})`);
            bgGrad.addColorStop(0.45, `rgba(14, 165, 233, ${0.08 + speedFactor * 0.12})`);
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

            // 3D Halqalar
            RingFX.drawRings(ctx, time, {
                baseColor: 'rgba(6, 182, 212, 0.7)',
                glowColor: '#38bdf8',
                accentColor: '#e0f2fe'
            }, speedFactor, ringAngles, rot3D, scaleMult);

            // 3D Şok dalğaları
            for (const sw of this.shockwaves) {
                RingFX.draw3DRing(ctx, sw.r * scaleMult, rx, ry, rz, `rgba(56, 189, 248, ${sw.alpha})`, '#38bdf8', 2.8, [], sw.alpha);
            }

            // 3D Dərinlik üzrə sıralanmış hissəciklər
            const sortedParticles = [];
            for (const p of this.particles) {
                if (p.burst) {
                    const proj = Math3D.project(p.x * scaleMult, p.y * scaleMult, (p.z || 0) * scaleMult, rx, ry, rz);
                    sortedParticles.push({ p, proj, burst: true });
                } else {
                    const lx = Math.cos(p.angle) * p.radius * scaleMult;
                    const ly = Math.sin(p.angle) * (p.radius * 0.42) * scaleMult;
                    const lz = (p.z || 0) * scaleMult;
                    const proj = Math3D.project(lx, ly, lz, rx, ry, rz);
                    sortedParticles.push({ p, proj, burst: false });
                }
            }
            sortedParticles.sort((a, b) => a.proj.z - b.proj.z);

            for (const item of sortedParticles) {
                const { p, proj, burst } = item;
                ctx.save();
                if (burst) {
                    ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.alpha * proj.k})`;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * proj.k * scaleMult), 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const depthRatio = Math.max(0.3, Math.min(1.4, proj.k));
                    ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${p.alpha * depthRatio})`;
                    ctx.shadowColor = '#06b6d4';
                    ctx.shadowBlur = 6 * depthRatio;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * depthRatio * scaleMult), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Mərkəzi Qara Dəlik & Foton Halqası
            const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
            ctx.save();
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, 36 * coreProj.k * scaleMult, 0, Math.PI * 2);
            ctx.fillStyle = '#02040a';
            ctx.fill();
            ctx.lineWidth = 3.5 * coreProj.k;
            ctx.strokeStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 18;
            ctx.stroke();
            ctx.restore();

            ctx.restore();
        }
    }

    class SupernovaTheme {
        constructor() {
            this.sparks = [];
            this.flares = [];
            this.reset();
        }

        reset() {
            this.sparks = [];
            this.flares = [];
            for (let i = 0; i < 110; i++) {
                this.sparks.push({
                    distance: MathUtils.randomRange(42, 175),
                    angle: Math.random() * Math.PI * 2,
                    speed: MathUtils.randomRange(0.6, 2.4),
                    radialDrift: MathUtils.randomRange(-10, 10),
                    size: MathUtils.randomRange(2, 4.5),
                    z: MathUtils.randomRange(-24, 24),
                    color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444'
                });
            }
        }

        triggerBurst() {
            this.flares.push({ r: 25, maxR: 240, alpha: 1 });
            quantumAudio.playPulse();
        }

        update(dt) {
            for (const s of this.sparks) {
                s.angle += s.speed * dt;
                s.distance += s.radialDrift * dt;
                if (s.distance > 185) s.distance = 45;
                if (s.distance < 40) s.distance = 180;
            }
            for (let i = this.flares.length - 1; i >= 0; i--) {
                const f = this.flares[i];
                f.r += (f.maxR - f.r) * 7 * dt;
                f.alpha -= 2.2 * dt;
                if (f.alpha <= 0) this.flares.splice(i, 1);
            }
        }

        render(ctx, cx, cy, time, rot3D, speedFactor, ringAngles, scaleMult = 1) {
            ctx.save();
            ctx.translate(cx, cy);
            const { rx, ry, rz } = rot3D;

            // Ambient Plasma Flare Glow
            const glowRadius = (250 + speedFactor * 45) * scaleMult;
            const bgGrad = ctx.createRadialGradient(0, 0, 10 * scaleMult, 0, 0, glowRadius);
            bgGrad.addColorStop(0, `rgba(249, 115, 22, ${0.3 + speedFactor * 0.2})`);
            bgGrad.addColorStop(0.5, `rgba(234, 88, 12, ${0.09 + speedFactor * 0.1})`);
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

            RingFX.drawRings(ctx, time, {
                baseColor: 'rgba(245, 158, 11, 0.7)',
                glowColor: '#fbbf24',
                accentColor: '#fffbeb'
            }, speedFactor, ringAngles, rot3D, scaleMult);

            for (const f of this.flares) {
                RingFX.draw3DRing(ctx, f.r * scaleMult, rx, ry, rz, `rgba(251, 191, 36, ${f.alpha})`, '#fbbf24', 3.5, [], f.alpha);
            }

            for (const s of this.sparks) {
                const lx = Math.cos(s.angle) * s.distance * scaleMult;
                const ly = Math.sin(s.angle) * s.distance * scaleMult;
                const proj = Math3D.project(lx, ly, s.z * scaleMult, rx, ry, rz);
                ctx.save();
                ctx.fillStyle = s.color;
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 8 * proj.k;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, s.size * proj.k * scaleMult, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, 30 * coreProj.k * scaleMult, 0, Math.PI * 2);
            ctx.fillStyle = '#fffbeb';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 24;
            ctx.fill();
            ctx.lineWidth = 3 * coreProj.k;
            ctx.strokeStyle = '#f97316';
            ctx.stroke();

            ctx.restore();
        }
    }

    class SynapseTheme {
        constructor() {
            this.nodes = [];
            this.pulses = [];
            this.reset();
        }

        reset() {
            this.nodes = [];
            this.pulses = [];
            for (let i = 0; i < 90; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = MathUtils.randomRange(35, 180);
                this.nodes.push({
                    x: Math.cos(a) * r,
                    y: Math.sin(a) * r,
                    z: MathUtils.randomRange(-25, 25),
                    vx: MathUtils.randomRange(-12, 12),
                    vy: MathUtils.randomRange(-12, 12),
                    size: MathUtils.randomRange(2.2, 4.2),
                    baseX: Math.cos(a) * r,
                    baseY: Math.sin(a) * r
                });
            }
        }

        triggerBurst() {
            this.pulses.push({ r: 10, maxR: 220, alpha: 1.0 });
            quantumAudio.playPulse();
        }

        update(dt) {
            for (const n of this.nodes) {
                n.x += n.vx * dt;
                n.y += n.vy * dt;
                const dx = n.baseX - n.x;
                const dy = n.baseY - n.y;
                n.vx += dx * 2.2 * dt;
                n.vy += dy * 2.2 * dt;
                n.vx *= 0.98;
                n.vy *= 0.98;
            }
            for (let i = this.pulses.length - 1; i >= 0; i--) {
                const p = this.pulses[i];
                p.r += (p.maxR - p.r) * 6 * dt;
                p.alpha -= 2.0 * dt;
                if (p.alpha <= 0) this.pulses.splice(i, 1);
            }
        }

        render(ctx, cx, cy, time, rot3D, speedFactor, ringAngles, scaleMult = 1) {
            ctx.save();
            ctx.translate(cx, cy);
            const { rx, ry, rz } = rot3D;

            // Ambient Bio-Electric Glow
            const glowRadius = (240 + speedFactor * 45) * scaleMult;
            const bgGrad = ctx.createRadialGradient(0, 0, 10 * scaleMult, 0, 0, glowRadius);
            bgGrad.addColorStop(0, `rgba(168, 85, 247, ${0.28 + speedFactor * 0.2})`);
            bgGrad.addColorStop(0.5, `rgba(147, 51, 234, ${0.08 + speedFactor * 0.1})`);
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

            RingFX.drawRings(ctx, time, {
                baseColor: 'rgba(168, 85, 247, 0.65)',
                glowColor: '#c084fc',
                accentColor: '#faf5ff'
            }, speedFactor, ringAngles, rot3D, scaleMult);

            for (const p of this.pulses) {
                RingFX.draw3DRing(ctx, p.r * scaleMult, rx, ry, rz, `rgba(216, 180, 254, ${p.alpha})`, '#c084fc', 2.5, [], p.alpha);
            }

            // 3D Synaptic connectors
            const projectedNodes = this.nodes.map(n => ({
                ...n,
                proj: Math3D.project(n.x * scaleMult, n.y * scaleMult, n.z * scaleMult, rx, ry, rz)
            }));

            ctx.save();
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
            ctx.lineWidth = 1 * scaleMult;
            for (let i = 0; i < projectedNodes.length; i++) {
                for (let j = i + 1; j < projectedNodes.length; j++) {
                    const dx = projectedNodes[i].x - projectedNodes[j].x;
                    const dy = projectedNodes[i].y - projectedNodes[j].y;
                    const d = Math.hypot(dx, dy);
                    if (d < 46) {
                        ctx.beginPath();
                        ctx.moveTo(projectedNodes[i].proj.x, projectedNodes[i].proj.y);
                        ctx.lineTo(projectedNodes[j].proj.x, projectedNodes[j].proj.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();

            for (const item of projectedNodes) {
                const { proj } = item;
                ctx.save();
                ctx.fillStyle = '#c084fc';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 7 * proj.k;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, item.size * proj.k * scaleMult, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, 28 * coreProj.k * scaleMult, 0, Math.PI * 2);
            ctx.fillStyle = '#581c87';
            ctx.strokeStyle = '#d8b4fe';
            ctx.lineWidth = 2.5 * coreProj.k;
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    class AbyssalTheme {
        constructor() {
            this.spores = [];
            this.reset();
        }

        getParticleCount() {
            return this.spores.length;
        }

        reset() {
            this.spores = [];
            const count = 125;
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = MathUtils.randomRange(30, 180);
                this.spores.push({
                    x: Math.cos(a) * d,
                    y: Math.sin(a) * d,
                    z: MathUtils.randomRange(-25, 25),
                    drift: MathUtils.randomRange(0.8, 2.5),
                    angle: a,
                    size: MathUtils.randomRange(2, 4)
                });
            }
        }

        triggerBurst() {}

        update(dt) {
            for (const sp of this.spores) {
                sp.angle += sp.drift * 0.4 * dt;
                sp.x += Math.sin(sp.angle) * 18 * dt;
                sp.y += Math.cos(sp.angle) * 18 * dt;
            }
        }

        render(ctx, cx, cy, time, rot3D = { rx: 0, ry: 0, rz: 0 }, speedFactor = 0, ringAngles = null, scaleMult = 1) {
            ctx.save();
            ctx.translate(cx, cy);
            const { rx, ry, rz } = rot3D;

            // Ambient Abyss Glow
            const glowRadius = (240 + speedFactor * 45) * scaleMult;
            const bgGrad = ctx.createRadialGradient(0, 0, 10 * scaleMult, 0, 0, glowRadius);
            bgGrad.addColorStop(0, `rgba(13, 148, 136, ${0.28 + speedFactor * 0.2})`);
            bgGrad.addColorStop(0.5, `rgba(15, 118, 110, ${0.08 + speedFactor * 0.1})`);
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

            RingFX.drawRings(ctx, time, {
                baseColor: 'rgba(20, 184, 166, 0.7)',
                glowColor: '#2dd4bf',
                accentColor: '#f0fdfa'
            }, speedFactor, ringAngles, rot3D, scaleMult);

            // Bioluminescent Spores in 3D
            for (const sp of this.spores) {
                const proj = Math3D.project(sp.x * scaleMult, sp.y * scaleMult, sp.z * scaleMult, rx, ry, rz);
                ctx.save();
                ctx.fillStyle = '#2dd4bf';
                ctx.shadowColor = '#14b8a6';
                ctx.shadowBlur = 7 * proj.k;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, Math.max(0.5, sp.size * proj.k * scaleMult), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Eldritch Tentacles projected in 3D
            ctx.strokeStyle = '#0f766e';
            ctx.lineWidth = 3.5 * scaleMult;
            ctx.lineCap = 'round';
            for (let arm = 0; arm < 6; arm++) {
                const baseAngle = (arm * Math.PI * 2) / 6;
                ctx.beginPath();
                const startPt = Math3D.project(0, 0, 0, rx, ry, rz);
                ctx.moveTo(startPt.x, startPt.y);
                for (let seg = 1; seg <= 18; seg++) {
                    const r = seg * 7.5 * scaleMult;
                    const wave = Math.sin(time * 3 + seg * 0.4 + arm) * (seg * 1.6 * scaleMult);
                    const a = baseAngle + wave * 0.04;
                    const zArm = Math.sin(time * 2 + seg * 0.3) * 18 * scaleMult;
                    const pt = Math3D.project(Math.cos(a) * r, Math.sin(a) * r, zArm, rx, ry, rz);
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            }

            // Leviathan Eye in 3D
            const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, 24 * coreProj.k * scaleMult, 0, Math.PI * 2);
            ctx.fillStyle = '#042f2e';
            ctx.strokeStyle = '#5eead4';
            ctx.lineWidth = 2.5 * coreProj.k;
            ctx.shadowColor = '#2dd4bf';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    // 6. ƏSAS İNTEQRASİYA SİSTEMİ (SINGULARITY SPAWN EFFECT MODULE)
    const SingularitySpawnEffect = {
        id: 'singularity',
        name: 'Kiber Sinqulyarlıq',
        title: 'Cyber Singularity',
        icon: 'fa-circle-nodes',
        fallbackIcon: 'fa-atom',
        color: '#38bdf8',
        glowColor: '#06b6d4',
        badge: '🌀 Kvant Sinqulyarlığı (3D Halqalar & Ulduz Şığıması)',
        desc: 'Kvant Fizikası Simulyatoru: 3D orbit halqaları, oriyentasiya qanadları, döşəmədə qəlpələrə parçalanan ulduz kaskadı və Kvant Şok Dalğası.',
        costType: 'redDiamonds',
        cost: 55,
        duration: 7.8,

        // Daxili modullar
        // Fərdi Mövzu Ulduz Sistemləri (Kartlar və önbaxış bir-birinə qarışmır)
        stellarSystems: {
            singularity: new StellarMissileSystem(),
            supernova: new StellarMissileSystem(),
            synapse: new StellarMissileSystem(),
            abyssal: new StellarMissileSystem()
        },
        inGameStellarSystem: new StellarMissileSystem(),
        themes: {
            singularity: new SingularityTheme(),
            supernova: new SupernovaTheme(),
            synapse: new SynapseTheme(),
            abyssal: new AbyssalTheme()
        },
        currentThemeKey: 'singularity',

        // İdarəetmə və oriyentasiya
        rot3D: { rx: 0, ry: 0, rz: 0 },
        speedFactor: 0,
        ringAngles: { r1: 0, r2: 0, r3: 0 },
        vx: 0,
        vy: 0,
        x: 0,
        y: 0,
        keys: {},
        interactive: false,
        starDropTimers: {
            singularity: 0.8,
            supernova: 1.2,
            synapse: 1.5,
            abyssal: 1.0
        },
        _lastT: 0,
        _eventsInitialized: false,

        initEvents() {
            if (this._eventsInitialized) return;
            this._eventsInitialized = true;
            if (typeof window === 'undefined') return;

            window.addEventListener('keydown', (e) => {
                const fsModal = document.getElementById('spawn-anim-fullscreen-modal');
                const isFsOpen = fsModal && !fsModal.classList.contains('hidden');
                if (!isFsOpen && !this.interactive) return;

                if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
                    this.keys[e.code] = true;
                } else if (e.code === 'Space') {
                    e.preventDefault();
                    this.triggerBurstAction();
                } else if (e.code === 'KeyE') {
                    e.preventDefault();
                    this.triggerManualStar();
                }
            });

            window.addEventListener('keyup', (e) => {
                if (this.keys[e.code]) {
                    this.keys[e.code] = false;
                }
            });

            let isDragging = false;
            let lastMouse = { x: 0, y: 0 };
            let lastDragTime = performance.now();

            const onStart = (cx, cy) => {
                const fsModal = document.getElementById('spawn-anim-fullscreen-modal');
                if (!fsModal || fsModal.classList.contains('hidden')) return;
                isDragging = true;
                lastMouse = { x: cx, y: cy };
                lastDragTime = performance.now();
            };
            const onMove = (cx, cy) => {
                if (!isDragging) return;
                const now = performance.now();
                const dt = Math.max(0.008, (now - lastDragTime) / 1000);
                const dx = cx - lastMouse.x;
                const dy = cy - lastMouse.y;
                this.x += dx;
                this.y += dy;
                this.vx = dx / dt;
                this.vy = dy / dt;
                lastMouse = { x: cx, y: cy };
                lastDragTime = now;
            };
            const onEnd = () => { isDragging = false; };

            window.addEventListener('mousedown', (e) => {
                if (e.target && e.target.id === 'spawn-anim-fullscreen-canvas') {
                    onStart(e.clientX, e.clientY);
                }
            });
            window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onEnd);

            window.addEventListener('touchstart', (e) => {
                if (e.target && e.target.id === 'spawn-anim-fullscreen-canvas' && e.touches.length > 0) {
                    onStart(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            window.addEventListener('touchend', onEnd);
        },

        triggerManualStar() {
            const themeKey = this.currentThemeKey || 'singularity';
            const activeTheme = this.themes[themeKey] || this.themes.singularity;
            const stellarSys = this.stellarSystems[themeKey] || this.stellarSystems.singularity;
            const canvas = (typeof document !== 'undefined') ? document.getElementById('spawn-anim-fullscreen-canvas') : null;
            const w = canvas ? canvas.width : 650;
            const h = canvas ? canvas.height : 420;
            const scale = 0.75;
            const cx = w / 2 + this.x;
            const cy = h * 0.42 + this.y;
            stellarSys.launchStar(cx, cy, themeKey, activeTheme, this.rot3D, scale);
        },

        triggerBurstAction() {
            const themeKey = this.currentThemeKey || 'singularity';
            const activeTheme = this.themes[themeKey] || this.themes.singularity;
            const canvas = (typeof document !== 'undefined') ? document.getElementById('spawn-anim-fullscreen-canvas') : null;
            const w = canvas ? canvas.width : 650;
            const h = canvas ? canvas.height : 420;
            const cx = w / 2 + this.x;
            const cy = h * 0.42 + this.y;
            if (typeof activeTheme.triggerBurst === 'function') {
                activeTheme.triggerBurst(cx, cy);
            }
            quantumAudio.playPulse();
        },

        resetFlight() {
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.rot3D = { rx: 0, ry: 0, rz: 0 };
            this.speedFactor = 0;
            this.ringAngles = { r1: 0, r2: 0, r3: 0 };
            if (this.stellarSystems[this.currentThemeKey]) {
                this.stellarSystems[this.currentThemeKey].reset();
            }
            if (this.themes[this.currentThemeKey]) {
                this.themes[this.currentThemeKey].reset();
            }
            this.starDropTimers[this.currentThemeKey] = 0.8;
            this._lastT = 0;
            this.initEvents();
        },

        setTheme(key) {
            if (this.themes[key]) {
                this.currentThemeKey = key;
                this.resetFlight();
            }
        },

        // Oyundaxili Ulduz Atışı (Oyunçunun orbitindən aşağıya atılan kvant ulduzları)
        launchInGameStar(player) {
            if (!player) return;
            const themeKey = this.getActiveThemeKey(player);
            const activeTheme = this.themes[themeKey] || this.themes.singularity;
            const rot = (player && player.singularityRot) ? player.singularityRot : { rx: 0, ry: 0, rz: 0 };
            this.inGameStellarSystem.launchStar(
                player.x,
                player.y,
                themeKey,
                activeTheme,
                rot,
                0.85
            );
        },

        getActiveThemeKey(player) {
            if (typeof permUpgrades !== 'undefined') {
                const eq = permUpgrades.equippedSpawnAnim;
                if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(eq)) {
                    return eq;
                }
            }
            return this.currentThemeKey || 'singularity';
        },

        // Oyundaxili hər kadrda ulduzların hərəkəti və lavaya təsiri
        updateInGame(dt, player) {
            const worldH = (typeof getFloorWorldHeight === 'function' && typeof gameState !== 'undefined') 
                ? getFloorWorldHeight(gameState.floor || 1) 
                : 2000;
            const activeMonster = (typeof window !== 'undefined' ? window.monster : null);
            const activeLavaFalls = (typeof currentLavaFalls !== 'undefined' ? currentLavaFalls : []);

            this.inGameStellarSystem.update(dt, worldH, activeMonster, activeLavaFalls);

            // Mövzu hissəciklərini yenilə
            const themeKey = this.getActiveThemeKey(player);
            const activeTheme = this.themes[themeKey] || this.themes.singularity;
            activeTheme.update(dt);
        },

        // Oyundaxili ulduzların və parçalanan qəlpələrin çizilməsi (Kamera ofseti ilə)
        drawInGameProjectiles(ctx) {
            this.inGameStellarSystem.render(ctx);
        },

        draw(ctx, w, h, t, drawMonster, isIngame = false, explicitTheme = null) {
            this.initEvents();
            const dt = Math.max(0.008, Math.min(0.04, t - this._lastT));
            this._lastT = t;

            function S(a, b, val) {
                const x = Math.max(0, Math.min(1, (val - a) / (b - a)));
                return x * x * (3 - 2 * x);
            }

            const themeKey = (explicitTheme && this.themes[explicitTheme]) ? explicitTheme : (this.currentThemeKey || 'singularity');
            const activeTheme = this.themes[themeKey] || this.themes.singularity;
            const stellarSys = this.stellarSystems[themeKey] || this.stellarSystems.singularity;

            // Fazalar
            const introProgress = Math.min(1, t / this.duration);
            const scaleGrow = S(0.2, 1.8, t);
            const ringsUnfold = S(0.8, 2.4, t);
            const monsterEmerge = S(3.0, 4.4, t);
            const shatterBurst = S(2.2, 2.6, t);

            // İnteraktiv Uçuş Fizikaları (İstifadəçinin tam kodundakı kimi: WASD/Oxlar/Drag)
            const fsModal = (typeof document !== 'undefined') ? document.getElementById('spawn-anim-fullscreen-modal') : null;
            const isFsOpen = fsModal && !fsModal.classList.contains('hidden');
            if (isFsOpen || this.interactive) {
                let kdx = 0, kdy = 0;
                if (this.keys['KeyD'] || this.keys['ArrowRight']) kdx += 1;
                if (this.keys['KeyA'] || this.keys['ArrowLeft']) kdx -= 1;
                if (this.keys['KeyS'] || this.keys['ArrowDown']) kdy += 1;
                if (this.keys['KeyW'] || this.keys['ArrowUp']) kdy -= 1;

                const moveSpeed = 260;
                this.vx += (kdx * moveSpeed - this.vx) * 0.14;
                this.vy += (kdy * moveSpeed - this.vy) * 0.14;
                this.x += this.vx * dt;
                this.y += this.vy * dt;

                const currentSpeed = Math.hypot(this.vx, this.vy);
                const targetSpeedFactor = Math.min(1.0, currentSpeed / 180);
                this.speedFactor += (targetSpeedFactor - this.speedFactor) * Math.min(1, 10 * dt);

                const spinBoost = this.speedFactor * 4.2;
                this.ringAngles.r1 += (0.42 + spinBoost * 2.0) * dt;
                this.ringAngles.r2 -= (0.28 + spinBoost * 1.6) * dt;
                this.ringAngles.r3 += (0.15 + spinBoost * 1.1) * dt;

                const targetRy = Math.max(-0.68, Math.min(0.68, -(this.vx / 260) * 0.65));
                const targetRx = Math.max(-0.55, Math.min(0.55, (this.vy / 260) * 0.5));
                const targetRz = Math.max(-0.25, Math.min(0.25, (this.vx / 260) * 0.2));

                const lerpSpeed = Math.min(1, 8.5 * dt);
                this.rot3D.rx += (targetRx - this.rot3D.rx) * lerpSpeed;
                this.rot3D.ry += (targetRy - this.rot3D.ry) * lerpSpeed;
                this.rot3D.rz += (targetRz - this.rot3D.rz) * lerpSpeed;

                const limitX = w * 0.38;
                const limitY = h * 0.34;
                this.x = MathUtils.clamp(this.x, -limitX, limitX);
                this.y = MathUtils.clamp(this.y, -limitY, limitY);
            } else {
                const spinIntensity = 0.6 + this.speedFactor * 3.5;
                this.ringAngles.r1 += (0.42 + spinIntensity * 1.5) * dt;
                this.ringAngles.r2 -= (0.28 + spinIntensity * 1.2) * dt;
                this.ringAngles.r3 += (0.15 + spinIntensity * 0.8) * dt;
            }

            // Miqyas və Mərkəz (Mini kanvas və tam ekran üçün optimal miqyas)
            const scale = Math.min(w / 720, h / 510) * (isIngame ? 0.48 : (w < 200 ? 0.55 : 0.75)) * (0.2 + 0.8 * scaleGrow);
            const cx = w / 2 + this.x;
            const cy = isIngame ? (h * 0.48 + this.y) : (h * 0.42 + this.y);

            // Avtomatik Ulduz Şığıması (Hər mövzu orbitindən ulduz qopur və aşağı şığıyır)
            if (this.starDropTimers[themeKey] === undefined) this.starDropTimers[themeKey] = 1.0;
            this.starDropTimers[themeKey] -= dt;
            if (this.starDropTimers[themeKey] <= 0) {
                stellarSys.launchStar(cx, cy, themeKey, activeTheme, this.rot3D, scale);
                this.starDropTimers[themeKey] = MathUtils.randomRange(1.8, 3.2);
            }

            // Şatır və Ulduz Sisteminin yenilənməsi
            const floorLevel = isIngame ? (h - 20) : (h - 25);
            stellarSys.update(dt, floorLevel);
            activeTheme.update(dt);

            // Şok partlayışı
            if (t >= 2.4 && t <= 2.45) {
                activeTheme.triggerBurst();
            }

            // ==================== DÖŞƏMƏ VƏ HUD TƏLİMATI (FULLSCREEN PREVİEW) ====================
            if (!isIngame && w > 380) {
                ctx.save();
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                ctx.moveTo(0, h - 25);
                ctx.lineTo(w, h - 25);
                ctx.stroke();
                ctx.restore();

                // 3D HUD Göstəricisi
                ctx.save();
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillStyle = '#38bdf8';
                const pitchDeg = Math.round(this.rot3D.rx * (180 / Math.PI));
                const rollDeg = Math.round(-this.rot3D.ry * (180 / Math.PI));
                const pCount = (typeof activeTheme.getParticleCount === 'function') ? activeTheme.getParticleCount() : 150;
                ctx.fillText(`3D PITCH: ${pitchDeg > 0 ? '+' : ''}${pitchDeg}° · ROLL: ${rollDeg > 0 ? '+' : ''}${rollDeg}° | ORBİT: ${pCount}`, 16, 24);
                ctx.fillStyle = '#64748b';
                ctx.font = '9px "JetBrains Mono", monospace';
                ctx.fillText(`DÖŞƏMƏ TOQQUŞMASI: AKTİV · [W][A][S][D] / Drag · [BOŞLUQ]: Şok · [E]: Ulduz`, 16, 38);
                ctx.restore();
            }

            // ==================== 1. 3D ORIENTASİYA VƏ HALQALAR ====================
            ctx.save();
            ctx.globalAlpha = Math.min(1, ringsUnfold);
            activeTheme.render(ctx, cx, cy, t, this.rot3D, this.speedFactor, this.ringAngles, scale);
            ctx.restore();

            // ==================== 2. DÜŞƏN ULDUZLAR VƏ KRİSTAL QƏLPƏLƏRİ ====================
            stellarSys.render(ctx);

            // ==================== 3. MONSUN ORBİTDƏN DOĞULMASI ====================
            if (typeof drawMonster === 'function' && monsterEmerge > 0.05) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(scale * monsterEmerge, scale * monsterEmerge);
                ctx.globalAlpha = Math.min(1, monsterEmerge * 1.15);

                // Mövzuya uyğun parıldayan Kvant enerji aurası
                const auraColors = {
                    singularity: { inner: 'rgba(56, 189, 248, 0.55)', mid: 'rgba(6, 182, 212, 0.2)' },
                    supernova: { inner: 'rgba(245, 158, 11, 0.55)', mid: 'rgba(234, 88, 12, 0.2)' },
                    synapse: { inner: 'rgba(192, 132, 252, 0.55)', mid: 'rgba(147, 51, 234, 0.2)' },
                    abyssal: { inner: 'rgba(45, 212, 191, 0.55)', mid: 'rgba(13, 148, 136, 0.2)' }
                };
                const ac = auraColors[themeKey] || auraColors.singularity;

                const auraR = 48;
                const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraR);
                auraGrad.addColorStop(0, ac.inner);
                auraGrad.addColorStop(0.6, ac.mid);
                auraGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = auraGrad;
                ctx.beginPath();
                ctx.arc(0, 0, auraR, 0, Math.PI * 2);
                ctx.fill();

                drawMonster(ctx, t);
                ctx.restore();
            }
        }
    };

    const SingularityEffects = {
        singularity: {
            id: 'singularity',
            name: 'Kiber Sinqulyarlıq',
            title: 'Cyber Singularity',
            color: '#38bdf8',
            duration: 7.8,
            draw(ctx, w, h, t, drawMonster, isIngame = false) {
                SingularitySpawnEffect.draw(ctx, w, h, t, drawMonster, isIngame, 'singularity');
            }
        },
        supernova: {
            id: 'supernova',
            name: 'Plazma Supernova',
            title: 'Plasma Supernova',
            color: '#fbbf24',
            duration: 7.8,
            draw(ctx, w, h, t, drawMonster, isIngame = false) {
                SingularitySpawnEffect.draw(ctx, w, h, t, drawMonster, isIngame, 'supernova');
            }
        },
        synapse: {
            id: 'synapse',
            name: 'Kvant Sinapsı',
            title: 'Quantum Synapse',
            color: '#c084fc',
            duration: 7.8,
            draw(ctx, w, h, t, drawMonster, isIngame = false) {
                SingularitySpawnEffect.draw(ctx, w, h, t, drawMonster, isIngame, 'synapse');
            }
        },
        abyssal: {
            id: 'abyssal',
            name: 'Dərin Abiss',
            title: 'Deep Abyssal',
            color: '#2dd4bf',
            duration: 7.8,
            draw(ctx, w, h, t, drawMonster, isIngame = false) {
                SingularitySpawnEffect.draw(ctx, w, h, t, drawMonster, isIngame, 'abyssal');
            }
        }
    };

    // Qlobal reyestrə qeydiyyat - 4 mövzunun hər birini fərdi modul kimi qeydiyyatdan keçiririk!
    if (typeof window !== 'undefined') {
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
        if (global.SpawnEffectRegistry) {
            Object.keys(SingularityEffects).forEach(id => {
                global.SpawnEffectRegistry.register(id, SingularityEffects[id]);
            });
        }
    }
})();
