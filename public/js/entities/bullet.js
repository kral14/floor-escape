// MƏRMİ VƏ TƏLƏ PROYEKTİLLƏRİ SİNİFİ

class Bullet {
    constructor(type, startX, startY, vy = 10.5, vx = 0) {
        this.type = type;
        this.x = startX;
        this.y = startY;
        this.vx = vx;
        this.vy = vy;
        this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.08;
        this.tail = [];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        this.tail.push({ x: this.x, y: this.y, alpha: 0.7 });
        if (this.tail.length > 8) this.tail.shift();
    }

    draw() {
        this.tail.forEach((t, i) => {
            ctx.save();
            ctx.globalAlpha = (i / this.tail.length) * 0.35;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 8 * (i / this.tail.length), 0, Math.PI * 2);
            const trailColors = {
                wall: '#ffaa00',
                ice: '#00ccff',
                shock: '#c084fc',
                mine: '#f43f5e',
                plasma: '#34d399'
            };
            ctx.fillStyle = trailColors[this.type] || '#ffffff';
            ctx.fill();
            ctx.restore();
        });

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // 1. BARRİKADA
        if (this.type === 'wall') {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#ffd000';

            ctx.fillStyle = 'rgba(40, 28, 10, 0.85)';
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 32, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#facc15';
            const sz = 4.5;
            ctx.fillRect(-sz/2, -10, sz, sz);
            ctx.fillRect(-sz - 1, -4.5, sz, sz);
            ctx.fillRect(1, -4.5, sz, sz);
            ctx.fillRect(-sz * 1.5 - 1.5, 1, sz, sz);
            ctx.fillRect(-sz/2, 1, sz, sz);
            ctx.fillRect(sz/2 + 1.5, 1, sz, sz);
        }
        // 2. BUZ
        else if (this.type === 'ice') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';

            ctx.fillStyle = 'rgba(8, 35, 45, 0.85)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 32, 8);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            for (let a = 0; a < 3; a++) {
                ctx.beginPath();
                ctx.moveTo(-9, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(5, -3);
                ctx.lineTo(8, 0);
                ctx.lineTo(5, 3);
                ctx.moveTo(-5, -3);
                ctx.lineTo(-8, 0);
                ctx.lineTo(-5, 3);
                ctx.stroke();

                ctx.rotate(Math.PI / 3);
            }
        }
        // 3. ELEKTRİK ŞOKU
        else if (this.type === 'shock') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#c084fc';

            ctx.fillStyle = 'rgba(32, 18, 52, 0.85)';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 32, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#d8b4fe';
            ctx.beginPath();
            ctx.moveTo(1, -11);
            ctx.lineTo(-7, 0);
            ctx.lineTo(-1, 0);
            ctx.lineTo(-2, 11);
            ctx.lineTo(7, -1);
            ctx.lineTo(1, -1);
            ctx.closePath();
            ctx.fill();
        }
        // 4. MİNA
        else if (this.type === 'mine') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#f43f5e';

            ctx.fillStyle = 'rgba(48, 12, 22, 0.85)';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 32, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            const spikes = 8;
            for (let s = 0; s < spikes * 2; s++) {
                const r = s % 2 === 0 ? 9 : 4.5;
                const angle = (s * Math.PI) / spikes;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }
        // 5. PLAZMA
        else if (this.type === 'plasma') {
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#34d399';

            ctx.fillStyle = 'rgba(8, 38, 28, 0.85)';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 32, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#6ee7b7';
            ctx.lineWidth = 1.6;
            for (let o = 0; o < 3; o++) {
                ctx.beginPath();
                ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.rotate(Math.PI / 3);
            }
        }

        ctx.restore();
    }
}
