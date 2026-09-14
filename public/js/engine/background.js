// Distant reactor shaft. All geometry is viewport-bounded; no gameplay randomness.
function drawArenaBackground(c, w, h, camera, floor, time) {
    c.save();
    const base = c.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#050b19');
    base.addColorStop(0.5, '#0b1427');
    base.addColorStop(1, '#050914');
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);

    const halo = c.createRadialGradient(w * 0.5, h * 0.32, 0, w * 0.5, h * 0.32, w * 0.65);
    halo.addColorStop(0, 'rgba(30,99,130,0.15)');
    halo.addColorStop(1, 'rgba(10,20,40,0)');
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);

    // Recessed structural ribs scroll more slowly than the arena.
    const offset = ((camera * 0.24) % 240 + 240) % 240;
    const inset = Math.min(70, w * 0.12);
    c.lineWidth = 1;
    for (let y = -240 - offset; y < h + 240; y += 240) {
        c.fillStyle = 'rgba(2,7,17,0.48)';
        c.fillRect(inset, y + 20, w - inset * 2, 205);
        c.strokeStyle = 'rgba(80,124,156,0.09)';
        c.strokeRect(inset, y + 20, w - inset * 2, 205);
        for (const x of [inset + 12, w - inset - 12]) {
            c.strokeStyle = 'rgba(65,133,163,0.16)';
            c.beginPath();
            c.moveTo(x, y + 35);
            c.lineTo(x, y + 82);
            c.lineTo(x + (x < w / 2 ? 16 : -16), y + 98);
            c.lineTo(x + (x < w / 2 ? 16 : -16), y + 188);
            c.stroke();
        }
        c.fillStyle = 'rgba(108,157,182,0.12)';
        c.font = '10px monospace';
        c.textAlign = 'center';
        c.fillText('SECTOR ' + String(floor).padStart(2, '0') + '  /  CORE ACCESS', w / 2, y + 211);
    }

    // Tall edge rails frame the play area without resembling pickups.
    for (const x of [18, w - 24]) {
        c.fillStyle = '#060b15';
        c.fillRect(x - 7, 0, 20, h);
        c.fillStyle = 'rgba(48,114,140,0.18)';
        c.fillRect(x, 0, 2, h);
        for (let y = -80 - offset; y < h; y += 120) {
            c.fillStyle = 'rgba(75,177,196,0.23)';
            c.fillRect(x - 2, y, 6, 26);
        }
    }

    // Sparse, dim drifting dust: no glow or pickup-sized shapes.
    for (let i = 0; i < 28; i++) {
        const x = ((i * 137.51 + Math.sin(time * 0.12 + i) * 9) % w + w) % w;
        const y = ((i * 91.73 + time * (2 + i % 3) - camera * 0.1) % h + h) % h;
        c.fillStyle = 'rgba(119,167,192,0.16)';
        c.fillRect(x, y, 1, 1);
    }
    const shade = c.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, 'rgba(0,2,8,0.6)');
    shade.addColorStop(0.25, 'rgba(0,2,8,0)');
    shade.addColorStop(0.75, 'rgba(0,2,8,0)');
    shade.addColorStop(1, 'rgba(0,2,8,0.6)');
    c.fillStyle = shade;
    c.fillRect(0, 0, w, h);
    c.restore();
}
