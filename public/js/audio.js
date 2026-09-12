// ============================================================================
// 🔊 MƏRKƏZİ AUDIO KÖRPÜSÜ VƏ FACADE İDARƏETMƏ SİSTEMİ
// Bütün ixtisaslaşmış modulları (Engine, SFX, Beats, Ambient, Panel) birləşdirir
// ============================================================================

class UnifiedAudioController {
    constructor() {
        this.engine = window.audioEngine || new AudioEngine();
        this.sfx = new AudioSFX(this.engine);
        this.beats = new AudioBeats(this.engine);
        this.ambient = new AudioAmbient(this.engine);
        this.panel = null;

        // UI yükləndikdə paneli başladırıq
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initPanel());
            } else {
                this.initPanel();
            }
        }
    }

    initPanel() {
        if (!this.panel && typeof AudioPanel === 'function') {
            this.panel = new AudioPanel(this.engine, this.ambient, this.beats, this.sfx);
        }
    }

    get ctx() { return this.engine.ctx; }
    get muted() { return this.engine.muted; }
    set muted(val) { this.engine.muted = val; this.engine.applyVolumes(); }

    init() {
        this.engine.init();
        if (!this.muted && this.engine.volumes.ambient > 0 && !this.ambient.isPlaying) {
            this.ambient.start();
        }
    }

    // 🎚️ SƏS İKONUNA BASILDIQDA AÇILAN PANEL
    openSettings() {
        this.init();
        if (!this.panel) this.initPanel();
        if (this.panel) this.panel.open();
    }

    toggleSettings() {
        this.init();
        if (!this.panel) this.initPanel();
        if (this.panel) this.panel.toggle();
    }

    // 💓 QATLARA GÖRƏ DİNAMİK CANAVAR HƏYƏCAN RİTMLƏRİ VƏ ARXA FON MUSİQİSİ
    updateMonsterBeat(monsterY, canvasHeight, isPaused, isGameOver, floor = 1) {
        this.beats.updateMonsterBeat(monsterY, canvasHeight, isPaused, isGameOver, floor);

        if (this.ambient) {
            // Əgər Game Over və ya Pause fon musiqisi rejimidirsə, normal qat musiqi rejimi kəsilmir
            if (this.ambient.isGameOverMode || this.ambient.isPauseMode) return;

            if (this.ambient.currentFloor !== floor) {
                this.ambient.setFloor(floor, true);
            }
            if (isPaused || isGameOver || this.muted || this.engine.volumes.ambient === 0) {
                if (this.ambient.isPlaying) this.ambient.stop();
            } else {
                if (!this.ambient.isPlaying && !this.ambient.isSwitching) this.ambient.start();
            }
        }
    }

    // 🔄 QATA GÖRƏ MUSİQİNİ YENİDƏN BAŞLATMAQ
    setFloor(floor, restart = true) {
        if (this.ambient) {
            this.ambient.setFloor(floor, restart);
        }
    }

    // 🌌 ARXA FON SƏSLƏRİ
    startAmbient() { this.ambient.start(); }
    stopAmbient() { this.ambient.stop(); }

    // 💀 GAME OVER XÜSUSİ ARXA FON SOUNDTRACK METODLARI
    startGameOverTheme() {
        if (this.beats && typeof this.beats.stop === 'function') this.beats.stop();
        if (this.ambient && typeof this.ambient.startGameOverTheme === 'function') {
            this.ambient.startGameOverTheme();
        }
    }

    stopGameOverTheme() {
        if (this.ambient && typeof this.ambient.stopGameOverTheme === 'function') {
            this.ambient.stopGameOverTheme();
        }
    }

    // ⏸️ OYUN DAYANDIQDA (PAUSE) XÜSUSİ ARXA FON SOUNDTRACK METODLARI
    startPauseTheme() {
        if (this.beats && typeof this.beats.stop === 'function') this.beats.stop();
        if (this.ambient && typeof this.ambient.startPauseTheme === 'function') {
            this.ambient.startPauseTheme();
        }
    }

    stopPauseTheme() {
        if (this.ambient && typeof this.ambient.stopPauseTheme === 'function') {
            this.ambient.stopPauseTheme();
        }
    }

    // 🎮 SFX METODLARI
    playCoin() { this.sfx.playCoin(); }
    playShoot() { this.sfx.playShoot(); }
    playTurretShot() { this.sfx.playTurretShot(); }
    playDash() { this.sfx.playDash(); }
    playImpact() { this.sfx.playImpact(); }
    playDoorOpen() { this.sfx.playDoorOpen(); }
    playGameOver() {
        this.sfx.playGameOver();
        if (this.beats && typeof this.beats.stop === 'function') this.beats.stop();
        if (this.ambient && typeof this.ambient.startGameOverTheme === 'function') {
            this.ambient.startGameOverTheme();
        }
    }
    playKeySet() { this.sfx.playKeySet(); }
    playDiamond() { this.sfx.playDiamond(); }
    playChest() { this.sfx.playChest(); }
    playBarricade() { this.sfx.playBarricade(); }
    playIce() { this.sfx.playIce(); }
    playShock() { this.sfx.playShock(); }
    playExplosion() { this.sfx.playExplosion(); }
    playPlasma() { this.sfx.playPlasma(); }
    playPowerUp() { this.sfx.playPowerUp(); }
    playRoar() { this.sfx.playRoar(); }
    playCombo(count) { this.sfx.playCombo(count); }
    playShieldBreak() { this.sfx.playShieldBreak(); }
    playMeteorWarning() { this.sfx.playMeteorWarning(); }
    playMeteorExplode() { this.sfx.playMeteorExplode(); }
}

window.audio = new UnifiedAudioController();
