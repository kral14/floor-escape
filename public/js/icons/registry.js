/**
 * ============================================================================
 * 💎 FLOOR ESCAPE: RƏSMİ İKONLAR REYESTRİ (ICONS REGISTRY)
 * Hər bir ikonun sabit unikal ID nömrəsi və vektor SVG tərifi var.
 * ============================================================================
 */

(function (global) {
    const REGISTRY = {
        // [ID: 101] Qızıl Sikkə (3D Kiber Qızıl)
        101: {
            id: 101,
            key: 'gold_coin',
            alias: ['gold', 'coin', 'qizil'],
            name: 'Qızıl Sikkə',
            defaultSize: 20,
            render: function (opts = {}) {
                const size = opts.size || 20;
                const anim = opts.animated !== false ? 'coin-spin-3d' : '';
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${anim} ${extraClass}" width="${size}" height="${size}" viewBox="0 0 64 64" style="overflow:visible;" data-icon-id="101">
                    <defs>
                        <linearGradient id="icGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#fffbeb"/>
                            <stop offset="25%" stop-color="#f59e0b"/>
                            <stop offset="65%" stop-color="#d97706"/>
                            <stop offset="100%" stop-color="#78350f"/>
                        </linearGradient>
                        <linearGradient id="icGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#fef08a"/>
                            <stop offset="100%" stop-color="#b45309"/>
                        </linearGradient>
                        <filter id="icGoldGlow">
                            <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#f59e0b" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#icGoldGrad)" stroke="url(#icGoldRim)" stroke-width="2.5" filter="url(#icGoldGlow)"/>
                    <circle cx="32" cy="32" r="22" fill="none" stroke="#fef08a" stroke-dasharray="3,2" stroke-width="1.5" opacity="0.85"/>
                    <path d="M26 21 H38 V25 H30 V29 H36 V33 H30 V43 H26 Z" fill="#ffffff" opacity="0.95"/>
                    <polygon points="32,15 34,18 37,18 35,20 36,23 32,21 28,23 29,20 27,18 30,18" fill="#fef08a"/>
                </svg>`.trim();
            }
        },

        // [ID: 102] Mavi Kiber Almaz (Cyan Diamond Gem)
        102: {
            id: 102,
            key: 'cyan_diamond',
            alias: ['diamond', 'cyan', 'blue_diamond', 'mavi_almaz'],
            name: 'Mavi Almaz',
            defaultSize: 24,
            render: function (opts = {}) {
                const size = opts.size || 24;
                const anim = opts.animated !== false ? 'cyan-gem-anim' : '';
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${anim} ${extraClass}" width="${size}" height="${size}" viewBox="0 0 64 64" style="overflow:visible;" data-icon-id="102">
                    <defs>
                        <linearGradient id="icCyanTop" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#cffafe"/>
                            <stop offset="100%" stop-color="#06b6d4"/>
                        </linearGradient>
                        <linearGradient id="icCyanLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#0891b2"/>
                            <stop offset="100%" stop-color="#164e63"/>
                        </linearGradient>
                        <linearGradient id="icCyanRight" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#22d3ee"/>
                            <stop offset="100%" stop-color="#0e7490"/>
                        </linearGradient>
                        <linearGradient id="icCyanCenter" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="100%" stop-color="#06b6d4"/>
                        </linearGradient>
                        <filter id="icCyanGlow">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#06b6d4" flood-opacity="0.85"/>
                        </filter>
                    </defs>
                    <g filter="url(#icCyanGlow)">
                        <polygon points="20,16 44,16 54,27 10,27" fill="url(#icCyanTop)" stroke="#a5f3fc" stroke-width="1"/>
                        <polygon points="20,16 32,27 10,27" fill="#38bdf8" opacity="0.9"/>
                        <polygon points="44,16 32,27 54,27" fill="#0891b2" opacity="0.95"/>
                        <polygon points="20,16 32,16 32,27" fill="#ffffff" opacity="0.6"/>
                        <polygon points="10,27 32,27 32,54" fill="url(#icCyanLeft)" stroke="#06b6d4" stroke-width="0.5"/>
                        <polygon points="54,27 32,27 32,54" fill="url(#icCyanRight)" stroke="#22d3ee" stroke-width="0.5"/>
                        <polygon points="22,27 42,27 32,54" fill="url(#icCyanCenter)" opacity="0.85"/>
                    </g>
                </svg>`.trim();
            }
        },

        // [ID: 103] Qırmızı Almaz (Real Ruby Gem - Parlaq, Yüksək Kontrastlı Neon Yaqut)
        103: {
            id: 103,
            key: 'ruby_diamond',
            alias: ['ruby', 'red_diamond', 'qirmizi_almaz', 'qırmızı_almaz'],
            name: 'Qırmızı Almaz',
            defaultSize: 24,
            render: function (opts = {}) {
                const size = opts.size || 24;
                const anim = opts.animated !== false ? 'ruby-anim' : '';
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${anim} ${extraClass}" width="${size}" height="${size}" viewBox="0 0 64 64" style="overflow:visible; vertical-align:middle;" data-icon-id="103">
                    <defs>
                        <linearGradient id="icRubyTop" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="40%" stop-color="#ffb3c1"/>
                            <stop offset="100%" stop-color="#ff0055"/>
                        </linearGradient>
                        <linearGradient id="icRubyLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ff2a5f"/>
                            <stop offset="100%" stop-color="#b51740"/>
                        </linearGradient>
                        <linearGradient id="icRubyRight" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ff597b"/>
                            <stop offset="100%" stop-color="#d90429"/>
                        </linearGradient>
                        <linearGradient id="icRubyCenter" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="50%" stop-color="#ff4d6d"/>
                            <stop offset="100%" stop-color="#c9184a"/>
                        </linearGradient>
                        <filter id="icRubyGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ff0055" flood-opacity="0.95"/>
                        </filter>
                    </defs>
                    <g filter="url(#icRubyGlow)">
                        <!-- Tac Hissəsi (Üst Fasetlər) -->
                        <polygon points="20,15 44,15 55,27 9,27" fill="url(#icRubyTop)" stroke="#ffe4e6" stroke-width="1.2"/>
                        <polygon points="20,15 32,27 9,27" fill="#ff4d6d" opacity="0.95"/>
                        <polygon points="44,15 32,27 55,27" fill="#d90429" opacity="0.95"/>
                        <polygon points="20,15 32,15 32,27" fill="#ffffff" opacity="0.85"/>
                        <polygon points="32,15 44,15 32,27" fill="#ffe4e6" opacity="0.75"/>

                        <!-- Pavilyon Hissəsi (Alt Korpus) -->
                        <polygon points="9,27 32,27 32,55" fill="url(#icRubyLeft)" stroke="#ff4d6d" stroke-width="0.8"/>
                        <polygon points="55,27 32,27 32,55" fill="url(#icRubyRight)" stroke="#ff758f" stroke-width="0.8"/>
                        <polygon points="20,27 44,27 32,55" fill="url(#icRubyCenter)" opacity="0.95"/>
                        
                        <!-- Parıltı Nöqtəsi (Sparkle Flare) -->
                        <circle cx="23" cy="20" r="2.5" fill="#ffffff" opacity="1"/>
                        <circle cx="41" cy="32" r="1.5" fill="#ffffff" opacity="0.85"/>
                    </g>
                </svg>`.trim();
            }
        },

        // [ID: 104] Hərəkət Sürəti (Speed Upgrade)
        104: {
            id: 104,
            key: 'speed',
            alias: ['suret', 'velocity'],
            name: 'Hərəkət Sürəti',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="104">
                    <path d="M10,28 L24,10 L28,18 L38,14 L30,32 L22,26 L16,36 Z" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.8"/>
                    <circle cx="28" cy="12" r="3" fill="#ffffff"/>
                    <line x1="8" y1="36" x2="20" y2="36" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="12" y1="42" x2="26" y2="42" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 105] Kiber Maqnit (Magnet Upgrade)
        105: {
            id: 105,
            key: 'magnet',
            alias: ['maqnit'],
            name: 'Maqnit Sahəsi',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="105">
                    <path d="M12,18 L12,28 C12,35 17,40 24,40 C31,40 36,35 36,28 L36,18 L28,18 L28,28 C28,30 26,32 24,32 C22,32 20,30 20,28 L20,18 Z" fill="#c084fc" stroke="#f3e8ff" stroke-width="1.8"/>
                    <rect x="11" y="12" width="10" height="7" rx="1.5" fill="#ef4444" stroke="#fca5a5" stroke-width="1.2"/>
                    <rect x="27" y="12" width="10" height="7" rx="1.5" fill="#3b82f6" stroke="#93c5fd" stroke-width="1.2"/>
                    <line x1="16" y1="9" x2="16" y2="5" stroke="#f87171" stroke-width="2" stroke-linecap="round"/>
                    <line x1="32" y1="9" x2="32" y2="5" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 106] Sikkə Dəyəri (Coin Value)
        106: {
            id: 106,
            key: 'coin_val',
            alias: ['coin_value'],
            name: 'Sikkə Dəyəri',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="106">
                    <circle cx="20" cy="24" r="14" fill="#f59e0b" stroke="#fde047" stroke-width="2"/>
                    <circle cx="28" cy="20" r="14" fill="#fbbf24" stroke="#fef08a" stroke-width="2" opacity="0.9"/>
                    <path d="M26,13 L31,27 M30,13 L25,27 M23,17 H33 M23,23 H33" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 107] Sikkə Tezliyi (Coin Spawn Rate)
        107: {
            id: 107,
            key: 'coin_rate',
            alias: ['coin_spawn'],
            name: 'Sikkə Tezliyi',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="107">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="24,8"/>
                    <circle cx="24" cy="24" r="10" fill="#4ade80" stroke="#bbf7d0" stroke-width="1.5"/>
                    <path d="M24,14 V24 L30,28" stroke="#052e16" stroke-width="2.5" stroke-linecap="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 108] Qoruyucu Qalxan (Energy Shield)
        108: {
            id: 108,
            key: 'shield',
            alias: ['qalxan'],
            name: 'Enerji Qalxanı',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="108">
                    <path d="M24,6 L38,12 V24 C38,33 32,40 24,43 C16,40 10,33 10,24 V12 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
                    <path d="M24,11 L33,15 V24 C33,30 29,35 24,37 C19,35 15,30 15,24 V15 Z" fill="#06b6d4" opacity="0.8"/>
                    <polygon points="24,16 27,23 34,23 28,27 30,34 24,29 18,34 20,27 14,23 21,23" fill="#ffffff"/>
                </svg>`.trim();
            }
        },

        // [ID: 109] İmpuls Sıçrayışı (Dash CD)
        109: {
            id: 109,
            key: 'dash',
            alias: ['dash_cd'],
            name: 'İmpuls Sıçrayışı',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="109">
                    <polygon points="14,12 28,12 20,24 34,24 16,42 20,28 10,28" fill="#eab308" stroke="#fef08a" stroke-width="1.8"/>
                </svg>`.trim();
            }
        },

        // [ID: 110] Başlanğıc Büdcəsi (Start Gold)
        110: {
            id: 110,
            key: 'start_gold',
            alias: ['budget'],
            name: 'Başlanğıc Büdcəsi',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="110">
                    <rect x="8" y="14" width="32" height="24" rx="4" fill="#059669" stroke="#6ee7b7" stroke-width="2"/>
                    <circle cx="24" cy="26" r="6" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
                    <path d="M12,18 L18,24 M36,18 L30,24 M12,34 L18,28 M36,34 L30,28" stroke="#a7f3d0" stroke-width="1.5"/>
                </svg>`.trim();
            }
        },

        // [ID: 111] İkili Müdafiə Qülləsi (Twin Turrets)
        111: {
            id: 111,
            key: 'turret',
            alias: ['turrets', 'twin_turrets'],
            name: 'Kiber Qüllə',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="111">
                    <circle cx="24" cy="24" r="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="2.5"/>
                    <circle cx="24" cy="24" r="9" fill="#4f46e5"/>
                    <rect x="21" y="6" width="6" height="14" rx="2" fill="#818cf8"/>
                    <circle cx="24" cy="24" r="4" fill="#c7d2fe"/>
                </svg>`.trim();
            }
        },

        // [ID: 112] Poçt / Məktub (Envelope)
        112: {
            id: 112,
            key: 'envelope',
            alias: ['mail', 'inbox_icon', 'mektub'],
            name: 'Poçt Qutusu',
            defaultSize: 20,
            render: function (opts = {}) {
                const size = opts.size || 20;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="112">
                    <rect x="6" y="10" width="36" height="28" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
                    <path d="M6,14 L24,28 L42,14" fill="none" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 113] Bildiriş Zəngi (Notification Bell)
        113: {
            id: 113,
            key: 'bell',
            alias: ['notification', 'zeng'],
            name: 'Bildiriş Zəngi',
            defaultSize: 20,
            render: function (opts = {}) {
                const size = opts.size || 20;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="113">
                    <path d="M24,6 C21.8,6 20,7.8 20,10 C15.6,11.2 12,15.6 12,22 V32 L8,36 V38 H40 V36 L36,32 V22 C36,15.6 32.4,11.2 28,10 C28,7.8 26.2,6 24,6 Z" fill="#0ea5e9" stroke="#7dd3fc" stroke-width="2"/>
                    <circle cx="24" cy="42" r="4" fill="#38bdf8"/>
                </svg>`.trim();
            }
        },

        // [ID: 114] Zibil Qutusu / Sil (Trash Can)
        114: {
            id: 114,
            key: 'trash',
            alias: ['sil', 'delete', 'remove'],
            name: 'Zibil Qutusu',
            defaultSize: 18,
            render: function (opts = {}) {
                const size = opts.size || 18;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="114">
                    <path d="M12,14 L15,40 C15.2,42 16.8,43.5 19,43.5 H29 C31.2,43.5 32.8,42 33,40 L36,14" fill="#e11d48" stroke="#fda4af" stroke-width="2" opacity="0.9"/>
                    <line x1="8" y1="14" x2="40" y2="14" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
                    <path d="M18,14 V9 C18,7.5 19.5,6 21,6 H27 C28.5,6 30,7.5 30,9 V14" fill="none" stroke="#f43f5e" stroke-width="2.5"/>
                    <line x1="20" y1="20" x2="20" y2="36" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                    <line x1="28" y1="20" x2="28" y2="36" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                </svg>`.trim();
            }
        },

        // [ID: 115] Sandıq / Hədiyyə (Chest / Gift)
        115: {
            id: 115,
            key: 'chest',
            alias: ['sandıq', 'sandig', 'gift'],
            name: 'Kiber Sandıq',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="115">
                    <rect x="8" y="18" width="32" height="22" rx="3" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
                    <path d="M6,18 C6,13 14,10 24,10 C34,10 42,13 42,18 Z" fill="#d97706" stroke="#fde047" stroke-width="2"/>
                    <rect x="21" y="16" width="6" height="8" rx="1.5" fill="#fef08a" stroke="#78350f" stroke-width="1.5"/>
                    <line x1="8" y1="28" x2="40" y2="28" stroke="#fde047" stroke-width="1.5"/>
                </svg>`.trim();
            }
        },

        // [ID: 116] Kiber Gücləndirici / Orblar (PowerUp Frequency)
        116: {
            id: 116,
            key: 'power_up',
            alias: ['powerup', 'power_up', 'powerUp', 'orb', 'guclendirici', 'power_ups'],
            name: 'Gücləndirici Tezliyi',
            defaultSize: 22,
            render: function (opts = {}) {
                const size = opts.size || 22;
                const extraClass = opts.className || '';
                return `
                <svg class="inline-block align-middle ${extraClass}" width="${size}" height="${size}" viewBox="0 0 48 48" data-icon-id="116">
                    <defs>
                        <linearGradient id="icPowerUpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#fef08a"/>
                            <stop offset="50%" stop-color="#f59e0b"/>
                            <stop offset="100%" stop-color="#d97706"/>
                        </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="14,6"/>
                    <circle cx="24" cy="24" r="10" fill="url(#icPowerUpGrad)" stroke="#fef08a" stroke-width="1.5"/>
                    <polygon points="24,16 26.5,21 32,22 28,26 29,31.5 24,28.5 19,31.5 20,26 16,22 21.5,21" fill="#ffffff"/>
                </svg>`.trim();
            }
        }
    };

    global.FLOOR_ESCAPE_ICONS_REGISTRY = REGISTRY;
})(typeof window !== 'undefined' ? window : this);
