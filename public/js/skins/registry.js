// ============================================================================
// 🎨 SKINS REGISTRY: MƏRKƏZİ DƏRİLƏR REYESTRİ VƏ VAHİD RENDER DİSPATCHERİ
// ============================================================================

const SkinRegistry = {
    skins: {},
    renderers: {},

    register(id, config, renderFn) {
        if (!id) return;
        this.skins[id] = { id, ...config };
        if (typeof renderFn === 'function') {
            this.renderers[id] = renderFn;
        }
    },

    get(id) {
        return this.skins[id] || this.skins['default'] || null;
    },

    getAll() {
        return this.skins;
    },

    drawSkinModel(c, x, y, r, skinId, facing = 0, time = 0, isInvuln = false, entity = null) {
        const activeId = (skinId && this.renderers[skinId]) ? skinId : 'default';
        const renderer = this.renderers[activeId];
        const skin = this.get(activeId) || { color: '#00ffcc', glowColor: '#00ffcc' };

        c.save();
        c.translate(x, y);

        // 🦇 MONS VƏ QANADLARIN VAHİD MEYLLƏNMƏSİ (BANKING TILT):
        // Bədən və qanadlar tam sinxron bir az bucaqla əyilir, hərəkət dayananda 0 bucaqla düz dayanır
        c.rotate(facing || 0);

        // 🦇 DRAKULA QANADLARI (YALNIZ OYUNDAXİLİ REAL QAÇIŞDA - CANLI OYUNÇU ENTITY MÖVCUD OLDUQDA)
        if (entity && typeof drawDraculaBatWings === 'function' && typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim === 'dracula') {
            drawDraculaBatWings(c, r, facing, time, entity);
        }

        if (renderer) {
            // Ana kontekst artıq facing qədər fırladılıb, daxildə təkrar fırlanmasın
            renderer(c, r, skin, 0, time, isInvuln);
        }

        c.restore();
    }
};

// Qlobal qeydiyyat və geriyə uyğunluq
window.SkinRegistry = SkinRegistry;
window.SKINS = SkinRegistry.skins;
window.drawSkinModel = (c, x, y, r, skinId, facing = 0, time = 0, isInvuln = false, entity = null) => {
    SkinRegistry.drawSkinModel(c, x, y, r, skinId, facing, time, isInvuln, entity);
};
