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

let currentWorldHeight = 1800;
let currentRocks = [];         // Prosedural üzən qaya adacıqları
let initialLavaSources = [];   // Prosedural lava mənbələri
let activeLavaHazardBoxes = []; // Dəqiq və ədalətli toqquşma zonaları
let lavaFlowOffset = 0;        // Animasiya zamanı (saniyə)
let lavaDripParticles = [];    // Lavadan damcılayan közlər

// 1. Qat hündürlüyü
function getFloorWorldHeight(floor = 1) {
    return 1400 + floor * 500;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// 2. Hər dəfə unikal, amma 100% KEÇİLƏ BİLƏN platforma və lava xəritəsi
function initFloorPlatforms(floor = 1) {
    currentWorldHeight = getFloorWorldHeight(floor);
    currentRocks = [];
    initialLavaSources = [];
    activeLavaHazardBoxes = [];
    lavaDripParticles = [];

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
    const totalHeight = currentWorldHeight;

    const startY = totalHeight - 260;
    const endY = 220;
    const heightSpan = startY - endY;

    // Hər oyunda / qatda fərqli layout təmin edən unikal toxum
    const runSeed = Math.floor(Math.random() * 10000);

    // ========================================================================
    // A) PROSEDURAL QAYA ADACIQLARI (GENİŞ KEÇİD BOŞLUQLARI İLƏ)
    // ========================================================================
    // Mərtəbələr arası 220-250px məsafə saxlayırıq ki, oyunçu rahat süzə bilsin
    const rowSpacing = 230;
    const numRows = Math.floor(heightSpan / rowSpacing);

    for (let r = 0; r < numRows; r++) {
        const rowY = startY - (r * rowSpacing) - (Math.random() * 25);
        const pattern = (r + floor + runSeed) % 4;

        if (pattern === 0) {
            // Sol qaya və Sağ qaya (Ortada 240px geniş sərbəst dəhliz)
            const leftW = 160 + Math.random() * 40;
            const rightW = 160 + Math.random() * 40;
            currentRocks.push({ x: 30, y: rowY, w: leftW, h: 40, type: 'rock' });
            currentRocks.push({ x: w - 30 - rightW, y: rowY, w: rightW, h: 40, type: 'rock' });
        } else if (pattern === 1) {
            // Mərkəzi Qaya (Həm solunda, həm sağında 180px+ geniş keçid yolu)
            const centerW = 200 + Math.random() * 60;
            const centerX = (w - centerW) / 2 + (Math.random() - 0.5) * 40;
            currentRocks.push({ x: centerX, y: rowY, w: centerW, h: 42, type: 'rock' });
        } else if (pattern === 2) {
            // Sola meylli qaya (Sağ tərəfdə 300px nəhəng sərbəst zona)
            const rockW = 210 + Math.random() * 50;
            currentRocks.push({ x: 40, y: rowY, w: rockW, h: 40, type: 'rock' });
        } else {
            // Sağa meylli qaya (Sol tərəfdə 300px nəhəng sərbəst zona)
            const rockW = 210 + Math.random() * 50;
            currentRocks.push({ x: w - 40 - rockW, y: rowY, w: rockW, h: 40, type: 'rock' });
        }
    }

    // ========================================================================
    // B) AĞILLI KASKAD LAVA MƏNBƏLƏRİ (SOLVABLE DEFLECTION PUZZLE)
    // ========================================================================
    // Qayda: Lava axınları elə hədəflənir ki, yuxarıdan tökülən lava mütləq
    // qayanın bir kənarına dəysin, qayanın üstü ilə digər kənara axsın.
    // Nəticədə:
    // - Həmin qayanın ALTINDA və qarşı tərəfində TƏMİZ VƏ TƏHLÜKƏSİZ keçid yaranır.
    // - Oyunçu həmin sığınacaqdan istifadə edərək sağa və ya sola maneəsiz keçir!
    const numSources = Math.min(4, 2 + Math.floor(floor / 2));
    const tierSpan = heightSpan / (numSources + 1);

    for (let i = 0; i < numSources; i++) {
        const approxY = endY + 70 + i * tierSpan + (Math.random() - 0.5) * 35;

        // Bu hündürlükdən aşağıda yerləşən ən yaxın qayaları tapırıq
        const rocksBelow = currentRocks.filter(rk => rk.y > approxY + 30 && rk.y < approxY + 280);

        let sourceX = 0;
        const sourceW = 26;

        if (rocksBelow.length > 0) {
            // Qayaya yönəldirik
            const targetRock = rocksBelow[Math.floor(Math.random() * rocksBelow.length)];
            // Qayanın sol və ya sağ 25%-lik kənarına yönəldirik
            const hitLeft = (i % 2 === 0);
            if (hitLeft) {
                // Sola dəyəcək -> sağa yönələcək (altında soldan sağa keçid açılır!)
                sourceX = targetRock.x + 18 + Math.random() * 14;
            } else {
                // Sağa dəyəcək -> sola yönələcək (altında sağdan sola keçid açılır!)
                sourceX = targetRock.x + targetRock.w - 38 - Math.random() * 14;
            }
        } else {
            // Əgər qaya yoxdursa, divara bitişik tökülür (ortadan keçid tam açıqdır)
            sourceX = (i % 2 === 0) ? (35 + Math.random() * 20) : (w - 60 - Math.random() * 20);
        }

        initialLavaSources.push({
            x: Math.max(25, Math.min(w - 55, sourceX)),
            y: approxY,
            w: sourceW,
            seed: i + runSeed
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

    if (player.hasShield) {
        player.breakShield();
        if (typeof showToast === 'function') {
            showToast('🔥 AXAN LAVAYA DƏYDİNİZ! Qalxanınız yandı və sizi xilas etdi!', 'warning');
        }
        return;
    }

    if (player.hasLifeFlower && typeof player.consumeLifeFlower === 'function') {
        player.consumeLifeFlower();
        if (typeof showToast === 'function') {
            showToast('🌸 AXAN LAVAYA DƏYDİNİZ! Yaşam Çiçəyi yanaraq canınızı qorudu!', 'warning');
        }
        return;
    }

    if (typeof showToast === 'function') {
        showToast('🔥 DİQQƏT! AXAN LAVAYA DƏYDİNİZ VƏ YANDINIZ!', 'danger');
    }

    if (typeof addFloatingText === 'function') {
        addFloatingText(player.x, player.y - 25, '🔥 YANDIN!', '#ef4444', 20);
    }

    if (typeof triggerGameOver === 'function') {
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

            // 1. Şaquli şəlalə axını
            const fallH = Math.max(10, minHitY - currY);
            path.falls.push({
                x: currX,
                y: currY,
                w: currW,
                h: fallH,
                seed: seed + d
            });

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

            // Qayanın sol tərəfinə dəyibsə -> SAĞA axır!
            // Qayanın sağ tərəfinə dəyibsə -> SOLA axır!
            // Beləliklə platformanın digər tərəfi və ALTI oyunçunun keçidi üçün TƏHLÜKƏSİZ qalır!
            const goRight = (distToLeft < distToRight);
            const outX = goRight ? (hitRock.x + hitRock.w - 14) : (hitRock.x + 14);

            path.shelves.push({
                rock: hitRock,
                hitX: hitX,
                outX: outX,
                goRight: goRight,
                d: d
            });

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

    const t = lavaFlowOffset;
    activeLavaHazardBoxes = [];

    // Canavarın səthi (Lavanın töküldüyü son nöqtə)
    const monsterBottomY = (typeof monster !== 'undefined' && monster && typeof monster.y === 'number')
        ? monster.y
        : currentWorldHeight;

    const useEngine = (typeof LavaEngine !== 'undefined' && LavaEngine);

    // Kaskad şüalarını hesablayırıq
    const cascadePaths = traceLavaCascadePaths(initialLavaSources, currentRocks, monsterBottomY);

    // ========================================================================
    // A) ŞƏLALƏLƏR VƏ QAYALARIN ÜZƏRİNDƏN AXAN LAVA
    // ========================================================================
    for (let pIdx = 0; pIdx < cascadePaths.length; pIdx++) {
        const path = cascadePaths[pIdx];

        // Mənbə oyuqu
        if (useEngine) {
            LavaEngine.drawLavaSourceRock(c, path.source.x, path.source.y, path.source.w, path.source.seed, t);
        }

        // Bütün şaquli şəlalə axınları (Pillələr arası və ən altda canavara tökülən)
        for (let fIdx = 0; fIdx < path.falls.length; fIdx++) {
            const fall = path.falls[fIdx];
            if (useEngine) {
                LavaEngine.drawPlatformWaterfall(c, t + fIdx * 0.75, fall.x, fall.y, fall.w, fall.h);
                if (fIdx > 0) {
                    LavaEngine.drawSpillwayLip(c, fall.x, fall.w, fall.y + 2);
                }
            }

            // Şaquli lava şəlaləsinin faktiki zərər zonası (ədalətli dar hitbox)
            activeLavaHazardBoxes.push({
                x: fall.x + 4,
                y: fall.y,
                w: Math.max(12, fall.w - 8),
                h: fall.h
            });
        }

        // Canavara tökülən nöqtədə qaynayan dalğa
        if (path.monsterImpact && useEngine) {
            c.save();
            c.fillStyle = '#ffd567';
            c.beginPath();
            c.ellipse(path.monsterImpact.x, monsterBottomY - 1, 20, 5, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    }

    // ========================================================================
    // B) QAYA PLATFORMALARI (Obsidian Dizaynı)
    // ========================================================================
    for (const rock of currentRocks) {
        c.save();

        // 1. Qaya xarici kölgəsi
        c.shadowColor = 'rgba(0, 0, 0, 0.7)';
        c.shadowBlur = 18;
        c.shadowOffsetY = 8;

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

        // 4. Çatlar
        c.strokeStyle = 'rgba(15, 23, 42, 0.75)';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(rock.x + rock.w * 0.25, rock.y + 2);
        c.lineTo(rock.x + rock.w * 0.32, rock.y + rock.h * 0.6);
        c.lineTo(rock.x + rock.w * 0.40, rock.y + rock.h - 3);

        c.moveTo(rock.x + rock.w * 0.70, rock.y + 2);
        c.lineTo(rock.x + rock.w * 0.65, rock.y + rock.h * 0.5);
        c.lineTo(rock.x + rock.w * 0.75, rock.y + rock.h - 3);
        c.stroke();

        // 5. Kiber işıqlar
        c.fillStyle = '#38bdf8';
        c.shadowColor = '#38bdf8';
        c.shadowBlur = 8;
        c.beginPath();
        c.arc(rock.x + 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
        c.arc(rock.x + rock.w - 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
        c.fill();

        c.restore();

        // ====================================================================
        // C) ƏGƏR LAVANIN BU QAYAYA DƏYMƏSİ VARSA: ÜZƏRİNDƏN AXAN QIZMAR MAYE
        // (Platformanın qalan hissəsi və ALTI isə oyunçunun keçidi üçün TƏHLÜKƏSİZDİR!)
        // ====================================================================
        for (const path of cascadePaths) {
            for (const shelf of path.shelves) {
                if (shelf.rock === rock) {
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
        c.shadowBlur = 10;
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
    c.shadowBlur = 8;
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
    c.shadowBlur = 10;
    c.beginPath();
    c.arc(mapX + mapW / 2, playerIndicatorY, 5, 0, Math.PI * 2);
    c.fill();

    c.font = '900 9px Orbitron, monospace';
    c.textAlign = 'right';
    c.fillStyle = '#38bdf8';
    c.shadowBlur = 6;
    c.fillText(`${Math.round(progress * 100)}%`, mapX - 6, playerIndicatorY + 3);

    c.restore();
}
window.drawHeightMinimap = drawHeightMinimap;
