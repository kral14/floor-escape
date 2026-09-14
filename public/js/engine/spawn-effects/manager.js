// ============================================================================
// 🌀 MONS SPAWN & TELEPORT EFFECT MANAGER
// Yalnız istifadəçinin təqdim etdiyi orijinal animasiyaları idarə edir:
// 1. Holoqramdan Doğuluş (Portal)
// 2. Kristal Yarığı (Crystal)
// ============================================================================

const SpawnEffectRegistry = {
    effects: {},

    register(id, effectModule) {
        if (!id || !effectModule) return;
        this.effects[id] = effectModule;
    },

    get(id) {
        if (this.effects[id]) return this.effects[id];
        const effectsMap = (typeof window !== 'undefined' && window.SingularityEffects ? window.SingularityEffects : (typeof global !== 'undefined' && global.SingularityEffects ? global.SingularityEffects : null));
        if (effectsMap && effectsMap[id]) return effectsMap[id];

        const singFx = (typeof SingularitySpawnEffect !== 'undefined' ? SingularitySpawnEffect : (typeof window !== 'undefined' && window.SingularitySpawnEffect ? window.SingularitySpawnEffect : (typeof global !== 'undefined' && global.SingularitySpawnEffect ? global.SingularitySpawnEffect : null)));
        if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(id)) {
            if (singFx) {
                return {
                    id: id,
                    duration: 7.8,
                    themes: singFx.themes,
                    rot3D: singFx.rot3D,
                    ringAngles: singFx.ringAngles,
                    stellarSystems: singFx.stellarSystems,
                    draw: (c, w, h, t, dm, ig) => singFx.draw(c, w, h, t, dm, ig, id)
                };
            }
            return null;
        }
        return this.effects[id] || this.effects['singularity'] || this.effects['portal'] || null;
    },

    getAll() {
        return this.effects;
    }
};

const MathUtils = (typeof window !== 'undefined' && window.MathUtils) ? window.MathUtils : {
    clamp: (val, min = 0, max = 1) => Math.max(min, Math.min(max, val)),
    smooth: (a, b, t) => {
        if (a === b) return t >= b ? 1 : 0;
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
    },
    lerp: (a, b, t) => a + (b - a) * t,
    randomRange: (min, max) => min + Math.random() * (max - min)
};
if (typeof window !== 'undefined' && !window.MathUtils) window.MathUtils = MathUtils;

const MonsCharacterRenderer = {
    drawDefaultMons(ctx, t, alpha = 1.0) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = MathUtils.clamp(alpha, 0, 1);
        const breathing = Math.sin(t * 3.5) * 1.8;

        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.fillStyle = '#021815';
        ctx.beginPath();
        ctx.ellipse(0, 1 + breathing * 0.5, 18, 18, 0, 0, Math.PI * 2);
        ctx.fill();

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

class MonsSpawnEffect {
    constructor({
        x = 400,
        y = 160,
        targetY = 120,
        skinId = 'default',
        animType = 'singularity',
        mode = 'in',           // 'in' (doğuluş/giriş) | 'out' (teleport/qatdan çıxış)
        loop = false,
        onComplete
    } = {}) {
        this.x = x;
        this.y = y;
        this.targetY = (targetY !== undefined) ? targetY : y;
        this.skinId = skinId;
        this.skin = (typeof SKINS !== 'undefined' && SKINS[skinId]) ? SKINS[skinId] : null;
        let selectedType = ['singularity', 'supernova', 'synapse', 'abyssal', 'crystal', 'stellar', 'dracula', 'seed'].includes(animType) ? animType : 'singularity';
        if (!selectedType || selectedType === 'portal') selectedType = 'singularity';
        this.animType = selectedType;
        this.mode = mode || 'in';
        this.loop = !!loop;
        this.onComplete = onComplete;
        this.time = 0;

        this.engine = null;
        if (['singularity', 'supernova', 'synapse', 'abyssal'].includes(this.animType)) {
            const singModule = (typeof SingularitySpawnEffect !== 'undefined' ? SingularitySpawnEffect : (typeof window !== 'undefined' && window.SingularitySpawnEffect ? window.SingularitySpawnEffect : null));
            if (singModule && typeof singModule.getActiveEngine === 'function') {
                this.engine = singModule.getActiveEngine(this.animType);
                this.engine.reset(); // TAM SIFIRDAN BAŞLANĞIC (timeline = 0)
                if (this.mode === 'out') {
                    this.engine.timeline = 6.0;
                }
            }
        }

        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (fxModule && typeof fxModule.resetFlight === 'function') {
            fxModule.interactive = false;
            fxModule.resetFlight();
        }
        this.maxAnimTime = (fxModule && fxModule.duration) ? fxModule.duration : 7.0;
        // 🌀 Tam ardıcıl sıfırdan doğuluş animasiyası (İstifadəçinin tam kodu: 5.6s tam onlayn)
        this.duration = (this.mode === 'out') ? 1.4 : 5.6;
        this.finished = false;
        this.scale = 0.56; // İKİNCİ ŞƏKİLDƏKİ REAL OYUNÇU ÖLÇÜSÜ
        this._burstPlayed = false;
    }

    static smooth(a, b, t) {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
    }

    update(dt) {
        if (this.finished) return;
        this.time += dt;

        if (this.engine) {
            if (this.mode === 'out') {
                this.engine.timeline = Math.max(0, 6.0 - (this.time / this.duration) * 6.0);
            } else {
                this.engine.step(dt);
            }
            if (this.time >= this.duration) {
                if (this.loop) {
                    this.time = 0;
                    this.engine.reset();
                } else {
                    this.finish();
                }
            }
            return;
        }

        const progress = Math.min(1, this.time / this.duration);
        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (this.time >= this.duration) {
            if (this.loop) {
                this.time = 0;
            } else {
                this.finish();
            }
        }
    }

    finish() {
        if (this.finished) return;
        this.finished = true;

        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (fxModule && typeof fxModule.resetFlight === 'function') {
            fxModule.interactive = false;
            fxModule.resetFlight();
        }

        if (typeof particles !== 'undefined' && typeof Particle === 'function') {
            const blastColor = (this.animType === 'crystal') ? '#b899ff' : (this.animType === 'stellar' ? '#54d8cf' : (this.animType === 'dracula' ? '#ba7886' : (this.animType === 'seed' ? '#62e6a0' : (this.animType === 'singularity' ? '#38bdf8' : '#65dfff'))));
            const count = (this.mode === 'out') ? 35 : 24;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(this.x, this.targetY, blastColor, 4.2));
            }
        }

        if (typeof this.onComplete === 'function') {
            this.onComplete();
        }
    }

    skip() {
        this.finish();
    }

    draw(c, canvasWidth, canvasHeight) {
        if (this.finished && !this.loop) return;

        // 🌀 KİBER SİNQULYARLIQ: BİRBAŞA İSTİFADƏÇİNİN KODU İLƏ ÇƏKİLİŞ
        if (this.engine) {
            const drawMonster = (ctx, t, alpha) => {
                if (typeof drawSkinModel === 'function') {
                    drawSkinModel(ctx, 0, 0, 16, this.skinId, 0, t * 3, false);
                } else if (typeof MonsCharacterRenderer !== 'undefined' && MonsCharacterRenderer.drawDefaultMons) {
                    MonsCharacterRenderer.drawDefaultMons(ctx, t, alpha);
                }
            };
            if (canvasWidth && canvasHeight) {
                const stageScale = Math.min(canvasWidth / 640, canvasHeight / 380) * 0.92;
                this.engine.render(c, canvasWidth / 2, canvasHeight / 2, Math.max(0.42, stageScale), drawMonster);
            } else {
                const curY = (this.targetY !== undefined) ? this.targetY : this.y;
                this.engine.render(c, this.x, curY, 0.54, drawMonster, true);
            }
            return;
        }

        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (!fxModule) return;

        const progress = Math.min(1, this.time / this.duration);
        const animT = (this.mode === 'out') ? (this.maxAnimTime * (1 - progress)) : (progress * this.maxAnimTime);

        const drawMonster = (ctx, t) => {
            if (typeof drawSkinModel === 'function') {
                drawSkinModel(ctx, 0, 0, 32, this.skinId, 0, t * 3, false);
            }
        };

        if (canvasWidth && canvasHeight) {
            fxModule.draw(c, canvasWidth, canvasHeight, animT, drawMonster, false, this.animType);
        } else {
            c.save();
            c.translate(this.x - 300 * this.scale, this.y - 200 * this.scale);
            c.scale(this.scale, this.scale);
            fxModule.draw(c, 600, 400, animT, drawMonster, true, this.animType);
            c.restore();
        }
    }
}

// İstifadəçinin verdiyi orijinal animasiyalar reyestrdə qeydiyyatdan keçir
if (typeof PortalSpawnEffect !== 'undefined') SpawnEffectRegistry.register('portal', PortalSpawnEffect);
if (typeof CrystalSpawnEffect !== 'undefined') SpawnEffectRegistry.register('crystal', CrystalSpawnEffect);
if (typeof StellarSpawnEffect !== 'undefined') SpawnEffectRegistry.register('stellar', StellarSpawnEffect);
if (typeof DraculaSpawnEffect !== 'undefined') SpawnEffectRegistry.register('dracula', DraculaSpawnEffect);
if (typeof SeedSpawnEffect !== 'undefined') SpawnEffectRegistry.register('seed', SeedSpawnEffect);
const resolvedEffects = (typeof window !== 'undefined' && window.SingularityEffects ? window.SingularityEffects : (typeof global !== 'undefined' && global.SingularityEffects ? global.SingularityEffects : null));
const singModule = (typeof SingularitySpawnEffect !== 'undefined' ? SingularitySpawnEffect : (typeof window !== 'undefined' ? window.SingularitySpawnEffect : null));
if (resolvedEffects && singModule) {
    Object.keys(resolvedEffects).forEach(id => {
        SpawnEffectRegistry.register(id, singModule);
    });
}

// Qlobal reyestr
if (typeof window !== 'undefined') {
    window.SpawnEffectRegistry = SpawnEffectRegistry;
    window.MonsSpawnEffect = MonsSpawnEffect;
    window.MonsPortalEffect = MonsSpawnEffect;
}
if (typeof global !== 'undefined') {
    global.SpawnEffectRegistry = SpawnEffectRegistry;
    global.MonsSpawnEffect = MonsSpawnEffect;
    global.MonsPortalEffect = MonsSpawnEffect;
}
