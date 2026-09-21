// ƏSAS OYUN MƏNTİQİ, FİZİKA VƏ OYUN DÖNGƏSİ (GAME LOOP & ENGINE COORDINATOR)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
window.ctx = ctx;

// SABİT STANDART QRİD VƏ OYUN MEYDANI ÖLÇÜLƏRİ (800x680: 20x17 xana, hər biri 40px)
const canvasWidth = 800;
const canvasHeight = 680;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

function resizeCanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Brauzer zoomunun qarşısının alınması
window.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault();
}, { passive: false });

window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
        e.preventDefault();
    }
});

canvas.addEventListener('click', () => {
    if (gameState.transitioning || gameState.gameOver || gameState.paused) return;
    if (typeof audio !== 'undefined') audio.init();
    canvas.focus();
});

// OBYEKTLƏR VƏ QURULUŞ
const player = new Player();
const monster = new Monster();
window.player = player;
window.monster = monster;
let frameCount = 0;
let cameraY = 0;
window.cameraY = cameraY;

// ============================================================================
// SABİT SÜRƏT, DİNAMİK DELTA VƏ GPU/CPU AVTOMATİK OPTİMİZASİYA SİSTEMİ
// ============================================================================

// 1. 🛡️ GPU VƏ CPU AVTOMATİK TƏYİNATI (HARDWARE DETECTION & FALLBACK)
function detectHardwareCapability() {
    let hasHardwareGPU = false;
    let rendererInfo = "Standart CPU Render";
    try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl', { powerPreference: 'high-performance' }) || 
                   testCanvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                rendererInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                const lower = rendererInfo.toLowerCase();
                // Əgər software/CPU renderer (SwiftShader, Mesa, llvmpipe, Microsoft Basic, VirtualBox) deyilsə, deməli real GPU var
                const isSoftware = lower.includes('software') || 
                                   lower.includes('llvmpipe') || 
                                   lower.includes('basic render') || 
                                   lower.includes('swiftshader') ||
                                   lower.includes('gdi generic') ||
                                   lower.includes('virtualbox') ||
                                   lower.includes('vmware');
                if (!isSoftware && rendererInfo.trim().length > 0) {
                    hasHardwareGPU = true;
                }
            } else {
                // Extension olmasa belə WebGL mövcuddursa
                hasHardwareGPU = true;
                rendererInfo = "WebGL Hardware";
            }
        }
    } catch(e) {
        hasHardwareGPU = false;
        rendererInfo = "Software Canvas 2D";
    }
    return { hasHardwareGPU, rendererInfo };
}

const hwInfo = detectHardwareCapability();
window.HAS_HARDWARE_GPU = hwInfo.hasHardwareGPU;
window.HW_RENDERER_INFO = hwInfo.rendererInfo;

// Qrafika Rejimi ('high', 'low', 'auto')
let savedQuality = localStorage.getItem('floor_escape_graphics_quality') || 'auto';
let activeQuality = savedQuality;
if (activeQuality === 'auto') {
    // 4-CÜ QAYDA: Əgər GPU yoxdursa, avtomatik olaraq CPU (low/yüngül) rejimindən istifadə et!
    activeQuality = hwInfo.hasHardwareGPU ? 'high' : 'low';
}
window.GRAPHICS_QUALITY = activeQuality;

// ⚡ CPU REJİMİ OPTİMİZASİYASI: Bütün ctx.shadowBlur çağırışlarını CPU rejimində 0 edən ağıllı proxy
(function installShadowOptimization(c) {
    try {
        const proto = CanvasRenderingContext2D.prototype;
        const origDesc = Object.getOwnPropertyDescriptor(proto, 'shadowBlur');
        if (origDesc && origDesc.set) {
            Object.defineProperty(c, 'shadowBlur', {
                set: function(val) {
                    // Əgər CPU rejimindədirsə (GPU yoxdursa və ya low seçilibsə) kölgə hesablamalarını sıfırla
                    if (window.GRAPHICS_QUALITY === 'low' || (!window.HAS_HARDWARE_GPU && window.GRAPHICS_QUALITY === 'auto')) {
                        origDesc.set.call(this, 0);
                    } else {
                        origDesc.set.call(this, val);
                    }
                },
                get: function() {
                    if (window.GRAPHICS_QUALITY === 'low' || (!window.HAS_HARDWARE_GPU && window.GRAPHICS_QUALITY === 'auto')) {
                        return 0;
                    }
                    return origDesc.get.call(this);
                },
                configurable: true
            });
        }
    } catch(e) {
        console.warn('Shadow optimization hook:', e);
    }
})(ctx);

// Əgər GPU varsa - kətanı və konteyneri GPU qatına veririk; Yoxdursa - CPU yükünü sıfırlayırıq
function applyHardwareLayerSettings() {
    const screenCont = document.getElementById('game-screen-container');
    const cEl = document.getElementById('gameCanvas');
    const isGPUActive = (window.GRAPHICS_QUALITY === 'high') || (window.GRAPHICS_QUALITY === 'auto' && window.HAS_HARDWARE_GPU);
    
    if (isGPUActive) {
        if (screenCont) {
            screenCont.style.transform = (screenCont.style.transform || '').replace(' translateZ(0)', '') + ' translateZ(0)';
            screenCont.style.willChange = 'transform';
        }
        if (cEl) {
            cEl.style.transform = 'translateZ(0)';
            cEl.style.willChange = 'transform';
        }
    } else {
        // CPU Rejimi: qat çevrilmələrini və willChange-i ləğv et, prosessoru artıq kompozisiya işlərindən azad et
        if (screenCont) {
            screenCont.style.transform = (screenCont.style.transform || '').replace(' translateZ(0)', '');
            screenCont.style.willChange = 'auto';
        }
        if (cEl) {
            cEl.style.transform = 'none';
            cEl.style.willChange = 'auto';
        }
    }
}
setTimeout(applyHardwareLayerSettings, 100);

// 2. ⚡ DİNAMİK DELTA VƏ TEZLİK İDARƏETMƏSİ (0 = Auto/Monitor Hz, 60, 120, 144, 30)
let targetFPS = parseInt(localStorage.getItem('floor_escape_target_fps') || '0', 10);
if (![0, 30, 60, 120, 144].includes(targetFPS)) targetFPS = 0; // 0 = Auto Monitor Refresh Rate

let frameInterval = targetFPS > 0 ? (1000 / targetFPS) : 0;
const FIXED_PHYSICS_DELTA = 1000 / 60; // Dəqiq 60Hz fizika addımı (16.66667 ms)
let lastFrameTime = performance.now();
let physicsAccumulator = 0;

// Canlı FPS Hesablama
let fpsFramesCount = 0;
let fpsLastTime = performance.now();
let currentMeasuredFPS = 60;

function setTargetFPS(fps) {
    if (![0, 30, 60, 120, 144].includes(fps)) return;
    targetFPS = fps;
    window.targetFPS = targetFPS;
    frameInterval = targetFPS > 0 ? (1000 / targetFPS) : 0;
    localStorage.setItem('floor_escape_target_fps', targetFPS.toString());
    updateFpsUI();
    if (typeof showToast === 'function') {
        const labels = {
            0: '🔄 Auto (Monitorun təbii Hz tezliyinə uyğun tam səlislik)',
            60: '⚡ 60 FPS Sabit rejim',
            120: '🚀 120 FPS Yüksək tezlik rejimi',
            144: '🏎️ 144 FPS Ultra səlislik rejimi',
            30: '🔋 30 FPS Qənaət rejimi'
        };
        showToast(labels[targetFPS] || 'Tezlik yeniləndi', 'info');
    }
}
window.setTargetFPS = setTargetFPS;
window.targetFPS = targetFPS;

function setGraphicsQuality(mode) {
    if (!['auto', 'high', 'low'].includes(mode)) return;
    savedQuality = mode;
    window.savedQuality = savedQuality;
    localStorage.setItem('floor_escape_graphics_quality', mode);
    if (mode === 'auto') {
        // GPU yoxdursa avtomatik CPU (low) rejiminə keçir
        activeQuality = hwInfo.hasHardwareGPU ? 'high' : 'low';
    } else {
        activeQuality = mode;
    }
    window.GRAPHICS_QUALITY = activeQuality;
    applyHardwareLayerSettings();
    updateFpsUI();
    if (typeof showToast === 'function') {
        showToast(`🎨 Qrafika: ${mode === 'high' ? 'Yüksək (GPU Neon)' : mode === 'low' ? 'Yüngül (CPU Sürətli)' : 'Avtomatik'} rejim seçildi`, 'success');
    }
}
window.setGraphicsQuality = setGraphicsQuality;
window.savedQuality = savedQuality;

function updateFpsUI() {
    const fpsEl = document.getElementById('stat-fps');
    const fpsBtn = document.getElementById('btn-fps-toggle');
    if (fpsEl) {
        fpsEl.innerText = targetFPS === 0 ? `${currentMeasuredFPS} FPS (Auto)` : `${currentMeasuredFPS} / ${targetFPS} FPS`;
    }
    if (fpsBtn) {
        if (targetFPS === 0 || targetFPS >= 120) {
            fpsBtn.className = "px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs flex items-center gap-1.5 shadow transition select-none cursor-pointer";
            const icon = fpsBtn.querySelector('i');
            if (icon) icon.className = "fa-solid fa-bolt text-cyan-400 text-xs";
        } else if (targetFPS === 60) {
            fpsBtn.className = "px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:border-emerald-400 text-emerald-300 font-orbitron font-bold text-xs flex items-center gap-1.5 shadow transition select-none cursor-pointer";
            const icon = fpsBtn.querySelector('i');
            if (icon) icon.className = "fa-solid fa-gauge-high text-emerald-400 text-xs";
        } else {
            fpsBtn.className = "px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:border-amber-400 text-amber-300 font-orbitron font-bold text-xs flex items-center gap-1.5 shadow transition select-none cursor-pointer";
            const icon = fpsBtn.querySelector('i');
            if (icon) icon.className = "fa-solid fa-battery-half text-amber-400 text-xs";
        }
    }
}
window.updateFpsUI = updateFpsUI;

// 1. DƏQİQ FİZİKA VƏ OYUN MƏNTİQİ ADDIMI (Həmişə 60Hz sabit addımla hesablanır)
function updatePhysicsStep() {
    if (gameState.isIntroPlaying) {
        if (typeof monsPortal !== 'undefined' && monsPortal && !monsPortal.finished) {
            monsPortal.update(1 / 60);
        }
        // 🌋 Lav şəlalələri və köz damcıları oyun açılanda da canlı axır
        if (typeof updatePlatformsPhysics === 'function') {
            updatePlatformsPhysics(player, 1 / 60);
        }
        // Canavar hələ yüksəlmir, lakin lava həmişə ekranın alt kənarında dalğalanaraq aydın görünür
        const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : canvasHeight;
        monster.y = worldH - 38;
        if (typeof monster.t === 'number') monster.t += 0.025;
        return;
    }
    frameCount++;

    if (!gameState.transitioning) {
        gameState.floorTime += 1 / 60;

        if (gameState.dashCooldown > 0) {
            gameState.dashCooldown -= 1 / 60;
            if (gameState.dashCooldown < 0) gameState.dashCooldown = 0;
        }
        if (gameState.dashInvulnerable > 0) {
            gameState.dashInvulnerable--;
        }

        // Sərhəd bağlı olduqda sikkə taymeri işləyir
        if (!gameState.borderOpen) {
            gameState.coinCountdown -= 1 / 60;
            if (gameState.coinCountdown <= 0) {
                autoSpawnCoin();
                gameState.coinCountdown = getCoinSpawnInterval();
            }
        }

        // Əkiz Qüllələrin dövrü
        if (typeof twinTurrets !== 'undefined' && twinTurrets.update) {
            twinTurrets.update();
        }
    }

    player.update(keys);

    // Uçan neon mətnlərin yenilənməsi
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        ft.alpha = Math.max(0, ft.life / 55);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Sikkələrin süzülməsi və optimallaşdırılmış toplanması
    let coinsCollectedThisFrame = 0;
    let totalBatchGold = 0;
    let effectsPlayedThisFrame = 0;
    const MAX_EFFECTS_PER_FRAME = 3;

    for (let index = coins.length - 1; index >= 0; index--) {
        const c = coins[index];
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.hypot(dx, dy);

        const isSuper = (gameState.superMagnetTimer > 0);
        const attractDist = isSuper ? 1100 : gameState.magnetRadius;

        if (dist < attractDist) {
            c.isGliding = true;
            c.glideProgress = Math.min(1, (c.glideProgress || 0) + 0.02);

            // Oyunçuya doğru əsas cazibə bucağı
            const directAngle = Math.atan2(dy, dx);

            // Kənardan süzülə-süzülə, zərif qövs vuraraq axma effekti
            const curveOffset = Math.sin((c.bobOffset || 0) + dist * 0.012) * Math.min(2.2, dist / 110);
            const glideAngle = directAngle + curveOffset * (1 - c.glideProgress);

            // Təbii süzülmə sürəti: uzaqda zərif başlayır, yaxınlaşdıqca axıcı sürətlənir
            const baseSpeed = isSuper ? 6.0 : 4.2;
            const distBoost = isSuper ? (2.2 * (1 - dist / attractDist)) : 0.8;
            const targetSpeed = Math.min(isSuper ? 8.8 : 6.8, baseSpeed + distBoost);

            const targetVx = Math.cos(glideAngle) * targetSpeed;
            const targetVy = Math.sin(glideAngle) * targetSpeed;

            // İnersiya və süzülmə ləngiməsi (steering easing)
            c.vx = (c.vx || 0) * 0.86 + targetVx * 0.14;
            c.vy = (c.vy || 0) * 0.86 + targetVy * 0.14;

            c.x += c.vx;
            c.y += c.vy;
        } else {
            c.isGliding = false;
            c.vx = (c.vx || 0) * 0.92;
            c.vy = (c.vy || 0) * 0.92;
            c.x += c.vx;
            c.y += c.vy;
        }

        // Oyunçuya çatdıqda toplanma
        const collectionThreshold = player.radius + c.radius + 3;
        if (dist < collectionThreshold) {
            coinsCollectedThisFrame++;
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

            const comboMult = gameState.combo >= 10 ? 3.0 : (gameState.combo >= 5 ? 2.0 : (gameState.combo >= 3 ? 1.5 : 1.0));
            const gainedGold = Math.round(c.value * comboMult);
            gameState.gold += gainedGold;
            totalBatchGold += gainedGold;

            // Tək-tək toplayanda dəqiq say göstərilir, kütləvi yığılma zamanı isə maksimum 3-4 effekt verilir
            if (effectsPlayedThisFrame < MAX_EFFECTS_PER_FRAME) {
                effectsPlayedThisFrame++;

                // Səs idarəsi: eyni kadrda ən çox 2 dəfə çalınır ki, audio tıxanmasın
                if (typeof audio !== 'undefined' && effectsPlayedThisFrame <= 2) {
                    audio.playCoin();
                    if (gameState.combo >= 5 && effectsPlayedThisFrame === 1 && typeof audio.playCombo === 'function') {
                        audio.playCombo(gameState.combo);
                    }
                }

                // Tək-tək toplayanda və ya ilk 3 effektdə sikkənin üstündə dəqiq say görünür
                addFloatingText(c.x, c.y - 15, `+${gainedGold}`, '#ffd700', 13);

                // Zərif hissəciklər (ekranı dondurmayan yüngül 3 hissəcik)
                if (typeof particles !== 'undefined') {
                    for (let i = 0; i < 3; i++) {
                        particles.push(new Particle(c.x, c.y, '#ffd700', 2.4));
                    }
                }
            }

            coins.splice(index, 1);
        }
    }

    // Əgər bu kadrda sikkələr toplanıbsa, ağır əməliyyatları (DOM və LocalStorage) dövrün sonunda yalnız 1 DƏFƏ icra edirik
    if (coinsCollectedThisFrame > 0) {
        if (coinsCollectedThisFrame > MAX_EFFECTS_PER_FRAME) {
            // Kütləvi maqnit yığılması zamanı ümumi cəm zərif tək bildirişlə göstərilir
            addFloatingText(player.x, player.y - 28, `🧲 +${totalBatchGold} 🪙`, '#facc15', 16);
            if (typeof showGoldToast === 'function') {
                showGoldToast(totalBatchGold);
            }
        } else if (coinsCollectedThisFrame === 1) {
            // Tək sikkə toplanarkən
            if (typeof showGoldToast === 'function') {
                showGoldToast(totalBatchGold);
            }
        }

        // 30 dəfə yox, cəmi 1 dəfə yadda saxla və UI-ı yenilə
        updateUI();
        if (typeof saveActiveRun === 'function') {
            saveActiveRun();
        }
    }

    // Gücləndiricilərin (Power-Ups) yenilənməsi və toplanması
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (!p.update()) {
            powerUps.splice(i, 1);
            if (typeof saveActiveRun === 'function') saveActiveRun();
            continue;
        }

        const pDist = Math.hypot(player.x - p.x, player.y - p.y);
        if (pDist < player.radius + p.radius) {
            if (typeof audio !== 'undefined' && audio.playPowerUp) {
                audio.playPowerUp();
            }
            if (typeof particles !== 'undefined') {
                for (let k = 0; k < 18; k++) {
                    particles.push(new Particle(p.x, p.y, p.cfg.color, 3.5));
                }
            }

            if (p.type === 'shield') {
                if (typeof player.restoreShield === 'function') {
                    player.restoreShield();
                } else {
                    player.hasShield = true;
                }
                addFloatingText(player.x, player.y - 20, '🛡️ QALXAN AKTİV! (1 DƏFƏLİK QORUMA)', '#00f0ff', 16);
                if (typeof showToast === 'function') {
                    showToast('🛡️ ENERJİ QALXANI AKTİVLƏŞDİ! (1 Dəfə Zərərdən Qoruyacaq)', 'success');
                }
            } else if (p.type === 'chrono') {
                gameState.chronoTimer = 240; // 4.0 saniyə (60fps)
                addFloatingText(player.x, player.y - 20, '⏱️ MATRIX SHIFT (4.0s)!', '#e879f9', 15);
                if (typeof showToast === 'function') {
                    showToast('⏱️ ZAMAN LƏNGİDİLDİ (4.0s)!', 'info');
                }
            } else if (p.type === 'jump') {
                player.hasHyperJump = true;
                addFloatingText(player.x, player.y - 20, '🚀 QUANTUM THRUSTER READY!', '#f59e0b', 16);
                if (typeof showToast === 'function') {
                    showToast('🚀 KVANT SIÇRAYIŞI HAZIRDIR! (Lavaya 2px qalmış avtomatik xilas edəcək)', 'warning');
                }
            } else if (p.type === 'magnet') {
                gameState.superMagnetTimer = 300; // 5.0 saniyə (60fps)
                addFloatingText(player.x, player.y - 20, '🧲 MAGNET STORM!', '#a855f7', 15);
                if (typeof showToast === 'function') {
                    showToast('🧲 SUPER MAQNİT FIRTINASI (5.0s)!', 'success');
                }
            } else if (p.type === 'lifeFlower') {
                if (typeof player.addLifeFlower === 'function') {
                    const added = player.addLifeFlower();
                    if (added) {
                        addFloatingText(player.x, player.y - 20, `🌸 YAŞAM ÇİÇƏYİ (+1 CAN)! [${player.lifeFlowers}/${player.maxLifeFlowers}]`, '#62e6a0', 16);
                        if (typeof showToast === 'function') {
                            showToast(`🌸 Yaşam Çiçəyi bərpa olundu! Cari Can: ${player.lifeFlowers}/${player.maxLifeFlowers}`, 'success');
                        }
                    } else {
                        // Əgər canlar onsuz da maksimumdursa, +50 bonus Qızıl ver
                        gameState.gold += 50;
                        gameState.runGold = (gameState.runGold || 0) + 50;
                        addFloatingText(player.x, player.y - 20, '🌸 MAKSİMUM CAN! +50 🪙', '#ffe3a0', 15);
                        if (typeof showToast === 'function') {
                            showToast('🌸 Yaşam çiçəkləri artıq tam doludur! (+50 Qızıl)', 'info');
                        }
                    }
                }
            } else if (p.type === 'tesseractAmmo') {
                let collected = false;
                if (window.TesseractSpawnEffect && typeof window.TesseractSpawnEffect.collectAmmo === 'function') {
                    collected = window.TesseractSpawnEffect.collectAmmo(player);
                } else if (player.tesseractSlots) {
                    const emptyIdx = player.tesseractSlots.indexOf(false);
                    if (emptyIdx !== -1) {
                        player.tesseractSlots[emptyIdx] = true;
                        collected = true;
                    }
                }
                const curCount = (player.tesseractSlots || []).filter(Boolean).length;
                if (collected) {
                    addFloatingText(player.x, player.y - 20, `⚛️ +1 QRAVİTON MƏRMİSİ! [${curCount}/6]`, '#c084fc', 16);
                    if (typeof showToast === 'function') {
                        showToast(`⚛️ Qraviton Mərmisi toplandı! [${curCount}/6]`, 'success');
                    }
                } else {
                    gameState.gold += 35;
                    gameState.runGold = (gameState.runGold || 0) + 35;
                    addFloatingText(player.x, player.y - 20, '⚛️ MƏRMİLƏR TAM DOLUDUR! +35 🪙', '#f0abfc', 15);
                }
            } else if (p.type === 'iceAmmo') {
                let collected = false;
                if (window.GlacialSpawnEffect && typeof window.GlacialSpawnEffect.collectAmmo === 'function') {
                    collected = window.GlacialSpawnEffect.collectAmmo(player);
                } else if (player.glacialSlots) {
                    const emptyIdx = player.glacialSlots.indexOf(false);
                    if (emptyIdx !== -1) {
                        player.glacialSlots[emptyIdx] = true;
                        collected = true;
                    }
                }
                const curCount = (player.glacialSlots || []).filter(Boolean).length;
                if (collected) {
                    addFloatingText(player.x, player.y - 20, `❄️ +1 BUZ MƏRMİSİ! [${curCount}/6]`, '#38bdf8', 16);
                    if (typeof showToast === 'function') {
                        showToast(`❄️ Buz Mərmisi toplandı! [${curCount}/6]`, 'success');
                    }
                } else {
                    gameState.gold += 35;
                    gameState.runGold = (gameState.runGold || 0) + 35;
                    addFloatingText(player.x, player.y - 20, '❄️ MƏRMİLƏR TAM DOLUDUR! +35 🪙', '#a5f3fc', 15);
                }
            }

            powerUps.splice(i, 1);
            if (typeof saveActiveRun === 'function') saveActiveRun();
        }
    }

    // Taymerlərin geri sayımı
    if (gameState.chronoTimer > 0) gameState.chronoTimer--;
    if (gameState.superMagnetTimer > 0) gameState.superMagnetTimer--;

    if (!gameState.gameOver && !gameState.paused && !gameState.transitioning) {
        const baseInterval = (typeof getPowerUpSpawnInterval === 'function') ? getPowerUpSpawnInterval() : 15;
        if (!gameState.powerUpCountdown) gameState.powerUpCountdown = baseInterval;
        gameState.powerUpCountdown -= 1 / 60;
        if (gameState.powerUpCountdown <= 0) {
            autoSpawnPowerUp();
        if (typeof ensureAmmoSpawn === 'function') ensureAmmoSpawn();
            gameState.powerUpCountdown = baseInterval + Math.random() * 4;
        }
    }

    // Lavanın yenilənməsi
    if (gameState.activeModifier === 'goldrush') {
        monster.speed = monster.baseSpeed * 1.20;
    }
    monster.update();

    // Mərmilərin yenilənməsi (traps.js)
    if (typeof updateBullets === 'function') {
        updateBullets();
    }

    // 📜 Keçid Kağızının yenilənməsi
    if (typeof updateEscapePass === 'function') {
        updateEscapePass(FIXED_PHYSICS_DELTA / 1000);
    }
    // 🛡️ Qat Qoruma Kağızının yenilənməsi
    if (typeof updateFloorProtection === 'function') {
        updateFloorProtection(FIXED_PHYSICS_DELTA / 1000);
    }

    // 🏔️ Qayalar və Axan Lava Fizikası
    if (typeof updatePlatformsPhysics === 'function') {
        updatePlatformsPhysics(player, FIXED_PHYSICS_DELTA / 1000);
    }

    // 🎥 Şaquli Kamera İzləməsi (Smooth Vertical Camera Following Player)
    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : canvasHeight;
    const targetCamY = Math.max(0, Math.min(worldH - canvasHeight, player.y - canvasHeight * 0.55));
    if (gameState.isIntroPlaying || gameState.transitioning) {
        cameraY = targetCamY;
    } else {
        cameraY += (targetCamY - cameraY) * 0.14;
    }
    window.cameraY = cameraY;

    // Hissəciklər
    for (let idx = particles.length - 1; idx >= 0; idx--) {
        const p = particles[idx];
        p.update();
        if (p.alpha <= 0) particles.splice(idx, 1);
    }

    // Sərhəddən keçid yoxlanışı (Teleport Out ➔ Qat Keçidi)
    const borderY = 55;
    if (gameState.borderOpen && player.y <= borderY + player.radius) {
        if (!hasPassedBorder && !gameState.transitioning && !gameState.isIntroPlaying) {
            hasPassedBorder = true;
            playFloorTeleportTransition();
        }
    }

    // 🧱 Barrikada Təhlükəsizliyi: Barrikada aktivdirsə (monster.wallTimer > 0), o keçilməz fiziki platformadır!
    // Oyunçu barrikadaya toxunarkən lavaya dəymir və qətiyyən ölə bilməz!
    const isWallActive = (typeof monster !== 'undefined' && monster && monster.wallTimer > 0);
    const wallTopY = isWallActive ? ((monster.y + (monster.shockShake || 0)) - 16) : null;

    if (isWallActive && wallTopY !== null) {
        if (player.y + player.radius >= wallTopY) {
            player.y = wallTopY - player.radius;
            // Barrikada üzərində təhlükəsiz dayaq qığılcımları
            if (frameCount % 5 === 0 && typeof particles !== 'undefined') {
                particles.push(new Particle(player.x + (Math.random() - 0.5) * 20, wallTopY, '#f59e0b', 2.2));
            }
        }
    }

    // Lavanın təhlükəsi, Kvant Sıçrayışı və Qalxan İerarxiyası
    const playerMonsterY = monster.surface ? monster.surface(player.x, monster.y) : monster.y;
    const distToLava = playerMonsterY - (player.y + player.radius);

    if (!gameState.transitioning && gameState.dashInvulnerable <= 0 && !isWallActive) {
        if (distToLava <= 2 && player.hasHyperJump) {
            player.hyperJump();
            if (typeof saveActiveRun === 'function') saveActiveRun();
        } else if (distToLava <= 0) {
            player.takeDamage(1, 'lava');
            if (typeof saveActiveRun === 'function') saveActiveRun();
        }

    }

    // Sərhəd açıq deyilsə passiv qızıl artımı
    if (frameCount % 30 === 0 && !gameState.borderOpen) {
        gameState.gold += 0.15 * (1 + gameState.combo * 0.05);
    }

    // Avtomatik yaddaşa qeyd
    if (frameCount % 20 === 0) {
        saveActiveRun();
    }
}

// 2. RENDERING ADDIMI
function renderGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawArenaBackground(ctx, canvasWidth, canvasHeight, cameraY, gameState.floor, performance.now() / 1000);

    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : canvasHeight;

    // ==================== A) DÜNYA MƏKANI (WORLD SPACE TRANSLATED BY -cameraY) ====================
    ctx.save();
    ctx.translate(0, -Math.round(cameraY));

    // 🎯 2-Cİ VƏ 3-CÜ BƏND: EK RANDAN KƏNAR OBYEKTLƏRİN GİZLƏDİLMƏSİ (OFF-SCREEN CULLING)
    const viewTop = cameraY - 70;
    const viewBottom = cameraY + canvasHeight + 70;

    // 3. 🏔️ Qayalar və Animasiyalı Axan Lava Blokları (Daxili culling aktivdir)
    if (typeof drawPlatforms === 'function') {
        drawPlatforms(ctx);
    }

    // 4. Sərhəd Qapısı (Yalnız kamera yuxarı çatanda və ekranda görünəndə çəkilir)
    if (typeof drawBorderLine === 'function' && viewTop <= 110) {
        drawBorderLine();
    }

    // 5. Gücləndiricilər (Yalnız ekranda görünənlər çəkilir)
    for (let i = 0; i < powerUps.length; i++) {
        const p = powerUps[i];
        if (p.y >= viewTop && p.y <= viewBottom) {
            p.draw(ctx);
        }
    }

    // 6. 📜 Keçid Kağızı (Escape Pass) (Yalnız kamera baxış sahəsindədirsə çəkilir)
    if (typeof activeEscapePass !== 'undefined' && activeEscapePass) {
        if (activeEscapePass.y >= viewTop - 30 && activeEscapePass.y <= viewBottom + 30) {
            if (typeof drawEscapePass === 'function') drawEscapePass(ctx);
        }
    } else if (typeof drawEscapePass === 'function') {
        drawEscapePass(ctx);
    }

    // 🛡️ Qat Qoruma Kağızı (Floor Protection) (Culling yoxlanışı)
    if (typeof activeFloorProtection !== 'undefined' && activeFloorProtection) {
        if (activeFloorProtection.y >= viewTop - 30 && activeFloorProtection.y <= viewBottom + 30) {
            if (typeof drawFloorProtection === 'function') drawFloorProtection(ctx);
        }
    } else if (typeof drawFloorProtection === 'function') {
        drawFloorProtection(ctx);
    }

    // 7. Oyunçu, Qüllələr, Sikkələr, Mərmilər, Canavar və Zərrəciklər
    if (gameState.isIntroPlaying && typeof monsPortal !== 'undefined' && monsPortal && !monsPortal.finished) {
        monsPortal.draw(ctx);
    } else {
        player.draw();
        drawMonsAmmoArrow(ctx);
    }
    if (typeof twinTurrets !== 'undefined' && twinTurrets.draw) {
        twinTurrets.draw();
    }

    // 🎯 SİKKƏLƏR (Yalnız kamera baxış sahəsində olan sikkələr çəkilir)
    for (let i = 0; i < coins.length; i++) {
        const c = coins[i];
        if (c.y >= viewTop && c.y <= viewBottom) {
            c.draw();
        }
    }

    // Canavar həmişə lava səthindədir, kamera sahəsindədirsə tam çəkilir
    if (monster.y >= viewTop - 150 && monster.y <= viewBottom + 250) {
        monster.draw();
    } else {
        // Canavarın gövdəsi ekrandan aşağıda olsa belə, göydən enən meteorlar və şok dalğaları həmişə çəkilir
        if (typeof monster.drawMeteors === 'function') monster.drawMeteors(ctx);
        if (typeof monster.drawShockwaves === 'function') monster.drawShockwaves(ctx);

        // Ekranın alt kənarında qaynayan lava parıltısı (Lava Proximity Glow)
        if (monster.y > viewBottom) {
            const distFromScreen = monster.y - viewBottom;
            if (distFromScreen < 750) {
                const glowAlpha = Math.max(0, Math.min(0.5, 1 - distFromScreen / 750));
                ctx.save();
                const threatGrad = ctx.createLinearGradient(0, viewBottom - 50, 0, viewBottom);
                threatGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
                threatGrad.addColorStop(1, `rgba(249, 115, 22, ${glowAlpha})`);
                ctx.fillStyle = threatGrad;
                ctx.fillRect(0, viewBottom - 50, canvasWidth, 50);
                ctx.restore();
            }
        }
    }

    // 🎯 MƏRMİLƏR (Kamerada görünənlər çəkilir)
    for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        if (b.y >= viewTop && b.y <= viewBottom) {
            b.draw();
        }
    }

    // 🎯 ZƏRRƏCİKLƏR (Culling və CPU rejimində yükü qoruyan limitləmə)
    const isCPUMode = (window.GRAPHICS_QUALITY === 'low' || (!window.HAS_HARDWARE_GPU && window.GRAPHICS_QUALITY === 'auto'));
    const maxParticles = isCPUMode ? Math.min(particles.length, 30) : particles.length;
    for (let i = 0; i < maxParticles; i++) {
        const p = particles[i];
        if (p.y >= viewTop && p.y <= viewBottom) {
            p.draw();
        }
    }

    // 🎯 UÇAN NEON MƏTNLƏR (Culling və kölgə optimizasiyası)
    for (let i = 0; i < floatingTexts.length; i++) {
        const ft = floatingTexts[i];
        if (ft.y >= viewTop && ft.y <= viewBottom) {
            ctx.save();
            ctx.font = `900 ${ft.size}px Orbitron, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            if (!isCPUMode) {
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 14;
            }
            ctx.globalAlpha = ft.alpha;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    ctx.restore(); // ==================== DÜNYA MƏKANININ SONU ====================

    // ==================== B) EKRAN MƏKANI (SCREEN SPACE HUD) ====================
    // 🧭 Mərmi Naviqasiya Oxları (Wayfinder)
    // Arrow rendered directly on Mons
    // 1. 👾 Boss HP Bar (Ekranın yuxarısında həmişə sabit)
    if (typeof monster !== 'undefined' && typeof monster.drawBossHpBar === 'function') {
        monster.drawBossHpBar(ctx);
    }

    // 2. 📍 Şaquli Dırmaşma Mini-Şkalası (Sağ tərəfdə faiz və irəliləyiş)
    if (typeof drawHeightMinimap === 'function') {
        drawHeightMinimap(ctx, player, worldH);
    }

    // 3. Keçici İmpuls Parıltısı
    if (screenPulse.alpha > 0.01) {
        ctx.save();
        const pGrad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.35, canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.65);
        pGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        const pulseColor = (typeof screenPulse.color === 'string' && screenPulse.color) ? screenPulse.color : '#ef4444';
        pGrad.addColorStop(1, pulseColor);
        ctx.globalAlpha = screenPulse.alpha;
        ctx.fillStyle = pGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
        screenPulse.alpha *= 0.85;
    }

    // Aktiv Anomaliya Banneri
    if (gameState.activeModifier && gameState.activeModifier !== 'normal') {
        ctx.save();
        let badgeTxt = '';
        let badgeColor = '#00f0ff';
        if (gameState.activeModifier === 'gravity') {
            badgeTxt = '🪐 ANOMALİYA: AY QRAVİTASİYASI (SÜZÜLƏN HƏRƏKƏT)';
            badgeColor = '#c084fc';
        } else if (gameState.activeModifier === 'goldrush') {
            badgeTxt = '💰 ANOMALİYA: QIZIL QIZDIRMASI (SÜRƏTLİ LAVA & 2X QIZIL)';
            badgeColor = '#fbbf24';
        }

        ctx.font = 'bold 10px Orbitron, sans-serif';
        const tw = ctx.measureText(badgeTxt).width;
        const bw = tw + 24;
        const bx = (canvasWidth - bw) / 2;
        const by = 18;

        ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = badgeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(bx, by, bw, 20, 5);
        } else {
            ctx.rect(bx, by, bw, 20);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = badgeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeTxt, canvasWidth / 2, by + 10);
        ctx.restore();
    }
}

// 3. ƏSAS OYUN DÖVRÜ (FIXED TIMESTEP GAME LOOP)
function gameLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!lastFrameTime) lastFrameTime = timestamp;

    let elapsed = timestamp - lastFrameTime;

    // Əgər sabit FPS (30/60/120/144) seçilibsə interval gözlənilir, Auto (0) olduqda isə monitorun tam təbii tezliyində işləyir
    if (targetFPS > 0 && elapsed < frameInterval - 1.5) {
        requestAnimationFrame(gameLoop);
        return;
    }

    lastFrameTime = targetFPS > 0 ? (timestamp - (elapsed % frameInterval)) : timestamp;
    if (elapsed > 100) elapsed = 100;

    physicsAccumulator += elapsed;

    fpsFramesCount++;
    if (timestamp - fpsLastTime >= 1000) {
        currentMeasuredFPS = Math.round((fpsFramesCount * 1000) / (timestamp - fpsLastTime));
        fpsFramesCount = 0;
        fpsLastTime = timestamp;
        const fpsBadge = document.getElementById('stat-fps');
        if (fpsBadge) {
            fpsBadge.innerText = `${currentMeasuredFPS} FPS`;
        }
    }

    if (!gameState.paused && !gameState.gameOver) {
        let steps = 0;
        while (physicsAccumulator >= FIXED_PHYSICS_DELTA && steps < 5) {
            updatePhysicsStep();
            physicsAccumulator -= FIXED_PHYSICS_DELTA;
            steps++;
        }

        renderGame();
        updateUI();
    } else {
        physicsAccumulator = 0;
    }

    requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    // 🛡️ QAT QORUMASI YOXLANIŞI (RESURRECTION CHECKPOINT)
    // Əgər oyunçunun üzərində Qat Qoruma Kağızı varsa və 1-ci qatdan yuxarıdadırsa, 1-ci qata qayıtmır!
    if (gameState.floorProtection && gameState.floorProtection > 0 && gameState.floor > 1) {
        gameState.floorProtection--;
        if (typeof showToast === 'function') {
            showToast(`🛡️ QAT QORUMASI İSTİFADƏ OLUNDU! Qat ${gameState.floor}-dən davam edilir! (Qalan qoruma: ${gameState.floorProtection})`, 'success');
        }
        if (typeof addFloatingText === 'function' && typeof player !== 'undefined' && player) {
            addFloatingText(player.x, player.y - 40, `🛡️ QAT ${gameState.floor} QORUNDU!`, '#34d399', 24);
        }
        if (typeof audio !== 'undefined' && typeof audio.playDiamond === 'function') {
            audio.playDiamond();
        }
        respawnOnCurrentFloor();
        return;
    }
    gameState.gameOver = true;
    gameState.coinCountdown = getCoinSpawnInterval();
    if (typeof clearBullets === 'function') clearBullets();
    coins = [];
    clearActiveRun();
    if (typeof audio !== 'undefined') {
        if (typeof audio.stopPauseTheme === 'function') audio.stopPauseTheme();
        if (typeof audio.playGameOver === 'function') audio.playGameOver();
        if (typeof showToast === 'function') {
            showToast('🔬 Laboratoriyadan yüksəltmələr edərək daha çox nailiyyətlər əldə etməlisiniz!', 'info');
        }
    }
    if (typeof cancelRebinding === 'function') cancelRebinding();

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };
    setTxt('final-floor', gameState.floor);
    setTxt('final-gold', Math.floor(gameState.gold));
    setTxt('final-traps', gameState.totalTrapsPlaced);
    setTxt('final-diamonds', diamonds);
    setTxt('final-red-diamonds', redDiamonds);
    
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.remove('hidden');

    if (typeof syncPlayerDataCloud === 'function') {
        syncPlayerDataCloud(true);
    }
}


// 🛡️ CARİ QATDAN DİRİLMƏ VƏ BƏRPA FUNKSİYASI (RESPAWN ON CURRENT FLOOR)
function respawnOnCurrentFloor() {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.transitioning = false;
    hasPassedBorder = false;
    gameState.borderOpen = false;
    keys = {};

    const targetFloor = gameState.floor || 1;
    gameState.scoreProgress = 0;
    gameState.scoreReq = gameState.getFloorRequirement(targetFloor);
    gameState.combo = 0;
    gameState.floorTime = 0;

    // Platformaları və dünyanı həmin qata uyğun bərpa edirik
    if (typeof initFloorPlatforms === 'function') {
        initFloorPlatforms(targetFloor);
    }

    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(targetFloor) : canvasHeight;
    cameraY = Math.max(0, Math.min(worldH - canvasHeight, (worldH - 200) - canvasHeight / 2));
    window.cameraY = cameraY;

    // Oyunçu və canavarı həmin qatın başlanğıcına yerləşdiririk
    if (typeof player !== 'undefined' && player) {
        player.x = 400;
        player.y = worldH - 200;
        player.reset(true);
        gameState.dashInvulnerable = 180; // Diriləndə 3s təhlükəsizlik
    }

    if (typeof monster !== 'undefined' && monster) {
        monster.reset();
        monster.y = worldH - 38;
    }

    if (typeof twinTurrets !== 'undefined' && twinTurrets && twinTurrets.reset) {
        twinTurrets.reset();
    }

    if (typeof clearBullets === 'function') clearBullets();
    if (typeof clearEscapePass === 'function') clearEscapePass();
    if (typeof clearFloorProtection === 'function') clearFloorProtection();
    if (typeof particles !== 'undefined') particles.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;

    coins = [];
    powerUps = [];
    if (typeof spawnCoins === 'function') spawnCoins();
    if (typeof spawnPowerUps === 'function') spawnPowerUps();

    if (typeof updateUI === 'function') updateUI(true);
    if (typeof saveActiveRun === 'function') saveActiveRun();

    // Zümrüd dirilmə aurası zərrəcikləri
    if (typeof particles !== 'undefined' && player) {
        for (let i = 0; i < 40; i++) {
            particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 60,
                player.y + (Math.random() - 0.5) * 60,
                '#34d399',
                3.5
            ));
        }
    }
}
window.respawnOnCurrentFloor = respawnOnCurrentFloor;

function restartGame() {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    clearActiveRun();
    gameState.transitioning = false;
    keys = {};
    gameState.gold = 75;
    gameState.floor = 1;
    gameState.scoreProgress = 0;
    gameState.scoreReq = gameState.getFloorRequirement(1);
    gameState.borderOpen = false;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.totalTrapsPlaced = 0;
    gameState.totalTrapsDestroyed = 0;
    gameState.floorTime = 0;
    gameState.inGameSpeedLvl = 0;
    gameState.inGameMagnetLvl = 0;
    gameState.magnetRadius = getBaseMagnetRadius();
    gameState.dashCooldown = 0;
    gameState.coinCountdown = getCoinSpawnInterval();
    gameState.bulletUsage = { wall: 0, ice: 0, shock: 0, mine: 0, plasma: 0 };
    hasPassedBorder = false;

    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('hidden');
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');

    if (typeof cancelRebinding === 'function') cancelRebinding();
    if (typeof clearBullets === 'function') clearBullets();
    coins = [];
    if (typeof particles !== 'undefined') particles.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    if (typeof screenPulse !== 'undefined') screenPulse.alpha = 0;
    const targetFloor = (typeof activeTestTrackId === 'number' && activeTestTrackId >= 1) ? activeTestTrackId : 1;
    gameState.floor = targetFloor;
    if (typeof initFloorPlatforms === 'function') initFloorPlatforms(targetFloor);
    player.reset();
    monster.reset();
    if (typeof twinTurrets !== 'undefined' && twinTurrets.reset) twinTurrets.reset();
    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(targetFloor) : canvasHeight;
    monster.y = worldH - 38;
    cameraY = Math.max(0, Math.min(worldH - canvasHeight, player.y - canvasHeight * 0.55));
    window.cameraY = cameraY;
    gameState.dashInvulnerable = 120; // Başlanğıcda 2 saniyə təhlükəsizlik
    spawnCoins();
    updateUI();
    if (typeof activeTestTrackId !== 'number') {
        saveActiveRun();
    }

    // 🎵 Pause və Game Over fon musiqilərini dayandır və 1-ci Qatın fon musiqisini yenidən başlat
    if (typeof audio !== 'undefined') {
        if (typeof audio.stopPauseTheme === 'function') {
            audio.stopPauseTheme();
        }
        if (typeof audio.stopGameOverTheme === 'function') {
            audio.stopGameOverTheme();
        }
        if (typeof audio.setFloor === 'function') {
            audio.setFloor(1, true);
        }
    }

    // 🌀 Holoqram Doğuluş Animasiyası (Summon Sequence)
    playSummonIntro();
}

// ==================== 🌀 HOLOQRAMDAN DOĞULUŞ (SUMMON INTRO) MENECERİ ====================
let monsPortal = null;

function playSummonIntro(onFinish) {
    // Əvvəlki qatdan qalan partlayışları, uçan mətnləri, ekran titrəmələrini və güllələri dərhal təmizləyirik
    if (typeof particles !== 'undefined') particles.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    if (typeof screenPulse !== 'undefined') screenPulse.alpha = 0;
    if (typeof clearBullets === 'function') clearBullets();

    const skinId = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
    let animType = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'portal';

    gameState.isIntroPlaying = true;
    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : canvasHeight;
    monster.y = worldH - 38; // Lava həmişə ekranın alt kənarında sabit görünür

    // Kamera dərhal oyunçunun doğulduğu yerə fokuslanır
    cameraY = Math.max(0, Math.min(worldH - canvasHeight, player.y - canvasHeight * 0.55));
    window.cameraY = cameraY;

    // Yalnız 1-ci qatda: canavar nəriltisi və təlimat banneri
    if (gameState.floor === 1) {
        showFirstFloorLavaWarning();
    }

    const SpawnClass = window.MonsSpawnEffect || (typeof MonsPortalEffect !== 'undefined' ? MonsPortalEffect : null);
    if (SpawnClass) {
        monsPortal = new SpawnClass({
            x: player.x,
            y: player.y,
            targetY: player.y,
            skinId: skinId,
            animType: animType,
            onComplete: () => {
                gameState.isIntroPlaying = false;
                gameState.dashInvulnerable = 90; // Doğuluş bitdikdə 1.5s qoruma
                lastFrameTime = performance.now();
                physicsAccumulator = 0;
                initIngameQuantumTheme();
                if (typeof onFinish === 'function') onFinish();
            }
        });
    } else {
        gameState.isIntroPlaying = false;
        gameState.dashInvulnerable = 90;
        if (typeof onFinish === 'function') onFinish();
    }
}

// ==================== ⚠️ 1-Cİ QAT LAV CANAVARI XƏBƏRDARLIĞI VƏ NƏRİLTİSİ ====================
function showFirstFloorLavaWarning() {
    // 1. Zərif Kiber Bildiriş Səsi (Cyber Chime)
    setTimeout(() => {
        if (typeof audio !== 'undefined') {
            if (typeof audio.playCyberWarning === 'function') {
                audio.playCyberWarning();
            } else if (typeof audio.playRoar === 'function') {
                audio.playRoar();
            }
        }
        if (typeof triggerScreenPulse === 'function') {
            triggerScreenPulse('#ef4444', 0.65);
        }
    }, 350);

    // 2. Ekranın mərkəzində möhtəşəm Kiber Xəbərdarlıq Baneri
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const existing = document.getElementById('first-floor-lava-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'first-floor-lava-banner';
    banner.className = 'absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40 select-none transition-all duration-500 ease-out';
    banner.style.opacity = '0';
    banner.style.transform = 'scale(0.85)';

    banner.innerHTML = `
        <div class="flex flex-col items-center gap-3 px-7 py-5 rounded-3xl bg-slate-950/92 border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.75)] backdrop-blur-md max-w-[85%] text-center">
            <div class="flex items-center gap-3 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-orbitron font-extrabold px-6 py-2.5 rounded-2xl border border-amber-400/80 shadow-[0_0_25px_rgba(239,68,68,0.8)] text-base uppercase tracking-wider">
                <i class="fa-solid fa-triangle-exclamation text-yellow-300 text-2xl animate-bounce"></i>
                <span class="drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">⚠️ DİQQƏT: LAV CANAVARI YÜKSƏLİR!</span>
                <i class="fa-solid fa-fire text-amber-300 text-xl animate-pulse"></i>
            </div>
            <div class="text-sm font-mono text-amber-200 drop-shadow-md">
                🌋 Onu məğlub edərək və maneələri keçərək irəliləməlisiniz!
            </div>
            <div class="flex items-center gap-3 text-xs font-orbitron text-slate-300 bg-slate-900/85 px-4 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
                <span>🎮 WASD / Oxlar: Hərəkət</span>
                <span class="text-slate-500">•</span>
                <span>⚡ E / Boşluq: Dash & Bacarıq</span>
            </div>
        </div>
    `;

    container.appendChild(banner);

    // Zərif Fade-in və Scale animasiyası
    requestAnimationFrame(() => {
        banner.style.opacity = '1';
        banner.style.transform = 'scale(1)';
    });

    // 2.4 saniyə sonra zərifcə fade-out edərək silinir (oyunçunu ləngitmir)
    setTimeout(() => {
        if (banner && banner.parentNode) {
            banner.style.opacity = '0';
            banner.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (banner && banner.parentNode) banner.remove();
            }, 400);
        }
    }, 2400);
}
window.showFirstFloorLavaWarning = showFirstFloorLavaWarning;

// ==================== 🌀 QAT KEÇİDİ TELEPORTASİYASI (TELEPORT OUT ➔ TELEPORT IN) ====================
function playFloorTeleportTransition() {
    if (gameState.gameOver) return;
    gameState.transitioning = true;
    keys = {};

    // Qat keçidində əvvəlki döyüşün partlayışlarını, mətnlərini və güllələrini dərhal təmizləyirik
    if (typeof particles !== 'undefined') particles.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    if (typeof screenPulse !== 'undefined') screenPulse.alpha = 0;
    if (typeof clearBullets === 'function') clearBullets();

    const skinId = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSkin) ? permUpgrades.equippedSkin : 'default';
    let animType = (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim) ? permUpgrades.equippedSpawnAnim : 'portal';
    const SpawnClass = window.MonsSpawnEffect || (typeof MonsPortalEffect !== 'undefined' ? MonsPortalEffect : null);

    const startX = player.x;
    const startY = player.y;

    gameState.isIntroPlaying = true;
    const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor) : canvasHeight;
    monster.y = worldH - 38; // Lava bütün qatlarda aşağıda aydın görünür və dalğalanır

    if (SpawnClass) {
        // Mərhələ 1: Teleport Out (Mons portala sovrulur və yox olur)
        monsPortal = new SpawnClass({
            x: startX,
            y: startY,
            targetY: startY,
            skinId: skinId,
            animType: animType,
            mode: 'out',
            onComplete: () => {
                // Mons portala çəkildi və yox oldu!
                // Mərhələ 2: Qat artırılır və növbəti qatda Teleport In ilə çıxır
                if (typeof nextFloor === 'function') {
                    nextFloor();
                }
            }
        });
    } else {
        if (typeof nextFloor === 'function') nextFloor();
    }
}
window.playFloorTeleportTransition = playFloorTeleportTransition;

function togglePause() {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    if (gameState.gameOver) return;
    gameState.paused = !gameState.paused;
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        if (gameState.paused) {
            pauseOverlay.classList.remove('hidden');
            if (typeof audio !== 'undefined' && typeof audio.startPauseTheme === 'function') {
                audio.startPauseTheme();
            }
        } else {
            pauseOverlay.classList.add('hidden');
            if (typeof audio !== 'undefined') {
                if (typeof audio.stopPauseTheme === 'function') {
                    audio.stopPauseTheme();
                }
                if (typeof audio.startAmbient === 'function' && !audio.ambient.isPlaying) {
                    audio.startAmbient();
                }
            }
        }
    }
}

function pauseGame() {
    if (gameState.gameOver || gameState.paused) return;
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
    gameState.paused = true;
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.remove('hidden');
    if (typeof audio !== 'undefined' && typeof audio.startPauseTheme === 'function') {
        audio.startPauseTheme();
    }
}

// Brauzerdə pəncərə arxaya düşəndə fasilə
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGame();
    } else {
        lastFrameTime = performance.now();
        physicsAccumulator = 0;
    }
});

window.addEventListener('blur', () => {
    pauseGame();
});

window.addEventListener('focus', () => {
    lastFrameTime = performance.now();
    physicsAccumulator = 0;
});

function toggleAudio() {
    if (typeof audio !== 'undefined' && typeof audio.openSettings === 'function') {
        audio.openSettings();
    } else if (typeof audio !== 'undefined') {
        audio.init();
        audio.muted = !audio.muted;
        const btn = document.getElementById('btn-sound');
        if (btn) btn.innerHTML = audio.muted ? `<i class="fa-solid fa-volume-xmark text-sm text-rose-400"></i>` : `<i class="fa-solid fa-volume-high text-sm"></i>`;
    }
}

window.addEventListener('beforeunload', () => {
    if (!gameState.gameOver) {
        saveActiveRun();
    }
});

// İLKİN İŞƏSALMA
loadPermanentData();
if (typeof loadKeybinds === 'function') loadKeybinds();
resizeCanvas();
adjustViewportFit();

let isTestingSpecificTrack = false;
if (typeof activeTestTrackId === 'number' && activeTestTrackId >= 1) {
    isTestingSpecificTrack = true;
    gameState.floor = activeTestTrackId;
}

if (typeof initFloorPlatforms === 'function') initFloorPlatforms(gameState.floor || 1);
player.reset(true);
monster.reset();
if (typeof twinTurrets !== 'undefined' && twinTurrets.reset) twinTurrets.reset();
applyFloorModifier();

const hasLoadedRun = isTestingSpecificTrack ? false : loadActiveRun();

const startWorldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(gameState.floor || 1) : canvasHeight;
cameraY = Math.max(0, Math.min(startWorldH - canvasHeight, player.y - canvasHeight * 0.55));
window.cameraY = cameraY;
gameState.dashInvulnerable = 120; // Açılışda 2 saniyə toxunulmazlıq

const bestEl = document.getElementById('stat-best-floor');
if (bestEl) bestEl.innerText = `🏆 REKORD: ${gameState.bestFloor}`;
gameState.scoreReq = gameState.getFloorRequirement(gameState.floor);
if (typeof renderKeybindBadges === 'function') renderKeybindBadges();
if (typeof updatePermUpgradesUI === 'function') updatePermUpgradesUI();
if (typeof updateTurretsUI === 'function') updateTurretsUI();
updateUI();

if (gameState.activeModifier === 'darkness') {
    gameState.activeModifier = 'normal';
}

if (isTestingSpecificTrack) {
    if (typeof showToast === 'function') {
        showToast(`🎯 SINAQ REJİMİ: Yol ${activeTestTrackId} sınaqdan keçirilir!`, 'info');
    }
} else if (hasLoadedRun) {
    if (typeof showToast === 'function') {
        showToast(`🔄 Oyun ${gameState.floor}-ci Qatdan davam edir! (Vəziyyət tam saxlanıldı)`, 'success');
    }
} else {
    spawnCoins();
    spawnPowerUps();
    if (typeof getShieldStartChance === 'function' && Math.random() < getShieldStartChance()) {
        player.hasShield = true;
        if (typeof showToast === 'function') {
            showToast('🛡️ LABORATORİYA BONUSU: AEGIS QALXANI AKTİVDİR!', 'success');
        }
    }
}

// Doğuluş yalnız açıq başlanğıc istəyi və ya yeni oyun üçün göstərilir.
let shouldPlayIntro = !hasLoadedRun;
try {
    if (typeof sessionStorage !== 'undefined') {
        shouldPlayIntro = sessionStorage.getItem('floor_escape_play_intro') === 'true' || !hasLoadedRun;
        sessionStorage.removeItem('floor_escape_play_intro');
    }
    if (typeof permUpgrades !== 'undefined' && permUpgrades.equippedSpawnAnim) {
        if (!Array.isArray(permUpgrades.ownedSpawnAnims)) {
            permUpgrades.ownedSpawnAnims = [permUpgrades.equippedSpawnAnim];
        } else if (!permUpgrades.ownedSpawnAnims.includes(permUpgrades.equippedSpawnAnim)) {
            permUpgrades.ownedSpawnAnims.push(permUpgrades.equippedSpawnAnim);
        }
    }
} catch (e) {}
if (shouldPlayIntro) {
    playSummonIntro();
} else {
    gameState.isIntroPlaying = false;
    initIngameQuantumTheme();
}

gameState.paused = false;
if (window.audio && typeof audio.setFloor === 'function') {
    audio.init();
    audio.setFloor(gameState.floor, true);
}
const gameScreenContainer = document.getElementById('game-screen-container');
if (gameScreenContainer) {
    gameScreenContainer.classList.remove('hidden');
}
adjustViewportFit();

requestAnimationFrame(gameLoop);

function initIngameQuantumTheme() {
    const equipped = (typeof permUpgrades !== 'undefined') ? permUpgrades.equippedSpawnAnim : null;
    const isQuantum = ['singularity', 'supernova', 'synapse', 'abyssal'].includes(equipped);
    if (isQuantum) {
        if (typeof SingularitySpawnEffect !== 'undefined') {
            SingularitySpawnEffect.setTheme(equipped);
        }
        if (typeof player !== 'undefined' && player) {
            player.hasSingularity = true;
            player.singularityTheme = equipped;
        }
    } else {
        if (typeof player !== 'undefined' && player) {
            player.hasSingularity = false;
            player.singularityTheme = null;
        }
    }
}

// 🎯 Track Studio Sınaq Rejimi Bildiriş Paneli
if (typeof isTestingSpecificTrack !== 'undefined' && isTestingSpecificTrack) {
    const testBanner = document.createElement('div');
    testBanner.id = 'track-studio-test-banner';
    testBanner.style.cssText = 'position:fixed; top:56px; left:50%; transform:translateX(-50%); z-index:9999; padding:8px 16px; background:rgba(15,23,42,0.96); border:1px solid #10b981; border-radius:14px; box-shadow:0 0 25px rgba(16,185,129,0.35); display:flex; align-items:center; gap:12px; color:#fff; font-family:Orbitron,sans-serif; font-size:11px;';
    testBanner.innerHTML = `
        <span style="color:#34d399; font-weight:bold; display:flex; align-items:center; gap:6px;">
            🎮 SINAQ: YOL ${activeTestTrackId}
        </span>
        <span style="color:#94a3b8; font-family:system-ui,sans-serif; font-size:11px;">Redaktorda qurduğunuz canlı platforma və lavalar aktivdir.</span>
        <a href="editor/" style="padding:4px 10px; background:#059669; border-radius:6px; color:#fff; text-decoration:none; font-weight:bold; font-size:10px; display:flex; align-items:center; gap:4px;">
            ✏️ Redaktora Qayıt
        </a>
    `;
    document.body.appendChild(testBanner);
}
window.initIngameQuantumTheme = initIngameQuantumTheme;
setTimeout(initIngameQuantumTheme, 50);

window.triggerGameOver = triggerGameOver;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.pauseGame = pauseGame;
window.toggleAudio = toggleAudio;
window.setTargetFPS = setTargetFPS;
window.toggleFpsMode = toggleFpsMode;
window.playSummonIntro = playSummonIntro;


// 🧭 MƏRMİ NAVİQASİYA VƏ YÖN GÖSTƏRİCİ OX SİSTEMİ (AMMO WAYFINDER / COMPASS)
function drawAmmoNavigationIndicators(ctx) {
    if (typeof player === 'undefined' || !player || gameState.gameOver || gameState.paused || gameState.transitioning) return;
    const anim = (typeof permUpgrades !== 'undefined') ? permUpgrades.equippedSpawnAnim : null;
    if (anim !== 'tesseract' && anim !== 'glacial') return;

    const ammoType = anim === 'tesseract' ? 'tesseractAmmo' : 'iceAmmo';
    if (typeof powerUps === 'undefined' || !powerUps) return;
    const activeAmmos = powerUps.filter(p => p.type === ammoType);
    if (activeAmmos.length === 0) return;

    // Ən yaxın mərmini tapırıq
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < activeAmmos.length; i++) {
        const p = activeAmmos[i];
        const d = Math.hypot(p.x - player.x, p.y - player.y);
        if (d < minDist) {
            minDist = d;
            nearest = p;
        }
    }
    if (!nearest) return;

    const isTess = anim === 'tesseract';
    const mainColor = isTess ? '#c084fc' : '#38bdf8';
    const glowColor = isTess ? '#e879f9' : '#0ea5e9';
    const icon = isTess ? '⚛️' : '❄️';
    const ammoName = isTess ? 'QRAVİTON' : 'BUZ';

    const pScreenX = nearest.x;
    const pScreenY = nearest.y - cameraY;
    const isOffScreen = pScreenY < 45 || pScreenY > canvasHeight - 45;

    const now = performance.now();
    const pulse = Math.sin(now * 0.007) * 4;

    ctx.save();

    // 1. OYUNÇUNUN ƏTRAFINDA DÖNƏN KOMPAS OXU
    if (minDist > 65) {
        const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        const playerScreenX = player.x;
        const playerScreenY = player.y - cameraY;
        const orbitR = player.radius + 18 + pulse * 0.4;

        const ox = playerScreenX + Math.cos(angle) * orbitR;
        const oy = playerScreenY + Math.sin(angle) * orbitR;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(angle);

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = mainColor;

        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, -5.5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-6, 5.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // 2. ƏGƏR MƏRMİ EKRANDAN KƏNARDADIRSA -> EKRANIN KƏNARINDA NAVİQASİYA KAPSULU
    if (isOffScreen) {
        const isAbove = pScreenY < 45;
        const edgeY = isAbove ? 65 : canvasHeight - 50;
        const edgeX = Math.max(95, Math.min(canvasWidth - 95, pScreenX));

        ctx.save();
        ctx.translate(edgeX, edgeY + pulse * (isAbove ? -1 : 1));

        const distM = Math.round(minDist / 10);
        const label = `${isAbove ? '▲' : '▼'} ${icon} ${ammoName} [${distM}m]`;

        ctx.font = '900 11px Orbitron, sans-serif';
        const tw = ctx.measureText(label).width;
        const bw = tw + 20;
        const bh = 22;

        ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 1);

        ctx.restore();
    } 
    // 3. ƏGƏR MƏRMİ EKRANDADIRSA -> MƏRMİNİN ÜZƏRİNDƏ ENƏN İŞARƏTLƏYİCİ OX
    else {
        ctx.save();
        ctx.translate(pScreenX, pScreenY - 32 + pulse);

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-6, -2);
        ctx.lineTo(6, -2);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 9px Orbitron, sans-serif';
        const tag = `${icon} GÖTÜR`;
        const tw = ctx.measureText(tag).width;
        const bw = tw + 12;

        ctx.fillStyle = 'rgba(8, 14, 28, 0.88)';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -18, bw, 14, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, 0, -10.5);

        ctx.restore();
    }

    ctx.restore();
}


// 🧭 MONS VƏ ANİMASİYA ÜZƏRİNDƏKİ İSTİQAMƏT OXU (Mərmiyə tərəf tuşlanır)
function drawMonsAmmoArrow(ctx) {
    if (typeof player === 'undefined' || !player || gameState.gameOver || gameState.paused || gameState.transitioning) return;
    const anim = (typeof permUpgrades !== 'undefined') ? permUpgrades.equippedSpawnAnim : null;
    if (anim !== 'tesseract' && anim !== 'glacial') return;

    const ammoType = anim === 'tesseract' ? 'tesseractAmmo' : 'iceAmmo';
    if (typeof powerUps === 'undefined' || !powerUps) return;
    const activeAmmos = powerUps.filter(p => p.type === ammoType);
    if (activeAmmos.length === 0) return;

    // Ən yaxın mərmini tapırıq
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < activeAmmos.length; i++) {
        const p = activeAmmos[i];
        const d = Math.hypot(p.x - player.x, p.y - player.y);
        if (d < minDist) {
            minDist = d;
            nearest = p;
        }
    }
    if (!nearest) return;

    const isTess = anim === 'tesseract';
    const mainColor = isTess ? '#f0abfc' : '#38bdf8';
    const glowColor = isTess ? '#c084fc' : '#0ea5e9';
    const accentColor = '#ffffff';

    const dx = nearest.x - player.x;
    const dy = nearest.y - player.y;
    const angle = Math.atan2(dy, dx);

    const now = performance.now();
    const pulse = Math.sin(now * 0.008) * 3;

    // 🎯 1. MONS-UN VƏ ANİMASİYASININ DÜZ ÜSTÜNDƏ PARLAQ İSTİQAMƏT OXU
    ctx.save();
    const arrowCenterY = player.y - player.radius - 18;
    ctx.translate(player.x, arrowCenterY);

    // Zərif neon halqa
    ctx.strokeStyle = isTess ? 'rgba(192, 132, 252, 0.4)' : 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 13 + pulse * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Mərmiyə tərəf fırlanan neon ox
    ctx.save();
    ctx.rotate(angle);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;

    // Ox Gövdəsi (Stealth Arrowhead)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(14 + pulse, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();

    // Daxili neon xətt
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(11 + pulse, 0);
    ctx.lineTo(-1, 0);
    ctx.stroke();

    ctx.restore();

    // Mini Məsafə İndikatoru
    const distM = Math.round(minDist / 10);
    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${distM}m`, 0, -18);

    ctx.restore();

    // 🎯 2. MƏRMİNİN ÜSTÜNDƏKİ İŞARƏTLƏYİCİ ENƏN OX (Mərminin yerini uzaqdan parıldadır)
    ctx.save();
    const pPulse = Math.sin(now * 0.009) * 4;
    ctx.translate(nearest.x, nearest.y - 28 + pPulse);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-6, -3);
    ctx.lineTo(6, -3);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9px "Orbitron", monospace';
    const tag = isTess ? '⚛️ MƏRMİ' : '❄️ BUZ';
    const tw = ctx.measureText(tag).width;
    const bw = tw + 10;
    ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -18, bw, 13, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, 0, -11);

    ctx.restore();
}
