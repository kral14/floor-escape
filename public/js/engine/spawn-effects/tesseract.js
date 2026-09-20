// Original 4D tesseract geometry and effects, adapted to the game render loop.
(function(){
    class QuantumSoundEngine {
      constructor() {
        this.ctx = null;
      }
      canPlay() {
        if (typeof window === 'undefined') return false;
        if (window.spawnAnimAudioEnabled) return true;
        if (typeof gameRunning !== 'undefined' && gameRunning) return true;
        if (typeof isGameActive !== 'undefined' && isGameActive) return true;
        const fsModal = document.getElementById('spawn-anim-fullscreen-modal');
        return !!(fsModal && !fsModal.classList.contains('hidden'));
      }
      init() {
        if (!this.canPlay()) return;
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        if (!this.ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
      playTesseractFold() {
        if (!this.canPlay() || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(320, t);
          osc1.frequency.exponentialRampToValueAtTime(80, t + 0.28);
          osc2.frequency.setValueAtTime(640, t);
          osc2.frequency.exponentialRampToValueAtTime(160, t + 0.28);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.28);
          osc2.stop(t + 0.28);
        } catch (e) {}
      }
      playGravitonLaunch() {
        if (!this.canPlay() || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(950, t);
          osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);
          gain.gain.setValueAtTime(0.16, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.22);
        } catch (e) {}
      }
      playGravitonImplosion() {
        if (!this.canPlay() || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          // 1. Heavy Gravitational Sub-Drop & Detonation
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = 'sawtooth';
          subOsc.frequency.setValueAtTime(240, t);
          subOsc.frequency.exponentialRampToValueAtTime(18, t + 0.55);
          subGain.gain.setValueAtTime(0.42, t);
          subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
          subOsc.connect(subGain);
          subGain.connect(this.ctx.destination);
          subOsc.start(t);
          subOsc.stop(t + 0.55);

          // 2. High-Voltage Lightning Crackle Burst (White Noise Discharge)
          const bufferSize = this.ctx.sampleRate * 0.38;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            // Chaotic electrical spark bursts
            const spike = Math.random() > 0.88 ? 3.0 : 1.0;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28)) * spike;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.linearRampToValueAtTime(2800, t + 0.15);
          filter.frequency.exponentialRampToValueAtTime(120, t + 0.38);
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.35, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noise.start(t);

          // 3. Resonant Hyper-Ionization Arpeggio Tone
          const ionOsc = this.ctx.createOscillator();
          const ionGain = this.ctx.createGain();
          ionOsc.type = 'triangle';
          ionOsc.frequency.setValueAtTime(1280, t);
          ionOsc.frequency.exponentialRampToValueAtTime(95, t + 0.4);
          ionGain.gain.setValueAtTime(0.22, t);
          ionGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          ionOsc.connect(ionGain);
          ionGain.connect(this.ctx.destination);
          ionOsc.start(t);
          ionOsc.stop(t + 0.4);
        } catch (e) {}
      }
      playForgeOrb() {
        if (!this.canPlay() || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, t);
          osc.frequency.exponentialRampToValueAtTime(1480, t + 0.2);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        } catch (e) {}
      }
    }
    const audio = new QuantumSoundEngine();

    const MathUtils = {
      clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      smooth: (a, b, t) => {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
      },
      randomRange: (min, max) => min + Math.random() * (max - min)
    };

    // TRUE 4D HYPERCUBE MATHEMATICS
    // 16 Vertices: (±1, ±1, ±1, ±1)
    // 32 Edges: pairs differing by exactly one coordinate
    const Math4D = {
      vertices: [],
      edges: [],
      init() {
        for (let i = 0; i < 16; i++) {
          const x = (i & 1) ? 1 : -1;
          const y = (i & 2) ? 1 : -1;
          const z = (i & 4) ? 1 : -1;
          const w = (i & 8) ? 1 : -1;
          this.vertices.push([x, y, z, w]);
        }
        for (let i = 0; i < 16; i++) {
          for (let j = i + 1; j < 16; j++) {
            let diff = 0;
            for (let k = 0; k < 4; k++) {
              if (this.vertices[i][k] !== this.vertices[j][k]) diff++;
            }
            if (diff === 1) {
              this.edges.push([i, j]);
            }
          }
        }
      },
      // Rotate in 4D space across (XW, YW, ZW) and 3D space (XY, XZ, YZ)
      rotateAndProject(vertex, rot4D, rot3D, scale = 75, fov3D = 480) {
        let [x, y, z, w] = vertex;

        // 4D Rotation in XW Plane (Inside-Out Inversion)
        const cosXW = Math.cos(rot4D.xw), sinXW = Math.sin(rot4D.xw);
        const x1 = x * cosXW - w * sinXW;
        const w1 = x * sinXW + w * cosXW;

        // 4D Rotation in YW Plane
        const cosYW = Math.cos(rot4D.yw), sinYW = Math.sin(rot4D.yw);
        const y2 = y * cosYW - w1 * sinYW;
        const w2 = y * sinYW + w1 * cosYW;

        // 4D Rotation in ZW Plane
        const cosZW = Math.cos(rot4D.zw), sinZW = Math.sin(rot4D.zw);
        const z3 = z * cosZW - w2 * sinZW;
        const w3 = z * sinZW + w2 * cosZW;

        // 4D Stereographic / Perspective Projection to 3D Space
        // Distance along 4th dimension
        const dist4D = 2.6;
        const k4 = 1 / (dist4D - w3);
        const x3D = x1 * k4 * scale;
        const y3D = y2 * k4 * scale;
        const z3D = z3 * k4 * scale;

        // 3D Perspective Projection to 2D Screen
        // Pitch (rx)
        const cosX = Math.cos(rot3D.rx), sinX = Math.sin(rot3D.rx);
        const yP = y3D * cosX - z3D * sinX;
        const zP = y3D * sinX + z3D * cosX;

        // Roll / Yaw (ry)
        const cosY = Math.cos(rot3D.ry), sinY = Math.sin(rot3D.ry);
        const xR = x3D * cosY + zP * sinY;
        const zR = -x3D * sinY + zP * cosY;

        // Bank (rz)
        const cosZ = Math.cos(rot3D.rz), sinZ = Math.sin(rot3D.rz);
        const xF = xR * cosZ - yP * sinZ;
        const yF = xR * sinZ + yP * cosZ;

        const depth = fov3D + zR;
        const k2D = depth > 20 ? fov3D / depth : 1;

        return {
          x: xF * k2D,
          y: yF * k2D,
          z: zR,
          w: w3,
          k: k2D,
          hyperDepth: w3
        };
      }
    };
    Math4D.init();

    class SpacetimeCurvatureGrid {
      constructor(engine) {
        this.engine = engine;
        this.gridSpacing = 36;
      }
      render(ctx) {
        const w = this.engine.w;
        const h = this.engine.h;
        const cx = w / 2 + this.engine.x;
        const cy = h / 2 + this.engine.y;

        ctx.save();
        ctx.lineWidth = 1;

        const cols = Math.ceil(w / this.gridSpacing) + 2;
        const rows = Math.ceil(h / this.gridSpacing) + 2;

        // Draw distorted spacetime grid lines
        // Points get drawn towards the entity and active floor singularities
        const activeSingularities = this.engine.singularitySystem.implosions;

        for (let r = 0; r <= rows; r++) {
          const baseY = r * this.gridSpacing;
          ctx.beginPath();
          for (let c = 0; c <= cols; c++) {
            const baseX = c * this.gridSpacing;

            let curX = baseX;
            let curY = baseY;

            // 1. Gravity distortion towards the Tesseract Entity
            const dx = cx - curX;
            const dy = cy - curY;
            const dist = Math.hypot(dx, dy);
            if (dist > 10 && dist < 320) {
              const pull = (1 - dist / 320) * (26 + this.engine.speedFactor * 32);
              curX += (dx / dist) * pull;
              curY += (dy / dist) * pull;
            }

            // 2. Gravity distortion towards Active Floor Singularities
            for (const s of activeSingularities) {
              const sdx = s.x - curX;
              const sdy = s.y - curY;
              const sdist = Math.hypot(sdx, sdy);
              if (sdist > 6 && sdist < 260) {
                const sPull = (1 - sdist / 260) * s.gravityPower * 42;
                curX += (sdx / sdist) * sPull;
                curY += (sdy / sdist) * sPull;
              }
            }

            if (c === 0) ctx.moveTo(curX, curY);
            else ctx.lineTo(curX, curY);
          }
          ctx.strokeStyle = 'rgba(147, 51, 234, 0.09)';
          ctx.stroke();
        }

        // Floor Event Horizon Boundary Line
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, h - 6);
        ctx.lineTo(w, h - 6);
        ctx.stroke();
        ctx.restore();
      }
    }

    class SingularitySystem {
      constructor(engine) {
        this.engine = engine;
        this.projectiles = [];
        this.implosions = [];
        this.quantumDebris = [];
        this.lightnings = [];
        this.damagePopups = [];
        this.groundFlashes = [];
        this.slots = [true, true, true, true, true, true];
        this.maxAmmo = 6;
        this.resonanceProgress = 0;
        this.chronoWaveTime = 0;
      }

      getAmmoCount() {
        return this.slots.filter(Boolean).length;
      }

      reset() {
        this.projectiles = [];
        this.implosions = [];
        this.quantumDebris = [];
        this.lightnings = [];
        this.damagePopups = [];
        this.groundFlashes = [];
        this.slots = [true, true, true, true, true, true];
        this.resonanceProgress = 0;
        this.updateHUD();
      }

      launchGraviton() {
        if (this.engine.currentPhase < 4) return;

        const loaded = [];
        for (let i = 0; i < 6; i++) {
          if (this.slots[i]) loaded.push(i);
        }
        if (!loaded.length) {
          const btn = document.getElementById('fireGravitonBtn');
          if (btn) {
            btn.classList.add('opacity-50');
            btn.textContent = '⚛ Şarj Boşdur! Sağa-sola uçun ↻';
          }
          return;
        }

        const slotIdx = loaded[Math.floor(Math.random() * loaded.length)];
        this.slots[slotIdx] = false;

        const cx = this.engine.w / 2 + this.engine.x;
        const cy = this.engine.h / 2 + this.engine.y;

        // High velocity graviton singularity orb
        this.projectiles.push({
          x: cx + MathUtils.randomRange(-20, 20),
          y: cy + 30,
          vx: MathUtils.randomRange(-40, 40) + this.engine.vx * 0.15,
          vy: MathUtils.randomRange(440, 580),
          gravity: 860,
          size: 7.5,
          spin: MathUtils.randomRange(-15, 15),
          angle: 0,
          tail: [],
          color: '#f0abfc'
        });

        audio.playGravitonLaunch();
        this.updateHUD();
      }

      forgeNewGraviton() {
        const empty = [];
        for (let i = 0; i < 6; i++) {
          if (!this.slots[i]) empty.push(i);
        }
        if (!empty.length) return;

        this.slots[empty[0]] = true;
        audio.playForgeOrb();
        this.updateHUD();
      }

      triggerFloorImplosion(x, y) {
        audio.playGravitonImplosion();

        // 1. Heavy Camera Shake / Screen Trauma
        this.engine.addScreenShake(26);

        // 2. High-Yield Gravitational Singularity Core (Violently pulls spacetime grid)
        this.implosions.push({
          x,
          y,
          radius: 4,
          maxRadius: MathUtils.randomRange(90, 130),
          gravityPower: 2.4, // Massive spacetime warp strength
          life: 1.1,
          maxLife: 1.1,
          rings: 4
        });

        // 3. Violent Multidirectional Ground Lightning Bolts & Sky Arcs
        const boltCount = Math.floor(MathUtils.randomRange(8, 14));
        for (let b = 0; b < boltCount; b++) {
          // Arc sideways across the floor and branch upward into the atmosphere
          const isFloorDischarge = Math.random() > 0.35;
          const targetX = isFloorDischarge 
            ? x + MathUtils.randomRange(-280, 280)
            : x + MathUtils.randomRange(-160, 160);
          const targetY = isFloorDischarge 
            ? y - MathUtils.randomRange(0, 18)
            : y - MathUtils.randomRange(70, 220);

          // Generate jagged lightning path
          const segments = Math.floor(MathUtils.randomRange(7, 13));
          const points = [{ x, y }];
          let curX = x;
          let curY = y;
          const dx = (targetX - x) / segments;
          const dy = (targetY - y) / segments;

          for (let s = 1; s < segments; s++) {
            const jitterRange = 22;
            curX += dx + MathUtils.randomRange(-jitterRange, jitterRange);
            curY += dy + MathUtils.randomRange(-jitterRange, jitterRange);
            points.push({ x: curX, y: curY });
          }
          points.push({ x: targetX, y: targetY });

          this.lightnings.push({
            points,
            life: MathUtils.randomRange(0.22, 0.42),
            maxLife: 0.42,
            width: MathUtils.randomRange(2.2, 4.2),
            color: Math.random() > 0.3 ? '#67e8f9' : '#f472b6',
            coreColor: '#ffffff'
          });
        }

        // 4. Blinding Ground Ionization Flash
        this.groundFlashes.push({
          x,
          y,
          radius: 8,
          maxRadius: MathUtils.randomRange(120, 190),
          alpha: 1.0,
          color: '#e879f9'
        });

        // 5. High-Impact Critical Damage Telemetry Popup
        const rawDamage = Math.floor(MathUtils.randomRange(88500, 146000));
        this.damagePopups.push({
          x,
          y: y - 28,
          damageText: `CRITICAL DETONATION: -${rawDamage.toLocaleString()}`,
          subText: '⚡ QRAVİTON İMPLOZİYASI · SİNQULYARLIQ YARILMASI',
          alpha: 1.0,
          vy: -85,
          scale: 1.4
        });

        // 6. Dense High-speed Quantum Debris (Micro Tesseract Shards)
        const shardCount = Math.floor(MathUtils.randomRange(32, 46));
        for (let i = 0; i < shardCount; i++) {
          const a = -Math.PI / 2 + MathUtils.randomRange(-Math.PI * 0.48, Math.PI * 0.48);
          const spd = MathUtils.randomRange(260, 680);
          this.quantumDebris.push({
            x,
            y,
            vx: Math.cos(a) * spd + MathUtils.randomRange(-35, 35),
            vy: Math.sin(a) * spd,
            gravity: 860,
            friction: 0.962,
            size: MathUtils.randomRange(3.5, 8.5),
            angle: Math.random() * Math.PI * 2,
            spin: MathUtils.randomRange(-22, 22),
            alpha: 1.0,
            decay: MathUtils.randomRange(0.8, 1.6),
            color: Math.random() > 0.4 ? '#e879f9' : (Math.random() > 0.5 ? '#67e8f9' : '#ffffff')
          });
        }
      }

      update(dt) {
        this.chronoWaveTime += dt;
        const floorY = this.engine.h - 6;

        // Auto Kinetic Recharge DISABLED in-game (Ammo is collected from the arena)
        if (this.engine.currentPhase >= 4 && !this.engine.isGame) {
          const ammo = this.getAmmoCount();
          if (ammo < this.maxAmmo) {
            if (this.engine.speedFactor > 0.22) {
              this.resonanceProgress += this.engine.speedFactor * 1.7 * dt;
              if (this.resonanceProgress >= 1.0) {
                this.resonanceProgress = 0;
                this.forgeNewGraviton();
              }
            }
          } else {
            this.resonanceProgress = 1.0;
          }
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const p = this.projectiles[i];
          p.tail.push({ x: p.x, y: p.y });
          if (p.tail.length > 12) p.tail.shift();

          p.vy += p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.angle += p.spin * dt;

          if (p.y >= floorY) {
            this.triggerFloorImplosion(p.x, floorY);
            this.projectiles.splice(i, 1);
            continue;
          }
          if (p.x < 10) { p.x = 10; p.vx = Math.abs(p.vx) * 0.7; }
          else if (p.x > this.engine.w - 10) { p.x = this.engine.w - 10; p.vx = -Math.abs(p.vx) * 0.7; }
        }

        // Update Implosion Gravity Wells
        for (let i = this.implosions.length - 1; i >= 0; i--) {
          const imp = this.implosions[i];
          imp.life -= dt;
          const ratio = Math.max(0, imp.life / imp.maxLife);
          imp.radius += (imp.maxRadius - imp.radius) * 10 * dt;
          imp.gravityPower = ratio * 2.4;
          if (imp.life <= 0) this.implosions.splice(i, 1);
        }

        // Update Violent Lightning Arcs
        for (let i = this.lightnings.length - 1; i >= 0; i--) {
          const l = this.lightnings[i];
          l.life -= dt;
          if (l.life <= 0) this.lightnings.splice(i, 1);
        }

        // Update Ground Flashes
        for (let i = this.groundFlashes.length - 1; i >= 0; i--) {
          const gf = this.groundFlashes[i];
          gf.radius += (gf.maxRadius - gf.radius) * 12 * dt;
          gf.alpha -= 2.6 * dt;
          if (gf.alpha <= 0) this.groundFlashes.splice(i, 1);
        }

        // Update High Damage Floating Popups
        for (let i = this.damagePopups.length - 1; i >= 0; i--) {
          const d = this.damagePopups[i];
          d.y += d.vy * dt;
          d.vy *= 0.94; // Decelerate as it rises
          d.scale = Math.max(1.0, d.scale - dt * 0.7);
          d.alpha -= 0.68 * dt;
          if (d.alpha <= 0) this.damagePopups.splice(i, 1);
        }

        // Update Quantum Debris
        for (let i = this.quantumDebris.length - 1; i >= 0; i--) {
          const d = this.quantumDebris[i];
          d.vx *= d.friction;
          d.vy += d.gravity * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.angle += d.spin * dt;
          d.alpha -= d.decay * dt;

          if (d.y >= floorY) {
            d.y = floorY;
            d.vy = -Math.abs(d.vy) * 0.35;
            d.vx *= 0.8;
          }
          if (d.alpha <= 0) this.quantumDebris.splice(i, 1);
        }

        this.updateHUD();
      }

      updateHUD() {
        const ammo = this.getAmmoCount();
        const pips = document.getElementById('gravitonPips');
        const num = document.getElementById('ammoNumber');
        const meter = document.getElementById('hyperMeter');
        const btn = document.getElementById('fireGravitonBtn');

        if (pips) {
          let str = '';
          for (let i = 0; i < 6; i++) {
            str += this.slots[i] ? '⚛ ' : '· ';
          }
          pips.textContent = str.trim();
        }

        if (num) {
          num.textContent = `(${ammo}/6)`;
          num.className = ammo === 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-fuchsia-400';
        }

        if (meter) {
          meter.style.width = `${Math.min(100, Math.round(this.resonanceProgress * 100))}%`;
        }

        if (btn) {
          if (ammo > 0) {
            btn.classList.remove('opacity-50');
            btn.textContent = `⚛ Qraviton İmplozoru At [E] (${ammo})`;
          } else {
            btn.classList.add('opacity-50');
            btn.textContent = '⚛ Sağa-sola uçub tesseraktı fırlat!';
          }
        }
      }

      render(ctx) {
        ctx.save();

        // 1. Render Blinding Ground Shockwave Flashes
        for (const gf of this.groundFlashes) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, gf.alpha);
          const flashGrad = ctx.createRadialGradient(gf.x, gf.y, 0, gf.x, gf.y, gf.radius);
          flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          flashGrad.addColorStop(0.3, 'rgba(103, 232, 249, 0.65)');
          flashGrad.addColorStop(0.7, 'rgba(232, 121, 249, 0.25)');
          flashGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(gf.x, gf.y, gf.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 2. Render Singularity Implosion Wells (Black hole lens effect on floor)
        for (const imp of this.implosions) {
          ctx.save();
          ctx.translate(imp.x, imp.y);
          const alpha = Math.max(0, imp.life / imp.maxLife);

          // Dark Gravitational Horizon Well
          ctx.fillStyle = `rgba(5, 1, 15, ${alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(0, 0, imp.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Shockwave Prismatic Accretion Rings
          ctx.strokeStyle = `rgba(216, 180, 254, ${alpha})`;
          ctx.shadowColor = '#e879f9';
          ctx.shadowBlur = 24;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.arc(0, 0, imp.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Secondary Inward Collapse Ring
          ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.8})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, imp.radius * 0.72, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }

        // 3. Render Violent Jagged Lightning Storm Arcs
        for (const l of this.lightnings) {
          const ratio = Math.max(0, l.life / l.maxLife);
          ctx.save();
          ctx.globalAlpha = ratio;

          // Outer Plasma Glow
          ctx.strokeStyle = l.color;
          ctx.shadowColor = l.color;
          ctx.shadowBlur = 18;
          ctx.lineWidth = l.width * (1.2 + (1 - ratio) * 0.6);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'miter';
          ctx.beginPath();
          l.points.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();

          // Superconducting White Core
          ctx.strokeStyle = l.coreColor;
          ctx.lineWidth = Math.max(1.0, l.width * 0.45);
          ctx.stroke();

          ctx.restore();
        }

        // 4. Render Graviton Projectiles
        for (const p of this.projectiles) {
          ctx.save();
          // Hyper-trail
          for (let t = 0; t < p.tail.length; t++) {
            const pt = p.tail[t];
            const ratio = t / p.tail.length;
            ctx.fillStyle = '#c084fc';
            ctx.globalAlpha = ratio * 0.45;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, p.size * ratio * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.shadowColor = '#f0abfc';
          ctx.shadowBlur = 18;

          // Double Concentric Graviton Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }

        // Render Quantum Debris
        for (const d of this.quantumDebris) {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.angle);
          ctx.globalAlpha = Math.max(0, d.alpha);
          ctx.fillStyle = d.color;
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 1.4);
          ctx.restore();
        }

        // 5. Render High-Damage Popups
        for (const dp of this.damagePopups) {
          ctx.save();
          ctx.translate(dp.x, dp.y);
          ctx.scale(dp.scale, dp.scale);
          ctx.globalAlpha = Math.max(0, dp.alpha);
          ctx.textAlign = 'center';

          // Critical Damage Number
          ctx.font = '800 16px "JetBrains Mono", monospace';
          ctx.fillStyle = '#fdf2f8';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 18;
          ctx.fillText(dp.damageText, 0, 0);

          // Subtitle Telemetry
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#67e8f9';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
          ctx.fillText(dp.subText, 0, 14);

          ctx.restore();
        }

        ctx.restore();
      }
    }

    const TesseractRenderer = {
      render(ctx, time, rot4D, rot3D, speedFactor, assemblyRatio, ammoSlots = []) {
        ctx.save();
        const baseScale = 90 + speedFactor * 16;
        const progress = MathUtils.clamp(assemblyRatio, 0, 1);
        if (progress <= 0) {
          ctx.restore();
          return;
        }

        // Calculate all 16 projected 4D Vertices in 2D Screen
        const projVerts = Math4D.vertices.map((v, idx) => {
          const p = Math4D.rotateAndProject(v, rot4D, rot3D, baseScale * progress);
          return { ...p, idx };
        });

        // FANTASTIC EFFECT 1: CHROMATIC ABERRATION PRISMATIC EDGES
        // As speed increases, tesseract separates into RGB quantum fringes!
        const chromaOffset = speedFactor * 4;

        for (const [i, j] of Math4D.edges) {
          const p1 = projVerts[i];
          const p2 = projVerts[j];

          // Edge depth cue
          const avgZ = (p1.z + p2.z) * 0.5;
          const avgW = (p1.hyperDepth + p2.hyperDepth) * 0.5;
          const depthAlpha = MathUtils.clamp(0.25 + (avgW + 1) * 0.38 + speedFactor * 0.3, 0.15, 1.0);

          ctx.save();
          if (chromaOffset > 0.5) {
            // Cyan fringe
            ctx.strokeStyle = `rgba(103, 232, 249, ${depthAlpha * 0.6})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(p1.x - chromaOffset, p1.y);
            ctx.lineTo(p2.x - chromaOffset, p2.y);
            ctx.stroke();

            // Magenta fringe
            ctx.strokeStyle = `rgba(244, 114, 182, ${depthAlpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(p1.x + chromaOffset, p1.y);
            ctx.lineTo(p2.x + chromaOffset, p2.y);
            ctx.stroke();
          }

          // Main Glowing Hyper-Laser Edge
          ctx.strokeStyle = `rgba(192, 132, 252, ${depthAlpha})`;
          ctx.shadowColor = '#e879f9';
          ctx.shadowBlur = 8 + speedFactor * 16;
          ctx.lineWidth = (1.5 + (avgW + 1) * 0.8 + speedFactor * 1.5) * p1.k;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }

        // FANTASTIC EFFECT 2: 16 HYPER-NODES & MOUNTED SINGULARITY ORBS
        // Top 6 vertices with highest W-coordinate hold the active graviton orbs!
        const sortedByW = [...projVerts].sort((a, b) => b.hyperDepth - a.hyperDepth);

        projVerts.forEach(p => {
          ctx.save();
          const nodeSize = (4.0 + (p.hyperDepth + 1) * 2.5 + speedFactor * 2) * p.k;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 12 + speedFactor * 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, nodeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Render Graviton Orbs loaded on 6 primary dimensional anchor vertices
        if (progress > 0.6) {
          for (let k = 0; k < 6; k++) {
            if (ammoSlots[k]) {
              const anchor = sortedByW[k];
              const orbPulse = (Math.sin(time * 6 + k * 1.2) * 0.5 + 0.5) * 3;
              ctx.save();
              ctx.fillStyle = '#f0abfc';
              ctx.shadowColor = '#e879f9';
              ctx.shadowBlur = 16 + speedFactor * 16;
              ctx.beginPath();
              ctx.arc(anchor.x, anchor.y, (7.0 + orbPulse) * anchor.k, 0, Math.PI * 2);
              ctx.fill();

              // Concentric quantum ring around orb
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(anchor.x, anchor.y, (12.0 + orbPulse * 1.5) * anchor.k, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // FANTASTIC EFFECT 3: HOLLOW INNER CHRONO-STASIS CHAMBER (FOR MONS)
        // A crystal octagonal/circular forcefield keeping Mons protected in stasis
        const stasisRadius = 48 + speedFactor * 6;
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 16 + speedFactor * 14;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, stasisRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Counter-rotating telemetry dash rings
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, stasisRadius - 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }
    };

    const ChronoMonsRenderer = {
      drawDefaultMons(ctx, t, alpha = 1.0) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = MathUtils.clamp(alpha, 0, 1);

        const breathing = Math.sin(t * 3.6) * 1.8;

        // Gravitational Stasis Field Aura
        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 38);
        halo.addColorStop(0, 'rgba(192, 132, 252, 0.32)');
        halo.addColorStop(0.7, 'rgba(126, 34, 206, 0.12)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();

        // 4D Chrono Horns (Geometric Prisms)
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.fillStyle = '#3b0764';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(10, -12);
          ctx.lineTo(24, -28);
          ctx.lineTo(16, -39);
          ctx.lineTo(8, -14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Mons Quantum Shell Body
        const bodyGrad = ctx.createRadialGradient(-6, -7, 2, 0, 0, 26);
        bodyGrad.addColorStop(0, '#581c87');
        bodyGrad.addColorStop(0.7, '#2e1065');
        bodyGrad.addColorStop(1, '#7e22ce');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, breathing * 0.4, 23, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dark Visor Face Shield
        ctx.fillStyle = '#090214';
        ctx.beginPath();
        ctx.ellipse(0, 1 + breathing * 0.4, 17, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Bioluminescent Hyper-Eyes
        ctx.fillStyle = '#f0abfc';
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 8;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 10, -2 + breathing * 0.3);
          ctx.lineTo(side * 3, -6 + breathing * 0.3);
          ctx.lineTo(side * 4, 1 + breathing * 0.3);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Digital Smile
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, 7 + breathing * 0.3);
        ctx.lineTo(0, 10 + breathing * 0.3);
        ctx.lineTo(5, 7 + breathing * 0.3);
        ctx.stroke();

        ctx.restore();
      }
    };

    class ChronoTesseractEngine {
      constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = null;

        this.drawCustomMonster = options.drawMonster || null;
        this.onPhaseChange = options.onPhaseChange || null;

        this.w = 800;
        this.h = 480;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        this.screenShake = 0;

        // 3D Euler Angles (Pitch, Roll/Yaw, Bank)
        this.rot3D = { rx: 0, ry: 0, rz: 0 };
        // 4D Rotation Tensors (Inside-Out hyper-rotations)
        this.rot4D = { xw: 0, yw: 0, zw: 0 };

        this.speedFactor = 0;
        this.timeline = 0;
        this.duration = 6.8;
        this.currentPhase = 1;

        this.spacetimeGrid = new SpacetimeCurvatureGrid(this);
        this.singularitySystem = new SingularitySystem(this);

        this.keys = {};
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;


        this.restartIntro();
      }

      addScreenShake(amount) {
        this.screenShake = Math.min(36, this.screenShake + amount);
      }

      resize() {
        const rect = this.container.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      restartIntro() {
        this.timeline = 0;
        this.currentPhase = 1;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.rot3D = { rx: 0, ry: 0, rz: 0 };
        this.rot4D = { xw: 0, yw: 0, zw: 0 };
        this.speedFactor = 0;
        this.singularitySystem.reset();

        audio.init();
        audio.playTesseractFold();
        this.updateHUD();
      }

      initControls() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('keydown', (e) => {
          if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
            this.keys[e.code] = true;
          } else if (e.code === 'KeyE' || e.code === 'Space') {
            e.preventDefault();
            this.singularitySystem.launchGraviton();
          }
        });

        window.addEventListener('keyup', (e) => {
          this.keys[e.code] = false;
        });

        let isDragging = false;
        let lastMouse = { x: 0, y: 0 };
        let lastDragTime = performance.now();

        const startDrag = (cx, cy) => {
          isDragging = true;
          lastMouse = { x: cx, y: cy };
          lastDragTime = performance.now();
          audio.init();
        };

        const moveDrag = (cx, cy) => {
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

        const endDrag = () => { isDragging = false; };

        this.canvas.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
        window.addEventListener('mouseup', endDrag);

        this.canvas.addEventListener('touchstart', (e) => {
          if (e.touches.length) startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
          if (e.touches.length) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchend', endDrag);
      }

      updateHUD() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
          const pct = Math.min(100, (this.timeline / this.duration) * 100);
          progressBar.style.width = `${pct}%`;
        }
      }

      step(dt) {
        this.timeline += dt;

        let newPhase = 1;
        if (this.timeline >= 5.4) newPhase = 4;
        else if (this.timeline >= 3.4) newPhase = 3;
        else if (this.timeline >= 1.4) newPhase = 2;

        if (newPhase !== this.currentPhase) {
          this.currentPhase = newPhase;
          if (newPhase === 3) audio.playTesseractFold();
          this.onPhaseChange?.(this.currentPhase);
        }

        let dx = 0, dy = 0;
        if (this.currentPhase >= 4) {
          if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
          if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
          if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
          if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        }

        const moveSpeed = 270;
        this.vx += (dx * moveSpeed - this.vx) * 0.12;
        this.vy += (dy * moveSpeed - this.vy) * 0.12;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const limitX = this.w * 0.38;
        const limitY = this.h * 0.34;
        this.x = MathUtils.clamp(this.x, -limitX, limitX);
        this.y = MathUtils.clamp(this.y, -limitY, limitY);

        const curSpeed = Math.hypot(this.vx, this.vy);
        const targetSpeedFactor = Math.min(1.0, curSpeed / 180);
        this.speedFactor += (targetSpeedFactor - this.speedFactor) * Math.min(1, 10 * dt);

        // 4D ROTATION RATES (TURNING THE HYPERCUBE INSIDE OUT)
        // Horizontal flight rapidly speeds up 4D rotation!
        const hyperSpin = 0.38 + this.speedFactor * 3.8;
        this.rot4D.xw += hyperSpin * dt;
        this.rot4D.yw += (hyperSpin * 0.75) * dt;
        this.rot4D.zw += (hyperSpin * 0.5) * dt;

        // 3D Roll/Yaw and Pitch for Tesseract Orientations
        const targetRy = Math.max(-0.68, Math.min(0.68, -(this.vx / 270) * 0.65));
        const targetRx = Math.max(-0.55, Math.min(0.55, (this.vy / 270) * 0.5));
        const targetRz = Math.max(-0.25, Math.min(0.25, (this.vx / 270) * 0.2));

        const lerpSpeed = Math.min(1, 8.5 * dt);
        this.rot3D.rx += (targetRx - this.rot3D.rx) * lerpSpeed;
        this.rot3D.ry += (targetRy - this.rot3D.ry) * lerpSpeed;
        this.rot3D.rz += (targetRz - this.rot3D.rz) * lerpSpeed;

        if (this.screenShake > 0) {
          this.screenShake = Math.max(0, this.screenShake - 42 * dt);
        }

        this.singularitySystem.update(dt);
        this.updateHUD();
      }

      render() {
        const ctx = this.ctx;
        const nowSec = performance.now() / 1000;


        ctx.save();
        if (this.screenShake > 0.5) {
          const sx = (Math.random() * 2 - 1) * this.screenShake;
          const sy = (Math.random() * 2 - 1) * this.screenShake;
          ctx.translate(sx, sy);
        }

        // 1. Render Spacetime Curvature Grid (physically bent by gravity!)
        if (!this.isGame) this.spacetimeGrid.render(ctx);

        const cx = this.w / 2 + this.x;
        const cy = this.h / 2 + this.y;

        ctx.save();
        ctx.translate(cx, cy);

        // 2. Ambient Singularity Horizon Glow
        const assemblyProgress = MathUtils.smooth(1.4, 5.4, this.timeline);
        if (assemblyProgress > 0) {
          const glowAlpha = assemblyProgress * (0.28 + this.speedFactor * 0.3);
          const glowRadius = 240 + this.speedFactor * 55;
          const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
          bgGrad.addColorStop(0, `rgba(168, 85, 247, ${glowAlpha})`);
          bgGrad.addColorStop(0.5, `rgba(88, 28, 135, ${glowAlpha * 0.4})`);
          bgGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        }

        // 3. Render 4D Tesseract Structure & Singularity Orbs
        TesseractRenderer.render(
          ctx,
          nowSec,
          this.rot4D,
          this.rot3D,
          this.speedFactor,
          assemblyProgress,
          this.singularitySystem.slots
        );

        // 4. MONS CHARACTER EMBEDDED SAFELY IN CHRONO-STASIS CHAMBER
        const monsEmergence = MathUtils.smooth(5.0, 6.0, this.timeline);
        if (monsEmergence > 0) {
          ctx.save();
          if (this.drawCustomMonster) {
            this.drawCustomMonster(ctx, nowSec, monsEmergence);
          } else {
            ChronoMonsRenderer.drawDefaultMons(ctx, nowSec, monsEmergence);
          }
          ctx.restore();
        }

        ctx.restore();

        // 5. Render Singularity Implosions, Graviton Orbs & Quantum Shards
        this.singularitySystem.render(ctx);

        ctx.restore(); // Restore camera shake
      }

      start() {
        const loop = (now) => {
          const dt = Math.min(0.04, (now - this.lastTime) / 1000);
          this.lastTime = now;

          this.frameCount++;
          this.fpsTimer += dt;
          if (this.fpsTimer >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
            const fpsVal = document.getElementById('fpsVal');
            if (fpsVal) fpsVal.textContent = this.fps;
          }

          this.step(dt);
          this.render();

          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    }


    ChronoTesseractEngine.prototype.updateHUD = function() {};
    SingularitySystem.prototype.updateHUD = function() {};
    const instances = {};
    function getEngine(surface) {
        if (!instances[surface]) instances[surface] = new ChronoTesseractEngine({getContext:()=>null});
        return instances[surface];
    }
    const effect = {
        id: 'tesseract', name: '4D Kvant Tesseraktı', duration: 6.8, getEngine,
        resetFlight() { for (const [surface, e] of Object.entries(instances)) if (surface !== 'game') e.restartIntro(); },
        resetGame() { if (instances.game) instances.game.singularitySystem.reset(); },
        syncGame(p) {
            const e = getEngine('game'); e.isGame = true;
            const wH = (typeof getFloorWorldHeight === 'function' && typeof gameState !== 'undefined') ? getFloorWorldHeight(gameState.floor) : 3600;
            const tessCap = (typeof getTesseractAmmoCap === 'function') ? getTesseractAmmoCap() : 1;
            e.w = (typeof canvasWidth === 'number' ? canvasWidth : 800) / .54;
            e.h = wH / .54;
            e.x = p.x / .54 - e.w / 2;
            e.y = p.y / .54 - e.h / 2;
            e.timeline = 6.8;
            e.currentPhase = 4;
            e.singularitySystem.maxAmmo = tessCap;
            if (!p.tesseractSlots || p.tesseractSlots.length !== tessCap) {
                p.tesseractSlots = Array(tessCap).fill(true);
            }
            e.singularitySystem.slots = p.tesseractSlots.slice();
            return e;
        },
        updateGame(dt, p) {
            const e = this.syncGame(p);
            e.vx = (p.vx || 0) * 60;
            e.vy = (p.vy || 0) * 60;
            e.keys = {KeyD: p.vx > 0, KeyA: p.vx < 0, KeyW: p.vy < 0, KeyS: p.vy > 0};
            e.step(dt);
            p.tesseractSlots = e.singularitySystem.slots.slice();
            const boss = window.monster;
            if (boss && !boss.isDefeated) {
                for (let i = e.singularitySystem.projectiles.length - 1; i >= 0; i--) {
                    const pr = e.singularitySystem.projectiles[i], x = pr.x * .54, y = pr.y * .54;
                    const lavaY = typeof boss.surface === 'function' ? boss.surface(x, boss.y) : boss.y;
                    if (y >= lavaY - 15) {
                        e.singularitySystem.triggerFloorImplosion(pr.x, lavaY / .54);
                        e.singularitySystem.projectiles.splice(i, 1);
                        if (typeof boss.takeDamage === 'function') boss.takeDamage(350, 'shock', x, lavaY);
                    }
                }
            }
        },
        fireGame(p) {
            const tessCap = (typeof getTesseractAmmoCap === 'function') ? getTesseractAmmoCap() : 1;
            if (!p.tesseractSlots || p.tesseractSlots.length !== tessCap) {
                p.tesseractSlots = Array(tessCap).fill(true);
            }
            const loaded = [];
            for (let i = 0; i < p.tesseractSlots.length; i++) {
                if (p.tesseractSlots[i]) loaded.push(i);
            }
            if (loaded.length === 0) return false;

            p.tesseractSlots[loaded[0]] = false;
            const e = this.syncGame(p);
            e.singularitySystem.slots = p.tesseractSlots.slice();

            const cx = e.w / 2 + e.x;
            const cy = e.h / 2 + e.y;
            e.singularitySystem.projectiles.push({
                x: cx + MathUtils.randomRange(-15, 15),
                y: cy + 25,
                vx: MathUtils.randomRange(-35, 35) + e.vx * 0.15,
                vy: MathUtils.randomRange(460, 600),
                gravity: 860,
                size: 8,
                spin: MathUtils.randomRange(-15, 15),
                angle: 0,
                tail: [],
                color: '#f0abfc'
            });

            audio.playGravitonLaunch();
            if (typeof saveActiveRun === 'function') saveActiveRun();
            return true;
        },
        collectAmmo(p) {
            const tessCap = (typeof getTesseractAmmoCap === 'function') ? getTesseractAmmoCap() : 1;
            if (!p.tesseractSlots || p.tesseractSlots.length !== tessCap) {
                p.tesseractSlots = Array(tessCap).fill(true);
            }
            const currentCount = p.tesseractSlots.filter(Boolean).length;
            if (currentCount < tessCap) {
                const emptyIdx = p.tesseractSlots.indexOf(false);
                if (emptyIdx !== -1) {
                    p.tesseractSlots[emptyIdx] = true;
                    const e = this.syncGame(p);
                    e.singularitySystem.slots = p.tesseractSlots.slice();
                    return true;
                }
            }
            return false;
        },
        draw(c, w, h, t, drawMonster, isIngame = false, surface = 'preview') {
            if (w <= 200 && h <= 200) surface = 'card';
            const e = getEngine(surface), now = performance.now();
            const dt = e.drawAt === undefined ? 0 : Math.min(.04, Math.max(0, (now - e.drawAt) / 1000));
            e.drawAt = now;
            e.ctx = c; e.w = 600; e.h = 500; e.drawCustomMonster = drawMonster || (() => {}); e.isGame = surface === 'game';
            e.timeline = surface === 'card' || e.isGame ? 6.8 : t;
            e.step(dt);
            if (surface !== 'fullscreen') { e.x = 0; e.y = 0; }
            const scale = Math.min(w / 600, h / 500);
            c.save(); c.translate(w / 2, h / 2); c.scale(scale, scale); c.translate(-300, -250); e.render(); c.restore();
        },
        drawPlayer(c, p) {
            const e = getEngine('game');
            e.x = p.x / .54 - e.w / 2;
            e.y = p.y / .54 - e.h / 2;
            e.ctx = c;
            e.drawCustomMonster = () => {};
            c.save();
            c.scale(.54, .54);
            e.render();
            c.restore();
        }
    };
    window.TesseractSpawnEffect=effect;
})();
