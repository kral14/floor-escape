// ============================================================================
// 🎛️ AUDIO ENGINE: ƏSAS KANALLAR VƏ SƏS SƏVİYYƏSİ İDARƏETMƏ SİSTEMİ
// ============================================================================

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;

        // Səs Səviyyələri (0.0 - 1.0)
        this.volumes = {
            master: 0.85,
            sfx: 0.80,
            beats: 0.40,
            ambient: 0.65
        };

        // Gain Düyünləri
        this.masterGain = null;
        this.sfxGain = null;
        this.beatGain = null;
        this.ambientGain = null;
        this.unlocked = false;

        this.loadSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('floor_escape_audio_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.master === 'number') this.volumes.master = parsed.master;
                if (typeof parsed.sfx === 'number') this.volumes.sfx = parsed.sfx;
                if (typeof parsed.beats === 'number') this.volumes.beats = parsed.beats;
                if (typeof parsed.ambient === 'number') this.volumes.ambient = parsed.ambient;
                if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
            }
        } catch (e) {
            console.warn('Audio ayarları yüklənmədi:', e);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('floor_escape_audio_config', JSON.stringify({
                ...this.volumes,
                muted: this.muted
            }));
        } catch (e) {
            console.warn('Audio ayarları yadda saxlanılmadı:', e);
        }
    }

    init() {
        if (this.ctx && this.ctx.state === 'running' && this.unlocked) {
            return;
        }

        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            // Əsas çıxış qovşaqları (Bussing Architecture)
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);

            this.beatGain = this.ctx.createGain();
            this.beatGain.connect(this.masterGain);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.connect(this.masterGain);

            this.applyVolumes();

            const removeUnlockListeners = () => {
                window.removeEventListener('pointerdown', unlockAudio);
                window.removeEventListener('mousedown', unlockAudio);
                window.removeEventListener('touchstart', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
                window.removeEventListener('click', unlockAudio);
            };

            // YALNIZ İLK toxunuş və ya klik anında bir dəfə aktivləşmə (təkrar çağırışları bloklayır)
            const unlockAudio = () => {
                if (this.unlocked) {
                    removeUnlockListeners();
                    return;
                }
                if (this.ctx) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume().then(() => {
                            this.unlocked = true;
                            removeUnlockListeners();
                            this.applyVolumes();
                            if (window.audio && window.audio.ambient && typeof window.audio.ambient.onContextResumed === 'function') {
                                window.audio.ambient.onContextResumed();
                            }
                        }).catch(() => {});
                    } else if (this.ctx.state === 'running') {
                        this.unlocked = true;
                        removeUnlockListeners();
                        this.applyVolumes();
                    }
                }
            };
            const opts = { passive: true };
            window.addEventListener('pointerdown', unlockAudio, opts);
            window.addEventListener('mousedown', unlockAudio, opts);
            window.addEventListener('touchstart', unlockAudio, opts);
            window.addEventListener('keydown', unlockAudio, opts);
            window.addEventListener('click', unlockAudio, opts);
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.unlocked = true;
                this.applyVolumes();
                if (window.audio && window.audio.ambient && typeof window.audio.ambient.onContextResumed === 'function') {
                    window.audio.ambient.onContextResumed();
                }
            }).catch(() => {});
        } else if (this.ctx && this.ctx.state === 'running') {
            this.unlocked = true;
        }
    }

    applyVolumes() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;

        const effectiveMaster = this.muted ? 0 : this.volumes.master;
        this.masterGain.gain.setValueAtTime(effectiveMaster, now);
        this.sfxGain.gain.setValueAtTime(this.volumes.sfx, now);
        this.beatGain.gain.setValueAtTime(this.volumes.beats, now);
        this.ambientGain.gain.setValueAtTime(this.volumes.ambient, now);
    }

    setVolume(channel, value) {
        const val = Math.max(0, Math.min(1, parseFloat(value) || 0));
        if (this.volumes[channel] !== undefined) {
            this.volumes[channel] = val;
            this.applyVolumes();
            this.saveSettings();
        }
    }

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        this.applyVolumes();
        this.saveSettings();
        return this.muted;
    }
}

window.audioEngine = new AudioEngine();
