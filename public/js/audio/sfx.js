// ============================================================================
// 🎮 AUDIO SFX: OYUN EFFEKTLƏRİ VƏ SƏS REAKSİYALARI
// ============================================================================

class AudioSFX {
    constructor(engine) {
        this.engine = engine;
    }

    get ctx() { return this.engine.ctx; }
    get dest() { return this.engine.sfxGain || (this.ctx ? this.ctx.destination : null); }
    get muted() { return this.engine.muted; }

    playCoin() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playShoot() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playTurretShot() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playDash() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 🎯 ZÖVQLÜ VƏ ESTETİK KİBER HIT-MARKER (TOXUNUŞ TƏSDİQİ)
    playImpact() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playDoorOpen() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.09);
            gain.gain.setValueAtTime(0.18, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.09 + 0.3);
            osc.connect(gain);
            gain.connect(this.dest);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.3);
        });
    }

    playGameOver() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.8);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.8);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.8);
    }

    playKeySet() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playDiamond() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playChest() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.18, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.07 + 0.35);
            osc.connect(gain);
            gain.connect(this.dest);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.35);
        });
    }

    playBarricade() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playIce() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    playShock() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.08);
        osc.frequency.linearRampToValueAtTime(520, now + 0.15);
        osc.frequency.linearRampToValueAtTime(140, now + 0.24);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.24);
    }

    // 💣 YUMŞAQ KİBER-MİNA DETONASİYASI (QULAĞI YORMAYAN)
    playExplosion() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.15);

        // Mikro detonasiya pıçıltısı
        const spark = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        spark.type = 'sine';
        spark.frequency.setValueAtTime(360, now);
        spark.frequency.exponentialRampToValueAtTime(140, now + 0.06);
        sparkGain.gain.setValueAtTime(0.06, now);
        sparkGain.gain.exponentialRampToValueAtTime(0.002, now + 0.06);
        spark.connect(sparkGain);
        sparkGain.connect(this.dest);
        spark.start(now);
        spark.stop(now + 0.06);
    }

    playPlasma() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.38);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.38);
    }

    playPowerUp() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.16, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.003, now + idx * 0.06 + 0.22);
            osc.connect(gain);
            gain.connect(this.dest);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.22);
        });
    }

    playRoar() {
        this.playCyberWarning();
    }

    playCyberWarning() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Zərif Məxməri Kosmik Sinus Bası (Warm Sub-Pulse)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(146.83, now); // D3
        subOsc.frequency.exponentialRampToValueAtTime(110.0, now + 1.1); // A2
        subGain.gain.setValueAtTime(0.20, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        subOsc.connect(subGain);
        subGain.connect(this.dest);

        // 2. Təmiz Kristal Kiber Akkord (Ethereal Crystal Harmonics)
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(587.33, now); // D5
        chimeOsc.frequency.exponentialRampToValueAtTime(880.0, now + 0.35); // A5
        chimeGain.gain.setValueAtTime(0.12, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.dest);

        subOsc.start(now);
        chimeOsc.start(now);
        subOsc.stop(now + 1.1);
        chimeOsc.stop(now + 0.85);
    }

    playCombo(count) {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = 523.25 * Math.min(2.5, 1 + (count || 1) * 0.15);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playShieldBlock() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playShieldBreak() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(600, now);
        osc.connect(flt);
        flt.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playMeteorWarning() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playMeteorExplode() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

window.AudioSFX = AudioSFX;
