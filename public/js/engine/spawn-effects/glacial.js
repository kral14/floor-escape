// Kvant Buz Zirehi — supplied original geometry, particles and assembly.
(function() {
    class MechaAudioEngine {
      constructor() {
        this.ctx = null;
      }
      init() {
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        if (!this.ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
      playServoClick() {
        if (!this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(850, t);
          osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        } catch (e) {}
      }
      playIceShoot() {
        if (!this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          // High-pitch glacial whistle launch
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, t);
          osc.frequency.exponentialRampToValueAtTime(320, t + 0.2);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        } catch (e) {}
      }
      playEnergyHum() {
        if (!this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(90, t);
          osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.25);
        } catch (e) {}
      }
      playIceForge() {
        if (!this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          // Crystal freezing chime when a new ice projectile is forged by spinning
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(880, t);
          osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.18);
          osc2.frequency.setValueAtTime(1320, t);
          osc2.frequency.exponentialRampToValueAtTime(2640, t + 0.18);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.22);
          osc2.stop(t + 0.22);
        } catch (e) {}
      }
      playIceShatter() {
        if (!this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          // Noise burst + multiple glass/crystal pings
          const bufferSize = this.ctx.sampleRate * 0.18;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2800, t);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(t);
        } catch (e) {}
      }
    }
    const audio = new MechaAudioEngine();

    const MathUtils = {
      clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      smooth: (a, b, t) => {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
      },
      randomRange: (min, max) => min + Math.random() * (max - min)
    };

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
        // Perspective factor
        const depth = this.fov + z2;
        const k = depth > 20 ? this.fov / depth : 1;
        return { x: x3 * k, y: y3 * k, z: z2, k };
      }
    };

    const ProceduralArcRenderer = {
      drawElectricArc(ctx, p1, p2, color = '#38bdf8', segments = 7, roughness = 12) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) return;

        const nx = -dy / dist;
        const ny = dx / dist;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        for (let i = 1; i < segments; i++) {
          const ratio = i / segments;
          const jitter = (Math.random() - 0.5) * roughness;
          const px = p1.x + dx * ratio + nx * jitter;
          const py = p1.y + dy * ratio + ny * jitter;
          ctx.lineTo(px, py);
        }
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      },

      drawEnergyConduit(ctx, p1, p2, speedFactor, pulseOffset = 0) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) return;

        ctx.save();
        // 1. Outer Neon Conduit Glow
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + speedFactor * 0.55})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12 + speedFactor * 16;
        ctx.lineWidth = 2.2 + speedFactor * 2.8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // 2. Ultra-Bright Superconducting Core
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.2 + speedFactor * 1.2;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // 3. High-Speed Energy Pulse Packet Travelling Along Conduit
        const packetRatio = (pulseOffset % 1);
        const px = p1.x + dx * packetRatio;
        const py = p1.y + dy * packetRatio;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + speedFactor * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      },

      draw3DPolygon(ctx, pts, strokeColor, fillColor = null, lineWidth = 1.5, glow = null) {
        if (!pts.length) return;
        ctx.save();
        if (glow) {
          ctx.shadowColor = glow;
          ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        if (fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    const MechaIrisSystem = {
      // 6 Mechanical Aperture Blades sliding outwards to reveal the hollow center
      renderIrisBlades(ctx, rx, ry, rz, openRatio, speedFactor) {
        const bladeCount = 6;
        const baseHollowRadius = 52; // Completely empty for Mons
        const slideOffset = openRatio * 32 + speedFactor * 12;

        for (let i = 0; i < bladeCount; i++) {
          const angle = (i * Math.PI * 2) / bladeCount;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Center of the individual blade sliding along radius
          const dist = baseHollowRadius + slideOffset;
          const cx = cos * dist;
          const cy = sin * dist;

          // Define an angular, sharp mecha blade geometry
          const w = 26;
          const h = 16;
          const perpX = -sin;
          const perpY = cos;

          const p1 = Math3D.project(cx - perpX * w * 0.5 - cos * h * 0.4, cy - perpY * w * 0.5 - sin * h * 0.4, 0, rx, ry, rz);
          const p2 = Math3D.project(cx + perpX * w * 0.5 - cos * h * 0.2, cy + perpY * w * 0.5 - sin * h * 0.2, 0, rx, ry, rz);
          const p3 = Math3D.project(cx + perpX * w * 0.3 + cos * h * 0.8, cy + perpY * w * 0.3 + sin * h * 0.8, 5, rx, ry, rz);
          const p4 = Math3D.project(cx - perpX * w * 0.4 + cos * h * 0.6, cy - perpY * w * 0.4 + sin * h * 0.6, 5, rx, ry, rz);

          ProceduralArcRenderer.draw3DPolygon(
            ctx,
            [p1, p2, p3, p4],
            '#38bdf8',
            'rgba(6, 78, 119, 0.4)',
            1.6 * p1.k,
            '#0284c7'
          );

          // High-tech glowing core slot on each blade
          const pCore = Math3D.project(cx, cy, 3, rx, ry, rz);
          ctx.save();
          ctx.fillStyle = '#67e8f9';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pCore.x, pCore.y, 2.5 * pCore.k, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Hollow Hexagonal Aperture Outline (Boundary for Mons)
        const hexPts = [];
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3;
          const r = baseHollowRadius + openRatio * 4;
          hexPts.push(Math3D.project(Math.cos(a) * r, Math.sin(a) * r, 0, rx, ry, rz));
        }
        ProceduralArcRenderer.draw3DPolygon(ctx, hexPts, 'rgba(56, 189, 248, 0.85)', null, 2.2, '#00f0ff');
        return hexPts;
      },

      // 6 Heavy Outer Floating Magnetic Pylons with 6 Ice Projectile Chambers + Overdrive Lockdown
      renderFloatingPylons(ctx, t, rx, ry, rz, speedFactor, assemblyRatio, icePylonSlots, ringRotation, hexPts = []) {
        const pylonCount = 6;
        // When moving fast, pylons contract inward into a tight magnetic defense perimeter!
        const orbitRadius = 148 - speedFactor * 24;
        const pylonsWorld = [];

        for (let i = 0; i < pylonCount; i++) {
          const pylonProgress = MathUtils.smooth(0.2 + i * 0.08, 0.8 + i * 0.05, assemblyRatio);
          if (pylonProgress <= 0) continue;

          // Orbit rotation linked with dynamic centrifugal spin
          const angle = (i * Math.PI * 2) / pylonCount + ringRotation;
          const r = orbitRadius * pylonProgress;
          const zBob = Math.sin(t * 3.2 + i * 1.5) * (14 - speedFactor * 8);

          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;

          // 3D Obelisk / Floating Pylon diamond body
          const pTop = Math3D.project(px, py - 18, zBob, rx, ry, rz);
          const pRight = Math3D.project(px + 10, py, zBob, rx, ry, rz);
          const pBottom = Math3D.project(px, py + 18, zBob, rx, ry, rz);
          const pLeft = Math3D.project(px - 10, py, zBob, rx, ry, rz);
          const pApex = Math3D.project(px, py, zBob + 12, rx, ry, rz);

          ProceduralArcRenderer.draw3DPolygon(ctx, [pTop, pRight, pBottom, pLeft], '#0284c7', 'rgba(15, 23, 42, 0.8)', 1.4 * pTop.k);
          ProceduralArcRenderer.draw3DPolygon(ctx, [pTop, pRight, pApex], '#38bdf8', 'rgba(14, 165, 233, 0.25)', 1.0 * pTop.k);
          ProceduralArcRenderer.draw3DPolygon(ctx, [pTop, pLeft, pApex], '#38bdf8', 'rgba(14, 165, 233, 0.25)', 1.0 * pTop.k);

          // Pylon core center
          const pCenter = Math3D.project(px, py, zBob, rx, ry, rz);
          pylonsWorld.push({ x: pCenter.x, y: pCenter.y, k: pCenter.k, idx: i, lx: px, ly: py, lz: zBob, angle });

          // RENDER 3D ICE CRYSTAL BULLET IN THIS PYLON IF LOADED
          if (icePylonSlots[i]) {
            const crystalApex = Math3D.project(px, py + 24, zBob - 4, rx, ry, rz);
            const crystalTop = Math3D.project(px, py - 14, zBob - 4, rx, ry, rz);
            const crystalLeft = Math3D.project(px - 6, py + 2, zBob - 4, rx, ry, rz);
            const crystalRight = Math3D.project(px + 6, py + 2, zBob - 4, rx, ry, rz);
            const crystalFront = Math3D.project(px, py + 4, zBob + 10, rx, ry, rz);

            // Shimmering Glacial Facets
            ProceduralArcRenderer.draw3DPolygon(ctx, [crystalTop, crystalRight, crystalFront], '#bae6fd', 'rgba(186, 230, 253, 0.65)', 1.2 * crystalTop.k, '#38bdf8');
            ProceduralArcRenderer.draw3DPolygon(ctx, [crystalTop, crystalLeft, crystalFront], '#7dd3fc', 'rgba(125, 211, 252, 0.5)', 1.2 * crystalTop.k, '#38bdf8');
            ProceduralArcRenderer.draw3DPolygon(ctx, [crystalApex, crystalRight, crystalFront], '#38bdf8', 'rgba(56, 189, 248, 0.6)', 1.2 * crystalTop.k, '#00f0ff');
            ProceduralArcRenderer.draw3DPolygon(ctx, [crystalApex, crystalLeft, crystalFront], '#0284c7', 'rgba(14, 165, 233, 0.45)', 1.2 * crystalTop.k, '#00f0ff');
          } else {
            // Empty docking slot with faint frost wireframe
            const pSocket = Math3D.project(px, py, zBob - 2, rx, ry, rz);
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(pSocket.x - 4 * pSocket.k, pSocket.y - 8 * pSocket.k, 8 * pSocket.k, 16 * pSocket.k);
            ctx.restore();
          }
        }

        // FANTASTIC EFFECT 1: SOLID ENERGY CONDUIT BRIDGES BETWEEN NEIGHBORING PYLONS
        // As speed increases, they fuse into a closed hexagonal force field perimeter!
        if (pylonsWorld.length >= 6 && assemblyRatio > 0.5) {
          for (let k = 0; k < pylonsWorld.length; k++) {
            const current = pylonsWorld[k];
            const next = pylonsWorld[(k + 1) % pylonsWorld.length];
            ProceduralArcRenderer.drawEnergyConduit(ctx, current, next, speedFactor, t * (3.5 + speedFactor * 4) + k * 0.16);

            // Wild high-frequency Tesla discharge bursts across perimeter
            if (speedFactor > 0.25 || Math.random() > 0.4) {
              ProceduralArcRenderer.drawElectricArc(ctx, current, next, '#7dd3fc', 6, 10 + speedFactor * 14);
            }
          }

          // FANTASTIC EFFECT 2: ENERGY TRANSFERRED TO INNER HEXAGON (RADIAL FILAMENTS)
          // Power lines feeding from the 6 pylons directly into Mons's hexagonal cockpit!
          if (hexPts && hexPts.length === 6) {
            for (let m = 0; m < 6; m++) {
              const pylonPt = pylonsWorld[m];
              const hexVertex = hexPts[m];
              // Energy filament pulse
              ProceduralArcRenderer.drawElectricArc(ctx, pylonPt, hexVertex, '#38bdf8', 5, 8 + speedFactor * 10);

              // Power junction node at hexagon corner
              ctx.save();
              ctx.fillStyle = '#67e8f9';
              ctx.shadowColor = '#00f0ff';
              ctx.shadowBlur = 10 + speedFactor * 12;
              ctx.beginPath();
              ctx.arc(hexVertex.x, hexVertex.y, 3 * hexVertex.k, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // FANTASTIC EFFECT 3: HOLOGRAPHIC DEFENSE SHIELD WEB
          if (speedFactor > 0.35) {
            ctx.save();
            ctx.fillStyle = `rgba(14, 165, 233, ${speedFactor * 0.08})`;
            ctx.strokeStyle = `rgba(56, 189, 248, ${speedFactor * 0.35})`;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            pylonsWorld.forEach((p, idx) => {
              if (idx === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }

        return pylonsWorld;
      }
    };

    class GlacialAmmoSystem {
      constructor(engine) {
        this.engine = engine;
        this.javelins = [];
        this.fissures = [];
        this.shards = [];
        this.iceCrystalsForging = [];
        this.cryoVaporJets = []; // Sub-zero reactive thruster mist
        // 6 Ice bullet chambers
        this.slots = [true, true, true, true, true, true];
        this.maxAmmo = 6;
        this.ringRotation = 0;
        this.chargeProgress = 0; // Centrifugal recharge accumulator
      }

      getAmmoCount() {
        return this.slots.filter(Boolean).length;
      }

      reset() {
        this.javelins = [];
        this.fissures = [];
        this.shards = [];
        this.iceCrystalsForging = [];
        this.cryoVaporJets = [];
        this.slots = [true, true, true, true, true, true];
        this.chargeProgress = 0;
        this.ringRotation = 0;
        this.updateHUD();
      }

      // Shoots one ice projectile downwards from an active pylon chamber
      launchIceBullet() {
        if (this.engine.currentPhase < 4) return;

        // Find available loaded slot
        const loadedIndices = [];
        for (let i = 0; i < 6; i++) {
          if (this.slots[i]) loadedIndices.push(i);
        }

        if (!loadedIndices.length) {
          const btn = document.getElementById('fireSpikeBtn');
          if (btn) {
            btn.classList.add('opacity-50');
            btn.textContent = '❄ Buz Bitdi! Sağa-sola sürün ↻';
          }
          return;
        }

        // Fire from the lowest or a random available pylon
        const chosenIdx = loadedIndices[Math.floor(Math.random() * loadedIndices.length)];
        this.slots[chosenIdx] = false;

        // Calculate world departure coordinate
        const cx = this.engine.w / 2 + this.engine.x;
        const cy = this.engine.h / 2 + this.engine.y;
        const rot = this.engine.rot3D;

        const pylonAngle = (chosenIdx * Math.PI * 2) / 6 + this.ringRotation;
        const lx = Math.cos(pylonAngle) * 148;
        const ly = Math.sin(pylonAngle) * 148;

        const proj = Math3D.project(lx, ly, 0, rot.rx, rot.ry, rot.rz);
        const originX = cx + proj.x;
        const originY = cy + proj.y;

        // High-velocity sharp glacial lance
        const vx = MathUtils.randomRange(-35, 35) + this.engine.vx * 0.15;
        const vy = MathUtils.randomRange(460, 620);

        this.javelins.push({
          x: originX,
          y: originY,
          vx,
          vy,
          gravity: 880,
          length: MathUtils.randomRange(28, 38),
          width: 4.0,
          tail: [],
          alpha: 1.0
        });

        audio.playIceShoot();
        this.updateHUD();
      }

      // Recharges an empty slot through high centrifugal spin
      forgeNewIceCrystal() {
        const emptyIndices = [];
        for (let i = 0; i < 6; i++) {
          if (!this.slots[i]) emptyIndices.push(i);
        }
        if (!emptyIndices.length) return;

        const fillIdx = emptyIndices[0];
        this.slots[fillIdx] = true;

        // Spawn rapid frost condensation spark & swirl
        this.iceCrystalsForging.push({
          slotIdx: fillIdx,
          life: 0.5,
          maxLife: 0.5
        });

        audio.playIceForge();
        this.updateHUD();
      }

      triggerFloorImpact(x, y) {
        audio.playIceShatter();

        // 1. Frozen Ground Fissures & Ice Spikes
        this.fissures.push({
          x,
          y,
          radius: 8,
          maxRadius: MathUtils.randomRange(44, 70),
          alpha: 1.0
        });

        // 2. Translucent Polygonal Ice Shards bursting up
        const shardCount = Math.floor(MathUtils.randomRange(20, 30));
        for (let i = 0; i < shardCount; i++) {
          const spreadAngle = -Math.PI / 2 + MathUtils.randomRange(-Math.PI * 0.44, Math.PI * 0.44);
          const speed = MathUtils.randomRange(180, 520);
          this.shards.push({
            x,
            y,
            vx: Math.cos(spreadAngle) * speed + MathUtils.randomRange(-25, 25),
            vy: Math.sin(spreadAngle) * speed,
            gravity: 820,
            friction: 0.96,
            size: MathUtils.randomRange(3.5, 7.5),
            angle: Math.random() * Math.PI * 2,
            spin: MathUtils.randomRange(-16, 16),
            alpha: 1.0,
            decay: MathUtils.randomRange(0.8, 1.6),
            color: Math.random() > 0.35 ? '#bae6fd' : '#e0f2fe'
          });
        }
      }

      update(dt) {
        // SPIN KINETICS: Moving left and right spins the ring dynamically
        const horizontalSpeed = Math.abs(this.engine.vx);
        const spinSpeed = 0.35 + (horizontalSpeed / 270) * 4.8;
        this.ringRotation += spinSpeed * dt;

        // EMIT CRYO-THRUSTER VAPOR FROM PYLONS WHEN MOVING FAST!
        if (this.engine.speedFactor > 0.2) {
          const cx = this.engine.w / 2 + this.engine.x;
          const cy = this.engine.h / 2 + this.engine.y;
          const rot = this.engine.rot3D;

          // Emit from the rear-facing pylons relative to velocity
          for (let p = 0; p < 6; p++) {
            if (Math.random() < this.engine.speedFactor * 0.45) {
              const pAngle = (p * Math.PI * 2) / 6 + this.ringRotation;
              const r = 148 - this.engine.speedFactor * 24;
              const lx = Math.cos(pAngle) * r;
              const ly = Math.sin(pAngle) * r;
              const proj = Math3D.project(lx, ly, 0, rot.rx, rot.ry, rot.rz);

              this.cryoVaporJets.push({
                x: cx + proj.x,
                y: cy + proj.y,
                vx: -this.engine.vx * 0.25 + MathUtils.randomRange(-30, 30),
                vy: -this.engine.vy * 0.25 + MathUtils.randomRange(-30, 30),
                size: MathUtils.randomRange(5, 12),
                alpha: 0.8,
                life: MathUtils.randomRange(0.25, 0.45)
              });
            }
          }
        }

        // Update Cryo Vapor Jets
        for (let v = this.cryoVaporJets.length - 1; v >= 0; v--) {
          const jet = this.cryoVaporJets[v];
          jet.x += jet.vx * dt;
          jet.y += jet.vy * dt;
          jet.size += 18 * dt;
          jet.alpha -= 2.2 * dt;
          if (jet.alpha <= 0) this.cryoVaporJets.splice(v, 1);
        }

        // KINETIC RECHARGE MECHANISM:
        // When moving fast (high speedFactor), cryo charge rapidly builds up!
        if (this.engine.currentPhase >= 4) {
          const currentAmmo = this.getAmmoCount();
          const reloadLimit = this.engine.isGame ? (typeof getGlacialReloadLevel === 'function' ? getGlacialReloadLevel() : 0) : 6;
          if (currentAmmo < reloadLimit) {
            // When moving fast, recharge quickly!
            if (this.engine.speedFactor > 0.25) {
              const chargeRate = (this.engine.speedFactor * 1.65);
              this.chargeProgress += chargeRate * dt;

              if (this.chargeProgress >= 1.0) {
                this.chargeProgress = 0;
                this.forgeNewIceCrystal();
              }
            }
          } else {
            this.chargeProgress = 0;
          }
        }

        const floorY = this.engine.h - 6;

        // Update falling ice lances
        for (let i = this.javelins.length - 1; i >= 0; i--) {
          const j = this.javelins[i];
          j.tail.push({ x: j.x, y: j.y });
          if (j.tail.length > 12) j.tail.shift();

          j.vy += j.gravity * dt;
          j.x += j.vx * dt;
          j.y += j.vy * dt;

          if (j.y >= floorY) {
            this.triggerFloorImpact(j.x, floorY);
            this.javelins.splice(i, 1);
            continue;
          }

          if (j.x < 10) { j.x = 10; j.vx = Math.abs(j.vx) * 0.7; }
          else if (j.x > this.engine.w - 10) { j.x = this.engine.w - 10; j.vx = -Math.abs(j.vx) * 0.7; }
        }

        // Update ground fissures
        for (let i = this.fissures.length - 1; i >= 0; i--) {
          const f = this.fissures[i];
          f.radius += (f.maxRadius - f.radius) * 14 * dt;
          f.alpha -= 1.8 * dt;
          if (f.alpha <= 0) this.fissures.splice(i, 1);
        }

        // Update ice shards
        for (let i = this.shards.length - 1; i >= 0; i--) {
          const s = this.shards[i];
          s.vx *= s.friction;
          s.vy += s.gravity * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.angle += s.spin * dt;
          s.alpha -= s.decay * dt;

          if (s.y >= floorY) {
            s.y = floorY;
            s.vy = -Math.abs(s.vy) * 0.35;
            s.vx *= 0.8;
          }

          if (s.alpha <= 0) this.shards.splice(i, 1);
        }

        // Update crystal forging particles
        for (let c = this.iceCrystalsForging.length - 1; c >= 0; c--) {
          this.iceCrystalsForging[c].life -= dt;
          if (this.iceCrystalsForging[c].life <= 0) {
            this.iceCrystalsForging.splice(c, 1);
          }
        }

        this.updateHUD();
      }

      updateHUD() {
        const ammo = this.getAmmoCount();
        const icePips = document.getElementById('icePips');
        const ammoNum = document.getElementById('ammoNumber');
        const meter = document.getElementById('rechargeMeter');
        const btn = document.getElementById('fireSpikeBtn');

        if (icePips) {
          let str = '';
          for (let i = 0; i < 6; i++) {
            str += this.slots[i] ? '❄ ' : '· ';
          }
          icePips.textContent = str.trim();
        }

        if (ammoNum) {
          ammoNum.textContent = `(${ammo}/6)`;
          ammoNum.className = ammo === 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-cyan-300 font-semibold';
        }

        if (meter) {
          const pct = Math.min(100, Math.round(this.chargeProgress * 100));
          meter.style.width = `${pct}%`;
        }

        if (btn) {
          if (ammo > 0) {
            btn.classList.remove('opacity-50');
            btn.textContent = `❄ Buz Mərmisini At [E] (${ammo})`;
          } else {
            btn.classList.add('opacity-50');
            btn.textContent = '❄ Hərəkət etdirib halqanı fırlat!';
          }
        }
      }

      render(ctx) {
        ctx.save();

        // Render Cryo-Jet Vapor Mist
        for (const jet of this.cryoVaporJets) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, jet.alpha);
          const g = ctx.createRadialGradient(jet.x, jet.y, 0, jet.x, jet.y, jet.size);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.3, '#7dd3fc');
          g.addColorStop(0.7, '#0284c7');
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(jet.x, jet.y, jet.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Ground Fissures
        for (const f of this.fissures) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#67e8f9';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2.4;
          ctx.globalAlpha = Math.max(0, f.alpha);
          ctx.beginPath();
          ctx.moveTo(f.x - f.radius, f.y);
          ctx.lineTo(f.x + f.radius, f.y);
          ctx.stroke();

          // Small upward crystalline spike on impact point
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath();
          ctx.moveTo(f.x - 6, f.y);
          ctx.lineTo(f.x, f.y - 14 * f.alpha);
          ctx.lineTo(f.x + 6, f.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Render High-Velocity Glacial Lances
        for (const j of this.javelins) {
          // Frost Trail
          for (let t = 0; t < j.tail.length; t++) {
            const pt = j.tail[t];
            const ratio = t / j.tail.length;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = j.width * ratio;
            ctx.globalAlpha = ratio * 0.5;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pt.x, pt.y - 14);
            ctx.stroke();
          }

          // Diamond Ice Needle Body
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.lineWidth = j.width;
          ctx.beginPath();
          ctx.moveTo(j.x, j.y - j.length);
          ctx.lineTo(j.x, j.y);
          ctx.stroke();

          // Glacial Tip
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath();
          ctx.arc(j.x, j.y, j.width * 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Ice / Crystal Shards
        for (const s of this.shards) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle);
          ctx.globalAlpha = Math.max(0, s.alpha);
          ctx.fillStyle = s.color;
          ctx.shadowColor = '#67e8f9';
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.moveTo(0, -s.size);
          ctx.lineTo(s.size * 0.8, s.size * 0.8);
          ctx.lineTo(-s.size * 0.8, s.size * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }
    }

    const MechaMonsRenderer = {
      // Draws the horned Mons character safely inside the hollow hexagonal aperture
      drawDefaultMons(ctx, t, alpha = 1.0) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = MathUtils.clamp(alpha, 0, 1);

        const breathing = Math.sin(t * 3.6) * 1.6;

        // Subtle electric energy field behind Mons
        const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 36);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Dual Angular Tech-Horns
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(10, -12);
          ctx.lineTo(24, -26);
          ctx.lineTo(16, -38);
          ctx.lineTo(8, -14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Mons Hex-Shell Body
        const bodyGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 26);
        bodyGrad.addColorStop(0, '#1e293b');
        bodyGrad.addColorStop(0.7, '#0f172a');
        bodyGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, breathing * 0.4, 22, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Holographic Visor Screen
        ctx.fillStyle = '#030712';
        ctx.beginPath();
        ctx.ellipse(0, 1 + breathing * 0.4, 16, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cyber Eyes (Angular vector slit glow)
        ctx.fillStyle = '#67e8f9';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 7;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 10, -2 + breathing * 0.3);
          ctx.lineTo(side * 3, -5 + breathing * 0.3);
          ctx.lineTo(side * 4, 1 + breathing * 0.3);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Digital Smile
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, 7 + breathing * 0.3);
        ctx.lineTo(0, 10 + breathing * 0.3);
        ctx.lineTo(5, 7 + breathing * 0.3);
        ctx.stroke();

        ctx.restore();
      }
    };

    class NanoMechaEngine {
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

        // 3D Euler Angles (Pitch, Roll/Yaw, Bank)
        this.rot3D = { rx: 0, ry: 0, rz: 0 };
        this.speedFactor = 0;

        // Timeline progression
        this.timeline = 0;
        this.duration = 6.8;
        this.currentPhase = 1;

        this.javelinSystem = new GlacialAmmoSystem(this);
        this.keys = {};
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;


        this.restartIntro();
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
        this.speedFactor = 0;
        this.javelinSystem.reset();

        audio.init();
        audio.playServoClick();
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
            this.javelinSystem.launchIceBullet();
          }
        });

        window.addEventListener('keyup', (e) => {
          this.keys[e.code] = false;
        });

        // Mouse Drag / Touch
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

        // Phased Progression
        let newPhase = 1;
        if (this.timeline >= 5.4) newPhase = 4;
        else if (this.timeline >= 3.4) newPhase = 3;
        else if (this.timeline >= 1.4) newPhase = 2;

        if (newPhase !== this.currentPhase) {
          this.currentPhase = newPhase;
          if (newPhase === 3) audio.playServoClick();
          this.onPhaseChange?.(this.currentPhase);
        }

        // Flight controls
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
        if (!this.isGame) { this.x += this.vx * dt; this.y += this.vy * dt; }

        // Viewport boundaries
        const limitX = this.w * 0.38;
        const limitY = this.h * 0.34;
        if (!this.isGame) { this.x = MathUtils.clamp(this.x, -limitX, limitX); this.y = MathUtils.clamp(this.y, -limitY, limitY); }

        // Speed Factor for dynamic bloom
        const curSpeed = Math.hypot(this.vx, this.vy);
        const targetSpeedFactor = Math.min(1.0, curSpeed / 180);
        this.speedFactor += (targetSpeedFactor - this.speedFactor) * Math.min(1, 10 * dt);

        // True 3D Roll/Yaw and Pitch for Angular Mecha Frame
        const targetRy = Math.max(-0.68, Math.min(0.68, -(this.vx / 270) * 0.65));
        const targetRx = Math.max(-0.55, Math.min(0.55, (this.vy / 270) * 0.5));
        const targetRz = Math.max(-0.25, Math.min(0.25, (this.vx / 270) * 0.2));

        const lerpSpeed = Math.min(1, 8.5 * dt);
        this.rot3D.rx += (targetRx - this.rot3D.rx) * lerpSpeed;
        this.rot3D.ry += (targetRy - this.rot3D.ry) * lerpSpeed;
        this.rot3D.rz += (targetRz - this.rot3D.rz) * lerpSpeed;

        this.javelinSystem.update(dt);
        this.updateHUD();
      }

      render() {
        const ctx = this.ctx;
        const nowSec = performance.now() / 1000;


        const cx = this.w / 2 + this.x;
        const cy = this.h / 2 + this.y;

        ctx.save();
        ctx.translate(cx, cy);

        // 1. PHASE 01: Holographic Calibration Grid
        if (this.timeline < 1.6) {
          const gridAlpha = 1.0 - MathUtils.smooth(1.2, 1.6, this.timeline);
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${gridAlpha * 0.8})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-48, -48, 96, 96);
          ctx.strokeRect(-80, -80, 160, 160);
          ctx.restore();
        }

        // 2. Ambient Energy Core Glow
        const aegisProgress = MathUtils.smooth(1.4, 5.4, this.timeline);
        if (aegisProgress > 0) {
          const glowAlpha = aegisProgress * (0.24 + this.speedFactor * 0.28);
          const glowRadius = 220 + this.speedFactor * 50;
          const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
          bgGrad.addColorStop(0, `rgba(14, 165, 233, ${glowAlpha})`);
          bgGrad.addColorStop(0.5, `rgba(3, 105, 161, ${glowAlpha * 0.4})`);
          bgGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        }

        // 3. Render Hexagonal Aperture Blades (Revealing Hollow Core)
        const irisOpenRatio = MathUtils.smooth(3.2, 5.2, this.timeline);
        let hexPts = [];
        if (irisOpenRatio > 0) {
          hexPts = MechaIrisSystem.renderIrisBlades(
            ctx,
            this.rot3D.rx,
            this.rot3D.ry,
            this.rot3D.rz,
            irisOpenRatio,
            this.speedFactor
          );
        }

        // 4. Render 3D Floating Magnetic Pylons, Lockdown Force Field & Energy Conduits
        MechaIrisSystem.renderFloatingPylons(
          ctx,
          nowSec,
          this.rot3D.rx,
          this.rot3D.ry,
          this.rot3D.rz,
          this.speedFactor,
          aegisProgress,
          this.javelinSystem.slots,
          this.javelinSystem.ringRotation,
          hexPts
        );

        // 5. MONS CHARACTER EMBEDDED SAFELY IN HOLLOW APERTURE
        const monsEmergence = MathUtils.smooth(5.0, 6.0, this.timeline);
        if (monsEmergence > 0) {
          const coreProj = Math3D.project(0, 0, 0, this.rot3D.rx, this.rot3D.ry, this.rot3D.rz);
          ctx.save();
          ctx.translate(coreProj.x, coreProj.y);
          ctx.scale(coreProj.k, coreProj.k);

          if (this.drawCustomMonster) {
            this.drawCustomMonster(ctx, nowSec, monsEmergence);
          } else {
            MechaMonsRenderer.drawDefaultMons(ctx, nowSec, monsEmergence);
          }
          ctx.restore();
        }

        ctx.restore();

        // 6. Kinetic Javelins, Sub-zero Cryo Jets, Ground Fissures & Shattered Polygon Shards
        this.javelinSystem.render(ctx);
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


    // The original renderers and physics are driven by the game loop, without a second RAF or global controls.
    NanoMechaEngine.prototype.updateHUD = function() {};
    GlacialAmmoSystem.prototype.updateHUD = function() {};
    const instances = {};
    function getEngine(surface) {
        if (!instances[surface]) instances[surface] = new NanoMechaEngine({getContext: () => null});
        return instances[surface];
    }
    const effect = {
        id: 'glacial', name: 'Kvant Buz Zirehi', duration: 6.8,
        getEngine,
        resetFlight() { for (const [key, engine] of Object.entries(instances)) if (key !== 'game') engine.restartIntro(); },
        draw(c, w, h, t, drawMonster, isIngame = false, surface = 'preview') {
            if (w <= 200 && h <= 200) surface = 'card';
            const e = getEngine(surface);
            const now = performance.now();
            const dt = e.drawAt === undefined ? 0 : Math.min(.04, Math.max(0, (now - e.drawAt) / 1000));
            e.drawAt = now;
            e.ctx = c; e.drawCustomMonster = drawMonster || (() => {});
            e.w = 600; e.h = 500;
            e.timeline = surface === 'card' || surface === 'game' ? 6.8 : t;
            e.step(dt);
            if (surface !== 'fullscreen') { e.x = 0; e.y = 0; }
            const scale = Math.min(w / 600, h / 500);
            c.save(); c.translate(w / 2, h / 2); c.scale(scale, scale); c.translate(-300, -250);
            e.render(); c.restore();
        },
        resetGame() { if (instances.game) instances.game.javelinSystem.reset(); },
        syncGame(p) {
            const e = getEngine('game'); e.isGame = true;
            e.w = (typeof canvasWidth === 'number' ? canvasWidth : 800) / .54;
            e.h = (typeof getFloorWorldHeight === 'function' ? getFloorWorldHeight(gameState.floor) : 2200) / .54;
            e.x = p.x / .54 - e.w / 2; e.y = p.y / .54 - e.h / 2;
            e.timeline = 6.8; e.currentPhase = 4;
            e.javelinSystem.slots = p.glacialSlots.slice();
            e.javelinSystem.chargeProgress = p.glacialCharge || 0;
            return e;
        },
        updateGame(dt, p) {
            const e = this.syncGame(p);
            e.vx = (p.vx || 0) * 60; e.vy = (p.vy || 0) * 60;
            e.keys = {KeyD:p.vx>0,KeyA:p.vx<0,KeyW:p.vy<0,KeyS:p.vy>0};
            e.step(dt);
            p.glacialSlots = e.javelinSystem.slots.slice(); p.glacialCharge = e.javelinSystem.chargeProgress;
            const boss = window.monster;
            if (boss && !boss.isDefeated) {
                for (let i=e.javelinSystem.javelins.length-1;i>=0;i--) {
                    const j=e.javelinSystem.javelins[i], x=j.x*.54, y=j.y*.54;
                    const lavaY=typeof boss.surface==='function'?boss.surface(x,boss.y):boss.y;
                    if(y>=lavaY-12){e.javelinSystem.triggerFloorImpact(j.x,lavaY/.54);e.javelinSystem.javelins.splice(i,1);if(typeof boss.takeDamage==='function')boss.takeDamage(300,'ice',x,lavaY);}
                }
            }
        },
        fireGame(p) {
            const e=this.syncGame(p), before=e.javelinSystem.getAmmoCount();
            e.javelinSystem.launchIceBullet();
            p.glacialSlots=e.javelinSystem.slots.slice();
            if (typeof saveActiveRun==='function') saveActiveRun();
            return e.javelinSystem.getAmmoCount()<before;
        },
        drawPlayer(c, p) {
            const e=getEngine('game');
            e.x=p.x/.54-e.w/2; e.y=p.y/.54-e.h/2;e.ctx=c;e.drawCustomMonster=()=>{};
            c.save();c.scale(.54,.54);e.render();c.restore();
            c.save();c.font='11px monospace';c.textAlign='center';c.fillStyle='#a5f3fc';
            c.fillText('❄ '+p.glacialSlots.filter(Boolean).length+'/6',p.x,p.y+32);c.restore();
        }

    };
    window.GlacialSpawnEffect = effect;
})();
