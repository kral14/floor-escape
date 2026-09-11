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

    updateMonsterBeat(monsterY, canvasHeight, isPaused, isGameOver, floor = 1) {
        if (this.muted || !this.ctx || isPaused || isGameOver) return;
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

        if (!this.nextMonsterBeatTime || now < this.nextMonsterBeatTime - 2.5) {
            this.nextMonsterBeatTime = now + 0.15;
        }

        if (now >= this.nextMonsterBeatTime) {
            this.playFloorBeat(theme, danger);
            this.nextMonsterBeatTime = now + beatInterval;
        }
    }

    playFloorBeat(theme = 0, danger = 0) {
        if (this.muted || !this.ctx || !this.dest) return;
        const now = this.ctx.currentTime;

        // =====================================================================
        // 1. QAT 1, 6, 11... : 💓 CYBER CARDIO (Dərin Kiber Kardio Nəbz)
        // =====================================================================
        if (theme === 0) {
            const baseFreq = 72 + danger * 32;
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(36, now + 0.13);
            gain1.gain.setValueAtTime(0.24 + danger * 0.16, now);
            gain1.gain.exponentialRampToValueAtTime(0.003, now + 0.13);
            const flt1 = this.ctx.createBiquadFilter();
            flt1.type = 'lowpass';
            flt1.frequency.setValueAtTime(260 + danger * 70, now);
            osc1.connect(flt1);
            flt1.connect(gain1);
            gain1.connect(this.dest);
            osc1.start(now);
            osc1.stop(now + 0.13);

            // 2-ci Dub
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(baseFreq * 0.82, now + 0.08);
            osc2.frequency.exponentialRampToValueAtTime(30, now + 0.19);
            gain2.gain.setValueAtTime(0.16 + danger * 0.12, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.003, now + 0.19);
            const flt2 = this.ctx.createBiquadFilter();
            flt2.type = 'lowpass';
            flt2.frequency.setValueAtTime(220, now + 0.08);
            osc2.connect(flt2);
            flt2.connect(gain2);
            gain2.connect(this.dest);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.19);
        }

        // =====================================================================
        // 2. QAT 2, 7, 12... : ⚙️ INDUSTRIAL STOMP (Ağır Üçlü Addım Ritmi)
        // =====================================================================
        else if (theme === 1) {
            // Addım 1: Metalik bas toxunuşu
            const s1 = this.ctx.createOscillator();
            const g1 = this.ctx.createGain();
            s1.type = 'triangle';
            s1.frequency.setValueAtTime(95 + danger * 30, now);
            s1.frequency.exponentialRampToValueAtTime(45, now + 0.09);
            g1.gain.setValueAtTime(0.18 + danger * 0.13, now);
            g1.gain.exponentialRampToValueAtTime(0.003, now + 0.09);
            s1.connect(g1);
            g1.connect(this.dest);
            s1.start(now);
            s1.stop(now + 0.09);

            // Addım 2 (DUM): Dərin zəlzələ zərbəsi
            const s2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            s2.type = 'sine';
            s2.frequency.setValueAtTime(60 + danger * 20, now + 0.07);
            s2.frequency.exponentialRampToValueAtTime(28, now + 0.20);
            g2.gain.setValueAtTime(0.24 + danger * 0.17, now + 0.07);
            g2.gain.exponentialRampToValueAtTime(0.002, now + 0.20);
            const f2 = this.ctx.createBiquadFilter();
            f2.type = 'lowpass';
            f2.frequency.setValueAtTime(220, now + 0.07);
            s2.connect(f2);
            f2.connect(g2);
            g2.connect(this.dest);
            s2.start(now + 0.07);
            s2.stop(now + 0.20);
        }

        // =====================================================================
        // 3. QAT 3, 8, 13... : ⚡ SYNTHWAVE OFFBEAT (Sürətli Dinamik Texno-Qaçış)
        // =====================================================================
        else if (theme === 2) {
            // İti kik zərbəsi
            const k = this.ctx.createOscillator();
            const kg = this.ctx.createGain();
            k.type = 'sine';
            k.frequency.setValueAtTime(115 + danger * 40, now);
            k.frequency.exponentialRampToValueAtTime(42, now + 0.11);
            kg.gain.setValueAtTime(0.22 + danger * 0.16, now);
            kg.gain.exponentialRampToValueAtTime(0.003, now + 0.11);
            k.connect(kg);
            kg.connect(this.dest);
            k.start(now);
            k.stop(now + 0.11);

            // Sintezator sinkopasiyası
            const syn = this.ctx.createOscillator();
            const syng = this.ctx.createGain();
            syn.type = 'triangle';
            syn.frequency.setValueAtTime(220 + danger * 80, now + 0.06);
            syn.frequency.exponentialRampToValueAtTime(90, now + 0.13);
            syng.gain.setValueAtTime(0.12 + danger * 0.09, now + 0.06);
            syng.gain.exponentialRampToValueAtTime(0.002, now + 0.13);
            syn.connect(syng);
            syng.connect(this.dest);
            syn.start(now + 0.06);
            syn.stop(now + 0.13);
        }

        // =====================================================================
        // 4. QAT 4, 9, 14... : 🌋 VOLCANIC DOOM (Dərin Vulkan Marşı)
        // =====================================================================
        else if (theme === 3) {
            const v = this.ctx.createOscillator();
            const vg = this.ctx.createGain();
            v.type = 'sine';
            v.frequency.setValueAtTime(54 + danger * 20, now);
            v.frequency.exponentialRampToValueAtTime(24, now + 0.22);
            vg.gain.setValueAtTime(0.28 + danger * 0.18, now);
            vg.gain.exponentialRampToValueAtTime(0.002, now + 0.22);
            const vf = this.ctx.createBiquadFilter();
            vf.type = 'lowpass';
            vf.frequency.setValueAtTime(180 + danger * 60, now);
            v.connect(vf);
            vf.connect(vg);
            vg.connect(this.dest);
            v.start(now);
            v.stop(now + 0.22);

            if (danger > 0.1) {
                const sub = this.ctx.createOscillator();
                const subg = this.ctx.createGain();
                sub.type = 'triangle';
                sub.frequency.setValueAtTime(80 + danger * 40, now + 0.05);
                sub.frequency.exponentialRampToValueAtTime(32, now + 0.19);
                subg.gain.setValueAtTime(0.11 + danger * 0.10, now + 0.05);
                subg.gain.exponentialRampToValueAtTime(0.002, now + 0.19);
                sub.connect(subg);
                subg.connect(this.dest);
                sub.start(now + 0.05);
                sub.stop(now + 0.19);
            }
        }

        // =====================================================================
        // 5. QAT 5, 10, 15... : 🚀 QUANTUM OVERDRIVE (Boss Zirvəsi - Yüksək Təlaş)
        // =====================================================================
        else if (theme === 4) {
            const q1 = this.ctx.createOscillator();
            const qg1 = this.ctx.createGain();
            q1.type = 'triangle';
            q1.frequency.setValueAtTime(140 + danger * 60, now);
            q1.frequency.exponentialRampToValueAtTime(50, now + 0.08);
            qg1.gain.setValueAtTime(0.20 + danger * 0.15, now);
            qg1.gain.exponentialRampToValueAtTime(0.003, now + 0.08);
            q1.connect(qg1);
            qg1.connect(this.dest);
            q1.start(now);
            q1.stop(now + 0.08);

            const q2 = this.ctx.createOscillator();
            const qg2 = this.ctx.createGain();
            q2.type = 'sine';
            q2.frequency.setValueAtTime(85 + danger * 35, now + 0.07);
            q2.frequency.exponentialRampToValueAtTime(35, now + 0.16);
            qg2.gain.setValueAtTime(0.24 + danger * 0.17, now + 0.07);
            qg2.gain.exponentialRampToValueAtTime(0.002, now + 0.16);
            q2.connect(qg2);
            qg2.connect(this.dest);
            q2.start(now + 0.07);
            q2.stop(now + 0.16);
        }

        // Ümumi Gərginlik Qatı (Kino Drone)
        if (danger > 0.22) {
            const drone = this.ctx.createOscillator();
            const droneGain = this.ctx.createGain();
            drone.type = 'triangle';
            drone.frequency.setValueAtTime(120 + danger * 80, now);
            drone.frequency.exponentialRampToValueAtTime(65, now + 0.16);
            droneGain.gain.setValueAtTime(0.08 + danger * 0.09, now);
            droneGain.gain.exponentialRampToValueAtTime(0.002, now + 0.16);
            const droneFlt = this.ctx.createBiquadFilter();
            droneFlt.type = 'lowpass';
            droneFlt.frequency.setValueAtTime(280, now);
            drone.connect(droneFlt);
            droneFlt.connect(droneGain);
            droneGain.connect(this.dest);
            drone.start(now);
            drone.stop(now + 0.16);
        }
    }
}

window.AudioBeats = AudioBeats;
