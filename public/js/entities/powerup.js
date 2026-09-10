// ⚡ PLATFORMA VƏ ARENA GÜCLƏNDİRİCİLƏRİ (IN-GAME POWER-UPS)
// Mərhələ 1: Qalxan (Shield), Zaman Ləngiməsi (Chrono Shift), Kvant Sıçrayışı (Hyper Jump), Super-Maqnit (Magnet Storm)

class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.radius = 14;
        
        // Əgər növ verilməyibsə, təsadüfi seç
        const types = ['shield', 'chrono', 'jump', 'magnet'];
        const weights = [0.30, 0.25, 0.25, 0.20]; // Qalxan 30%, Zaman 25%, Sıçrayış 25%, Maqnit 20%
        
        if (type && types.includes(type)) {
            this.type = type;
        } else {
            const rand = Math.random();
            let sum = 0;
            this.type = 'shield';
            for (let i = 0; i < types.length; i++) {
                sum += weights[i];
                if (rand <= sum) {
                    this.type = types[i];
                    break;
                }
            }
        }

        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.lifeTime = 720; // 12 saniyə (60fps)
        this.age = 0;
        this.collected = false;

        // Xüsusi xarakteristikalar və rənglər
        const config = {
            shield: {
                color: '#00f0ff',
                glow: '#00c3ff',
                bg: 'rgba(0, 240, 255, 0.18)',
                icon: '🛡️',
                name: 'Enerji Qalxanı'
            },
            chrono: {
                color: '#c084fc',
                glow: '#a855f7',
                bg: 'rgba(192, 132, 252, 0.2)',
                icon: '⏱️',
                name: 'Zaman Ləngiməsi'
            },
            jump: {
                color: '#facc15',
                glow: '#f59e0b',
                bg: 'rgba(250, 204, 21, 0.2)',
                icon: '🚀',
                name: 'Kvant Sıçrayışı'
            },
            magnet: {
                color: '#34d399',
                glow: '#10b981',
                bg: 'rgba(52, 211, 153, 0.2)',
                icon: '🧲',
                name: 'Super Maqnit'
            }
        };

        this.cfg = config[this.type] || config.shield;
    }

    update() {
        this.age++;
        this.rotation += 0.04;
        return this.age < this.lifeTime;
    }

    draw(context) {
        const c = context || (typeof ctx !== 'undefined' ? ctx : null);
        if (!c) return;

        // Ömrün son 2.5 saniyəsində (150 frame) yanıb-sönmə
        if (this.lifeTime - this.age < 150) {
            if (Math.floor(this.age / 8) % 2 === 0) return;
        }

        const bob = Math.sin(Date.now() * 0.004 + this.bobOffset) * 3;
        const cy = this.y + bob;

        c.save();
        c.translate(this.x, cy);

        // 1. Xarici kiber-parıltı halqası
        c.shadowBlur = 18;
        c.shadowColor = this.cfg.glow;

        const pulseScale = 1 + Math.sin(Date.now() * 0.006 + this.bobOffset) * 0.08;
        c.scale(pulseScale, pulseScale);

        // Arxa dumanlı neon fon
        c.fillStyle = this.cfg.bg;
        c.beginPath();
        c.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        c.fill();

        // 2. Fırlanan qoruyucu kiber-halqa (Dashed Orbital Ring)
        c.save();
        c.rotate(this.rotation);
        c.strokeStyle = this.cfg.color;
        c.lineWidth = 2;
        c.setLineDash([6, 5]);
        c.beginPath();
        c.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // Əks istiqamətdə fırlanan ikinci nazik orbital xətt
        c.save();
        c.rotate(-this.rotation * 1.4);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.setLineDash([3, 8]);
        c.beginPath();
        c.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // 3. Əsas daxili qübbə / sfera
        const grad = c.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.cfg.color);
        grad.addColorStop(1, 'rgba(10, 15, 26, 0.95)');

        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = this.cfg.color;
        c.lineWidth = 1.5;
        c.stroke();

        // 4. Mərkəzi Simvol / Emoji
        c.shadowBlur = 0;
        c.font = '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(this.cfg.icon, 0, 1);

        c.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerUp;
}
