/**
 * ============================================================================
 * 💎 FLOOR ESCAPE: ƏSAS İKONLAR MÜHƏRRİKİ (ICONS MASTER ENGINE)
 * Bütün ikonlar public/js/icons/ qovluğundakı reyestr və render modullarından idarə olunur.
 * Hər bir ikonun unikal ID nömrəsi var və oyunda standart vektor formatında əks olunur.
 * ============================================================================
 */

(function (global) {
    const registry = global.FLOOR_ESCAPE_ICONS_REGISTRY || {};
    const renderer = global.FLOOR_ESCAPE_ICONS_RENDER || {};

    const ICONS = {
        // Universal çağırış: ID (məs: 103) və ya ad (məs: 'ruby', 'ruby_diamond')
        get: function (idOrKey, opts = {}) {
            if (renderer.get) {
                return renderer.get(idOrKey, opts);
            }
            if (idOrKey === 103 || idOrKey === 'ruby_diamond' || idOrKey === 'ruby') {
                return ICONS.rubyDiamond(opts);
            }
            if (idOrKey === 102 || idOrKey === 'cyan_diamond' || idOrKey === 'cyan') {
                return ICONS.cyanDiamond(opts);
            }
            if (idOrKey === 101 || idOrKey === 'gold_coin' || idOrKey === 'gold') {
                return ICONS.goldCoin(opts);
            }
            return '';
        },

        // Mətndəki qırmızı almaz və digər simvolları SVG-yə çevirmək
        formatText: function (text) {
            if (renderer.formatText) {
                return renderer.formatText(text);
            }
            if (!text || typeof text !== 'string') return text;
            return text.replace(/💎\s*🔴/g, ICONS.rubyDiamond({ size: 15, animated: false }));
        },

        // Səhifədəki [data-icon] elementlərini yeniləmək
        renderDOM: function (root) {
            if (renderer.renderDOM) {
                renderer.renderDOM(root);
            }
        },

        // 1. Qızıl Sikkə [ID: 101]
        goldCoin: function (opts = {}) {
            return (registry[101] && registry[101].render) 
                ? registry[101].render(opts) 
                : (renderer.get ? renderer.get(101, opts) : '');
        },

        // 2. Mavi Almaz [ID: 102]
        cyanDiamond: function (opts = {}) {
            return (registry[102] && registry[102].render) 
                ? registry[102].render(opts) 
                : (renderer.get ? renderer.get(102, opts) : '');
        },

        // 3. Qırmızı Almaz (Real Ruby Gem) [ID: 103] - 💎🔴 DEYİL, XALİS RUBİN!
        rubyDiamond: function (opts = {}) {
            return (registry[103] && registry[103].render) 
                ? registry[103].render(opts) 
                : (renderer.get ? renderer.get(103, opts) : '');
        },

        // 4. Baza Hərəkət Sürəti [ID: 104]
        speed: function (opts = {}) {
            return (registry[104] && registry[104].render) 
                ? registry[104].render(opts) 
                : (renderer.get ? renderer.get(104, opts) : '');
        },

        // 5. Baza Maqnit Sahəsi [ID: 105]
        magnet: function (opts = {}) {
            return (registry[105] && registry[105].render) 
                ? registry[105].render(opts) 
                : (renderer.get ? renderer.get(105, opts) : '');
        },

        // 6. Sikkə Dəyəri [ID: 106]
        coinVal: function (opts = {}) {
            return (registry[106] && registry[106].render) ? registry[106].render(opts) : '';
        },

        // 7. Sikkə Tezliyi [ID: 107]
        coinRate: function (opts = {}) {
            return (registry[107] && registry[107].render) ? registry[107].render(opts) : '';
        },

        // 8. Qoruyucu Qalxan [ID: 108]
        shield: function (opts = {}) {
            return (registry[108] && registry[108].render) ? registry[108].render(opts) : '';
        },

        // 9. İmpuls Sıçrayışı [ID: 109]
        dash: function (opts = {}) {
            return (registry[109] && registry[109].render) ? registry[109].render(opts) : '';
        },

        // 10. Başlanğıc Büdcəsi [ID: 110]
        startGold: function (opts = {}) {
            return (registry[110] && registry[110].render) ? registry[110].render(opts) : '';
        },

        // 11. Qüllə [ID: 111]
        turret: function (opts = {}) {
            return (registry[111] && registry[111].render) ? registry[111].render(opts) : '';
        },

        // 12. Poçt [ID: 112]
        envelope: function (opts = {}) {
            return (registry[112] && registry[112].render) ? registry[112].render(opts) : '';
        },

        // 13. Zəng [ID: 113]
        bell: function (opts = {}) {
            return (registry[113] && registry[113].render) ? registry[113].render(opts) : '';
        },

        // 14. Zibil Qutusu [ID: 114]
        trash: function (opts = {}) {
            return (registry[114] && registry[114].render) ? registry[114].render(opts) : '';
        },

        // 15. Sandıq [ID: 115]
        chest: function (opts = {}) {
            return (registry[115] && registry[115].render) ? registry[115].render(opts) : '';
        },

        // Mərmi İkonları
        bulletWall: function (opts = {}) {
            const size = opts.size || 20;
            return `<svg class="inline-block align-middle" width="${size}" height="${size}" viewBox="0 0 48 48"><polygon points="24,6 40,16 40,34 24,44 8,34 8,16" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/><circle cx="24" cy="25" r="7" fill="#0284c7"/></svg>`;
        },
        bulletIce: function (opts = {}) {
            const size = opts.size || 20;
            return `<svg class="inline-block align-middle" width="${size}" height="${size}" viewBox="0 0 48 48"><polygon points="24,6 40,16 40,34 24,44 8,34 8,16" fill="#082f49" stroke="#7dd3fc" stroke-width="2"/><line x1="24" y1="12" x2="24" y2="38" stroke="#38bdf8" stroke-width="2"/><line x1="12" y1="25" x2="36" y2="25" stroke="#38bdf8" stroke-width="2"/></svg>`;
        },
        bulletShock: function (opts = {}) {
            const size = opts.size || 20;
            return `<svg class="inline-block align-middle" width="${size}" height="${size}" viewBox="0 0 48 48"><polygon points="24,6 40,16 40,34 24,44 8,34 8,16" fill="#422006" stroke="#facc15" stroke-width="2"/><polygon points="26,12 16,26 24,26 22,38 32,24 24,24" fill="#eab308"/></svg>`;
        },
        bulletMine: function (opts = {}) {
            const size = opts.size || 20;
            return `<svg class="inline-block align-middle" width="${size}" height="${size}" viewBox="0 0 48 48"><polygon points="24,6 40,16 40,34 24,44 8,34 8,16" fill="#450a0a" stroke="#f87171" stroke-width="2"/><circle cx="24" cy="25" r="8" fill="#ef4444"/><circle cx="24" cy="25" r="3" fill="#ffffff"/></svg>`;
        },
        bulletPlasma: function (opts = {}) {
            const size = opts.size || 20;
            return `<svg class="inline-block align-middle" width="${size}" height="${size}" viewBox="0 0 48 48"><polygon points="24,6 40,16 40,34 24,44 8,34 8,16" fill="#3b0764" stroke="#c084fc" stroke-width="2"/><circle cx="24" cy="25" r="8" fill="#a855f7"/><circle cx="24" cy="25" r="4" fill="#ffffff"/></svg>`;
        },

        // Bütün səhifədəki slotları tənzimləmək
        renderAllSlots: function () {
            const slots = document.querySelectorAll('[data-icon]');
            slots.forEach(slot => {
                const iconIdOrKey = slot.getAttribute('data-icon');
                const size = parseInt(slot.getAttribute('data-size')) || 18;
                const animated = slot.getAttribute('data-animated') !== 'false';
                slot.innerHTML = ICONS.get(iconIdOrKey, { size, animated });
            });
        }
    };

    global.ICONS = ICONS;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => ICONS.renderAllSlots());
        } else {
            ICONS.renderAllSlots();
        }
    }
})(typeof window !== 'undefined' ? window : this);
