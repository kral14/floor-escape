/**
 * ============================================================================
 * 🎨 FLOOR ESCAPE: İKONLARIN STANDART RENDER VƏ FORMAT MÜHƏRRİKİ
 * Hər yerdə eyni növ və unikal ID-li ikonların göstərilməsini təmin edir.
 * Bütün SVG-lər mərkəzi Icons Registry-dən çəkilir.
 * ============================================================================
 */

(function (global) {
    function getRegistry() {
        return global.FLOOR_ESCAPE_ICONS_REGISTRY || {};
    }

    // ID və ya ad ilə ikonu tapmaq (Ağıllı Axtarış: camelCase, snake_case və defisləri dəstəkləyir)
    function findIconDef(idOrKey) {
        if (!idOrKey) return null;
        const registry = getRegistry();

        // 1. Rəqəmli ID ilə axtarış (məs: 101, 102, 103, "102")
        if (typeof idOrKey === 'number' || (!isNaN(Number(idOrKey)) && String(idOrKey).trim() !== '')) {
            const num = Number(idOrKey);
            if (registry[num]) return registry[num];
        }

        const rawStr = String(idOrKey).trim();
        const lowerStr = rawStr.toLowerCase();
        // Alt xətt, defis və boşluqları silərək tam təmiz forma (məs: coinVal -> coinval, coin_val -> coinval)
        const cleanStr = lowerStr.replace(/[\-_\s]/g, '');

        // 2. Birbaşa açar və ya alias müqayisəsi
        for (const id in registry) {
            const def = registry[id];
            if (!def) continue;

            const defKey = (def.key || '').toLowerCase();
            const cleanDefKey = defKey.replace(/[\-_\s]/g, '');

            if (defKey === lowerStr || cleanDefKey === cleanStr) return def;

            if (Array.isArray(def.alias)) {
                for (const a of def.alias) {
                    const aLower = String(a).toLowerCase();
                    const aClean = aLower.replace(/[\-_\s]/g, '');
                    if (aLower === lowerStr || aClean === cleanStr) return def;
                }
            }
        }

        return null;
    }

    // Əsas render metodu: ICONS.get(idOrKey, options)
    function getIconHtml(idOrKey, opts = {}) {
        const def = findIconDef(idOrKey);
        if (def && typeof def.render === 'function') {
            return def.render(opts);
        }
        // Fallback: əgər 103 (Ruby) tapılmasa belə birbaşa SVG istehsal edirik
        if (Number(idOrKey) === 103 || String(idOrKey).toLowerCase().includes('ruby')) {
            const size = opts.size || 24;
            return `<svg class="inline-block align-middle ruby-anim" width="${size}" height="${size}" viewBox="0 0 64 64" data-icon-id="103"><defs><linearGradient id="icRubyFallback" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff1f2"/><stop offset="40%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#881337"/></linearGradient></defs><polygon points="20,15 44,15 55,27 9,27" fill="url(#icRubyFallback)" stroke="#fecdd3" stroke-width="1.2"/><polygon points="9,27 32,27 32,55" fill="#e11d48"/><polygon points="55,27 32,27 32,55" fill="#fb7185"/><polygon points="20,27 44,27 32,55" fill="#ffffff" opacity="0.85"/></svg>`;
        }
        return '';
    }

    // Mətn daxilindəki köhnə və ya emoji qeydlərini rəsmi SVG ikonlara çevirmək
    function formatTextWithIcons(text) {
        if (!text || typeof text !== 'string') return text;

        let res = text;

        // 1. Qırmızı almaz səhvlərini düzəltmək: 💎🔴, 💎 🔴, 🔴💎 -> Əsl Ruby SVG (ID: 103)
        const rubySvg = getIconHtml(103, { size: 22, animated: false });
        res = res.replace(/💎\s*🔴/g, rubySvg);
        res = res.replace(/🔴\s*💎/g, rubySvg);
        res = res.replace(/\[ruby\]/gi, rubySvg);
        res = res.replace(/\[qirmizi_almaz\]/gi, rubySvg);
        res = res.replace(/\[icon:ruby\]/gi, rubySvg);
        res = res.replace(/\[icon:103\]/gi, rubySvg);

        // 2. Mavi almaz: [cyan], [mavi_almaz], [icon:102]
        const cyanSvg = getIconHtml(102, { size: 22, animated: false });
        res = res.replace(/\[cyan\]/gi, cyanSvg);
        res = res.replace(/\[mavi_almaz\]/gi, cyanSvg);
        res = res.replace(/\[icon:cyan\]/gi, cyanSvg);
        res = res.replace(/\[icon:102\]/gi, cyanSvg);

        // 3. Qızıl sikkə: [gold], [qizil], [icon:101]
        const goldSvg = getIconHtml(101, { size: 18, animated: false });
        res = res.replace(/\[gold\]/gi, goldSvg);
        res = res.replace(/\[qizil\]/gi, goldSvg);
        res = res.replace(/\[icon:gold\]/gi, goldSvg);
        res = res.replace(/\[icon:101\]/gi, goldSvg);

        return res;
    }

    // DOM-da olan [data-icon] elementlərini avtomatik SVG ilə doldurmaq
    function renderDOMElements(rootNode) {
        const root = rootNode || (typeof document !== 'undefined' ? document : null);
        if (!root || !root.querySelectorAll) return;

        const targets = root.querySelectorAll('[data-icon], [data-icon-id]');
        targets.forEach(el => {
            const iconId = el.getAttribute('data-icon-id') || el.getAttribute('data-icon');
            const size = parseInt(el.getAttribute('data-size')) || undefined;
            const anim = el.getAttribute('data-animated') !== 'false';
            const svg = getIconHtml(iconId, { size, animated: anim });
            if (svg) {
                el.innerHTML = svg;
            }
        });
    }

    global.FLOOR_ESCAPE_ICONS_RENDER = {
        get: getIconHtml,
        find: findIconDef,
        formatText: formatTextWithIcons,
        renderDOM: renderDOMElements
    };
})(typeof window !== 'undefined' ? window : this);

