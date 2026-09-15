// ============================================================================
// 🌋 FLOOR ESCAPE - VİZUAL YOL REDAKTORU VƏ KASKAD SİMULYATORU (TRACK STUDIO)
// ============================================================================

(function() {
    // Kətan və kontekst
    const canvas = document.getElementById('editorCanvas');
    const ctx = canvas.getContext('2d');
    const canvasWrapper = document.getElementById('canvas-wrapper');

    // DOM Elementləri
    const trackSelect = document.getElementById('track-select');
    const trackNameInput = document.getElementById('track-name-input');
    const btnSave = document.getElementById('btn-save');
    const btnExport = document.getElementById('btn-export');
    const btnModeTest = document.getElementById('btn-mode-test');
    const modeText = document.getElementById('mode-text');
    const btnAddRock = document.getElementById('btn-add-rock');
    const btnAddLava = document.getElementById('btn-add-lava');

    const rockProps = document.getElementById('rock-props');
    const lavaProps = document.getElementById('lava-props');
    const noSelectionHint = document.getElementById('no-selection-hint');

    const inputRockW = document.getElementById('input-rock-w');
    const valRockW = document.getElementById('val-rock-w');
    const inputRockH = document.getElementById('input-rock-h');
    const valRockH = document.getElementById('val-rock-h');
    const btnCenterRock = document.getElementById('btn-center-rock');
    const btnDeleteElement = document.getElementById('btn-delete-element');

    const inputLavaW = document.getElementById('input-lava-w');
    const valLavaW = document.getElementById('val-lava-w');
    const btnDirAuto = document.getElementById('btn-dir-auto');
    const btnDirRight = document.getElementById('btn-dir-right');
    const btnDirLeft = document.getElementById('btn-dir-left');
    const btnDeleteLava = document.getElementById('btn-delete-lava');
    const btnToggleTerminate = document.getElementById('btn-toggle-terminate');
    const textTerminateStatus = document.getElementById('text-terminate-status');
    const iconTerminateStatus = document.getElementById('icon-terminate-status');
    const btnResetCut = document.getElementById('btn-reset-cut');

    const statRocksCount = document.getElementById('stat-rocks-count');
    const statLavaCount = document.getElementById('stat-lava-count');
    const coordDisplay = document.getElementById('coord-display');

    const jsonModal = document.getElementById('json-modal');
    const jsonOutput = document.getElementById('json-output');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCopyJson = document.getElementById('btn-copy-json');
    const btnDownloadJson = document.getElementById('btn-download-json');
    const editorToast = document.getElementById('editor-toast');

    // Vəziyyət (State)
    let allTracks = [];
    let currentTrackId = 1;
    let currentTrack = null;
    let selectedType = null; // 'rock' | 'lava' | null
    let selectedIndex = -1;
    let hoveredType = null;
    let hoveredIndex = -1;

    // Sürükləmə (Drag, Resize, Direction & Mid-Air Height Gizmo)
    let isDragging = false;
    let isResizing = false;
    let isDraggingLavaDir = false;
    let activeLavaHandle = null;
    let isDraggingMidAirCut = false;
    let activeMidAirHandle = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Simulyasiya vaxtı
    let animTime = 0;
    let lastFrame = performance.now();

    // Sınaq Rejimi (Playtest Mode)
    let isTestMode = false;
    let testPlayer = {
        x: 400,
        y: 1600,
        radius: 16,
        vx: 0,
        vy: 0,
        speed: 280,
        health: 100,
        maxHealth: 100,
        invulnerableTime: 0,
        hitFlash: 0,
        reachedFinish: false
    };
    let keys = {};

    // 1. İLKİN YÜKLƏMƏ
    async function initEditor() {
        // Mövcud yolları oxuyuruq
        if (typeof window.FLOOR_PATTERNS !== 'undefined' && window.FLOOR_PATTERNS.tracks) {
            allTracks = JSON.parse(JSON.stringify(window.FLOOR_PATTERNS.tracks));
        } else {
            try {
                const res = await fetch('../data/floor_patterns.json?v=' + Date.now());
                if (res.ok) {
                    const data = await res.json();
                    allTracks = data.tracks || [];
                }
            } catch(e) {
                console.warn('JSON oxunarkən xəta, ehtiyat sxem yaradılır:', e);
            }
        }

        // Əgər 30 yol tam deyilsə, 30-a tamamla
        if (allTracks.length < 30) {
            for (let i = allTracks.length + 1; i <= 30; i++) {
                allTracks.push({
                    id: i,
                    name: `Yol ${i}`,
                    worldHeight: 1800,
                    rocks: [
                        { x: 100, y: 1380, w: 240, h: 42 },
                        { x: 460, y: 1380, w: 240, h: 42 },
                        { x: 250, y: 900,  w: 300, h: 42 },
                        { x: 240, y: 350,  w: 320, h: 42 }
                    ],
                    lavaSources: [
                        { x: 80, y: 300, w: 24 }
                    ]
                });
            }
        }

        // Seçim menyusunu doldur
        trackSelect.innerHTML = '';
        allTracks.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `Yol ${t.id}: ${t.name || 'Ad yoxdur'}`;
            trackSelect.appendChild(opt);
        });

        // 1-ci yolu yüklə
        loadTrack(1);

        // Başlanğıcda kətanı ortalara sürüşdür
        canvasWrapper.scrollTop = 900;

        // Hadisələri qoş
        setupEventListeners();

        // Render dövrəsini başlat
        requestAnimationFrame(renderLoop);
    }

    // 2. YOLUN YÜKLƏNMƏSİ
    function loadTrack(trackId) {
        currentTrackId = parseInt(trackId, 10);
        trackSelect.value = currentTrackId;

        const found = allTracks.find(t => t.id === currentTrackId);
        if (found) {
            currentTrack = JSON.parse(JSON.stringify(found));
        } else {
            currentTrack = {
                id: currentTrackId,
                name: `Yol ${currentTrackId}`,
                worldHeight: 1800,
                rocks: [],
                lavaSources: []
            };
        }

        // Təhlükəsizlik
        if (!currentTrack.rocks) currentTrack.rocks = [];
        if (!currentTrack.lavaSources) currentTrack.lavaSources = [];

        trackNameInput.value = currentTrack.name || `Yol ${currentTrackId}`;
        deselect();
        updateStats();

        // Sınaq oyunçusunu resetlə
        testPlayer.x = 400;
        testPlayer.y = 1600;
        testPlayer.vx = 0;
        testPlayer.vy = 0;

        showToast(`Yol ${currentTrackId} yükləndi!`, 'info');
    }

    // 3. STATİSTİKA VƏ PANELLƏR
    function updateStats() {
        if (!currentTrack) return;
        statRocksCount.textContent = currentTrack.rocks.length;
        statLavaCount.textContent = currentTrack.lavaSources.length;
    }

    function selectElement(type, index) {
        selectedType = type;
        selectedIndex = index;

        noSelectionHint.classList.add('hidden');

        if (type === 'rock') {
            const rock = currentTrack.rocks[index];
            rockProps.classList.remove('hidden');
            lavaProps.classList.add('hidden');

            inputRockW.value = rock.w;
            valRockW.textContent = rock.w;
            inputRockH.value = rock.h;
            valRockH.textContent = rock.h;
        } else if (type === 'lava') {
            const lava = currentTrack.lavaSources[index];
            lavaProps.classList.remove('hidden');
            rockProps.classList.add('hidden');

            inputLavaW.value = lava.w || 24;
            valLavaW.textContent = lava.w || 24;

            // İstiqamət düymələri
            const dir = lava.direction || 'auto';
            btnDirAuto.classList.toggle('active', dir === 'auto');
            btnDirRight.classList.toggle('active', dir === 'right');
            btnDirLeft.classList.toggle('active', dir === 'left');

            // Platformada və ya havada sonlanma statusu
            updateTerminateUI(lava);
        }
    }

    function updateTerminateUI(lava) {
        if (!btnToggleTerminate || !textTerminateStatus) return;
        if (!lava) {
            textTerminateStatus.textContent = '⬇️ Tam Aşağı Axır';
            iconTerminateStatus.className = 'fa-solid fa-water text-cyan';
            btnToggleTerminate.style.background = 'rgba(30, 41, 59, 0.9)';
            btnToggleTerminate.style.borderColor = '#475569';
            btnToggleTerminate.style.color = '#94a3b8';
            if (btnResetCut) btnResetCut.classList.add('hidden');
            return;
        }

        if (lava.endY) {
            textTerminateStatus.textContent = `🛑 Havada Sonlanır (Y: ${Math.round(lava.endY)})`;
            iconTerminateStatus.className = 'fa-solid fa-arrows-down-to-line text-orange';
            btnToggleTerminate.style.background = 'rgba(239, 68, 68, 0.25)';
            btnToggleTerminate.style.borderColor = '#ef4444';
            btnToggleTerminate.style.color = '#ff6b6b';
            if (btnResetCut) btnResetCut.classList.remove('hidden');
        } else if (lava.stopOnHit) {
            textTerminateStatus.textContent = '🛑 Platformada Sonlanır';
            iconTerminateStatus.className = 'fa-solid fa-hand text-orange';
            btnToggleTerminate.style.background = 'rgba(239, 68, 68, 0.25)';
            btnToggleTerminate.style.borderColor = '#ef4444';
            btnToggleTerminate.style.color = '#ff6b6b';
            if (btnResetCut) btnResetCut.classList.remove('hidden');
        } else {
            textTerminateStatus.textContent = '⬇️ Tam Aşağı Axır';
            iconTerminateStatus.className = 'fa-solid fa-water text-cyan';
            btnToggleTerminate.style.background = 'rgba(30, 41, 59, 0.9)';
            btnToggleTerminate.style.borderColor = '#475569';
            btnToggleTerminate.style.color = '#94a3b8';
            if (btnResetCut) btnResetCut.classList.add('hidden');
        }
    }

    function deselect() {
        selectedType = null;
        selectedIndex = -1;
        noSelectionHint.classList.remove('hidden');
        rockProps.classList.add('hidden');
        lavaProps.classList.add('hidden');
    }

    // 4. KASKAD HESABLANMASI (Lavanın qaya üstündə axması)
    function traceCascadePaths(sources, rocks, monsterY = 1750) {
        const paths = [];

        for (let sIdx = 0; sIdx < sources.length; sIdx++) {
            const src = sources[sIdx];
            let currX = src.x;
            let currW = src.w || 24;
            let currY = src.y;

            const path = {
                sourceIndex: sIdx,
                source: { x: currX, y: currY, w: currW },
                falls: [],
                shelves: []
            };

            const maxSteps = 5;
            for (let d = 0; d < maxSteps; d++) {
                const streamCenter = currX + currW * 0.5;

                // Ən yaxın alt qaya
                let hitRock = null;
                let minHitY = monsterY;

                for (const rock of rocks) {
                    if (rock.y > currY + 10 && rock.y < minHitY) {
                        if (streamCenter >= rock.x - 2 && streamCenter <= rock.x + rock.w + 2) {
                            hitRock = rock;
                            minHitY = rock.y;
                        }
                    }
                }

                // 🎯 İstifadəçi istənilən yerdə (iki platformanın ortasında) sonlandırıbsa (endY və ya customBottomY):
                let effectiveBottomY = minHitY;
                let isMidAir = false;

                const customCutY = src.endY || src.customBottomY;
                if (customCutY && customCutY > currY + 15 && customCutY < minHitY) {
                    effectiveBottomY = customCutY;
                    isMidAir = true;
                }

                const fallH = Math.max(10, effectiveBottomY - currY);
                path.falls.push({
                    x: currX,
                    y: currY,
                    w: currW,
                    h: fallH,
                    isMidAir: isMidAir,
                    bottomY: effectiveBottomY
                });

                if (isMidAir) {
                    // Havada istənilən nöqtədə sonlandı! Aşağıya daha heç bir şey getmir!
                    path.terminated = true;
                    path.midAirTermination = {
                        sourceIndex: sIdx,
                        x: currX,
                        y: effectiveBottomY,
                        w: currW
                    };
                    break;
                }

                if (!hitRock || minHitY >= monsterY) {
                    path.monsterImpact = { x: streamCenter, y: monsterY };
                    break;
                }

                // Qayaya dəydi
                const hitX = Math.max(hitRock.x + 8, Math.min(hitRock.x + hitRock.w - 8, streamCenter));
                const distToLeft = hitX - hitRock.x;
                const distToRight = (hitRock.x + hitRock.w) - hitX;

                // İstiqamət: İstifadəçi xüsusi seçibsə ona uyğunlaşır, əks halda ən yaxın kənara
                let outX;
                const savedOutX = (src.shelfOffsets && src.shelfOffsets[d] !== undefined)
                    ? src.shelfOffsets[d]
                    : (d === 0 ? src.customOutX : undefined);

                let goRight;
                if (savedOutX !== undefined) {
                    outX = Math.max(hitRock.x + 10, Math.min(hitRock.x + hitRock.w - 10, savedOutX));
                    goRight = (outX >= hitX);
                } else {
                    goRight = (distToRight < distToLeft);
                    if (src.direction === 'right') goRight = true;
                    if (src.direction === 'left') goRight = false;
                    outX = goRight ? (hitRock.x + hitRock.w - 14) : (hitRock.x + 14);
                }

                const isTerminated = !!src.stopOnHit;
                path.shelves.push({
                    sourceIndex: sIdx,
                    step: d,
                    rock: hitRock,
                    hitX: hitX,
                    outX: outX,
                    goRight: goRight,
                    terminated: isTerminated
                });

                // Əgər istifadəçi bu lavı töküldüyü platformada sonlandırıbsa, aşağıya yeni şəlalə getmir!
                if (isTerminated) {
                    path.terminated = true;
                    break;
                }

                currW = Math.min(currW, 26);
                currX = outX - currW * 0.5;
                currY = hitRock.y + hitRock.h - 2;
            }

            paths.push(path);
        }

        return paths;
    }

    // 5. ƏSAS RENDER DÖVRÜ
    function renderLoop(now) {
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;
        animTime += dt;

        // Sınaq rejimi fizika yenilənməsi
        if (isTestMode) {
            updateTestPlayerPhysics(dt);
        }

        // Kətanı təmizlə
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Şəbəkə (Grid)
        drawEditorGrid();

        // Kaskad şüaları
        const cascadePaths = traceCascadePaths(currentTrack.lavaSources, currentTrack.rocks, 1750);

        // 1. ŞƏLALƏ AXINLARI VƏ LAVA MƏNBƏLƏRİ
        for (let pIdx = 0; pIdx < cascadePaths.length; pIdx++) {
            const p = cascadePaths[pIdx];

            // Mənbə oyuqu
            if (typeof LavaEngine !== 'undefined') {
                LavaEngine.drawLavaSourceRock(ctx, p.source.x, p.source.y, p.source.w, pIdx, animTime);
            } else {
                ctx.fillStyle = '#ff7700';
                ctx.fillRect(p.source.x - 4, p.source.y - 12, p.source.w + 8, 14);
            }

            // Şaquli axınlar
            for (let fIdx = 0; fIdx < p.falls.length; fIdx++) {
                const fall = p.falls[fIdx];
                const isLastFall = (fIdx === p.falls.length - 1);
                const isTerminatedFall = !!(p.terminated && isLastFall);
                const isMidAir = !!fall.isMidAir;

                if (typeof LavaEngine !== 'undefined') {
                    LavaEngine.drawPlatformWaterfall(ctx, animTime + fIdx * 0.7, fall.x, fall.y, fall.w, fall.h, isTerminatedFall, isMidAir);
                    if (isMidAir && typeof LavaEngine.drawMidAirLavaTip === 'function') {
                        LavaEngine.drawMidAirLavaTip(ctx, animTime, fall.x, fall.bottomY, fall.w);
                    }
                    if (fIdx > 0 && !fall.isMidAir) LavaEngine.drawSpillwayLip(ctx, fall.x, fall.w, fall.y + 2);
                } else {
                    ctx.fillStyle = 'rgba(255, 100, 0, 0.85)';
                    ctx.fillRect(fall.x, fall.y, fall.w, fall.h);
                }
            }

            // 🎯 Havada Sonlanma Tutacağı (Mid-Air Termination Gizmo - yalnız redaktor rejimində)
            if (p.midAirTermination && !isTestMode) {
                const mat = p.midAirTermination;
                const isSelectedLava = (selectedType === 'lava' && selectedIndex === mat.sourceIndex);

                ctx.save();
                ctx.shadowColor = '#ff3b00';
                ctx.shadowBlur = isSelectedLava ? 12 : 6;
                ctx.fillStyle = isSelectedLava ? '#ff3b00' : 'rgba(239, 68, 68, 0.8)';
                ctx.beginPath();
                ctx.arc(mat.x + mat.w * 0.5, mat.y + 6, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↕', mat.x + mat.w * 0.5, mat.y + 6);

                // Yanındakı zərif etiket
                if (isSelectedLava) {
                    ctx.fillStyle = '#ff9999';
                    ctx.font = 'bold 10px Orbitron, monospace';
                    ctx.fillText(`🛑 SONLANMA (Y:${Math.round(mat.y)})`, mat.x + mat.w * 0.5, mat.y - 12);
                }
                ctx.restore();
            }
        }

        // 2. QAYALAR (PLATFORMALAR)
        for (let rIdx = 0; rIdx < currentTrack.rocks.length; rIdx++) {
            const rock = currentTrack.rocks[rIdx];
            const isSelected = (selectedType === 'rock' && selectedIndex === rIdx);

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 6;

            const rockGrad = ctx.createLinearGradient(rock.x, rock.y, rock.x, rock.y + rock.h);
            rockGrad.addColorStop(0, '#334155');
            rockGrad.addColorStop(0.4, '#1e293b');
            rockGrad.addColorStop(1, '#0f172a');

            ctx.fillStyle = rockGrad;
            ctx.strokeStyle = isSelected ? '#38bdf8' : '#475569';
            ctx.lineWidth = isSelected ? 3 : 2;

            ctx.beginPath();
            ctx.roundRect(rock.x, rock.y, rock.w, rock.h, 8);
            ctx.fill();
            ctx.stroke();

            // Kənar xətti
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(rock.x + 8, rock.y + 2);
            ctx.lineTo(rock.x + rock.w - 8, rock.y + 2);
            ctx.stroke();

            // Seçilibsə Resize tutacağı
            if (isSelected) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(rock.x + rock.w, rock.y + rock.h / 2, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();

            // Qaya üstü lava axını
            for (const path of cascadePaths) {
                for (const shelf of path.shelves) {
                    if (shelf.rock === rock) {
                        if (shelf.terminated) {
                            // 🛑 Platformada Sonlanmış ORQANİK QAYNAR LAVA GÖLMƏÇƏSİ (Düz kəsik yoxdur, təbii yayılır!)
                            if (typeof LavaEngine !== 'undefined' && typeof LavaEngine.drawTerminatedLavaPool === 'function') {
                                LavaEngine.drawTerminatedLavaPool(ctx, animTime, shelf.hitX, rock.y, 24);
                            } else {
                                ctx.save();
                                ctx.shadowColor = '#ff5500';
                                ctx.shadowBlur = 18;
                                ctx.fillStyle = '#ff6a00';
                                ctx.beginPath();
                                ctx.ellipse(shelf.hitX, rock.y + 2, 24, 7, 0, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.restore();
                            }

                            // Zərif kliklənə bilən status nişanı (gölməçənin üstündə səliqəli və şıq)
                            ctx.save();
                            ctx.shadowColor = '#ef4444';
                            ctx.shadowBlur = 12;
                            ctx.fillStyle = '#ef4444';
                            ctx.beginPath();
                            ctx.arc(shelf.hitX, rock.y - 12, 10, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();

                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 10px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('🛑', shelf.hitX, rock.y - 12);

                            ctx.fillStyle = '#ff9999';
                            ctx.font = 'bold 10px Orbitron, monospace';
                            ctx.fillText('SONLANDI', shelf.hitX, rock.y - 26);
                            ctx.restore();
                        } else {
                            // Normal axan lava səthi
                            const startX = Math.min(shelf.hitX, shelf.outX) - 2;
                            const endX = Math.max(shelf.hitX, shelf.outX) + 2;

                            ctx.save();
                            let surface = ctx.createLinearGradient(0, rock.y - 4, 0, rock.y + 6);
                            surface.addColorStop(0, '#ffce55');
                            surface.addColorStop(0.5, '#fa7b16');
                            surface.addColorStop(1, '#98210a');
                            ctx.fillStyle = surface;
                            ctx.beginPath();
                            ctx.roundRect(startX, rock.y - 2, Math.max(16, endX - startX), 7, 2);
                            ctx.fill();
                            ctx.restore();

                            // 🎯 Lavanın Platformadakı Tökülmə Tutacağı (Spillway Gizmo Handle)
                            ctx.save();
                            ctx.shadowColor = '#ff6600';
                            ctx.shadowBlur = 14;
                            ctx.fillStyle = '#ff6600';
                            ctx.beginPath();
                            ctx.arc(shelf.outX, rock.y + 2, 11, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 2.5;
                            ctx.stroke();

                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 11px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('↔', shelf.outX, rock.y + 2);

                            // Qayanın üstündə tökülmə nöqtəsi yazısı
                            ctx.fillStyle = '#ffd567';
                            ctx.font = 'bold 10px Orbitron, monospace';
                            ctx.fillText(`TÖKÜLMƏ X:${Math.round(shelf.outX)}`, shelf.outX, rock.y - 10);
                            ctx.restore();
                        }
                    }
                }
            }
            // Sürüklənərkən və ya seçilərkən canlı koordinat etiketi
            if (isSelected || (hoveredType === 'rock' && hoveredIndex === rIdx)) {
                ctx.save();
                ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
                ctx.font = 'bold 11px Orbitron, monospace';
                ctx.fillText(`🧱 X:${rock.x} Y:${rock.y} (W:${rock.w})`, rock.x, rock.y - 8);
                ctx.restore();
            }
        }

        // 3. LAVA MƏNBƏYİ SEÇİM İNDİKATORU
        for (let lIdx = 0; lIdx < currentTrack.lavaSources.length; lIdx++) {
            const lava = currentTrack.lavaSources[lIdx];
            const isSelected = (selectedType === 'lava' && selectedIndex === lIdx);
            const isHovered = (hoveredType === 'lava' && hoveredIndex === lIdx);

            if (isSelected || isHovered) {
                ctx.save();
                ctx.strokeStyle = isSelected ? '#f97316' : '#fdba74';
                ctx.lineWidth = isSelected ? 2.5 : 1.5;
                ctx.setLineDash([5, 4]);
                ctx.strokeRect(lava.x - 14, lava.y - 24, (lava.w || 24) + 28, 36);

                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 11px Orbitron, monospace';
                ctx.fillText(`🔥 LAVA X:${lava.x} Y:${lava.y}`, lava.x - 12, lava.y - 30);

                // İstiqaməti əllə dəyişmək üçün Tez Ox Düymələri (◀ və ▶)
                const curDir = lava.direction || 'auto';
                ctx.setLineDash([]);

                // Sol düyməcik
                ctx.fillStyle = curDir === 'left' ? '#f97316' : 'rgba(30, 41, 59, 0.9)';
                ctx.beginPath();
                ctx.roundRect(lava.x - 42, lava.y - 12, 24, 22, 4);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('◀', lava.x - 30, lava.y - 1);

                // Sağ düyməcik
                ctx.fillStyle = curDir === 'right' ? '#f97316' : 'rgba(30, 41, 59, 0.9)';
                ctx.beginPath();
                ctx.roundRect(lava.x + (lava.w || 24) + 18, lava.y - 12, 24, 22, 4);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.fillText('▶', lava.x + (lava.w || 24) + 30, lava.y - 1);

                ctx.restore();
            }
        }

        // 4. LAVA CANAVARI (Ən aşağıda)
        drawLavaMonsterVisual(1750, animTime);

        // 5. SINAQ OYUNÇUSU (Əgər test rejimi aktivdirsə)
        if (isTestMode) {
            drawTestPlayerVisual();
        }

        requestAnimationFrame(renderLoop);
    }

    // 6. KƏTAN ŞƏBƏKƏSİ
    function drawEditorGrid() {
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;

        // Şaquli xəttlər (hər 100px)
        for (let x = 100; x < canvas.width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Üfüqi xəttlər (hər 100px)
        for (let y = 100; y < canvas.height; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Mərkəz oxu (X = 400)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(400, 0);
        ctx.lineTo(400, canvas.height);
        ctx.stroke();

        ctx.restore();
    }

    // 7. LAVA CANAVARI VİZUALI
    function drawLavaMonsterVisual(monsterY, t) {
        ctx.save();
        const grad = ctx.createLinearGradient(0, monsterY, 0, canvas.height);
        grad.addColorStop(0, '#ff3b00');
        grad.addColorStop(0.3, '#d92700');
        grad.addColorStop(1, '#660b00');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, monsterY);
        for (let x = 0; x <= canvas.width; x += 20) {
            const wave = Math.sin(x * 0.02 + t * 4) * 6;
            ctx.lineTo(x, monsterY + wave);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 LAVA CANAVARI', 400, monsterY + 36);
        ctx.restore();
    }

    // 8. SINAQ OYUNÇUSU (CANLI FİZİKA VƏ KAMERA)
    function updateTestPlayerPhysics(dt) {
        // [R] basıldıqda yenidən başlanğıca qayıt
        if (keys['KeyR']) {
            testPlayer.x = 400;
            testPlayer.y = 1600;
            testPlayer.health = 100;
            testPlayer.invulnerableTime = 0.5;
            testPlayer.reachedFinish = false;
            const targetScroll = Math.max(0, 1600 - canvasWrapper.clientHeight * 0.7);
            canvasWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
            return;
        }

        const speed = testPlayer.speed;
        let dx = 0;
        let dy = 0;

        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        testPlayer.x += dx * speed * dt;
        testPlayer.y += dy * speed * dt;

        // Divar sərhədləri
        testPlayer.x = Math.max(30, Math.min(canvas.width - 30, testPlayer.x));
        testPlayer.y = Math.max(100, Math.min(1720, testPlayer.y));

        // Qayalarla toqquşma (itələmə)
        const pr = testPlayer.radius;
        if (currentTrack && currentTrack.rocks) {
            for (const rock of currentTrack.rocks) {
                const closestX = Math.max(rock.x, Math.min(testPlayer.x, rock.x + rock.w));
                const closestY = Math.max(rock.y, Math.min(testPlayer.y, rock.y + rock.h));
                const distSq = (testPlayer.x - closestX) ** 2 + (testPlayer.y - closestY) ** 2;

                if (distSq < pr * pr && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = pr - dist;
                    testPlayer.x += ((testPlayer.x - closestX) / dist) * overlap;
                    testPlayer.y += ((testPlayer.y - closestY) / dist) * overlap;
                }
            }
        }

        // 🎥 Kamera İzləməsi (Avtomatik və hamar skroll)
        const idealScroll = testPlayer.y - canvasWrapper.clientHeight * 0.55;
        const scrollDiff = idealScroll - canvasWrapper.scrollTop;
        if (Math.abs(scrollDiff) > 5) {
            canvasWrapper.scrollTop += scrollDiff * 0.12;
        }

        // Taymerlər
        if (testPlayer.invulnerableTime > 0) testPlayer.invulnerableTime -= dt;
        if (testPlayer.hitFlash > 0) testPlayer.hitFlash -= dt;

        // 🔥 Lava Kaskad Axınları ilə Toqquşma Yoxlanışı
        if (testPlayer.invulnerableTime <= 0 && currentTrack && currentTrack.lavaSources) {
            const cascadePaths = traceCascadePaths(currentTrack.lavaSources, currentTrack.rocks, 1750);
            let hitLava = false;

            for (const p of cascadePaths) {
                for (const f of p.falls) {
                    // Fall düzbucaqlısı
                    if (testPlayer.x + pr * 0.7 > f.x && testPlayer.x - pr * 0.7 < f.x + f.w &&
                        testPlayer.y + pr * 0.7 > f.y && testPlayer.y - pr * 0.7 < f.y + f.h) {
                        hitLava = true;
                        break;
                    }
                }
                if (hitLava) break;
                for (const sh of p.shelves) {
                    if (testPlayer.x + pr * 0.7 > sh.x && testPlayer.x - pr * 0.7 < sh.x + sh.w &&
                        testPlayer.y + pr * 0.7 > sh.y && testPlayer.y - pr * 0.7 < sh.y + sh.h) {
                        hitLava = true;
                        break;
                    }
                }
                if (hitLava) break;
            }

            if (hitLava) {
                testPlayer.health -= 35;
                testPlayer.invulnerableTime = 0.9;
                testPlayer.hitFlash = 0.4;

                if (testPlayer.health <= 0) {
                    showToast(`💀 Lavaya düşdünüz! Canınız tükəndi. Başlanğıca qaytarılırsınız.`, 'warning');
                    testPlayer.x = 400;
                    testPlayer.y = 1600;
                    testPlayer.health = 100;
                    testPlayer.invulnerableTime = 1.0;
                    const targetScroll = Math.max(0, 1600 - canvasWrapper.clientHeight * 0.7);
                    canvasWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
                } else {
                    showToast(`⚠️ Lava Zədəsi! Can: ${testPlayer.health}%`, 'warning');
                }
            }
        }

        // 🏆 Zirvəyə (Qələbə Portalına) Çatmaq
        if (testPlayer.y <= 180 && !testPlayer.reachedFinish) {
            testPlayer.reachedFinish = true;
            showToast(`🎉 TƏBRİKLƏR! Yol ${currentTrack ? currentTrack.id : 1} sınaqdan uğurla keçdi! "Oyunda Sınaqdan Keçir" ilə canlı rejimdə yoxlaya bilərsiniz.`, 'success');
        }
    }

    // Zirvə Portalı (Çıxış Qapısı)
    function drawFinishPortalVisual() {
        const portalY = 120;
        const portalX = 400;
        ctx.save();
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 25;
        
        // Fırlanan xarici halqa
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(portalX, portalY, 60, 24, animTime * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        // Daxili parlaqlıq
        const grad = ctx.createRadialGradient(portalX, portalY, 5, portalX, portalY, 50);
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(portalX, portalY, 50, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 13px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 ÇIXIŞ / QƏLƏBƏ ZONASI', portalX, portalY - 32);
        ctx.restore();
    }

    function drawTestPlayerVisual() {
        // Həmişə zirvə portalını da göstər
        drawFinishPortalVisual();

        ctx.save();
        const isHit = testPlayer.hitFlash > 0;
        const isInvul = testPlayer.invulnerableTime > 0 && Math.floor(animTime * 15) % 2 === 0;

        if (isInvul) {
            ctx.globalAlpha = 0.5;
        }

        ctx.shadowColor = isHit ? '#ef4444' : '#00ffcc';
        ctx.shadowBlur = isHit ? 25 : 16;
        ctx.fillStyle = isHit ? '#ef4444' : '#00ffcc';
        ctx.beginPath();
        ctx.arc(testPlayer.x, testPlayer.y, testPlayer.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(testPlayer.x, testPlayer.y, testPlayer.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Gözlər
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(testPlayer.x - 4, testPlayer.y - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(testPlayer.x + 4, testPlayer.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Başın üstündə Can (HP) Barı
        const barW = 44;
        const barH = 6;
        const barX = testPlayer.x - barW * 0.5;
        const barY = testPlayer.y - 28;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

        const hpRatio = Math.max(0, testPlayer.health / testPlayer.maxHealth);
        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        // Can yazısı və Ad
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SƏN (${testPlayer.health}%)`, testPlayer.x, barY - 5);

        ctx.restore();

        // Kətan üzərində Sınaq Məlumat Lövhəsi (HUD)
        ctx.save();
        const hudY = canvasWrapper.scrollTop + 20;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(20, hudY, 320, 52, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎮 SINAQ: YOL ${currentTrack ? currentTrack.id : 1}`, 32, hudY + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText(`[W,A,S,D / Oxlar] Hərəkət | [R] Sıfırla | Y: ${Math.round(testPlayer.y)}`, 32, hudY + 38);
        ctx.restore();
    }

    // 9. İNTERAKTİV SİÇAN HADİSƏLƏRİ (DRAG, RESIZE, SELECT)
    function setupEventListeners() {
        // Yol dəyişimi
        trackSelect.addEventListener('change', (e) => {
            loadTrack(e.target.value);
        });

        // Ad dəyişimi
        trackNameInput.addEventListener('input', (e) => {
            if (currentTrack) currentTrack.name = e.target.value;
        });

        // Element əlavə et
        btnAddRock.addEventListener('click', () => {
            const newRock = {
                x: 280,
                y: canvasWrapper.scrollTop + 260,
                w: 240,
                h: 42
            };
            currentTrack.rocks.push(newRock);
            selectElement('rock', currentTrack.rocks.length - 1);
            updateStats();
            showToast('Yeni platforma əlavə edildi!', 'info');
        });

        btnAddLava.addEventListener('click', () => {
            const newLava = {
                x: 388,
                y: canvasWrapper.scrollTop + 180,
                w: 24,
                direction: 'auto'
            };
            currentTrack.lavaSources.push(newLava);
            selectElement('lava', currentTrack.lavaSources.length - 1);
            updateStats();
            showToast('Yeni lava mənbəyi əlavə edildi!', 'info');
        });

        // 🎲 Təsadüfi Şablon Quraşdır
        const btnRandomGenerate = document.getElementById('btn-random-generate');
        if (btnRandomGenerate) {
            btnRandomGenerate.addEventListener('click', () => {
                if (!currentTrack) return;
                generateRandomLayoutForCurrentTrack();
                selectElement(null, -1);
                updateStats();
                showToast(`🎲 Yol ${currentTrack.id} üçün təzə təsadüfi arxitektura quruldu! İstədiyiniz kimi dəyişib yadda saxlaya bilərsiniz.`, 'info');
            });
        }

        function generateRandomLayoutForCurrentTrack() {
            if (!currentTrack) return;
            const newRocks = [];
            const newLavas = [];
            const yLevels = [1420, 1160, 900, 640, 380];

            for (let i = 0; i < yLevels.length; i++) {
                const y = yLevels[i];
                const pattern = Math.floor(Math.random() * 4);
                if (pattern === 0) {
                    const w = 240 + Math.floor(Math.random() * 100);
                    const x = Math.floor((800 - w) / 2) + Math.floor(Math.random() * 60 - 30);
                    newRocks.push({ x: Math.max(40, Math.min(760 - w, x)), y: y, w: w, h: 42 });
                } else if (pattern === 1) {
                    const w1 = 180 + Math.floor(Math.random() * 60);
                    const w2 = 180 + Math.floor(Math.random() * 60);
                    newRocks.push({ x: 50 + Math.floor(Math.random() * 40), y: y, w: w1, h: 42 });
                    newRocks.push({ x: 520 + Math.floor(Math.random() * 40), y: y, w: w2, h: 42 });
                } else if (pattern === 2) {
                    const w = 220 + Math.floor(Math.random() * 80);
                    newRocks.push({ x: 80 + Math.floor(Math.random() * 160), y: y, w: w, h: 42 });
                    if (Math.random() < 0.6) {
                        newRocks.push({ x: 510 + Math.floor(Math.random() * 70), y: y + (Math.random() < 0.5 ? -30 : 30), w: 180, h: 42 });
                    }
                } else {
                    const w = 220 + Math.floor(Math.random() * 80);
                    newRocks.push({ x: 380 + Math.floor(Math.random() * 140), y: y, w: w, h: 42 });
                    if (Math.random() < 0.6) {
                        newRocks.push({ x: 60 + Math.floor(Math.random() * 70), y: y + (Math.random() < 0.5 ? -30 : 30), w: 180, h: 42 });
                    }
                }
            }
            newRocks.push({ x: 260 + Math.floor(Math.random() * 100), y: 200, w: 260, h: 42 });

            const lavaCount = 1 + Math.floor(Math.random() * 2.3);
            const xs = [80 + Math.floor(Math.random() * 80), 320 + Math.floor(Math.random() * 160), 620 + Math.floor(Math.random() * 80)];
            xs.sort(() => Math.random() - 0.5);

            for (let j = 0; j < lavaCount; j++) {
                const ly = 240 + Math.floor(Math.random() * 200);
                const dirs = ['auto', 'auto', 'right', 'left'];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const lObj = { x: xs[j], y: ly, w: 24, direction: dir };
                if (Math.random() < 0.3) {
                    lObj.stopOnHit = true;
                } else if (Math.random() < 0.5) {
                    lObj.endY = ly + 400 + Math.floor(Math.random() * 300);
                }
                newLavas.push(lObj);
            }

            currentTrack.rocks = newRocks;
            currentTrack.lavaSources = newLavas;
        }

        // Xassələr (Props) Dəyişimi
        inputRockW.addEventListener('input', (e) => {
            if (selectedType === 'rock' && currentTrack.rocks[selectedIndex]) {
                const w = parseInt(e.target.value, 10);
                currentTrack.rocks[selectedIndex].w = w;
                valRockW.textContent = w;
            }
        });

        inputRockH.addEventListener('input', (e) => {
            if (selectedType === 'rock' && currentTrack.rocks[selectedIndex]) {
                const h = parseInt(e.target.value, 10);
                currentTrack.rocks[selectedIndex].h = h;
                valRockH.textContent = h;
            }
        });

        btnCenterRock.addEventListener('click', () => {
            if (selectedType === 'rock' && currentTrack.rocks[selectedIndex]) {
                const rock = currentTrack.rocks[selectedIndex];
                rock.x = Math.round((canvas.width - rock.w) / 2);
            }
        });

        btnDeleteElement.addEventListener('click', () => {
            if (selectedType === 'rock' && selectedIndex >= 0) {
                currentTrack.rocks.splice(selectedIndex, 1);
                deselect();
                updateStats();
                showToast('Platforma silindi.', 'warning');
            }
        });

        btnDeleteLava.addEventListener('click', () => {
            if (selectedType === 'lava' && selectedIndex >= 0) {
                currentTrack.lavaSources.splice(selectedIndex, 1);
                deselect();
                updateStats();
                showToast('Lava mənbəyi silindi.', 'warning');
            }
        });

        inputLavaW.addEventListener('input', (e) => {
            if (selectedType === 'lava' && currentTrack.lavaSources[selectedIndex]) {
                const w = parseInt(e.target.value, 10);
                currentTrack.lavaSources[selectedIndex].w = w;
                valLavaW.textContent = w;
            }
        });

        btnDirAuto.addEventListener('click', () => setLavaDir('auto'));
        btnDirRight.addEventListener('click', () => setLavaDir('right'));
        btnDirLeft.addEventListener('click', () => setLavaDir('left'));

        function setLavaDir(dir) {
            if (selectedType === 'lava' && currentTrack.lavaSources[selectedIndex]) {
                currentTrack.lavaSources[selectedIndex].direction = dir;
                btnDirAuto.classList.toggle('active', dir === 'auto');
                btnDirRight.classList.toggle('active', dir === 'right');
                btnDirLeft.classList.toggle('active', dir === 'left');
            }
        }

        // 🛑 Platformada və ya Havada Sonlandırma Düyməsi
        if (btnToggleTerminate) {
            btnToggleTerminate.addEventListener('click', () => {
                if (selectedType === 'lava' && currentTrack.lavaSources[selectedIndex]) {
                    const lava = currentTrack.lavaSources[selectedIndex];
                    if (lava.endY || lava.stopOnHit) {
                        delete lava.endY;
                        lava.stopOnHit = false;
                        updateTerminateUI(lava);
                        showToast('⬇️ Lava axını tam aşağıya bərpa edildi.', 'info');
                    } else {
                        lava.stopOnHit = true;
                        updateTerminateUI(lava);
                        showToast('🛑 Lava platformada sonlandırıldı! İki platformanın ortasında kəsmək üçün kətanda şəlalənin üzərinə klikləyin.', 'success');
                    }
                }
            });
        }

        // 🔄 Sonlanmanı Sıfırla (Tam Axıt)
        if (btnResetCut) {
            btnResetCut.addEventListener('click', () => {
                if (selectedType === 'lava' && currentTrack.lavaSources[selectedIndex]) {
                    const lava = currentTrack.lavaSources[selectedIndex];
                    delete lava.endY;
                    lava.stopOnHit = false;
                    updateTerminateUI(lava);
                    showToast('⬇️ Sonlanma ləğv edildi, lava tam aşağı axır!', 'info');
                }
            });
        }

        // Sınaq Rejimi Düyməsi (Kətan daxilində canlı test)
        btnModeTest.addEventListener('click', () => {
            isTestMode = !isTestMode;
            btnModeTest.classList.toggle('active', isTestMode);
            modeText.textContent = isTestMode ? 'Redaktora Qayıt' : 'Kətan Sınağı';
            if (isTestMode) {
                testPlayer.x = 400;
                testPlayer.y = 1600;
                testPlayer.health = 100;
                testPlayer.invulnerableTime = 0.6;
                testPlayer.reachedFinish = false;
                // Kətanı dərhal aşağıya - oyunçunun başladığı zonaya hamar sürüşdür
                const targetScroll = Math.max(0, 1600 - canvasWrapper.clientHeight * 0.7);
                canvasWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
                showToast(`🎮 Kətan Sınağı: Yol ${currentTrack ? currentTrack.id : 1} aktivdir! W,A,S,D və ya Oxlarla hərəkət edin, [R] Sıfırla.`, 'success');
            } else {
                showToast('✏️ Redaktor Rejiminə qayıdıldı.', 'info');
            }
        });

        // 🎮 Birbaşa Əsas Oyunda Canlı Sınaqdan Keçir
        const btnTestInGame = document.getElementById('btn-test-in-game');
        if (btnTestInGame) {
            btnTestInGame.addEventListener('click', async () => {
                showToast('⏳ Yol yadda saxlanılır və oyun açılır...', 'info');
                await saveTrackToServer();
                const trackId = currentTrack ? currentTrack.id : 1;
                try {
                    localStorage.setItem('floor_escape_custom_tracks', JSON.stringify(allTracks));
                } catch(e) {}
                setTimeout(() => {
                    window.location.href = `../game.html?testTrack=${trackId}&t=${Date.now()}`;
                }, 150);
            });
        }

        // Oyuna Keç linki
        const linkGame = document.getElementById('link-game');
        if (linkGame) {
            linkGame.addEventListener('click', (e) => {
                const trackId = currentTrack ? currentTrack.id : 1;
                try {
                    localStorage.setItem('floor_escape_custom_tracks', JSON.stringify(allTracks));
                } catch(err) {}
                linkGame.href = `../game.html?testTrack=${trackId}&t=${Date.now()}`;
            });
        }

        // Yolu Yadda Saxla (Save Track API)
        btnSave.addEventListener('click', saveTrackToServer);

        // JSON Modalı
        btnExport.addEventListener('click', () => {
            jsonOutput.value = JSON.stringify(currentTrack, null, 2);
            jsonModal.classList.remove('hidden');
        });
        btnCloseModal.addEventListener('click', () => jsonModal.classList.add('hidden'));

        btnCopyJson.addEventListener('click', () => {
            jsonOutput.select();
            navigator.clipboard.writeText(jsonOutput.value);
            showToast('JSON kopyalandı!', 'success');
        });

        btnDownloadJson.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(currentTrack, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `track_${currentTrack.id}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Dəqiq Kətan Koordinatlarını Hesablamaq (Miqyas və Zoom nəzərə alınmaqla)
        function getCanvasMouseCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = Math.round((e.clientX - rect.left) * scaleX);
            const mouseY = Math.round((e.clientY - rect.top) * scaleY);
            return { mouseX, mouseY };
        }

        // Siçanla Kətan Üzərində Gezinti və Kursor Dəyişimi
        canvas.addEventListener('mousemove', (e) => {
            if (isTestMode) return;
            const { mouseX, mouseY } = getCanvasMouseCoords(e);

            if (mouseX >= 0 && mouseX <= canvas.width && mouseY >= 0 && mouseY <= canvas.height) {
                coordDisplay.textContent = `X: ${mouseX} | Y: ${mouseY}`;
            }

            if (isDragging) {
                canvas.style.cursor = 'grabbing';
                return;
            }
            if (isDraggingMidAirCut) {
                canvas.style.cursor = 'ns-resize';
                return;
            }

            // Mid-Air sonlanma tutacağını yoxla
            const cascadePathsHover = traceCascadePaths(currentTrack.lavaSources, currentTrack.rocks, 1750);
            for (const p of cascadePathsHover) {
                if (p.midAirTermination) {
                    const mat = p.midAirTermination;
                    if (Math.hypot(mouseX - (mat.x + mat.w * 0.5), mouseY - (mat.y + 6)) < 18) {
                        canvas.style.cursor = 'ns-resize';
                        return;
                    }
                }
            }

            // Resize tutacağını yoxla
            if (selectedType === 'rock' && selectedIndex >= 0) {
                const rock = currentTrack.rocks[selectedIndex];
                if (rock) {
                    const handleX = rock.x + rock.w;
                    const handleY = rock.y + rock.h / 2;
                    if (Math.hypot(mouseX - handleX, mouseY - handleY) < 18) {
                        canvas.style.cursor = 'ew-resize';
                        return;
                    }
                }
            }

            // Lava mənbələrini yoxla (Genişləndirilmiş tutma sahəsi)
            for (let i = currentTrack.lavaSources.length - 1; i >= 0; i--) {
                const lava = currentTrack.lavaSources[i];
                if (mouseX >= lava.x - 25 && mouseX <= lava.x + (lava.w || 24) + 25 &&
                    mouseY >= lava.y - 30 && mouseY <= lava.y + 25) {
                    canvas.style.cursor = 'grab';
                    hoveredType = 'lava';
                    hoveredIndex = i;
                    return;
                }
            }

            // Platformaları yoxla
            for (let i = currentTrack.rocks.length - 1; i >= 0; i--) {
                const rock = currentTrack.rocks[i];
                if (mouseX >= rock.x && mouseX <= rock.x + rock.w &&
                    mouseY >= rock.y && mouseY <= rock.y + rock.h) {
                    canvas.style.cursor = 'grab';
                    hoveredType = 'rock';
                    hoveredIndex = i;
                    return;
                }
            }

            hoveredType = null;
            hoveredIndex = -1;
            canvas.style.cursor = 'default';
        });

        // Siçanla Seçim, İstiqamət Dəyişmə və Sürükləməyə Başlama
        canvas.addEventListener('mousedown', (e) => {
            if (isTestMode) return;
            const { mouseX, mouseY } = getCanvasMouseCoords(e);

            // 0. Havada Sonlanma Tutacağını (↕ Mid-Air Gizmo) yoxla
            const cascadePaths = traceCascadePaths(currentTrack.lavaSources, currentTrack.rocks, 1750);
            for (const p of cascadePaths) {
                if (p.midAirTermination) {
                    const mat = p.midAirTermination;
                    if (Math.hypot(mouseX - (mat.x + mat.w * 0.5), mouseY - (mat.y + 6)) < 22) {
                        isDraggingMidAirCut = true;
                        activeMidAirHandle = mat.sourceIndex;
                        selectElement('lava', mat.sourceIndex);
                        canvas.style.cursor = 'ns-resize';
                        return;
                    }
                }
            }

            // 1. Qaya üstündəki Lava Tökülmə / İstiqamət Tutacağını (Spillway Gizmo) və ya Sonlandırma Nişanını yoxla
            for (const path of cascadePaths) {
                for (const shelf of path.shelves) {
                    if (shelf.terminated) {
                        const distStop = Math.hypot(mouseX - shelf.hitX, mouseY - (shelf.rock.y + 2));
                        if (distStop < 22) {
                            selectElement('lava', shelf.sourceIndex);
                            const lava = currentTrack.lavaSources[shelf.sourceIndex];
                            lava.stopOnHit = false;
                            updateTerminateUI(false);
                            showToast('⬇️ Lava axını yenidən açıldı (tam aşağı axır).', 'info');
                            return;
                        }
                    } else {
                        const distHandle = Math.hypot(mouseX - shelf.outX, mouseY - (shelf.rock.y + 2));
                        if (distHandle < 20) {
                            isDraggingLavaDir = true;
                            activeLavaHandle = {
                                sourceIndex: shelf.sourceIndex,
                                step: shelf.step || 0,
                                rock: shelf.rock,
                                hitX: shelf.hitX
                            };
                            selectElement('lava', shelf.sourceIndex);
                            canvas.style.cursor = 'ew-resize';
                            return;
                        }
                    }
                }
            }

            // 2. Lava Mənbəyinin yanındakı Tez İstiqamət Düymələrini (◀ və ▶) yoxla
            for (let i = currentTrack.lavaSources.length - 1; i >= 0; i--) {
                const lava = currentTrack.lavaSources[i];
                const lw = lava.w || 24;

                // Sol ox düyməsi (◀)
                if (mouseX >= lava.x - 44 && mouseX <= lava.x - 16 && mouseY >= lava.y - 14 && mouseY <= lava.y + 12) {
                    selectElement('lava', i);
                    setLavaDir('left');
                    showToast('Lava sola yönləndirildi ◀', 'info');
                    return;
                }

                // Sağ ox düyməsi (▶)
                if (mouseX >= lava.x + lw + 16 && mouseX <= lava.x + lw + 44 && mouseY >= lava.y - 14 && mouseY <= lava.y + 12) {
                    selectElement('lava', i);
                    setLavaDir('right');
                    showToast('Lava sağa yönləndirildi ▶', 'info');
                    return;
                }
            }

            // 3. Resize tutacağını yoxla
            if (selectedType === 'rock' && selectedIndex >= 0) {
                const rock = currentTrack.rocks[selectedIndex];
                if (rock) {
                    const handleX = rock.x + rock.w;
                    const handleY = rock.y + rock.h / 2;
                    if (Math.hypot(mouseX - handleX, mouseY - handleY) < 18) {
                        isResizing = true;
                        canvas.style.cursor = 'ew-resize';
                        return;
                    }
                }
            }

            // 4. Lava mənbələrini sürükləmək üçün yoxla
            for (let i = currentTrack.lavaSources.length - 1; i >= 0; i--) {
                const lava = currentTrack.lavaSources[i];
                if (mouseX >= lava.x - 25 && mouseX <= lava.x + (lava.w || 24) + 25 &&
                    mouseY >= lava.y - 30 && mouseY <= lava.y + 25) {
                    selectElement('lava', i);
                    isDragging = true;
                    dragOffsetX = mouseX - lava.x;
                    dragOffsetY = mouseY - lava.y;
                    canvas.style.cursor = 'grabbing';
                    return;
                }
            }

            // 5. Platformaları (Qayaları) sürükləmək üçün yoxla
            for (let i = currentTrack.rocks.length - 1; i >= 0; i--) {
                const rock = currentTrack.rocks[i];
                if (mouseX >= rock.x && mouseX <= rock.x + rock.w &&
                    mouseY >= rock.y && mouseY <= rock.y + rock.h) {
                    selectElement('rock', i);
                    isDragging = true;
                    dragOffsetX = mouseX - rock.x;
                    dragOffsetY = mouseY - rock.y;
                    canvas.style.cursor = 'grabbing';
                    return;
                }
            }

            // 6. Şəlalənin Üzərinə Klikləmə (İki platformanın ortasında və ya istənilən Y hündürlüyündə birbaşa sonlandır!)
            for (const p of cascadePaths) {
                for (const fall of p.falls) {
                    if (mouseX >= fall.x - 22 && mouseX <= fall.x + fall.w + 22 &&
                        mouseY >= fall.y + 12 && mouseY <= fall.y + fall.h + 20) {
                        selectElement('lava', p.sourceIndex);
                        const lava = currentTrack.lavaSources[p.sourceIndex];
                        lava.endY = Math.round(mouseY);
                        delete lava.stopOnHit;
                        updateTerminateUI(lava);
                        showToast(`🛑 Lava Y:${lava.endY} nöqtəsində sonlandırıldı! (↕ Tutacaqla dəyişə bilərsiniz)`, 'success');
                        return;
                    }
                }
            }

            // Boş sahəyə klikləndisə seçimi ləğv et
            deselect();
        });

        // Sürükləmə Hərəkəti (Pəncərə boyu qüsursuz işləyir)
        window.addEventListener('mousemove', (e) => {
            if (!isDragging && !isResizing && !isDraggingLavaDir && !isDraggingMidAirCut) return;
            const { mouseX, mouseY } = getCanvasMouseCoords(e);

            // 🎯 Havada Sonlanma Hündürlüyünü (endY) Siçanla Yuxarı-Aşağı Çəkmək!
            if (isDraggingMidAirCut && activeMidAirHandle !== null) {
                const lava = currentTrack.lavaSources[activeMidAirHandle];
                if (lava) {
                    lava.endY = Math.max(lava.y + 35, Math.min(1750, mouseY));
                    delete lava.stopOnHit;
                    updateTerminateUI(lava);
                    coordDisplay.textContent = `Lava Sonlanma: Y = ${Math.round(lava.endY)}`;
                }
                return;
            }

            // 🎯 Lavanın Platformadakı Tökülmə Yerini (outX) Siçanla Tutub İstənilən Yerə Çəkmək!
            if (isDraggingLavaDir && activeLavaHandle) {
                const src = currentTrack.lavaSources[activeLavaHandle.sourceIndex];
                const rock = activeLavaHandle.rock;
                if (src && rock) {
                    // Qayanın hüdudları daxilində sərbəst hərəkət (istədiyiniz yerə çəkin!)
                    const newOutX = Math.max(rock.x + 10, Math.min(rock.x + rock.w - 10, mouseX));
                    src.shelfOffsets = src.shelfOffsets || {};
                    src.shelfOffsets[activeLavaHandle.step || 0] = newOutX;
                    src.customOutX = newOutX;
                    src.direction = (newOutX >= activeLavaHandle.hitX) ? 'right' : 'left';
                    setLavaDir(src.direction);
                    coordDisplay.textContent = `Tökülmə Nöqtəsi: X = ${Math.round(newOutX)}`;
                }
                return;
            }

            // Ölçü dəyişimi
            if (isResizing && selectedType === 'rock' && currentTrack.rocks[selectedIndex]) {
                const rock = currentTrack.rocks[selectedIndex];
                const newW = Math.max(80, Math.min(600, mouseX - rock.x));
                rock.w = Math.round(newW);
                inputRockW.value = rock.w;
                valRockW.textContent = rock.w;
                return;
            }

            // Sürükləmə (İstədiyiniz hər pikselə sərbəst çəkin!)
            if (isDragging) {
                if (selectedType === 'rock' && currentTrack.rocks[selectedIndex]) {
                    const rock = currentTrack.rocks[selectedIndex];
                    rock.x = Math.max(10, Math.min(canvas.width - rock.w - 10, mouseX - dragOffsetX));
                    rock.y = Math.max(140, Math.min(1720, mouseY - dragOffsetY));
                } else if (selectedType === 'lava' && currentTrack.lavaSources[selectedIndex]) {
                    const lava = currentTrack.lavaSources[selectedIndex];
                    lava.x = Math.max(20, Math.min(canvas.width - 45, mouseX - dragOffsetX));
                    lava.y = Math.max(120, Math.min(1650, mouseY - dragOffsetY));
                }
            }
        });

        // Sürükləmənin Bitməsi
        window.addEventListener('mouseup', () => {
            if (isDragging || isResizing || isDraggingLavaDir || isDraggingMidAirCut) {
                isDragging = false;
                isResizing = false;
                isDraggingLavaDir = false;
                isDraggingMidAirCut = false;
                activeLavaHandle = null;
                activeMidAirHandle = null;
                canvas.style.cursor = 'default';
            }
        });

        // Klaviatura (Test Rejimi)
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
    }

    // 10. SERVERƏ YADDA SAXLA (SAVE TO SERVER API)
    async function saveTrackToServer() {
        if (!currentTrack) return;

        // Massivdə yenilə
        const idx = allTracks.findIndex(t => t.id === currentTrack.id);
        if (idx >= 0) {
            allTracks[idx] = JSON.parse(JSON.stringify(currentTrack));
        } else {
            allTracks.push(JSON.parse(JSON.stringify(currentTrack)));
        }

        try {
            const res = await fetch('/api/tracks/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    track: currentTrack,
                    allTracks: allTracks
                })
            });

            // Hər ehtimala qarşı dərhal brauzer yaddaşında da saxla
            try {
                localStorage.setItem('floor_escape_custom_tracks', JSON.stringify(allTracks));
                if (typeof window.FLOOR_PATTERNS !== 'undefined') {
                    window.FLOOR_PATTERNS.tracks = allTracks;
                }
            } catch(e) {}

            if (res.ok) {
                const respData = await res.json();
                showToast(`💾 Yol ${currentTrack.id} uğurla saxlanıldı! "Kətan Sınağı" və ya "Oyunda Sınaqdan Keçir" ilə test edə bilərsiniz.`, 'success');
            } else {
                fallbackLocalSave();
            }
        } catch (e) {
            fallbackLocalSave();
        }
    }

    function fallbackLocalSave() {
        // Brauzer yaddaşında saxla
        try {
            localStorage.setItem('floor_escape_custom_tracks', JSON.stringify(allTracks));
            if (typeof window.FLOOR_PATTERNS !== 'undefined') {
                window.FLOOR_PATTERNS.tracks = allTracks;
            }
            showToast(`💾 Yol ${currentTrack.id} lokal yadda saxlanıldı! "Kətan Sınağı" və ya "Oyunda Sınaqdan Keçir" ilə test edə bilərsiniz.`, 'success');
        } catch(e) {
            showToast('Yadda saxlanarkən xəta baş verdi', 'warning');
        }
    }

    function showToast(msg, type = 'info') {
        editorToast.textContent = msg;
        editorToast.className = '';
        if (type === 'success') editorToast.style.borderColor = '#34d399';
        else if (type === 'warning') editorToast.style.borderColor = '#f97316';
        else editorToast.style.borderColor = '#38bdf8';

        setTimeout(() => {
            editorToast.classList.add('hidden');
        }, 3200);
    }

    // Başlat
    window.addEventListener('DOMContentLoaded', initEditor);
})();
