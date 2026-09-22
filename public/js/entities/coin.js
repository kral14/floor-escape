// QIZIL SİKKƏ SİNİFİ

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 7.5;
        this.value = Math.floor(10 + gameState.floor * 2.2) + getCoinBonusValue();
        this.bobOffset = Math.random() * Math.PI * 2;
        this.isGliding = false;
        this.glideProgress = 0;
    }

    draw() {
        // Süzülmə zamanı arxada buraxılan zərif qızıl xətt izi
        if (this.isGliding && (Math.abs(this.vx) > 0.8 || Math.abs(this.vy) > 0.8)) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }

        const bob = this.isGliding ? 0 : Math.sin(Date.now() * 0.003 + this.bobOffset) * 2;
        const currentY = this.y + bob;

        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = '#ffd700';

        const grad = ctx.createRadialGradient(this.x, currentY, 0, this.x, currentY, this.radius * 2);
        grad.addColorStop(0, this.isGliding ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 215, 0, 0.2)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x - 1, currentY - 1, this.radius - 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();

        ctx.fillStyle = '#b36b00';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.x, currentY + 0.5);

        ctx.restore();
    }
}
