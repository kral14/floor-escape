// ============================================================================
// 🏔️ PLATFORMALAR, QAYALAR VƏ AĞILLI KASKAD LAVA SİSTEMİ (PROCEDURAL & SOLVABLE)
// 1. Hər qatda və hər oyunda platformaların və lavanın axma yerləri prosedur olaraq dəyişir.
// 2. Dərin kaskad alqoritmi: Yuxarıdan axan lava platformaya dəyir, yönünü dəyişib
//    sağa və ya sola axır. Platformanın altında və yön dəyişən hissəsində oyunçunun
//    sağa/sola rahatlıqla keçə biləcəyi "TƏHLÜKƏSİZ KEÇİD DƏHLİZİ" (Lava Shadow) açılır!
// 3. Ən altda isə bütün axınlar birbaşa aşağıdakı LAVA CANAVARINA tökülür.
// ============================================================================

let currentWorldHeight = 1800; // Qat 1 üçün baza hündürlük
let currentRocks = [];         // Prosedural qaya maneələri
let initialLavaSources = [];   // Prosedural lava axını mənbələri
let activeLavaHazardBoxes = []; // Toqquşma üçün aktiv lava qutuları
let lavaFlowOffset = 0;        // Animasiya zamanı (saniyə ilə)
let lavaDripParticles = [];    // Lavadan damcılayan közlər

// 1. Qat hündürlüyünün hesablanması (Hər qat getdikcə daha uzun olur)
function getFloorWorldHeight(floor = 1) {
    return 1400 + floor * 500;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// 2. Hər dəfə dəyişən prosedural platforma və ağıllı lava generasiyası
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

    // Hər oyunda / qatda unikal dinamika təmin edən təsadüfi toxum (run seed)
    const runSeed = Math.floor(Math.random() * 10000);

    // ========================================================================
    // A) PROSEDURAL QAYA PLATFORMALARI (HƏR DƏFƏ MÜXTƏLİF DÜZÜLÜŞ)
    // ========================================================================
    const rowHeight = 220;
    const numRows = Math.floor(heightSpan / rowHeight);

    for (let r = 0; r < numRows; r++) {
        const rowY = startY - (r * rowHeight) - (Math.random() * 32);
        // Hər qat və mərtəbə üçün 5 müxtəlif həndəsi naxış növü
        const randChoice = (r + floor + runSeed) % 5;

        if (randChoice === 0) {
            // Sol qaya və Sağ qaya (Mərkəzdə şaquli keçid dəhlizi)
            const gap = 180 + Math.random() * 40;
            const leftW = Math.max(160, (w - gap) / 2 - 20 + (Math.random() - 0.5) * 35);
            const rightW = w - (leftW + gap) - 50;
            currentRocks.push({ x: 25, y: rowY, w: leftW, h: 42, type: 'rock' });
            currentRocks.push({ x: w - 25 - rightW, y: rowY, w: rightW, h: 42, type: 'rock' });
        } else if (randChoice === 1) {
            // Nəhəng Mərkəzi Qaya (Kənarlarda sərbəst sıçrayış zonaları)
            const rockW = 280 + Math.random() * 80;
            const rockX = (w - rockW) / 2 + (Math.random() - 0.5) * 40;
            currentRocks.push({ x: rockX, y: rowY, w: rockW, h: 44, type: 'rock' });
        } else if (randChoice === 2) {
            // Pilləli sola meylli ziqzaq adacıqları
            const plat1W = 220 + Math.random() * 50;
            const plat2W = 230 + Math.random() * 50;
            currentRocks.push({ x: 45, y: rowY + 25, w: plat1W, h: 42, type: 'rock' });
            currentRocks.push({ x: w - 45 - plat2W, y: rowY - 25, w: plat2W, h: 42, type: 'rock' });
        } else if (randChoice === 3) {
            // 3 Kiçik Adacıq (Sol, Orta, Sağ)
            const colW = (w - 140) / 3;
            currentRocks.push({ x: 40, y: rowY, w: colW, h: 40, type: 'rock' });
            currentRocks.push({ x: 40 + colW + 30, y: rowY - 18, w: colW, h: 40, type: 'rock' });
            currentRocks.push({ x: w - 40 - colW, y: rowY, w: colW, h: 40, type: 'rock' });
        } else {
            // Balanslaşdırılmış Asimmetrik Platforma
            const isLeftWide = (r % 2 === 0);
            if (isLeftWide) {
                currentRocks.push({ x: 35, y: rowY, w: 290, h: 42, type: 'rock' });
                currentRocks.push({ x: w - 210, y: rowY - 15, w: 175, h: 42, type: 'rock' });
            } else {
                currentRocks.push({ x: 35, y: rowY - 15, w: 175, h: 42, type: 'rock' });
                currentRocks.push({ x: w - 325, y: rowY, w: 290, h: 42, type: 'rock' });
            }
        }
    }

    // ========================================================================
    // B) AĞILLI LAVA MƏNBƏLƏRİNİN YARADILMASI (SOLVABLE CASCADE PUZZLE)
    // ========================================================================
    // Qayda: Lava mənbələri elə yerləşdirilir ki, yuxarıdan axan axın mütləq
    // altındakı platformaya dəysin və platforma tərəfindən sağa/sola yönləndirilsin.
    // Platformanın altında və yön dəyişən tərəfində oyunçu üçün sağa-sola
    // maneəsiz keçid sahəsi (Safe Passageway) açılır!
    const numSources = Math.min(5, 3 + Math.floor(floor / 2));
    const stepSpan = heightSpan / (numSources + 1);

    for (let i = 0; i < numSources; i++) {
        const sourceApproxY = endY + 60 + i * stepSpan + (Math.random() - 0.5) * 40;

        // Bu mənbənin altında yerləşən ilk platformaları tapırıq
        const candidateRocks = currentRocks.filter(rk => rk.y > sourceApproxY + 40 && rk.y < sourceApproxY + 280);

        let sourceX = 0;
        const sourceW = 28;

        if (candidateRocks.length > 0) {
            const targetRock = candidateRocks[Math.floor(Math.random() * candidateRocks.length)];
            // Qayanın sol və ya sağ 1/3 hissəsinə tökülür ki, qayanın qalan 2/3 hissəsi
            // təhlükəsiz quru daş zonası olsun və oyunçu rahat ayaq basa bilsin!
            const hitLeft = (i % 2 === 0);
            if (hitLeft) {
                sourceX = targetRock.x + 22 + Math.random() * 20;
            } else {
                sourceX = targetRock.x + targetRock.w - 48 - Math.random() * 20;
            }
        } else {
            // Əgər qaya yoxdursa divara yaxın axın yaradırıq (orta keçid açıq qalır)
            sourceX = (i % 2 === 0) ? (45 + Math.random() * 30) : (w - 75 - Math.random() * 30);
        }

        initialLavaSources.push({
            x: Math.max(25, Math.min(w - 55, sourceX)),
            y: sourceApproxY,
            w: sourceW,
            seed: i + runSeed
        });
    }
}
window.initFloorPlatforms = initFloorPlatforms;

// 3. Toqquşma və Yanma Fizikası
function updatePlatformsPhysics(player, dt = 0.016) {
    if (!player) return;

    lavaFlowOffset += dt;

    const pr = player.radius || 16;
    const prSq = pr * pr;

    // A) QAYALARLA TOQQUŞMA (Solid Rock Collision & Landing)
    for (const rock of currentRocks) {
        const pLeft = player.x - pr;
        const pRight = player.x + pr;
        const pTop = player.y - pr;
        const pBottom = player.y + pr;

        const rLeft = rock.x;
        const rRight = rock.x + rock.w;
        const rTop = rock.y;
        const rBottom = rock.y + rock.h;

        if (pRight > rLeft && pLeft < rRight && pBottom > rTop && pTop < rBottom) {
            const overlapLeft = pRight - rLeft;
            const overlapRight = rRight - pLeft;
            const overlapTop = pBottom - rTop;
            const overlapBottom = rBottom - pTop;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop && player.vy >= 0) {
                // Qayanın üstünə düşdü
                player.y = rTop - pr;
                player.vy = 0;
                player.isGrounded = true;
                player.jumpCount = 0;
            } else if (minOverlap === overlapBottom && player.vy <= 0) {
                // Aşağıdan qayaya dəydi
                player.y = rBottom + pr;
                player.vy = 20;
            } else if (minOverlap === overlapLeft) {
                player.x = rLeft - pr;
                player.vx = 0;
            } else if (minOverlap === overlapRight) {
                player.x = rRight + pr;
                player.vx = 0;
            }
        }
    }

    // B) AXAN VƏ TÖKÜLƏN LAVAYA TOXUNMA (Lava dəysə yanırıq)
    if (typeof gameState !== 'undefined' && !gameState.transitioning && gameState.dashInvulnerable <= 0) {
        for (const fall of activeLavaHazardBoxes) {
            const cX = Math.max(fall.x, Math.min(player.x, fall.x + fall.w));
            const cY = Math.max(fall.y, Math.min(player.y, fall.y + fall.h));
            const dX = player.x - cX;
            const dY = player.y - cY;

            if (dX * dX + dY * dY < prSq * 0.72) {
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
            vy: 80 + Math.random() * 90,
            size: 2.2 + Math.random() * 2.5,
            life: 0.8,
            maxLife: 0.8
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
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 160;
            const pColor = i % 2 === 0 ? '#facc15' : '#ef4444';
            if (typeof Particle !== 'undefined') {
                const p = new Particle(player.x, player.y, pColor, 3.8);
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

// 5. ŞÜA İZLƏMƏ: Lavanın qaya platformalarına dəyib yön dəyişməsi və canavara tökülməsi
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

        const maxDeflections = 5;
        for (let d = 0; d < maxDeflections; d++) {
            const streamCenter = currX + currW * 0.5;

            // Bu axının altında yerləşən ən yaxın qayanı tapırıq
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

            // 1. Şaquli şəlalə (currY -> minHitY)
            const fallH = Math.max(12, minHitY - currY);
            path.falls.push({
                x: currX,
                y: currY,
                w: currW,
                h: fallH,
                seed: seed + d
            });

            // Əgər heç bir qayaya dəymədisə və ya canavara çatdısa, axın canavara tökülüb bitir!
            if (!hitRock || minHitY >= monsterY) {
                path.monsterImpact = {
                    x: streamCenter,
                    y: monsterY
                };
                break;
            }

            // 2. QAYAYA DƏYDİ! Lavanın qaya üzərində sağa və ya sola axması
            // Dəydiyi nöqtə
            const hitX = Math.max(hitRock.x + 12, Math.min(hitRock.x + hitRock.w - 12, streamCenter));
            
            // YÖNÜN TƏYİN EDİLMƏSİ (Sağa və ya sola axma istiqaməti)
            // İstifadəçinin istəyi: Lava töküldükdən sonra yönünü dəyişir (məsələn, sola dəyibsə sağa axır,
            // və ya sağa dəyibsə sola axır) və kənardan yenidən aşağı tökülür!
            // Qayanın digər tərəfi və qayanın ALTI isə oyunçunun sağa-sola keçməsi üçün TƏMİZ VƏ TƏHLÜKƏSİZ qalır!
            const distToLeft = hitX - hitRock.x;
            const distToRight = (hitRock.x + hitRock.w) - hitX;
            
            // Əgər soldadırsa -> sağa doğru axır (outX = rock.x + rock.w - 14)
            // Əgər sağdadırsa -> sola doğru axır (outX = rock.x + 14)
            const goRight = distToLeft < distToRight;
            const outX = goRight ? (hitRock.x + hitRock.w - 14) : (hitRock.x + 14);

            path.shelves.push({
                rock: hitRock,
                hitX: hitX,
                outX: outX,
                goRight: goRight,
                d: d
            });

            // Növbəti şəlalə bu qayanın alt dodağından tökülməyə başlayır!
            currW = Math.min(currW, 28);
            currX = outX - currW * 0.5;
            currY = hitRock.y + hitRock.h - 2;
        }

        paths.push(path);
    }

    return paths;
}

// 6. ƏSAS RENDER: KASKAD LAVA VƏ PROSEDURAL PLATFORMALAR
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

    // Bütün lava cərəyanlarının platformalarla toqquşma və kaskad xəritəsini hesablayırıq
    const cascadePaths = traceLavaCascadePaths(initialLavaSources, currentRocks, monsterBottomY);

    // ========================================================================
    // A) ŞƏLALƏLƏR VƏ QAYALARIN ÜZƏRİNDƏN AXAN LAVA
    // ========================================================================
    for (let pIdx = 0; pIdx < cascadePaths.length; pIdx++) {
        const path = cascadePaths[pIdx];

        // Mənbə oyuqu (Vulkanik qaya çıxışı)
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

            // Aktiv şaquli təhlükə zonası (Lava şəlaləsi)
            activeLavaHazardBoxes.push({
                x: fall.x + 3,
                y: fall.y,
                w: fall.w - 6,
                h: fall.h
            });
        }

        // Canavara tökülən nöqtədə zərbə qaynaması
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
    // B) QAYA PLATFORMALARI (Cyber Obsidian Dizaynı)
    // ========================================================================
    for (const rock of currentRocks) {
        c.save();

        // 1. Qaya xarici kölgəsi
        c.shadowColor = 'rgba(0, 0, 0, 0.7)';
        c.shadowBlur = 18;
        c.shadowOffsetY = 8;

        // 2. Əsas Qaya Gövdəsi (Teksturalı Tünd Qaya)
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

        // 3. Qayanın üst kənar işıqlanması (Bevel highlight)
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(rock.x + 8, rock.y + 2);
        c.lineTo(rock.x + rock.w - 8, rock.y + 2);
        c.stroke();

        // 4. Qaya Çatları və Həndəsi Cizgilər
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

        // 5. Qaya Kənarlarında Neon Kiber Qeyd
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
        // (Platformanın qalan hissəsi və ALTI isə oyunçunun keçidi üçün təhlükəsizdir!)
        // ====================================================================
        for (const path of cascadePaths) {
            for (const shelf of path.shelves) {
                if (shelf.rock === rock) {
                    const startX = Math.min(shelf.hitX, shelf.outX) - 6;
                    const endX = Math.max(shelf.hitX, shelf.outX) + 6;

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

                    // Sağa və ya sola axan maye zolaqları
                    for (let j = 0; j < 14; j++) {
                        let q = (t * 0.48 + j / 14) % 1;
                        let xx = shelf.hitX + (shelf.outX - shelf.hitX) * q;
                        c.strokeStyle = j % 3 ? '#ffb532' : '#ffe28a';
                        c.lineWidth = 1.2;
                        c.beginPath();
                        c.moveTo(xx, rock.y + 1 + (j % 3) * 1.5);
                        c.lineTo(xx + Math.sign(shelf.outX - shelf.hitX) * 6, rock.y + 1 + (j % 3) * 1.5);
                        c.stroke();
                    }

                    // Zərbə nöqtəsi və sıçrayışlar
                    c.fillStyle = '#ffd567';
                    c.beginPath();
                    c.ellipse(shelf.hitX, rock.y - 1, 14, 3, 0, 0, Math.PI * 2);
                    c.fill();

                    for (let j = 0; j < 12; j++) {
                        let q = (t * 1.2 + j * 0.163) % 1;
                        let side = j % 2 ? 1 : -1;
                        let xx = shelf.hitX + side * q * (12 + (j % 4) * 4);
                        let yy = rock.y - 3 - 32 * q * (1 - q);
                        c.globalAlpha = 1 - q;
                        c.fillStyle = '#ffac36';
                        c.beginPath();
                        c.ellipse(xx, yy, 1.1, 1.8, side * q, 0, Math.PI * 2);
                        c.fill();
                    }
                    c.globalAlpha = 1;

                    // Qapalı tərəfdə qoruyucu sahil divarı (Retaining bank)
                    const closedX = shelf.goRight ? rock.x : (rock.x + rock.w);
                    c.fillStyle = '#353239';
                    c.beginPath();
                    if (shelf.goRight) {
                        c.moveTo(shelf.hitX - 8, rock.y + 8);
                        c.lineTo(shelf.hitX - 7, rock.y - 8);
                        c.lineTo(shelf.hitX + 3, rock.y - 10);
                        c.lineTo(shelf.hitX + 6, rock.y + 8);
                    } else {
                        c.moveTo(shelf.hitX - 6, rock.y + 8);
                        c.lineTo(shelf.hitX - 3, rock.y - 10);
                        c.lineTo(shelf.hitX + 7, rock.y - 8);
                        c.lineTo(shelf.hitX + 8, rock.y + 8);
                    }
                    c.closePath();
                    c.fill();

                    c.restore();

                    // Yalnız qayanın üstündəki qızmar maye kanalı oyunçunu yandırır
                    // Qayanın digər tərəfi və platformanın ALTI isə TƏMİZ VƏ TƏHLÜKƏSİZDİR!
                    activeLavaHazardBoxes.push({
                        x: startX,
                        y: rock.y - 3,
                        w: Math.max(20, endX - startX),
                        h: 10
                    });
                }
            }
        }
    }

    // ========================================================================
    // D) DAMCILAYAN LAVA KÖZLƏRİ (Dripping Embers)
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

// 7. Şaquli Hündürlük Tərəqqisi İndikatoru (Minimap / Height Bar on HUD)
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
