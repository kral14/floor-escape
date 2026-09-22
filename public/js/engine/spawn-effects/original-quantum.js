// Original reference algorithms, kept verbatim. Game integration lives in singularity.js.
(function() {
    const MathUtils = {
      randomRange: (min, max) => min + Math.random() * (max - min),
      lerp: (a, b, t) => a + (b - a) * t,
      clamp: (val, min, max) => Math.max(min, Math.min(max, val))
    };

    const Math3D = {
      fov: 460,
      project(x, y, z, rx, ry, rz) {
        // 1. Rotate around X (Pitch - Up/Down tilt)
        const cosX = Math.cos(rx), sinX = Math.sin(rx);
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // 2. Rotate around Y (Roll/Yaw - Left/Right 3D turn into screen depth)
        const cosY = Math.cos(ry), sinY = Math.sin(ry);
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        // 3. Rotate around Z (Banking)
        const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;

        // Perspective depth foreshortening
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
        ctx.shadowBlur = 0;
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
        ctx.shadowBlur = 0;
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
          ctx.shadowBlur = 0;
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
          ctx.shadowBlur = 0;
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

    class SingularityTheme {
      constructor(canvas) {
        this.canvas = canvas;
        this.particles = [];
        this.shockwaves = [];
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

      triggerBurst(x, y) {
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
      }

      update(dt) {
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
          }
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
          const sw = this.shockwaves[i];
          sw.r += (sw.maxR - sw.r) * 6 * dt;
          sw.alpha -= 1.8 * dt;
          if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
        }
      }

      render(ctx, cx, cy, time, rot3D = { rx: 0, ry: 0, rz: 0 }, speedFactor = 0, ringAngles = null) {
        ctx.save();
        ctx.translate(cx, cy);
        const { rx, ry, rz } = rot3D;

        // Event Horizon Ambient Glow in 3D
        const glowRadius = 240 + speedFactor * 50;
        const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
        bgGrad.addColorStop(0, `rgba(6, 182, 212, ${0.28 + speedFactor * 0.22})`);
        bgGrad.addColorStop(0.45, `rgba(14, 165, 233, ${0.08 + speedFactor * 0.12})`);
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

        // Render 3D Celestial Rings
        RingFX.drawRings(ctx, time, {
          baseColor: 'rgba(6, 182, 212, 0.7)',
          glowColor: '#38bdf8',
          accentColor: '#e0f2fe'
        }, speedFactor, ringAngles, rot3D);

        // 3D Shockwaves
        for (const sw of this.shockwaves) {
          RingFX.draw3DRing(ctx, sw.r, rx, ry, rz, `rgba(56, 189, 248, ${sw.alpha})`, '#38bdf8', 2.8, [], sw.alpha);
        }

        // Orbiting particles with 3D Depth Sort
        const sortedParticles = [];
        for (const p of this.particles) {
          if (p.burst) {
            const proj = Math3D.project(p.x, p.y, p.z || 0, rx, ry, rz);
            sortedParticles.push({ p, proj, burst: true });
          } else {
            const lx = Math.cos(p.angle) * p.radius;
            const ly = Math.sin(p.angle) * (p.radius * 0.42);
            const lz = p.z || 0;
            const proj = Math3D.project(lx, ly, lz, rx, ry, rz);
            sortedParticles.push({ p, proj, burst: false });
          }
        }
        sortedParticles.sort((a, b) => a.proj.z - b.proj.z);

        // Render particles with depth shading
        for (const item of sortedParticles) {
          const { p, proj, burst } = item;
          ctx.save();
          if (burst) {
            ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.alpha * proj.k})`;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * proj.k), 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Depth cues: particles in front (z > 0) are brighter and larger
            const depthRatio = Math.max(0.3, Math.min(1.4, proj.k));
            ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${p.alpha * depthRatio})`;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * depthRatio), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Black Hole Center & Photon Ring with 3D spherical core
        const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
        ctx.save();
        ctx.beginPath();
        ctx.arc(coreProj.x, coreProj.y, 36 * coreProj.k, 0, Math.PI * 2);
        ctx.fillStyle = '#02040a';
        ctx.fill();
        ctx.lineWidth = 3.5 * coreProj.k;
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }
    }

    class SupernovaTheme {
      constructor(canvas) {
        this.canvas = canvas;
        this.sparks = [];
        this.flares = [];
      }

      getParticleCount() {
        return this.sparks.length;
      }

      reset() {
        this.sparks = [];
        this.flares = [];
        const count = 135;
        for (let i = 0; i < count; i++) {
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

      render(ctx, cx, cy, time, rot3D = { rx: 0, ry: 0, rz: 0 }, speedFactor = 0, ringAngles = null) {
        ctx.save();
        ctx.translate(cx, cy);
        const { rx, ry, rz } = rot3D;

        // Ambient Plasma Flare Glow
        const glowRadius = 250 + speedFactor * 45;
        const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
        bgGrad.addColorStop(0, `rgba(249, 115, 22, ${0.3 + speedFactor * 0.2})`);
        bgGrad.addColorStop(0.5, `rgba(234, 88, 12, ${0.09 + speedFactor * 0.1})`);
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

        RingFX.drawRings(ctx, time, {
          baseColor: 'rgba(245, 158, 11, 0.7)',
          glowColor: '#fbbf24',
          accentColor: '#fffbeb'
        }, speedFactor, ringAngles, rot3D);

        // 3D Flares
        for (const f of this.flares) {
          RingFX.draw3DRing(ctx, f.r, rx, ry, rz, `rgba(251, 191, 36, ${f.alpha})`, '#fbbf24', 3.5, [], f.alpha);
        }

        // Sparks with 3D Depth
        for (const s of this.sparks) {
          const lx = Math.cos(s.angle) * s.distance;
          const ly = Math.sin(s.angle) * s.distance;
          const proj = Math3D.project(lx, ly, s.z, rx, ry, rz);
          ctx.save();
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, s.size * proj.k, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Supernova Core in 3D
        const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
        ctx.beginPath();
        ctx.arc(coreProj.x, coreProj.y, 32 * coreProj.k, 0, Math.PI * 2);
        ctx.fillStyle = '#fffbeb';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.lineWidth = 3 * coreProj.k;
        ctx.strokeStyle = '#f97316';
        ctx.stroke();

        ctx.restore();
      }
    }

    class SynapseTheme {
      constructor(canvas) {
        this.canvas = canvas;
        this.nodes = [];
        this.pulses = [];
      }

      getParticleCount() {
        return this.nodes.length;
      }

      reset() {
        this.nodes = [];
        this.pulses = [];
        const count = 110;
        for (let i = 0; i < count; i++) {
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

      render(ctx, cx, cy, time, rot3D = { rx: 0, ry: 0, rz: 0 }, speedFactor = 0, ringAngles = null) {
        ctx.save();
        ctx.translate(cx, cy);
        const { rx, ry, rz } = rot3D;

        // Ambient Bio-Electric Glow
        const glowRadius = 240 + speedFactor * 45;
        const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
        bgGrad.addColorStop(0, `rgba(168, 85, 247, ${0.28 + speedFactor * 0.2})`);
        bgGrad.addColorStop(0.5, `rgba(147, 51, 234, ${0.08 + speedFactor * 0.1})`);
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);

        RingFX.drawRings(ctx, time, {
          baseColor: 'rgba(168, 85, 247, 0.65)',
          glowColor: '#c084fc',
          accentColor: '#faf5ff'
        }, speedFactor, ringAngles, rot3D);

        // 3D Pulse waves
        for (const p of this.pulses) {
          RingFX.draw3DRing(ctx, p.r, rx, ry, rz, `rgba(216, 180, 254, ${p.alpha})`, '#c084fc', 2.5, [], p.alpha);
        }

        // Project nodes into 3D
        const projectedNodes = this.nodes.map(n => ({
          ...n,
          proj: Math3D.project(n.x, n.y, n.z, rx, ry, rz)
        }));

        // 3D Synaptic connectors
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.lineWidth = 1;
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

        // Nodes
        for (const n of projectedNodes) {
          ctx.save();
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(n.proj.x, n.proj.y, n.size * n.proj.k, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Neural Core in 3D
        const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
        ctx.beginPath();
        ctx.arc(coreProj.x, coreProj.y, 28 * coreProj.k, 0, Math.PI * 2);
        ctx.fillStyle = '#581c87';
        ctx.strokeStyle = '#d8b4fe';
        ctx.lineWidth = 2.5 * coreProj.k;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    }

    class AbyssalTheme {
      constructor(canvas) {
        this.canvas = canvas;
        this.spores = [];
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

      render(ctx, cx, cy, time, rot3D = { rx: 0, ry: 0, rz: 0 }, speedFactor = 0, ringAngles = null) {
        ctx.save();
        ctx.translate(cx, cy);
        const { rx, ry, rz } = rot3D;

        RingFX.drawRings(ctx, time, {
          baseColor: 'rgba(20, 184, 166, 0.7)',
          glowColor: '#2dd4bf',
          accentColor: '#f0fdfa'
        }, speedFactor, ringAngles, rot3D);

        // Bioluminescent Spores in 3D
        for (const sp of this.spores) {
          const proj = Math3D.project(sp.x, sp.y, sp.z, rx, ry, rz);
          ctx.save();
          ctx.fillStyle = '#2dd4bf';
          ctx.shadowColor = '#14b8a6';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, sp.size * proj.k, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Eldritch Tentacles projected in 3D
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (let arm = 0; arm < 6; arm++) {
          const baseAngle = (arm * Math.PI * 2) / 6;
          ctx.beginPath();
          const startPt = Math3D.project(0, 0, 0, rx, ry, rz);
          ctx.moveTo(startPt.x, startPt.y);
          for (let seg = 1; seg <= 18; seg++) {
            const r = seg * 7.5;
            const wave = Math.sin(time * 3 + seg * 0.4 + arm) * (seg * 1.6);
            const a = baseAngle + wave * 0.04;
            const zArm = Math.sin(time * 2 + seg * 0.3) * 18;
            const pt = Math3D.project(Math.cos(a) * r, Math.sin(a) * r, zArm, rx, ry, rz);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Leviathan Eye in 3D
        const coreProj = Math3D.project(0, 0, 0, rx, ry, rz);
        ctx.beginPath();
        ctx.arc(coreProj.x, coreProj.y, 24 * coreProj.k, 0, Math.PI * 2);
        ctx.fillStyle = '#042f2e';
        ctx.strokeStyle = '#5eead4';
        ctx.lineWidth = 2.5 * coreProj.k;
        ctx.shadowColor = '#2dd4bf';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    }


window.OriginalQuantumThemes = { singularity: SingularityTheme, supernova: SupernovaTheme, synapse: SynapseTheme, abyssal: AbyssalTheme };
window.OriginalQuantumMath3D = Math3D;
})();
