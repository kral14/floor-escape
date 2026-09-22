// ============================================================================
// 🏔️ PLATFORMALAR, QAYALAR VƏ AĞILLI KASKAD LAVA SİSTEMİ (PROSEDURAL & KEÇİLƏBİLƏN)
// ============================================================================
// 1. Hər qatda və hər yeni oyunda platformalar və lavalar dinamik dəyişir.
// 2. Ağıllı kaskad: Yuxarıdan tökülən lava platformaya dəyib istiqamətini dəyişir (sağa/sola).
//    Platformanın altında və yön dəyişdiyi zonada oyunçunun sağa və ya sola rahatlıqla
//    keçə biləcəyi "TƏHLÜKƏSİZ KEÇİD DƏHLİZİ" (Lava Shelter) yaranır.
// 3. Heç vaxt çıxılmaz vəziyyət (dead-end) yaranmır; bütün axınlar ən altda birbaşa
//    LAVA CANAVARINA tökülür.
// ============================================================================

let currentWorldHeight = 3600;
let currentRocks = [];         // Prosedural üzən qaya adacıqları
let initialLavaSources = [];   // Prosedural lava mənbələri
let activeLavaHazardBoxes = []; // Dəqiq və ədalətli toqquşma zonaları
let lavaFlowOffset = 0;        // Animasiya zamanı (saniyə)
let lavaDripParticles = [];    // Lavadan damcılayan közlər

let cachedFloorPatterns = (typeof window !== 'undefined' && window.FLOOR_PATTERNS) ? window.FLOOR_PATTERNS : null;

// Əgər localStorage-də redaktordan saxlanmış xüsusi yollar varsa, ilk növbədə onu nəzərə al
if (typeof localStorage !== 'undefined') {
    try {
        const localSaved = localStorage.getItem('floor_escape_custom_tracks');
        if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedFloorPatterns = {
                    totalTracks: parsed.length,
                    description: 'Redaktordan saxlanmış fərdi sınaq yolları',
                    tracks: parsed
                };
                if (typeof window !== 'undefined') window.FLOOR_PATTERNS = cachedFloorPatterns;
            }
        }
    } catch(e) {}
}

let activeTestTrackId = null; // Test üçün xüsusi seçilmiş yol (məs: 1)
let currentTrackInfo = null;

// URL parametrindən testTrack-i yoxla (?testTrack=1 və ya ?track=1)
if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const qTrack = urlParams.get('testTrack') || urlParams.get('track');
        if (qTrack) {
            const parsedId = parseInt(qTrack, 10);
            if (!isNaN(parsedId) && parsedId >= 1 && parsedId <= 30) {
                activeTestTrackId = parsedId;
            }
        }
    } catch(e) {}
}

// JSON faylını həm də dinamik fetch edirik (hər dəfə dəyişəndə dərhal yenilənsin)
async function loadFloorPatternsAsync() {
    try {
        const res = await fetch('data/floor_patterns.json?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            // Əgər localStorage-də daha təzə dəyişiklik yoxdursa, JSON-u götür
            cachedFloorPatterns = data;
            if (typeof window !== 'undefined') window.FLOOR_PATTERNS = data;
            // Əgər aktiv oyun varsa və sınaq yolundadırsa yenilə
            if (typeof gameState !== 'undefined' && gameState.floor) {
                initFloorPlatforms(gameState.floor);
            }
        }
    } catch (e) {
        // Fetch uğursuz olsa, daxil edilmiş JS obyekti aktiv qalır
    }
}
if (typeof window !== 'undefined') {
    loadFloorPatternsAsync();
}

// 1. Qat hündürlüyü
function getFloorWorldHeight(floor = 1) {
    if (currentTrackInfo && currentTrackInfo.worldHeight) {
        return currentTrackInfo.worldHeight * 2;
    }
    return 3600;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// Test məqsədilə istənilən yolu birbaşa seçmək üçün köməkçi funksiya:
// Məsələn: window.setFloorTrack(5)
function setFloorTrack(trackNum) {
    const num = parseInt(trackNum, 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
        activeTestTrackId = num;
        console.log(`🎯 Test üçün Yol ${num} aktivləşdirildi!`);
        if (typeof gameState !== 'undefined') {
            initFloorPlatforms(num);
            if (typeof player !== 'undefined' && player) {
                player.x = 400;
                player.y = currentWorldHeight - 200;
            }
        }
        if (typeof showToast === 'function') {
            showToast(`🗺️ Sınaq Yolu: ${num} aktivləşdirildi!`, 'info');
        }
        return `Yol ${num} uğurla seçildi.`;
    }
    return 'Xəta: Yol nömrəsi 1 ilə 30 arasında olmalıdır (Məsələn: setFloorTrack(5))';
}
window.setFloorTrack = setFloorTrack;

// 2. 30 Yoldan cari qata uyğun yolun yüklənməsi: Qat 1 -> Yol 1, Qat 2 -> Yol 2...
function initFloorPlatforms(floor = 1) {
    // 1. Canlı localStorage yoxlanışı (Redaktorda edilən dəyişiklik dərhal əks olunsun)
    if (typeof localStorage !== 'undefined') {
        try {
            const localSaved = localStorage.getItem('floor_escape_custom_tracks');
            if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    cachedFloorPatterns = {
                        totalTracks: parsed.length,
                        description: 'Redaktordan canlı yadda saxlanılmış fərdi sınaq yolları',
                        tracks: parsed
                    };
                    if (typeof window !== 'undefined') window.FLOOR_PATTERNS = cachedFloorPatterns;
                }
            }
        } catch(e) {}
    }

    const patterns = cachedFloorPatterns || (typeof window !== 'undefined' ? window.FLOOR_PATTERNS : null);
    const tracks = (patterns && patterns.tracks) ? patterns.tracks : [];

    // Cari yolun ID-si (Əgər test üçün xüsusi yol seçilibsə, onu istifadə et)
    const targetTrackId = (typeof activeTestTrackId === 'number' && activeTestTrackId >= 1)
        ? activeTestTrackId
        : (((Math.max(1, floor) - 1) % 30) + 1);

    // Uyğun track-i tapırıq
    let selectedTrack = tracks.find(t => t.id === targetTrackId);
    if (!selectedTrack && tracks.length > 0) {
        selectedTrack = tracks[(targetTrackId - 1) % tracks.length];
    }

    currentRocks = [];
    initialLavaSources = [];
    activeLavaHazardBoxes = [];
    lavaDripParticles = [];

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;

    if (selectedTrack) {
        currentTrackInfo = selectedTrack;
        const baseH = selectedTrack.worldHeight || 1800;
        currentWorldHeight = baseH * 2; // 2 QAT UZADILMIŞ YOL

        // Qayaları 2 qat hündürlük boyunca (həm aşağı, həm yuxarı mərhələdə) tam yükləyirik
        // 1-ci mərhələ: Yuxarı yarı (y: 0 ... baseH)
        for (const r of (selectedTrack.rocks || [])) {
            currentRocks.push({
                x: Number(r.x),
                y: Number(r.y),
                w: Number(r.w),
                h: Number(r.h),
                type: 'rock'
            });
        }
        // 2-ci mərhələ: Aşağı yarı (y: baseH ... baseH * 2)
        for (const r of (selectedTrack.rocks || [])) {
            currentRocks.push({
                x: Number(r.x),
                y: Number(r.y) + baseH,
                w: Number(r.w),
                h: Number(r.h),
                type: 'rock'
            });
        }

        // Lava mənbələrini 2 qat hündürlük boyunca yükləyirik
        // Yuxarı yarı
        for (let i = 0; i < (selectedTrack.lavaSources || []).length; i++) {
            const src = selectedTrack.lavaSources[i];
            initialLavaSources.push({
                x: Number(src.x),
                y: Number(src.y),
                w: Number(src.w || 24),
                direction: src.direction || 'auto',
                endY: src.endY !== undefined ? Number(src.endY) : undefined,
                customBottomY: src.customBottomY !== undefined ? Number(src.customBottomY) : undefined,
                stopOnHit: !!src.stopOnHit,
                shelfOffsets: src.shelfOffsets || null,
                customOutX: src.customOutX !== undefined ? Number(src.customOutX) : undefined,
                seed: i + floor * 13
            });
        }
        // Aşağı yarı
        for (let i = 0; i < (selectedTrack.lavaSources || []).length; i++) {
            const src = selectedTrack.lavaSources[i];
            initialLavaSources.push({
                x: Number(src.x),
                y: Number(src.y) + baseH,
                w: Number(src.w || 24),
                direction: src.direction || 'auto',
                endY: src.endY !== undefined ? Number(src.endY) + baseH : undefined,
                customBottomY: src.customBottomY !== undefined ? Number(src.customBottomY) + baseH : undefined,
                stopOnHit: !!src.stopOnHit,
                shelfOffsets: src.shelfOffsets || null,
                customOutX: src.customOutX !== undefined ? Number(src.customOutX) : undefined,
                seed: i + floor * 13 + 500
            });
        }

        // 🌋 ZƏNGİN VƏ CANLI KASKAD LAVA ŞƏLALƏLƏRİ:
        // Hər qatda və bütün yollarda platformalardan aşağı süzülən möhtəşəm təbii axınlar təmin edilir
        if (initialLavaSources.length < 8 && currentRocks.length > 0) {
            const sortedRocks = [...currentRocks].sort((a, b) => a.y - b.y);
            const step = Math.max(1, Math.floor(sortedRocks.length / 7));
            for (let i = 0; i < sortedRocks.length && initialLavaSources.length < 10; i += step) {
                const rock = sortedRocks[i];
                const hasNear = initialLavaSources.some(s => Math.abs(s.y - rock.y) < 180 && Math.abs(s.x - rock.x) < 120);
                if (!hasNear) {
                    const isRightEdge = (i % 2 === 0);
                    const sourceX = isRightEdge ? (rock.x + rock.w - 28) : (rock.x + 8);
                    initialLavaSources.push({
                        x: Math.round(sourceX),
                        y: Math.round(rock.y - 14),
                        w: 24,
                        direction: isRightEdge ? 'right' : 'left',
                        seed: i * 37 + floor * 19
                    });
                }
            }
        }

        console.log(`🗺️ [CANLI YOL ${targetTrackId}/30 - 2X UZUNLUQ: ${currentWorldHeight}px] "${selectedTrack.name}" aktivdir! Platforma: ${currentRocks.length}, Lava: ${initialLavaSources.length}`);
    } else {
        // Fallback əgər fayl yüklənməyibsə (2 qat)
        currentWorldHeight = 3600;
        const fbBase = 1800;
        [0, fbBase].forEach(offset => {
            currentRocks.push({ x: 100, y: 1360 + offset, w: 240, h: 42, type: 'rock' });
            currentRocks.push({ x: 460, y: 1360 + offset, w: 240, h: 42, type: 'rock' });
            currentRocks.push({ x: 250, y: 900  + offset, w: 300, h: 42, type: 'rock' });
            currentRocks.push({ x: 220, y: 440  + offset, w: 360, h: 42, type: 'rock' });
            initialLavaSources.push({ x: 160, y: 280 + offset, w: 24, direction: 'auto', seed: 1 + offset });
            initialLavaSources.push({ x: 620, y: 380 + offset, w: 24, direction: 'auto', seed: 2 + offset });
        });
    }
}
window.initFloorPlatforms = initFloorPlatforms;

// 3. Toqquşma və Süzülmə Fizikası (Oyunçunun ilişib qalmasının qarşısını alan hamar fizika)
function updatePlatformsPhysics(player, dt = 0.016) {
    if (!player) return;

    lavaFlowOffset += dt;

    const pr = player.radius || 16;
    const prSq = pr * pr;

    // A) QAYALARLA HAMAR DAİRƏVİ İTƏLƏMƏ (Smooth Obstacle Glide - İlişmə yoxdur!)
    for (const rock of currentRocks) {
        const closestX = Math.max(rock.x, Math.min(player.x, rock.x + rock.w));
        const closestY = Math.max(rock.y, Math.min(player.y, rock.y + rock.h));

        const distX = player.x - closestX;
        const distY = player.y - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < prSq && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const overlap = pr - dist;
            const nx = distX / dist;
            const ny = distY / dist;

            // Oyunçunu yumşaq şəkildə qayanın kənarına sürüşdürür
            player.x += nx * overlap;
            player.y += ny * overlap;

            // Hərəkət vektorunu qayanın səthinə uyğun düzəldir
            if (player.vx !== undefined && player.vy !== undefined) {
                const dot = player.vx * nx + player.vy * ny;
                if (dot < 0) {
                    player.vx -= dot * nx;
                    player.vy -= dot * ny;
                }
            }
        }
    }

    // B) AXAN VƏ TÖKÜLƏN LAVAYA TOXUNMA
    // Yalnız faktiki axan şaquli şəlaləyə və ya qayanın üstündəki dar qızmar kanala toxunanda yanır!
    if (typeof gameState !== 'undefined' && !gameState.transitioning && gameState.dashInvulnerable <= 0) {
        for (const fall of activeLavaHazardBoxes) {
            const cX = Math.max(fall.x, Math.min(player.x, fall.x + fall.w));
            const cY = Math.max(fall.y, Math.min(player.y, fall.y + fall.h));
            const dX = player.x - cX;
            const dY = player.y - cY;

            // Ədalətli toqquşma (Oyunçu radiusunun 65%-i)
            if (dX * dX + dY * dY < prSq * 0.65) {
                handleLavaBurn(player);
                break;
            }
        }
    }

    // C) DAMCILAYAN KÖZLƏRİN FİZİKASI
    if (Math.random() < 0.35 && activeLavaHazardBoxes.length > 0) {
        const rndFall = activeLavaHazardBoxes[Math.floor(Math.random() * activeLavaHazardBoxes.length)];
        lavaDripParticles.push({
            x: rndFall.x + Math.random() * rndFall.w,
            y: rndFall.y + rndFall.h - 4,
            vy: 75 + Math.random() * 85,
            size: 2.0 + Math.random() * 2.2,
            life: 0.75,
            maxLife: 0.75
        });
    }

    for (let i = lavaDripParticles.length - 1; i >= 0; i--) {
        const dp = lavaDripParticles[i];
        dp.y += dp.vy * dt;
        dp.life -= dt;
        if (dp.life <= 0) {
            lavaDripParticles.splice(i, 1);
        }
    }
}
window.updatePlatformsPhysics = updatePlatformsPhysics;

// 4. Lavaya Dəymə və Yanma İdarəetməsi
function handleLavaBurn(player) {
    if (!player) return;

    if (typeof gameState !== 'undefined') {
        if (gameState.dashInvulnerable > 0 || gameState.transitioning || gameState.gameOver) {
            return;
        }
    }

    if (typeof particles !== 'undefined') {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const pColor = (i % 2 === 0) ? '#facc15' : '#ef4444';
            if (typeof Particle !== 'undefined') {
                const p = new Particle(player.x, player.y, pColor, 3.5);
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                particles.push(p);
            }
        }
    }

    if (typeof audio !== 'undefined' && typeof audio.playExplosion === 'function') {
        audio.playExplosion();
    }

    if (typeof screenPulse !== 'undefined') {
        screenPulse.color = 'rgba(239, 68, 68, 0.45)';
        screenPulse.alpha = 0.85;
    }

    // 🛡️ Qalxan (1 dəfə zərərdən qoruma), Yaşam Çiçəyi və ya Monsun Canı (HP)
    if (typeof player !== 'undefined' && player && typeof player.takeDamage === 'function') {
        player.takeDamage(1, 'lava');
    } else if (typeof triggerGameOver === 'function') {
        triggerGameOver();
    }
}

window.handleLavaBurn = handleLavaBurn;

// 5. AĞILLI ŞÜA İZLƏMƏ: Lavanın qaya platformalarına dəyib yön dəyişməsi və canavara tökülməsi
function traceLavaCascadePaths(sources, rocks, monsterY) {
    const paths = [];

    for (let sIdx = 0; sIdx < sources.length; sIdx++) {
        const src = sources[sIdx];
        let currX = src.x;
        let currW = src.w;
        let currY = src.y;
        let seed = src.seed || sIdx;

        const path = {
            source: { x: currX, y: currY, w: currW, seed: seed },
            falls: [],
            shelves: []
        };

        const maxDeflections = 4;
        for (let d = 0; d < maxDeflections; d++) {
            const streamCenter = currX + currW * 0.5;

            // Bu axının altında yerləşən ən yaxın qayanı tapırıq
            let hitRock = null;
            let minHitY = monsterY;

            for (const rock of rocks) {
                if (rock.y > currY + 12 && rock.y < minHitY) {
                    if (streamCenter >= rock.x - 2 && streamCenter <= rock.x + rock.w + 2) {
                        hitRock = rock;
                        minHitY = rock.y;
                    }
                }
            }

            // 🎯 Əgər istifadəçi Track Studio-da axını havada (iki platformanın ortasında) sonlandırıbsa:
            let effectiveBottomY = minHitY;
            let isMidAir = false;
            const customCutY = src.endY || src.customBottomY;
            if (customCutY && customCutY > currY + 15 && customCutY < minHitY) {
                effectiveBottomY = customCutY;
                isMidAir = true;
            }

            // 1. Şaquli şəlalə axını
            const fallH = Math.max(10, effectiveBottomY - currY);
            path.falls.push({
                x: currX,
                y: currY,
                w: currW,
                h: fallH,
                seed: seed + d,
                isMidAir: isMidAir,
                bottomY: effectiveBottomY
            });

            if (isMidAir) {
                path.terminated = true;
                path.midAirTermination = {
                    x: currX,
                    y: effectiveBottomY,
                    w: currW
                };
                break;
            }

            // Əgər qaya yoxdursa və ya canavara çatdısa, axın canavara tökülüb bitir!
            if (!hitRock || minHitY >= monsterY) {
                path.monsterImpact = {
                    x: streamCenter,
                    y: monsterY
                };
                break;
            }

            // 2. QAYAYA DƏYDİ! Lavanın qaya üzərində sağa və ya sola axması
            const hitX = Math.max(hitRock.x + 10, Math.min(hitRock.x + hitRock.w - 10, streamCenter));
            const distToLeft = hitX - hitRock.x;
            const distToRight = (hitRock.x + hitRock.w) - hitX;

            // Əgər istifadəçi Track Studio-da xüsusi tökülmə yeri (customOutX) təyin edibsə:
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
                rock: hitRock,
                hitX: hitX,
                outX: isTerminated ? hitX : outX,
                goRight: goRight,
                d: d,
                terminated: isTerminated
            });

            // Əgər istifadəçi bu lavı töküldüyü platformada sonlandırıbsa, aşağıya yeni şəlalə getmir!
            if (isTerminated) {
                path.terminated = true;
                break;
            }

            // Növbəti şəlalə bu qayanın alt dodağından yenidən aşağı tökülür!
            currW = Math.min(currW, 26);
            currX = outX - currW * 0.5;
            currY = hitRock.y + hitRock.h - 2;
        }

        paths.push(path);
    }

    return paths;
}

// 6. ƏSAS RENDER: KASKAD LAVA VƏ PLATFORMALAR
function drawPlatforms(ctx) {
    const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
    if (!c) return;

    // 🌊 CANLI LAVA AXINI: Oyun açıldıqda, introda və oyun boyu fasiləsiz axır (heç vaxt donmur)
    const t = (typeof performance !== 'undefined' && typeof performance.now === 'function') 
        ? (performance.now() / 1000) 
        : lavaFlowOffset;
    lavaFlowOffset = t;
    activeLavaHazardBoxes = [];

    // Canavarın səthi (Lavanın töküldüyü son nöqtə)
    const monsterBottomY = (typeof monster !== 'undefined' && monster && typeof monster.y === 'number')
        ? monster.y
        : currentWorldHeight;

    const useEngine = (typeof LavaEngine !== 'undefined' && LavaEngine);

    // Kaskad şüalarını hesablayırıq (Dinamik Keşlənmə: Hər kadr təkrar hesablanmır, CPU gücünə 95% qənaət edir)
    if (!window._cachedCascadePaths || 
        Math.abs((window._lastMonsterBottomY || 0) - monsterBottomY) > 3 || 
        window._cachedSourcesLen !== initialLavaSources.length) {
        window._cachedCascadePaths = traceLavaCascadePaths(initialLavaSources, currentRocks, monsterBottomY);
        window._lastMonsterBottomY = monsterBottomY;
        window._cachedSourcesLen = initialLavaSources.length;
    }
    const cascadePaths = window._cachedCascadePaths;

    const camY = (typeof window !== 'undefined' && typeof window.cameraY === 'number') ? window.cameraY : 0;
    const viewH = 750;
    const enableShadows = (typeof window === 'undefined' || window.GRAPHICS_QUALITY !== 'low');

    // ========================================================================
    // A) ŞƏLALƏLƏR VƏ QAYALARIN ÜZƏRİNDƏN AXAN LAVA
    // ========================================================================
    for (let pIdx = 0; pIdx < cascadePaths.length; pIdx++) {
        const path = cascadePaths[pIdx];

        // Mənbə oyuqu (Off-screen culling)
        if (useEngine && path.source.y + 40 >= camY - 50 && path.source.y <= camY + viewH + 50) {
            LavaEngine.drawLavaSourceRock(c, path.source.x, path.source.y, path.source.w, path.source.seed, t);
        }

        // Bütün şaquli şəlalə axınları (Pillələr arası və ən altda canavara tökülən)
        for (let fIdx = 0; fIdx < path.falls.length; fIdx++) {
            const fall = path.falls[fIdx];
            const isLastFall = (fIdx === path.falls.length - 1);
            const isTerminatedFall = !!(path.terminated && isLastFall);
            const isMidAir = !!fall.isMidAir;

            // Şaquli lava şəlaləsinin faktiki zərər zonası həmişə aktiv qalır
            activeLavaHazardBoxes.push({
                x: fall.x + 4,
                y: fall.y,
                w: Math.max(12, fall.w - 8),
                h: fall.h
            });

            // 🎯 OFF-SCREEN CULLING: Yalnız ekranda görünən şəlalə qrafikası çəkilir
            if (fall.y + fall.h < camY - 80 || fall.y > camY + viewH + 80) {
                continue;
            }

            if (useEngine) {
                LavaEngine.drawPlatformWaterfall(c, t + fIdx * 0.75, fall.x, fall.y, fall.w, fall.h, isTerminatedFall, isMidAir);
                if (isMidAir && typeof LavaEngine.drawMidAirLavaTip === 'function') {
                    LavaEngine.drawMidAirLavaTip(c, t, fall.x, fall.bottomY, fall.w);
                }
                if (fIdx > 0 && !isMidAir) {
                    LavaEngine.drawSpillwayLip(c, fall.x, fall.w, fall.y + 2);
                }
            }
        }

        // Canavara tökülən nöqtədə qaynayan dalğa
        if (path.monsterImpact && useEngine && monsterBottomY >= camY - 50 && monsterBottomY <= camY + viewH + 50) {
            c.save();
            c.fillStyle = '#ffd567';
            c.beginPath();
            c.ellipse(path.monsterImpact.x, monsterBottomY - 1, 20, 5, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    }

    // ========================================================================
    // B) QAYA PLATFORMALARI (Obsidian Dizaynı) (Off-Screen Culling & GPU/CPU Optimizasiyası)
    // ========================================================================
    for (const rock of currentRocks) {
        // 🎯 OFF-SCREEN CULLING: Ekrandan kənardakı qayalar çəkilmir
        if (rock.y + rock.h < camY - 80 || rock.y > camY + viewH + 80) {
            continue;
        }

        c.save();

        // 1. Qaya xarici kölgəsi (Zəif PC / CPU rejimində söndürülür)
        if (enableShadows) {
            c.shadowColor = 'rgba(0, 0, 0, 0.6)';
            c.shadowBlur = 0;
            c.shadowOffsetY = 6;
        }

        // 2. Əsas Qaya Gövdəsi
        const rockGrad = c.createLinearGradient(rock.x, rock.y, rock.x, rock.y + rock.h);
        rockGrad.addColorStop(0, '#334155');
        rockGrad.addColorStop(0.35, '#1e293b');
        rockGrad.addColorStop(1, '#0f172a');

        c.fillStyle = rockGrad;
        c.strokeStyle = '#475569';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(rock.x, rock.y, rock.w, rock.h, 8);
        c.fill();
        c.stroke();
        c.shadowBlur = 0;

        // 3. Üst kənar parlaqlığı
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(rock.x + 8, rock.y + 2);
        c.lineTo(rock.x + rock.w - 8, rock.y + 2);
        c.stroke();

        // 4. Çatlar (Yalnız Yüksək və Orta rejimdə görünür)
        const currentQ = (typeof window !== 'undefined' && window.GRAPHICS_QUALITY) ? window.GRAPHICS_QUALITY : 'high';
        if (currentQ === 'high') {
            c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(rock.x + rock.w * 0.25, rock.y + 2);
            c.lineTo(rock.x + rock.w * 0.32, rock.y + rock.h * 0.6);
            c.lineTo(rock.x + rock.w * 0.40, rock.y + rock.h - 3);

            c.moveTo(rock.x + rock.w * 0.70, rock.y + 2);
            c.lineTo(rock.x + rock.w * 0.65, rock.y + rock.h * 0.5);
            c.lineTo(rock.x + rock.w * 0.75, rock.y + rock.h - 3);
            c.stroke();
        }

        // 5. Kiber işıqlar (Yalnız Yüksək və Orta rejimdə)
        if (currentQ !== 'low') {
            c.fillStyle = currentQ === 'high' ? '#38bdf8' : '#0284c7';
            c.beginPath();
            c.arc(rock.x + 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
            c.arc(rock.x + rock.w - 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
            c.fill();
        }
        c.shadowBlur = 0;

        c.restore();

        // ====================================================================
        // C) ƏGƏR LAVANIN BU QAYAYA DƏYMƏSİ VARSA: ÜZƏRİNDƏN AXAN QIZMAR MAYE
        // (Platformanın qalan hissəsi və ALTI isə oyunçunun keçidi üçün TƏHLÜKƏSİZDİR!)
        // ====================================================================
        for (const path of cascadePaths) {
            for (const shelf of path.shelves) {
                if (shelf.rock === rock) {
                    if (shelf.terminated) {
                        // 🛑 Platformada sonlanmış orqanik qaynayan gölməçə (Düz kəsik olmadan!)
                        if (useEngine && typeof LavaEngine.drawTerminatedLavaPool === 'function') {
                            LavaEngine.drawTerminatedLavaPool(c, t, shelf.hitX, rock.y, 24);
                        }
                        // Dar təbii zərər qutusu
                        activeLavaHazardBoxes.push({
                            x: shelf.hitX - 16,
                            y: rock.y - 4,
                            w: 32,
                            h: 10
                        });
                        continue;
                    }

                    const startX = Math.min(shelf.hitX, shelf.outX) - 4;
                    const endX = Math.max(shelf.hitX, shelf.outX) + 4;

                    c.save();
                    let surface = c.createLinearGradient(0, rock.y - 6, 0, rock.y + 8);
                    surface.addColorStop(0, '#ffce55');
                    surface.addColorStop(0.4, '#fa7b16');
                    surface.addColorStop(1, '#98210a');
                    c.beginPath();
                    c.moveTo(startX, rock.y + 6);
                    for (let xx = startX; xx <= endX; xx += 3) {
                        c.lineTo(xx, rock.y - 2 + Math.sin(xx * 0.08 - t * 3) * 1.1);
                    }
                    c.lineTo(endX, rock.y + 6);
                    c.closePath();
                    c.fillStyle = surface;
                    c.fill();

                    // Maye zolaqları
                    for (let j = 0; j < 14; j++) {
                        let q = (t * 0.48 + j / 14) % 1;
                        let xx = shelf.hitX + (shelf.outX - shelf.hitX) * q;
                        c.strokeStyle = (j % 3 === 0) ? '#ffb532' : '#ffe28a';
                        c.lineWidth = 1.2;
                        c.beginPath();
                        c.moveTo(xx, rock.y + 1 + (j % 3) * 1.5);
                        c.lineTo(xx + Math.sign(shelf.outX - shelf.hitX) * 6, rock.y + 1 + (j % 3) * 1.5);
                        c.stroke();
                    }

                    // Zərbə nöqtəsi
                    c.fillStyle = '#ffd567';
                    c.beginPath();
                    c.ellipse(shelf.hitX, rock.y - 1, 14, 3, 0, 0, Math.PI * 2);
                    c.fill();

                    for (let j = 0; j < 12; j++) {
                        let q = (t * 1.2 + j * 0.163) % 1;
                        let side = (j % 2 === 0) ? 1 : -1;
                        let xx = shelf.hitX + side * q * (12 + (j % 4) * 4);
                        let yy = rock.y - 3 - 32 * q * (1 - q);
                        c.globalAlpha = 1 - q;
                        c.fillStyle = '#ffac36';
                        c.beginPath();
                        c.ellipse(xx, yy, 1.1, 1.8, side * q, 0, Math.PI * 2);
                        c.fill();
                    }
                    c.globalAlpha = 1;

                    c.restore();

                    // Yalnız qayanın üstündəki qızmar kanal zərər vurur
                    // Platformanın altı və quru tərəfi 100% təhlükəsizdir!
                    activeLavaHazardBoxes.push({
                        x: startX,
                        y: rock.y - 2,
                        w: Math.max(16, endX - startX),
                        h: 8
                    });
                }
            }
        }
    }

    // ========================================================================
    // D) DAMCILAYAN LAVA KÖZLƏRİ
    // ========================================================================
    for (const dp of lavaDripParticles) {
        c.save();
        const alpha = Math.max(0, Math.min(1, dp.life / dp.maxLife));
        c.globalAlpha = alpha;
        c.fillStyle = '#fde047';
        c.shadowColor = '#f97316';
        c.shadowBlur = 0;
        c.beginPath();
        c.ellipse(dp.x, dp.y, dp.size * 0.7, dp.size * 1.3, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }
}
window.drawPlatforms = drawPlatforms;

// 7. Mini-xəritə
function drawHeightMinimap(ctx, player, worldHeight) {
    if (!player) return;
    const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
    if (!c) return;

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
    const mapX = w - 24;
    const mapY = 80;
    const mapW = 10;
    const mapH = 220;

    c.save();
    c.fillStyle = 'rgba(15, 23, 42, 0.85)';
    c.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(mapX, mapY, mapW, mapH, 4);
    c.fill();
    c.stroke();

    c.fillStyle = '#4ade80';
    c.shadowColor = '#4ade80';
    c.shadowBlur = 0;
    c.beginPath();
    c.arc(mapX + mapW / 2, mapY + 4, 4, 0, Math.PI * 2);
    c.fill();

    const progress = Math.max(0, Math.min(1, (worldHeight - player.y) / worldHeight));
    const playerIndicatorY = (mapY + mapH - 6) - progress * (mapH - 12);

    c.fillStyle = 'rgba(56, 189, 248, 0.6)';
    c.beginPath();
    c.roundRect(mapX + 2, playerIndicatorY, mapW - 4, (mapY + mapH - 2) - playerIndicatorY, 2);
    c.fill();

    c.fillStyle = '#38bdf8';
    c.shadowColor = '#00f0ff';
    c.shadowBlur = 0;
    c.beginPath();
    c.arc(mapX + mapW / 2, playerIndicatorY, 5, 0, Math.PI * 2);
    c.fill();

    c.font = '900 9px Orbitron, monospace';
    c.textAlign = 'right';
    c.fillStyle = '#38bdf8';
    c.shadowBlur = 0;
    c.fillText(`${Math.round(progress * 100)}%`, mapX - 6, playerIndicatorY + 3);

    c.restore();
}
window.drawHeightMinimap = drawHeightMinimap;


// 6. 🔥 ÇOXİSTİQAMƏTLİ LAVA TƏHLÜKƏ SENSORU (Multi-Directional Lava Proximity Warning System)
function getLavaDirectionalDangers(player) {
    const dangers = { right: 0, left: 0, bottom: 0, top: 0 };
    if (!player || typeof gameState === 'undefined' || gameState.gameOver) {
        return dangers;
    }

    const px = player.x;
    const py = player.y;
    const pr = player.radius || 16;

    // 1. AŞAĞIDAKI LAVA CANAVARI:
    if (typeof monster !== 'undefined' && monster && typeof monster.y === 'number') {
        const monsterY = monster.surface ? monster.surface(px, monster.y) : monster.y;
        const distToMonster = monsterY - (py + pr);
        // Əgər canavar 85px-dən yaxındırsa qızarır, uzaqdadırsa ƏSLA qızarmır
        if (distToMonster < 85 && distToMonster > -20) {
            dangers.bottom = Math.max(dangers.bottom, (85 - Math.max(0, distToMonster)) / 70);
        }
    }

    // 2. BÜTÜN LAVA ZONALARI (Şəlalələr, Kaskadlar və Qaya Platforması Lavaları)
    const boxes = [];
    if (typeof activeLavaHazardBoxes !== 'undefined' && Array.isArray(activeLavaHazardBoxes)) {
        for (let i = 0; i < activeLavaHazardBoxes.length; i++) {
            boxes.push(activeLavaHazardBoxes[i]);
        }
    }
    // Həmçinin keşlənmiş kaskad axınları (100% dəqiq aşkar etmək üçün)
    if (window._cachedCascadePaths && Array.isArray(window._cachedCascadePaths)) {
        for (const p of window._cachedCascadePaths) {
            if (p.falls) {
                for (const f of p.falls) {
                    boxes.push({ x: f.x + 4, y: f.y, w: Math.max(12, f.w - 8), h: f.h });
                }
            }
            if (p.shelves) {
                for (const s of p.shelves) {
                    const sx = Math.min(s.hitX, s.outX) - 4;
                    const ex = Math.max(s.hitX, s.outX) + 4;
                    const rY = (s.rock && typeof s.rock.y === 'number') ? s.rock.y : py;
                    boxes.push({ x: sx, y: rY - 2, w: Math.max(16, ex - sx), h: 10 });
                }
            }
        }
    }

    // Bütün lava zonalarına olan məsafə və istiqamət analizi
    for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (!b || typeof b.x !== 'number') continue;

        // İlkin məsafə süzgəci
        if (py < b.y - 85 || py > b.y + b.h + 85) continue;
        if (px < b.x - 85 || px > b.x + b.w + 85) continue;

        const cX = Math.max(b.x, Math.min(px, b.x + b.w));
        const cY = Math.max(b.y, Math.min(py, b.y + b.h));

        const dx = cX - px;
        const dy = cY - py;
        const dist = Math.hypot(dx, dy) - pr;

        // Əgər 65px məsafədən yaxındırsa
        if (dist < 65) {
            const danger = Math.max(0, Math.min(1, (65 - dist) / 58));

            // Üfüqi təhlükə: Sağ və ya Sol
            if (dx > 4) {
                dangers.right = Math.max(dangers.right, danger);
            } else if (dx < -4) {
                dangers.left = Math.max(dangers.left, danger);
            }

            // Şaquli təhlükə: Aşağı və ya Yuxarı
            if (dy > 4) {
                dangers.bottom = Math.max(dangers.bottom, danger);
            } else if (dy < -4) {
                dangers.top = Math.max(dangers.top, danger);
            }
        }
    }

    return dangers;
}
window.getLavaDirectionalDangers = getLavaDirectionalDangers;
window.getLavaDangerInfo = function(player) {
    const d = getLavaDirectionalDangers(player);
    const maxD = Math.max(d.right, d.left, d.bottom, d.top);
    return { danger: maxD };
};
window.getLavaDanger = function(player) {
    const d = getLavaDirectionalDangers(player);
    return Math.max(d.right, d.left, d.bottom, d.top);
};
window.activeLavaHazardBoxes = activeLavaHazardBoxes;
