// ============================================================================
// 💓 AUDIO BEATS: QATLARA GÖRƏ DİNAMİK CANAVAR HƏYƏCAN RİTMLƏRİ
// ============================================================================

class AudioBeats {
    constructor(engine) {
        this.engine = engine;
        this.nextMonsterBeatTime = 0;
        this.currentFloorTheme = 0;
    }

    get ctx() { return this.engine.ctx; }
    get dest() { return this.engine.beatGain || (this.ctx ? this.ctx.destination : null); }
    get muted() { return this.engine.muted; }

    stop() {
        this.nextMonsterBeatTime = 0;
    }

    updateMonsterBeat(monsterY, canvasHeight, isPaused, isGameOver, floor = 1) {
        if (this.muted || !this.ctx || this.ctx.state !== 'running' || isPaused || isGameOver) return;
        const now = this.ctx.currentTime;

        // Təhlükə dərəcəsi: canavar yuxarı qalxdıqca 0..1 artır, aşağı düşdükdə dərhal azalır!
        const maxDangerY = 170;
        const minDangerY = canvasHeight || 680;
        const danger = Math.max(0, Math.min(1, (minDangerY - monsterY) / (minDangerY - maxDangerY)));

        // Hər qata məxsus 5 unikal kiber ritm mövzusu (0..4 dövriyyəsi)
        const theme = ((Math.max(1, floor) - 1) % 5);

        // Qat temalarına görə baza ritm intervalı və sürətlənmə
        let baseInterval = 0.90;
        let minInterval = 0.20;
        if (theme === 1) { baseInterval = 0.95; minInterval = 0.22; }      // ⚙️ Industrial Stomp
        else if (theme === 2) { baseInterval = 0.85; minInterval = 0.18; } // ⚡ Synthwave Offbeat
        else if (theme === 3) { baseInterval = 1.05; minInterval = 0.24; } // 🌋 Volcanic Doom
        else if (theme === 4) { baseInterval = 0.78; minInterval = 0.16; } // 🚀 Quantum Overdrive

        const beatInterval = Math.max(minInterval, baseInterval - (danger * (baseInterval - minInterval)));

        // Qat dəyişdikdə yeni qatın ritminə anında keçid
        if (this.currentFloorTheme !== theme) {
            this.currentFloorTheme = theme;
            this.nextMonsterBeatTime = now + 0.1;
        }

        if (!this.nextMonsterBeatTime || now < this.nextMonsterBeatTime - 2.5 || this.nextMonsterBeatTime < now - 0.5) {
            this.nextMonsterBeatTime = now + 0.15;
        }

        if (now >= this.nextMonsterBeatTime) {
            this.playFloorBeat(theme, danger);
            this.nextMonsterBeatTime = now + beatInterval;
        }
    }

    playFloorBeat(theme = 0, danger = 0) {
        if (this.muted || !this.ctx || this.ctx.state !== 'running' || !this.dest) return;
        const now = this.ctx.currentTime;

        // =====================================================================
        // 1. QAT 1, 6, 11... : 💓 CYBER CARDIO (Dərin Kiber Kardio Nəbz)
        // =====================================================================
        if (theme === 0) {
            const baseFreq = 62 + danger * 18;
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            const flt1 = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);

            flt1.type = 'lowpass';
            flt1.frequency.setValueAtTime(140, now);

            gain1.gain.setValueAtTime(0.20 + danger * 0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.002, now + 0.12);

            osc1.connect(flt1);
            flt1.connect(gain1);
            gain1.connect(this.dest);
            osc1.start(now);
            osc1.stop(now + 0.12);

            // 2-ci Kardio Dub
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            const flt2 = this.ctx.createBiquadFilter();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(baseFreq * 0.85, now + 0.07);
            osc2.frequency.exponentialRampToValueAtTime(28, now + 0.17);

            flt2.type = 'lowpass';
            flt2.frequency.setValueAtTime(120, now + 0.07);

            gain2.gain.setValueAtTime(0.14 + danger * 0.09, now + 0.07);
            gain2.gain.exponentialRampToValueAtTime(0.002, now + 0.17);

            osc2.connect(flt2);
            flt2.connect(gain2);
            gain2.connect(this.dest);
            osc2.start(now + 0.07);
            osc2.stop(now + 0.17);
        }

        // =====================================================================
        // 2. QAT 2, 7, 12... : ⚙️ INDUSTRIAL STOMP (Ağır Dərin Zərbə)
        // =====================================================================
        else if (theme === 1) {
            const s = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const f = this.ctx.createBiquadFilter();

            s.type = 'sine';
            s.frequency.setValueAtTime(68 + danger * 20, now);
            s.frequency.exponentialRampToValueAtTime(30, now + 0.14);

            f.type = 'lowpass';
            f.frequency.setValueAtTime(150, now);

            g.gain.setValueAtTime(0.22 + danger * 0.12, now);
            g.gain.exponentialRampToValueAtTime(0.002, now + 0.14);

            s.connect(f);
            f.connect(g);
            g.connect(this.dest);
            s.start(now);
            s.stop(now + 0.14);
        }

        // =====================================================================
        // 3. QAT 3, 8, 13... : ⚡ SYNTHWAVE SUB-PULSE (Dəqiq Təmiz Kik)
        // =====================================================================
        else if (theme === 2) {
            const k = this.ctx.createOscillator();
            const kg = this.ctx.createGain();
            const kf = this.ctx.createBiquadFilter();

            k.type = 'sine';
            k.frequency.setValueAtTime(75 + danger * 20, now);
            k.frequency.exponentialRampToValueAtTime(35, now + 0.10);

            kf.type = 'lowpass';
            kf.frequency.setValueAtTime(140, now);

            kg.gain.setValueAtTime(0.20 + danger * 0.12, now);
            kg.gain.exponentialRampToValueAtTime(0.002, now + 0.10);

            k.connect(kf);
            kf.connect(kg);
            kg.connect(this.dest);
            k.start(now);
            k.stop(now + 0.10);
        }

        // =====================================================================
        // 4. QAT 4, 9, 14... : 🌋 VOLCANIC DOOM (Dərin Seysmik Nəbz)
        // =====================================================================
        else if (theme === 3) {
            const v = this.ctx.createOscillator();
            const vg = this.ctx.createGain();
            const vf = this.ctx.createBiquadFilter();

            v.type = 'sine';
            v.frequency.setValueAtTime(52 + danger * 16, now);
            v.frequency.exponentialRampToValueAtTime(24, now + 0.18);

            vf.type = 'lowpass';
            vf.frequency.setValueAtTime(110, now);

            vg.gain.setValueAtTime(0.24 + danger * 0.12, now);
            vg.gain.exponentialRampToValueAtTime(0.002, now + 0.18);

            v.connect(vf);
            vf.connect(vg);
            vg.connect(this.dest);
            v.start(now);
            v.stop(now + 0.18);
        }

        // =====================================================================
        // 5. QAT 5, 10, 15... : 🚀 QUANTUM PULSE (Təmiz Nəbz Zərbəsi)
        // =====================================================================
        else if (theme === 4) {
            const q = this.ctx.createOscillator();
            const qg = this.ctx.createGain();
            const qf = this.ctx.createBiquadFilter();

            q.type = 'sine';
            q.frequency.setValueAtTime(70 + danger * 25, now);
            q.frequency.exponentialRampToValueAtTime(34, now + 0.11);

            qf.type = 'lowpass';
            qf.frequency.setValueAtTime(150, now);

            qg.gain.setValueAtTime(0.22 + danger * 0.12, now);
            qg.gain.exponentialRampToValueAtTime(0.002, now + 0.11);

            q.connect(qf);
            qf.connect(qg);
            qg.connect(this.dest);
            q.start(now);
            q.stop(now + 0.11);
        }
    }
}

window.AudioBeats = AudioBeats;
