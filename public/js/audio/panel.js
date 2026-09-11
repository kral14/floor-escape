// ============================================================================
// 🎚️ AUDIO PANEL: İNTERAKTİV SƏS SƏVİYYƏSİ TƏNZİMLƏMƏ MODALI
// ============================================================================

class AudioPanel {
    constructor(engine, ambient, beats, sfx) {
        this.engine = engine;
        this.ambient = ambient;
        this.beats = beats;
        this.sfx = sfx;
        this.isOpen = false;
        this.modalEl = null;

        this.initDOM();
    }

    initDOM() {
        // Mövcud köhnə panel varsa təmizləyirik
        const old = document.getElementById('audio-settings-modal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'audio-settings-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm hidden opacity-0 transition-opacity duration-200';
        modal.innerHTML = `
            <div class="relative w-full max-w-sm mx-4 glass-card bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl shadow-cyan-950/50 text-slate-100 font-sans select-none animate-scale-up">
                
                <!-- Başlıq -->
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/30">
                            <i class="fa-solid fa-sliders text-sm"></i>
                        </div>
                        <div>
                            <h3 class="font-orbitron font-bold text-sm tracking-wider text-cyan-300">SƏS TƏNZİMLƏMƏLƏRİ</h3>
                            <p class="text-[10px] text-slate-400">Oyundaxili akustika və ritm balansı</p>
                        </div>
                    </div>
                    <button tabindex="-1" id="btn-close-audio-panel" class="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Slayderlər -->
                <div class="space-y-4">
                    
                    <!-- 1. ÜMUMİ SƏS (MASTER) -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-semibold text-slate-200">
                                <i class="fa-solid fa-volume-high text-cyan-400 w-4 text-center"></i> Ümumi Səs
                            </span>
                            <span id="txt-vol-master" class="font-orbitron text-[11px] text-cyan-400 font-bold">85%</span>
                        </div>
                        <input type="range" id="slider-vol-master" min="0" max="100" value="85"
                            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition">
                    </div>

                    <!-- 2. CANAVAR HƏYƏCAN RİTMİ (BEATS) -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-semibold text-rose-300">
                                <i class="fa-solid fa-heart-pulse text-rose-400 w-4 text-center animate-pulse"></i> Canavar Həyəcan Ritmi
                            </span>
                            <span id="txt-vol-beats" class="font-orbitron text-[11px] text-rose-400 font-bold">90%</span>
                        </div>
                        <input type="range" id="slider-vol-beats" min="0" max="100" value="90"
                            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition">
                    </div>

                    <!-- 3. OYUN EFFEKTLƏRİ (SFX) -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-semibold text-amber-300">
                                <i class="fa-solid fa-bolt text-amber-400 w-4 text-center"></i> Oyun Effektləri (SFX)
                            </span>
                            <span id="txt-vol-sfx" class="font-orbitron text-[11px] text-amber-400 font-bold">85%</span>
                        </div>
                        <input type="range" id="slider-vol-sfx" min="0" max="100" value="85"
                            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition">
                    </div>

                    <!-- 4. ARXA FON MUSİQİSİ (AMBIENT) -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-semibold text-purple-300">
                                <i class="fa-solid fa-music text-purple-400 w-4 text-center"></i> Arxa Fon Musiqisi
                            </span>
                            <span id="txt-vol-ambient" class="font-orbitron text-[11px] text-purple-400 font-bold">50%</span>
                        </div>
                        <input type="range" id="slider-vol-ambient" min="0" max="100" value="50"
                            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300 transition">
                    </div>

                </div>

                <!-- Aşağı Düymələr -->
                <div class="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800/80">
                    <button tabindex="-1" id="btn-modal-mute-toggle" class="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-orbitron text-xs font-semibold flex items-center justify-center gap-2 transition border border-slate-700">
                        <i id="icon-modal-mute" class="fa-solid fa-volume-high text-xs"></i>
                        <span id="txt-modal-mute">SƏSİ SÖNDÜR</span>
                    </button>
                    <button tabindex="-1" id="btn-modal-done" class="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron text-xs font-bold shadow-md shadow-cyan-500/20 transition">
                        TAMAM
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);
        this.modalEl = modal;

        this.bindEvents();
        this.syncUI();
    }

    bindEvents() {
        const modal = this.modalEl;
        if (!modal) return;

        // Bağlama düymələri
        const btnClose = modal.querySelector('#btn-close-audio-panel');
        const btnDone = modal.querySelector('#btn-modal-done');
        if (btnClose) btnClose.onclick = () => this.close();
        if (btnDone) btnDone.onclick = () => this.close();

        // Kənara klikləyəndə bağlama
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        // Slayder dinləyiciləri
        const sMaster = modal.querySelector('#slider-vol-master');
        const sBeats = modal.querySelector('#slider-vol-beats');
        const sSFX = modal.querySelector('#slider-vol-sfx');
        const sAmbient = modal.querySelector('#slider-vol-ambient');

        if (sMaster) {
            sMaster.oninput = (e) => {
                const val = e.target.value / 100;
                this.engine.setVolume('master', val);
                modal.querySelector('#txt-vol-master').innerText = `${Math.round(val * 100)}%`;
                this.updateHeaderButtonIcon();
            };
        }

        if (sBeats) {
            sBeats.oninput = (e) => {
                const val = e.target.value / 100;
                this.engine.setVolume('beats', val);
                modal.querySelector('#txt-vol-beats').innerText = `${Math.round(val * 100)}%`;
            };
        }

        if (sSFX) {
            sSFX.oninput = (e) => {
                const val = e.target.value / 100;
                this.engine.setVolume('sfx', val);
                modal.querySelector('#txt-vol-sfx').innerText = `${Math.round(val * 100)}%`;
            };
        }

        if (sAmbient) {
            sAmbient.oninput = (e) => {
                const val = e.target.value / 100;
                this.engine.setVolume('ambient', val);
                modal.querySelector('#txt-vol-ambient').innerText = `${Math.round(val * 100)}%`;
                if (val > 0 && this.ambient && !this.ambient.isPlaying && !this.engine.muted) {
                    this.ambient.start();
                } else if (val === 0 && this.ambient) {
                    this.ambient.stop();
                }
            };
        }

        // Mute Toggle düyməsi
        const btnMute = modal.querySelector('#btn-modal-mute-toggle');
        if (btnMute) {
            btnMute.onclick = () => {
                this.engine.toggleMute();
                this.syncUI();
                this.updateHeaderButtonIcon();
            };
        }
    }

    syncUI() {
        if (!this.modalEl) return;
        const v = this.engine.volumes;

        const sMaster = this.modalEl.querySelector('#slider-vol-master');
        const sBeats = this.modalEl.querySelector('#slider-vol-beats');
        const sSFX = this.modalEl.querySelector('#slider-vol-sfx');
        const sAmbient = this.modalEl.querySelector('#slider-vol-ambient');

        if (sMaster) {
            sMaster.value = Math.round(v.master * 100);
            this.modalEl.querySelector('#txt-vol-master').innerText = `${sMaster.value}%`;
        }
        if (sBeats) {
            sBeats.value = Math.round(v.beats * 100);
            this.modalEl.querySelector('#txt-vol-beats').innerText = `${sBeats.value}%`;
        }
        if (sSFX) {
            sSFX.value = Math.round(v.sfx * 100);
            this.modalEl.querySelector('#txt-vol-sfx').innerText = `${sSFX.value}%`;
        }
        if (sAmbient) {
            sAmbient.value = Math.round(v.ambient * 100);
            this.modalEl.querySelector('#txt-vol-ambient').innerText = `${sAmbient.value}%`;
        }

        const iconMute = this.modalEl.querySelector('#icon-modal-mute');
        const txtMute = this.modalEl.querySelector('#txt-modal-mute');
        if (this.engine.muted) {
            if (iconMute) iconMute.className = 'fa-solid fa-volume-xmark text-xs text-rose-400';
            if (txtMute) txtMute.innerText = 'SƏSİ AÇ';
        } else {
            if (iconMute) iconMute.className = 'fa-solid fa-volume-high text-xs text-cyan-400';
            if (txtMute) txtMute.innerText = 'SƏSİ SÖNDÜR';
        }
    }

    updateHeaderButtonIcon() {
        const btn = document.getElementById('btn-sound');
        if (btn) {
            if (this.engine.muted || this.engine.volumes.master === 0) {
                btn.innerHTML = `<i class="fa-solid fa-volume-xmark text-sm text-rose-400"></i>`;
            } else if (this.engine.volumes.master < 0.4) {
                btn.innerHTML = `<i class="fa-solid fa-volume-low text-sm text-cyan-400"></i>`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-volume-high text-sm text-cyan-400"></i>`;
            }
        }
    }

    open() {
        this.engine.init();
        if (this.ambient && !this.ambient.isPlaying && !this.engine.muted && this.engine.volumes.ambient > 0) {
            this.ambient.start();
        }

        this.syncUI();
        if (!this.modalEl) return;

        this.modalEl.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.modalEl.classList.remove('opacity-0');
        });
        this.isOpen = true;
    }

    close() {
        if (!this.modalEl) return;
        this.modalEl.classList.add('opacity-0');
        setTimeout(() => {
            this.modalEl.classList.add('hidden');
        }, 200);
        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
}

window.AudioPanel = AudioPanel;
