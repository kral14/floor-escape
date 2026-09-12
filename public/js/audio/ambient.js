// ============================================================================
// 🎵 AUDIO SOUNDTRACK: DİNAMİK VƏ KƏSKİN FƏRQLİ QAT SOUNDTRACK-LƏRİ
// Hər qatın tamamilə fərqli janrı, sintezator tembri, ritmi və melodiyası var:
// Qat 1: 🌆 Neon Retrowave (80s Analog Synthwave • 118 BPM)
// Qat 2: 👾 Chiptune Arcade Run (8-Bit NES/Square Wave • 128 BPM)
// Qat 3: 🏭 Acid Cyberpunk Techno (Roland TB-303 Acid Sweep • 136 BPM)
// Qat 4: 🌋 Magma Doom Metal-Synth (Darksynth Fuzz & Danger • 142 BPM)
// Qat 5+: 🚀 Hyperion Quantum Trance (Uplifting Euro-Trance • 150 BPM)
// ============================================================================

class AudioAmbient {
    constructor(engine) {
        this.engine = engine;
        this.isPlaying = false;
        this.isSwitching = false;
        this.currentFloor = 1;
        this.schedulerTimer = null;
        this.switchTimer = null;
        this.currentStep = 0;
        this.nextNoteTime = 0;

        // Bütün cari notları anında kəsmək üçün sub-gain
        this.trackGain = null;

        this.isGameOverMode = false;
        this.isPauseMode = false;

        // 💀 GAME OVER XÜSUSİ ARXA FON SOUNDTRACK (Melancholic Cyber Requiem • 82 BPM)
        this.gameOverTrack = {
            id: 'gameover',
            name: 'Cyber Requiem',
            bpm: 82,
            bassWave: 'triangle',
            leadWave: 'sine',
            filterFreq: 520,
            filterQ: 1.5,
            bassNotes: [
                73.42, 0, 73.42, 0,   58.27, 0, 58.27, 0, // D2, Bb1
                87.31, 0, 87.31, 0,   55.00, 0, 55.00, 0  // F2, A1
            ],
            leadNotes: [
                587.33, 0, 523.25, 440.00,  392.00, 440.00, 349.23, 0,
                466.16, 0, 440.00, 392.00,  349.23, 329.63, 293.66, 0,
                349.23, 392.00, 440.00, 523.25,  587.33, 0, 523.25, 440.00,
                392.00, 349.23, 329.63, 0,       293.66, 0, 0, 0
            ],
            padFreqs: [
                [220.00, 293.66], // Dm (A3, D4)
                [185.00, 293.66], // Bb (F#3/Bb, D4)
                [174.61, 261.63], // F (F3, C4)
                [220.00, 329.63]  // Am (A3, E4)
            ]
        };

        // ⏸️ OYUN DAYANDIQDA XÜSUSİ ARXA FON SOUNDTRACK (Dreamy Stasis Chillout • 74 BPM)
        this.pauseTrack = {
            id: 'pause',
            name: 'Stasis Chillout',
            bpm: 74,
            bassWave: 'sine',
            leadWave: 'sine',
            filterFreq: 450,
            filterQ: 1.2,
            bassNotes: [
                87.31, 0, 87.31, 0,   65.41, 0, 65.41, 0, // F2, C2
                73.42, 0, 73.42, 0,   58.27, 0, 58.27, 0  // D2, Bb1
            ],
            leadNotes: [
                440.00, 0, 523.25, 0,  659.25, 587.33, 523.25, 0,
                392.00, 0, 440.00, 0,  523.25, 440.00, 392.00, 349.23,
                349.23, 0, 440.00, 523.25,  587.33, 0, 523.25, 0,
                440.00, 392.00, 349.23, 0,  329.63, 0, 0, 0
            ],
            padFreqs: [
                [349.23, 523.25], // Fmaj (F4, C5)
                [261.63, 392.00], // Cmaj (C4, G4)
                [293.66, 440.00], // Dm (D4, A4)
                [233.08, 349.23]  // Bb (Bb3, F4)
            ]
        };

        // 🎹 5 TAMAMİLƏ FƏRQLİ JANRDA SOUNDTRACK
        this.tracks = [
            // ================================================================
            // 🌆 QAT 1: "NEON RETROWAVE" (80s Analog Synthwave • 118 BPM)
            // Karakter: Həzin, melodik, zərif analog pad və retro arpeggio
            // ================================================================
            {
                id: 'synthwave',
                name: 'Neon Retrowave',
                bpm: 118,
                bassWave: 'triangle',
                leadWave: 'sine',
                filterFreq: 850,
                filterQ: 2,
                bassNotes: [
                    110.00, 0, 110.00, 0,  87.31, 0,  87.31, 0, // A2, F2
                    65.41, 0,  65.41, 0,  98.00, 0,  98.00, 0  // C2, G2
                ],
                leadNotes: [
                    440.00, 523.25, 493.88, 392.00, 440.00, 329.63, 392.00, 440.00,
                    523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 392.00, 329.63,
                    440.00, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440.00,
                    493.88, 523.25, 587.33, 493.88, 440.00, 392.00, 440.00, 0
                ],
                padFreqs: [
                    [220.00, 329.63], // Am
                    [174.61, 261.63], // F
                    [261.63, 392.00], // C
                    [196.00, 293.66]  // G
                ]
            },

            // ================================================================
            // 👾 QAT 2: "CHIPTUNE ARCADE RUN" (8-Bit NES Square Wave • 128 BPM)
            // Karakter: Əsl retro arkada chiptune! Kəskin kvadrat dalğalar, şən və sürətli!
            // ================================================================
            {
                id: 'chiptune',
                name: 'Chiptune Arcade',
                bpm: 128,
                bassWave: 'square',
                leadWave: 'square',
                filterFreq: 2400,
                filterQ: 1,
                bassNotes: [
                    146.83, 146.83, 0, 146.83,  116.54, 116.54, 0, 116.54, // D3, Bb2
                    130.81, 130.81, 0, 130.81,  146.83, 174.61, 196.00, 220.00 // C3, D3, F3, G3, A3
                ],
                leadNotes: [
                    587.33, 0, 587.33, 698.46,  880.00, 0, 698.46, 587.33,
                    523.25, 0, 523.25, 659.25,  783.99, 0, 659.25, 523.25,
                    466.16, 0, 466.16, 587.33,  698.46, 0, 587.33, 466.16,
                    523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33
                ],
                padFreqs: null // Chiptune-da pad olmur, saf 8-bit ritm
            },

            // ================================================================
            // 🏭 QAT 3: "ACID CYBER TECHNO" (Roland TB-303 Acid Sweep • 136 BPM)
            // Karakter: Qaranlıq, ağır, aqressiv rezonanslı acid synthwave və kiber bas
            // ================================================================
            {
                id: 'acid',
                name: 'Acid Cyber Techno',
                bpm: 136,
                bassWave: 'sawtooth',
                leadWave: 'sawtooth',
                filterFreq: 480,
                filterQ: 8.5, // 🎛️ Güclü TB-303 rezonansı!
                bassNotes: [
                    82.41, 82.41, 164.81, 82.41,  98.00, 82.41, 196.00, 82.41, // E2, E3, G2, G3
                    73.42, 73.42, 146.83, 73.42,  82.41, 82.41, 110.00, 98.00  // D2, D3, E2, A2, G2
                ],
                leadNotes: [
                    329.63, 0, 493.88, 0, 659.25, 0, 493.88, 329.63,
                    0, 392.00, 0, 587.33, 0, 493.88, 392.00, 0,
                    659.25, 0, 587.33, 0, 493.88, 0, 392.00, 329.63,
                    392.00, 440.00, 493.88, 587.33, 659.25, 0, 0, 0
                ],
                padFreqs: [
                    [164.81, 246.94], // Em
                    [146.83, 220.00]  // D
                ]
            },

            // ================================================================
            // 🌋 QAT 4: "MAGMA DOOM SLAYER" (Darksynth Heavy Fuzz • 142 BPM)
            // Karakter: Təhlükəli, vulkanik gərginlik, ağır bas və kiber metal vıyıltısı
            // ================================================================
            {
                id: 'magma',
                name: 'Magma Doom Slayer',
                bpm: 142,
                bassWave: 'sawtooth',
                leadWave: 'triangle',
                filterFreq: 650,
                filterQ: 4,
                bassNotes: [
                    87.31, 87.31, 87.31, 103.83, 69.30, 69.30, 69.30, 77.78, // F2, Ab2, Db2, Eb2
                    87.31, 87.31, 87.31, 103.83, 77.78, 77.78, 69.30, 65.41  // F2, Ab2, Eb2, Db2, C2
                ],
                leadNotes: [
                    349.23, 0, 415.30, 523.25, 622.25, 0, 523.25, 415.30,
                    466.16, 0, 523.25, 554.37, 523.25, 466.16, 415.30, 392.00,
                    698.46, 0, 622.25, 554.37, 523.25, 0, 466.16, 415.30,
                    554.37, 523.25, 466.16, 392.00, 349.23, 0, 0, 0
                ],
                padFreqs: [
                    [174.61, 261.63], // Fm
                    [138.59, 207.65]  // Db
                ]
            },

            // ================================================================
            // 🚀 QAT 5+: "HYPERION QUANTUM TRANCE" (Euro Uplifting Trance • 150 BPM)
            // Karakter: Kosmik sürət, parıldayan arpejiolar, maksimal temp və ekstaz!
            // ================================================================
            {
                id: 'trance',
                name: 'Hyperion Trance',
                bpm: 150,
                bassWave: 'triangle',
                leadWave: 'sine',
                filterFreq: 1800,
                filterQ: 2,
                bassNotes: [
                    98.00, 98.00, 98.00, 116.54, 77.78, 77.78, 77.78, 87.31, // G2, Bb2, Eb2, F2
                    98.00, 98.00, 98.00, 116.54, 87.31, 87.31, 110.00, 73.42  // G2, Bb2, F2, A2, D2
                ],
                leadNotes: [
                    783.99, 587.33, 466.16, 587.33, 783.99, 587.33, 466.16, 587.33,
                    698.46, 587.33, 466.16, 587.33, 698.46, 587.33, 466.16, 587.33,
                    932.33, 783.99, 587.33, 783.99, 932.33, 783.99, 587.33, 783.99,
                    880.00, 698.46, 587.33, 698.46, 880.00, 698.46, 587.33, 392.00
                ],
                padFreqs: [
                    [196.00, 293.66], // Gm
                    [155.56, 233.08]  // Eb
                ]
            }
        ];
    }

    get ctx() { return this.engine.ctx; }
    get masterDest() { return this.engine.ambientGain || (this.ctx ? this.ctx.destination : null); }
    get muted() { return this.engine.muted; }

    ensureTrackGain() {
        if (!this.ctx || !this.masterDest) return null;
        if (!this.trackGain) {
            this.trackGain = this.ctx.createGain();
            this.trackGain.connect(this.masterDest);
        }
        return this.trackGain;
    }

    onContextResumed() {
        if (!this.ctx || this.muted || this.engine.volumes.ambient === 0) return;

        // Əgər musiqi artıq normal çalırsa və zaman gələcəkdədirsə, ritmi sıfırlama
        if (this.isPlaying && this.nextNoteTime >= this.ctx.currentTime - 0.05) {
            return;
        }

        const tg = this.ensureTrackGain();
        if (tg) {
            try {
                tg.gain.cancelScheduledValues(this.ctx.currentTime);
                tg.gain.setValueAtTime(1, this.ctx.currentTime);
            } catch (e) {}
        }

        // Cari zamana dərhal sinxronlaşırıq (keçmişdə qalan vaxt sıfırlanır)
        this.nextNoteTime = this.ctx.currentTime + 0.04;

        if (!this.isPlaying && !this.isSwitching) {
            this.start();
        }
    }

    start() {
        if (this.isPlaying || !this.ctx || this.muted || this.isSwitching) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.04;

        const tg = this.ensureTrackGain();
        if (tg) {
            try {
                tg.gain.cancelScheduledValues(this.ctx.currentTime);
                tg.gain.setValueAtTime(1, this.ctx.currentTime);
            } catch (e) {}
        }

        if (this.schedulerTimer) clearInterval(this.schedulerTimer);
        this.schedulerTimer = setInterval(() => this.schedule(), 25);
    }

    stop() {
        if (this.switchTimer) {
            clearTimeout(this.switchTimer);
            this.switchTimer = null;
        }
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        // Bütün cari çalan notları dərhal susdururuq
        if (this.trackGain && this.ctx) {
            try {
                this.trackGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.trackGain.gain.setValueAtTime(0, this.ctx.currentTime);
            } catch (e) {}
        }
        this.currentStep = 0;
    }

    // 💀 GAME OVER ARXA FON SOUNDTRACK-İNİ BAŞLAT
    startGameOverTheme() {
        this.isGameOverMode = true;
        this.stop();
        if (!this.ctx || this.muted || this.engine.volumes.ambient === 0) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        const tg = this.ensureTrackGain();
        if (tg) {
            try {
                tg.gain.cancelScheduledValues(this.ctx.currentTime);
                tg.gain.setValueAtTime(1, this.ctx.currentTime);
            } catch (e) {}
        }

        if (this.schedulerTimer) clearInterval(this.schedulerTimer);
        this.schedulerTimer = setInterval(() => this.schedule(), 25);
    }

    // 🛑 GAME OVER SOUNDTRACK-İNİ DAYANDIR
    stopGameOverTheme() {
        if (!this.isGameOverMode) return;
        this.isGameOverMode = false;
        this.stop();
    }

    // ⏸️ OYUN DAYANDIQDA (PAUSE) FON MUSİQİSİNİ BAŞLAT
    startPauseTheme() {
        if (this.isGameOverMode) return;
        this.isPauseMode = true;
        this.stop();
        if (!this.ctx || this.muted || this.engine.volumes.ambient === 0) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        const tg = this.ensureTrackGain();
        if (tg) {
            try {
                tg.gain.cancelScheduledValues(this.ctx.currentTime);
                tg.gain.setValueAtTime(1, this.ctx.currentTime);
            } catch (e) {}
        }

        if (this.schedulerTimer) clearInterval(this.schedulerTimer);
        this.schedulerTimer = setInterval(() => this.schedule(), 25);
    }

    // ▶️ OYUN DAVAM ETDİKDƏ (RESUME) PAUSE FON MUSİQİSİNİ DAYANDIR
    stopPauseTheme() {
        if (!this.isPauseMode) return;
        this.isPauseMode = false;
        this.stop();
    }

    // 🔄 HƏR QATDA MUSİQİ TAM BAŞDAN (STEP 0) VƏ FƏRQLİ MÖVZU İLƏ BAŞLAYIR
    setFloor(floor, restart = true) {
        if (this.isGameOverMode) {
            this.isGameOverMode = false;
        }
        if (this.isPauseMode) {
            this.isPauseMode = false;
        }
        const targetFloor = Math.max(1, parseInt(floor) || 1);
        const floorChanged = (this.currentFloor !== targetFloor);
        this.currentFloor = targetFloor;

        if (floorChanged || restart) {
            if (this.switchTimer) {
                clearTimeout(this.switchTimer);
                this.switchTimer = null;
            }
            // Əvvəlki musiqini dərhal kəsirik
            this.stop();
            this.isSwitching = true;
            this.currentStep = 0;

            // 120ms təmiz pauza: istifadəçi musiqinin kəsilib YENİDƏN başladığını dəqiq hiss edir
            this.switchTimer = setTimeout(() => {
                this.switchTimer = null;
                this.isSwitching = false;
                if (!this.muted && this.engine.volumes.ambient > 0) {
                    this.start();
                }
            }, 120);
        }
    }

    schedule() {
        if (!this.isPlaying || !this.ctx || this.muted || this.isSwitching) return;
        
        // 🛡️ 1. AudioContext suspended vəziyyətindədirsə, not cədvəli qurulmur və heç nə itmir
        if (this.ctx.state !== 'running') return;

        // 🛡️ 2. Desinxronizasiya və ya tab ləngiməsi qorunması (səhifə yenilənməsi / fon rejimi):
        if (this.nextNoteTime < this.ctx.currentTime - 0.10) {
            this.nextNoteTime = this.ctx.currentTime + 0.04;
        }

        const track = this.isGameOverMode
            ? this.gameOverTrack
            : (this.isPauseMode
                ? this.pauseTrack
                : this.tracks[((Math.max(1, this.currentFloor) - 1) % this.tracks.length)]);
        const stepTime = (60 / track.bpm) / 4; // 16-lıq not intervalı (saniyə ilə)

        // 🛡️ 3. Bir kadrda maksimum 4 addım cədvələ salınır (runaway loop qorunması)
        let scheduledCount = 0;
        while (this.nextNoteTime < this.ctx.currentTime + 0.10 && scheduledCount < 4) {
            this.playStep(track, this.currentStep, this.nextNoteTime, stepTime);
            this.nextNoteTime += stepTime;
            this.currentStep = (this.currentStep + 1) % 32;
            scheduledCount++;
        }

        // 🛡️ 4. Növbəti not heç vaxt keçmişdə qala bilməz
        if (this.nextNoteTime < this.ctx.currentTime) {
            this.nextNoteTime = this.ctx.currentTime + 0.04;
        }
    }

    playStep(track, step, rawTime, stepTime) {
        const dest = this.ensureTrackGain();
        if (!dest || !this.ctx || this.ctx.state !== 'running') return;

        // 🛡️ Keçmişdə qalan vaxtların qarşısını almaq üçün cari zaman təhlükəsizliyi
        const time = Math.max(rawTime, this.ctx.currentTime + 0.005);

        // ====================================================================
        // 1. 🎛️ QATA MƏXSUS KİBER BAS
        // ====================================================================
        if (step % 2 === 0) {
            const bassIdx = Math.floor(step / 2) % track.bassNotes.length;
            const bassFreq = track.bassNotes[bassIdx];

            if (bassFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                const bFilter = this.ctx.createBiquadFilter();

                bOsc.type = track.bassWave || 'sawtooth';
                bOsc.frequency.setValueAtTime(bassFreq, time);

                bFilter.type = 'lowpass';
                bFilter.frequency.setValueAtTime(track.filterFreq, time);
                bFilter.Q.setValueAtTime(track.filterQ || 2, time);

                // Filter envelopu
                if (track.id === 'gameover' || track.id === 'pause') {
                    bFilter.frequency.setValueAtTime(track.id === 'pause' ? 280 : 350, time);
                    bFilter.frequency.exponentialRampToValueAtTime(track.id === 'pause' ? 100 : 120, time + stepTime * 1.5);
                } else if (track.id === 'acid') {
                    // Acid sweep
                    bFilter.frequency.exponentialRampToValueAtTime(140, time + stepTime * 1.5);
                } else {
                    bFilter.frequency.exponentialRampToValueAtTime(track.filterFreq * 0.4, time + stepTime * 1.5);
                }

                const bVol = (track.id === 'gameover' || track.id === 'pause') ? 0.20 : ((track.id === 'chiptune') ? 0.14 : 0.22);
                bGain.gain.setValueAtTime(bVol, time);
                bGain.gain.exponentialRampToValueAtTime(0.002, time + stepTime * 1.6);

                bOsc.connect(bFilter);
                bFilter.connect(bGain);
                bGain.connect(dest);

                bOsc.start(time);
                bOsc.stop(time + stepTime * 1.6);
            }
        }

        // ====================================================================
        // 2. ✨ QATA MƏXSUS PARLAQ MELODİYA (Lead Synthesizer)
        // ====================================================================
        const leadFreq = track.leadNotes[step % track.leadNotes.length];
        if (leadFreq > 0) {
            const mOsc = this.ctx.createOscillator();
            const mGain = this.ctx.createGain();
            const mFilter = this.ctx.createBiquadFilter();

            mOsc.type = track.leadWave || 'triangle';
            mOsc.frequency.setValueAtTime(leadFreq, time);

            mFilter.type = (track.id === 'chiptune') ? 'allpass' : 'lowpass';
            if (track.id === 'gameover' || track.id === 'pause') {
                mFilter.frequency.setValueAtTime(track.id === 'pause' ? 750 : 900, time);
                mFilter.frequency.exponentialRampToValueAtTime(track.id === 'pause' ? 220 : 280, time + stepTime * 1.5);
            } else if (track.id !== 'chiptune') {
                mFilter.frequency.setValueAtTime(1800, time);
                mFilter.frequency.exponentialRampToValueAtTime(500, time + stepTime * 1.2);
            }

            const isBeat = (step % 4 === 0);
            const mVol = (track.id === 'gameover' || track.id === 'pause') ? (isBeat ? 0.12 : 0.08) : ((track.id === 'chiptune') ? (isBeat ? 0.12 : 0.08) : (isBeat ? 0.16 : 0.10));

            mGain.gain.setValueAtTime(mVol, time);
            mGain.gain.exponentialRampToValueAtTime(0.002, time + stepTime * 1.2);

            mOsc.connect(mFilter);
            mFilter.connect(mGain);
            mGain.connect(dest);

            mOsc.start(time);
            mOsc.stop(time + stepTime * 1.2);
        }

        // ====================================================================
        // 3. 🌌 AMBİENT PAD (Yalnız müvafiq qatlarda)
        // ====================================================================
        if (track.padFreqs && step % 8 === 0) {
            const padIdx = Math.floor(step / 8) % track.padFreqs.length;
            const chord = track.padFreqs[padIdx];

            chord.forEach((freq) => {
                const pOsc = this.ctx.createOscillator();
                const pGain = this.ctx.createGain();
                const pFilter = this.ctx.createBiquadFilter();

                pOsc.type = 'sine';
                pOsc.frequency.setValueAtTime(freq, time);

                pFilter.type = 'lowpass';
                pFilter.frequency.setValueAtTime(550, time);

                const dur = stepTime * 7.5;
                pGain.gain.setValueAtTime(0.001, time);
                pGain.gain.linearRampToValueAtTime(0.045, time + stepTime * 1.5);
                pGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

                pOsc.connect(pFilter);
                pFilter.connect(pGain);
                pGain.connect(dest);

                pOsc.start(time);
                pOsc.stop(time + dur);
            });
        }

        // ====================================================================
        // 4. 🥁 QATA GÖRƏ PERKUSSİYA / HI-HAT
        // ====================================================================
        if (track.id === 'gameover' || track.id === 'pause') {
            // Game Over və Pause soundtrack-lərində kəskin zərb alətləri olmur - axıcı atmosfer qorunur
            return;
        }

        if (step % 2 === 1) {
            const hOsc = this.ctx.createOscillator();
            const hGain = this.ctx.createGain();

            // Chiptune-da qısa 8-bit klik, Acid-də kəskin hi-hat, Synthwave-də yumşaq
            hOsc.type = (track.id === 'chiptune') ? 'square' : 'triangle';
            hOsc.frequency.setValueAtTime((track.id === 'chiptune') ? 600 : 1200, time);
            hOsc.frequency.exponentialRampToValueAtTime(100, time + 0.03);

            const hVol = (track.id === 'chiptune') ? 0.035 : 0.045;
            hGain.gain.setValueAtTime(hVol, time);
            hGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

            hOsc.connect(hGain);
            hGain.connect(dest);
            hOsc.start(time);
            hOsc.stop(time + 0.03);
        } else if (step % 8 === 4 && track.id !== 'chiptune') {
            // Snare vurğusu
            const sOsc = this.ctx.createOscillator();
            const sGain = this.ctx.createGain();
            sOsc.type = 'sine';
            sOsc.frequency.setValueAtTime(240, time);
            sOsc.frequency.exponentialRampToValueAtTime(70, time + 0.05);

            sGain.gain.setValueAtTime(0.05, time);
            sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            sOsc.connect(sGain);
            sGain.connect(dest);
            sOsc.start(time);
            sOsc.stop(time + 0.05);
        }
    }
}

window.AudioAmbient = AudioAmbient;
