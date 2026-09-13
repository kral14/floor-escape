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
                    draw: (c, w, h, t, dm, ig) => singFx.draw(c, w, h, t, dm, ig, id)
                };
            }
            return null;
        }
        return this.effects[id] || this.effects['portal'] || null;
    },

    getAll() {
        return this.effects;
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
        this.targetY = targetY;
        this.skinId = skinId;
        this.skin = (typeof SKINS !== 'undefined' && SKINS[skinId]) ? SKINS[skinId] : null;
        this.animType = ['singularity', 'supernova', 'synapse', 'abyssal', 'crystal', 'stellar', 'dracula', 'seed'].includes(animType) ? animType : 'singularity';
        this.mode = mode || 'in';
        this.loop = !!loop;
        this.onComplete = onComplete;
        this.time = 0;

        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (fxModule && typeof fxModule.resetFlight === 'function') {
            fxModule.interactive = false;
            fxModule.resetFlight();
        }
        this.maxAnimTime = (fxModule && fxModule.duration) ? fxModule.duration : 6.0;
        this.duration = (this.mode === 'out') ? 1.8 : 2.8;
        this.finished = false;
        this.scale = 0.52;
    }

    static smooth(a, b, t) {
        const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return x * x * (3 - 2 * x);
    }

    update(dt) {
        if (this.finished) return;
        this.time += dt;

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

        const fxModule = SpawnEffectRegistry.get(this.animType);
        if (!fxModule) return;

        // Zamanı orijinal şkalaya normallaşdırırıq
        const progress = Math.min(1, this.time / this.duration);
        const animT = (this.mode === 'out') ? (this.maxAnimTime * (1 - progress)) : (progress * this.maxAnimTime);

        const drawMonster = (ctx, t) => {
            if (typeof drawSkinModel === 'function') {
                drawSkinModel(ctx, 0, 0, 32, this.skinId, 0, t * 3, false);
            }
        };

        if (canvasWidth && canvasHeight) {
            // Birbaşa mağaza səhnəsi (canvas koordinatları ilə)
            fxModule.draw(c, canvasWidth, canvasHeight, animT, drawMonster, false, this.animType);
        } else {
            // Oyundaxili koordinat sistemi: mərkəz (this.x, this.y)
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
if (resolvedEffects) {
    Object.keys(resolvedEffects).forEach(id => {
        SpawnEffectRegistry.register(id, resolvedEffects[id]);
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
