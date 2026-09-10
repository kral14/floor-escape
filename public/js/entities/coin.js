// QIZIL SİKKƏ SİNİFİ

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 7.5;
        this.value = Math.floor(10 + gameState.floor * 2.2) + getCoinBonusValue();
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    draw() {
        const bob = Math.sin(Date.now() * 0.003 + this.bobOffset) * 2;
        const currentY = this.y + bob;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';

        const grad = ctx.createRadialGradient(this.x, currentY, 0, this.x, currentY, this.radius * 2);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
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
