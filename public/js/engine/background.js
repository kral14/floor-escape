// Distant reactor shaft. All geometry is viewport-bounded; no gameplay randomness.
let _cachedBgBase = null;
let _cachedBgHalo = null;
let _cachedBgShade = null;
let _cachedBgW = 0;
let _cachedBgH = 0;

function drawArenaBackground(c, w, h, camera, floor, time) {
    c.save();
    const q = (typeof window !== 'undefined' && window.GRAPHICS_QUALITY) ? window.GRAPHICS_QUALITY : 'high';

    if (_cachedBgW !== w || _cachedBgH !== h || !_cachedBgBase) {
        _cachedBgW = w;
        _cachedBgH = h;
        _cachedBgBase = c.createLinearGradient(0, 0, w, h);
        _cachedBgBase.addColorStop(0, '#050b19');
        _cachedBgBase.addColorStop(0.5, '#0b1427');
        _cachedBgBase.addColorStop(1, '#050914');

        _cachedBgHalo = c.createRadialGradient(w * 0.5, h * 0.32, 0, w * 0.5, h * 0.32, w * 0.65);
        _cachedBgHalo.addColorStop(0, 'rgba(30,99,130,0.18)');
        _cachedBgHalo.addColorStop(1, 'rgba(10,20,40,0)');

        _cachedBgShade = c.createLinearGradient(0, 0, w, 0);
        _cachedBgShade.addColorStop(0, 'rgba(0,2,8,0.7)');
        _cachedBgShade.addColorStop(0.25, 'rgba(0,2,8,0)');
        _cachedBgShade.addColorStop(0.75, 'rgba(0,2,8,0)');
        _cachedBgShade.addColorStop(1, 'rgba(0,2,8,0.7)');
    }

    c.fillStyle = _cachedBgBase;
    c.fillRect(0, 0, w, h);

    // ⚡ AŞAĞI REJİM (LOW): Təmiz, minimalist qaranlıq kiber arena! Sıfır artıq relyef və sıfır GPU yükü!
    if (q === 'low') {
        c.fillStyle = _cachedBgShade;
        c.fillRect(0, 0, w, h);
        c.restore();
        return;
    }

    c.fillStyle = _cachedBgHalo;
    c.fillRect(0, 0, w, h);

    // Recessed structural ribs scroll more slowly than the arena.
    const offset = ((camera * 0.24) % 240 + 240) % 240;
    const inset = Math.min(70, w * 0.12);
    c.lineWidth = 1;
    for (let y = -240 - offset; y < h + 240; y += 240) {
        c.fillStyle = 'rgba(2,7,17,0.48)';
        c.fillRect(inset, y + 20, w - inset * 2, 205);
        c.strokeStyle = 'rgba(80,124,156,0.12)';
        c.strokeRect(inset, y + 20, w - inset * 2, 205);

        // Yalnız YÜKSƏK rejimdə arxa plandakı texniki detallar və mətnlər çəkilir
        if (q === 'high') {
            for (const x of [inset + 12, w - inset - 12]) {
                c.strokeStyle = 'rgba(65,133,163,0.22)';
                c.beginPath();
                c.moveTo(x, y + 35);
                c.lineTo(x, y + 82);
                c.lineTo(x + (x < w / 2 ? 16 : -16), y + 98);
                c.lineTo(x + (x < w / 2 ? 16 : -16), y + 188);
                c.stroke();
            }
            c.fillStyle = 'rgba(108,157,182,0.18)';
            c.font = '10px Orbitron, monospace';
            c.textAlign = 'center';
            c.fillText('SECTOR ' + String(floor).padStart(2, '0') + '  /  CORE ACCESS', w / 2, y + 211);
        }
    }

    // Tall edge rails frame the play area
    for (const x of [18, w - 24]) {
        c.fillStyle = '#060b15';
        c.fillRect(x - 7, 0, 20, h);
        c.fillStyle = 'rgba(48,114,140,0.22)';
        c.fillRect(x, 0, 2, h);
        for (let y = -80 - offset; y < h; y += 120) {
            c.fillStyle = 'rgba(75,177,196,0.25)';
            c.fillRect(x - 2, y, 6, 26);
        }
    }

    // 🌟 YALNIZ YÜKSƏK REJİMDƏ: Uçuşan kosmik toz zərrəcikləri
    if (q === 'high') {
        for (let i = 0; i < 30; i++) {
            const x = ((i * 137.51 + Math.sin(time * 0.12 + i) * 9) % w + w) % w;
            const y = ((i * 91.73 + time * (2 + i % 3) - camera * 0.1) % h + h) % h;
            c.fillStyle = 'rgba(119,167,192,0.25)';
            c.fillRect(x, y, 1.5, 1.5);
        }
    }

    c.fillStyle = _cachedBgShade;
    c.fillRect(0, 0, w, h);
    c.restore();
}