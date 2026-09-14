// ============================================================================
// 🏔️ PLATFORMALAR, QAYALAR VƏ KASKAD AXAN LAVA SİSTEMİ (CASCADE HAZARDS)
// Hər qatın şaquli dırmaşma hündürlüyünü, pilləli qayaları və qayanın üstünə
// tökülüb sağa/sola axaraq birbaşa aşağıdakı LAVA CANAVARINA tökülən lavanı idarə edir.
// ============================================================================

let currentWorldHeight = 1800; // Qat 1 üçün baza hündürlük
let currentRocks = [];         // Qaya maneələri (oyunçu dayana bilər)
let currentLavaCascades = [];  // Kaskad lava zəncirləri (pillədən-pilləyə axan)
let currentLavaFalls = [];     // Aktiv şəlalə axınlarının toqquşma qutuları
let lavaFlowOffset = 0;        // Animasiya zamanı (saniyə ilə)
let lavaDripParticles = [];    // Lavadan damcılayan közlər

// 1. Qat hündürlüyünün hesablanması (Hər qat getdikcə daha uzun olur)
function getFloorWorldHeight(floor = 1) {
    return 1400 + floor * 500;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// 2. Qatın qaya və kaskad lava xəritəsinin generasiyası
function initFloorPlatforms(floor = 1) {
    currentWorldHeight = getFloorWorldHeight(floor);
    currentRocks = [];
    currentLavaCascades = [];
    currentLavaFalls = [];
    lavaDripParticles = [];

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
    const totalHeight = currentWorldHeight;

    const startY = totalHeight - 280;
    const endY = 240;
    const heightSpan = startY - endY;

    // A) KASKAD LAVA ZƏNCİRLƏRİNİN YARADILMASI (Pillədən-pilləyə axan və canavara tökülən)
    // Hər qat üçün 2 və ya 3 böyük kaskad zənciri qururuq
    const numChains = Math.min(3, 2 + (floor > 2 ? 1 : 0));
    const chainSpacing = heightSpan / numChains;

    for (let cIdx = 0; cIdx < numChains; cIdx++) {
        const chainTopY = endY + 80 + cIdx * chainSpacing + (Math.random() - 0.5) * 60;
        const isLeftSector = (cIdx % 2 === 0);

        // Mənbə (Vulkanik qaya çıxışı)
        const sourceX = isLeftSector ? (120 + Math.random() * 80) : (w - 200 - Math.random() * 80);
        const sourceY = chainTopY;

        // 3 Pilləli Kaskad Qayaları:
        // Pillə 1: Lava mənbədən bura tökülür, sağa (və ya sola) axır
        // Pillə 2: Pillə 1-in kənarından bura tökülür, əks istiqamətə axır
        // Pillə 3: Pillə 2-dən bura tökülür və buradan BİRBAŞA AŞAĞI CANAVARA tökülür!
        const dir1 = isLeftSector ? 1 : -1; // 1: sağa axır, -1: sola axır
        const shelf1W = 240 + Math.random() * 50;
        const shelf1X = isLeftSector ? (sourceX - 40) : (sourceX - shelf1W + 40);
        const shelf1Y = sourceY + 110;
        const out1X = dir1 === 1 ? (shelf1X + shelf1W - 20) : (shelf1X + 20);

        // Pillə 2 (Pillə 1-in çıxışının altında yerləşir)
        const dir2 = -dir1; // Əks istiqamətə axır
        const shelf2W = 250 + Math.random() * 50;
        const shelf2Y = shelf1Y + 150 + Math.random() * 30;
        const shelf2X = dir2 === 1 ? (out1X - 35) : (out1X - shelf2W + 35);
        const out2X = dir2 === 1 ? (shelf2X + shelf2W - 20) : (shelf2X + 20);

        // Pillə 3 (Pillə 2-nin çıxışının altında yerləşir və sonuncu pillədir)
        const dir3 = dir1; // Yenidən ilk istiqamətə axır
        const shelf3W = 230 + Math.random() * 40;
        const shelf3Y = shelf2Y + 160 + Math.random() * 30;
        const shelf3X = dir3 === 1 ? (out2X - 35) : (out2X - shelf3W + 35);
        const out3X = dir3 === 1 ? (shelf3X + shelf3W - 20) : (shelf3X + 20);

        const cascadeChain = {
            seed: cIdx,
            source: { x: sourceX, y: sourceY },
            levels: [
                {
                    x: shelf1X,
                    y: shelf1Y,
                    w: shelf1W,
                    h: 40,
                    hit: [sourceX],
                    out: [out1X],
                    direction: dir1
                },
                {
                    x: shelf2X,
                    y: shelf2Y,
                    w: shelf2W,
                    h: 40,
                    hit: [out1X],
                    out: [out2X],
                    direction: dir2
                },
                {
                    x: shelf3X,
                    y: shelf3Y,
                    w: shelf3W,
                    h: 40,
                    hit: [out2X],
                    out: [out3X],
                    direction: dir3,
                    isBottomShelf: true // Bu pillədən birbaşa canavara kimi tökülür!
                }
            ]
        };

        currentLavaCascades.push(cascadeChain);

        // Qayaları fiziki platformalar siyahısına əlavə edirik ki, oyunçu üstündə atlaya bilsin
        cascadeChain.levels.forEach(lvl => {
            currentRocks.push({
                x: lvl.x,
                y: lvl.y,
                w: lvl.w,
                h: lvl.h,
                type: 'cascade_shelf'
            });
        });
    }

    // B) ƏLAVƏ SƏRBƏST QAYA PLATFORMALARI (Oyunçunun dırmaşması üçün aralıq adacıqlar)
    const numRows = Math.floor(heightSpan / 220);
    for (let r = 0; r < numRows; r++) {
        const rowY = startY - (r * 220) - Math.random() * 35;
        // Əgər həmin hündürlükdə kaskad qayası yoxdursa, müstəqil platforma qoyuruq
        const hasNearShelf = currentRocks.some(rk => Math.abs(rk.y - rowY) < 75);
        if (!hasNearShelf) {
            const side = (r % 2 === 0);
            const platX = side ? (40 + Math.random() * 80) : (w - 240 - Math.random() * 80);
            const platW = 180 + Math.random() * 50;
            currentRocks.push({
                x: platX,
                y: rowY,
                w: platW,
                h: 38,
                type: 'standalone_rock'
            });
        }
    }
}
window.initFloorPlatforms = initFloorPlatforms;

// 3. Toqquşma və Yanma Fizikası
function updatePlatformsPhysics(player, dt = 0.016) {
    if (!player) return;

    // Axın fazasını yenilə
    lavaFlowOffset += dt;

    const pr = player.radius || 16;
    const prSq = pr * pr;

    // A) QAYA MANEƏLƏRİ İLƏ TOQQUŞMA (Solid Rock Collision & Landing)
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

    // B) AXAN VƏ TÖKÜLƏN LAVAYA TOXUNMA ("Lava dəysə yanırıq")
    if (typeof gameState !== 'undefined' && !gameState.transitioning && gameState.dashInvulnerable <= 0) {
        for (const fall of currentLavaFalls) {
            const cX = Math.max(fall.x, Math.min(player.x, fall.x + fall.w));
            const cY = Math.max(fall.y, Math.min(player.y, fall.y + fall.h));
            const dX = player.x - cX;
            const dY = player.y - cY;

            if (dX * dX + dY * dY < prSq * 0.75) {
                handleLavaBurn(player);
                break;
            }
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

    // Yanma zərrəcikləri
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

    // Yanma səsi
    if (typeof audio !== 'undefined' && typeof audio.playExplosion === 'function') {
        audio.playExplosion();
    }

    // Ekran qırmızı yanıb-sönür
    if (typeof screenPulse !== 'undefined') {
        screenPulse.color = 'rgba(239, 68, 68, 0.45)';
        screenPulse.alpha = 0.85;
    }

    // Qalxan qoruyurmu?
    if (player.hasShield) {
        player.breakShield();
        if (typeof showToast === 'function') {
            showToast('🔥 AXAN LAVAYA DƏYDİNİZ! Qalxanınız yandı və sizi xilas etdi!', 'warning');
        }
        return;
    }

    // Yaşam çiçəyi qoruyurmu?
    if (player.hasLifeFlower && typeof player.consumeLifeFlower === 'function') {
        player.consumeLifeFlower();
        if (typeof showToast === 'function') {
            showToast('🌸 AXAN LAVAYA DƏYDİNİZ! Yaşam Çiçəyi yanaraq canınızı qorudu!', 'warning');
        }
        return;
    }

    // Heç bir qorunma yoxdursa: Yanaraq ölür!
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

// 5. ƏSAS RENDER: KASKAD LAVA VƏ PLATFORMALAR
function drawPlatforms(ctx) {
    const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
    if (!c) return;

    const t = lavaFlowOffset;
    currentLavaFalls = []; // Hər kadrda aktiv lava təhlükə qutularını yeniləyirik

    // Canavarın və ya dünyanın ən alt lava səthi
    const monsterBottomY = (typeof monster !== 'undefined' && monster && typeof monster.y === 'number') 
        ? monster.y 
        : currentWorldHeight;

    const useEngine = (typeof LavaEngine !== 'undefined' && LavaEngine);

    // ========================================================================
    // 1. KASKAD LAVA ZƏNCİRLƏRİNİN ÇƏKİLMƏSİ (Şəlalələr + Qayalar + Canavara tökülmə)
    // ========================================================================
    for (let cIdx = 0; cIdx < currentLavaCascades.length; cIdx++) {
        const chain = currentLavaCascades[cIdx];
        const firstShelf = chain.levels[0];

        // A) Mənbədən birinci pilləyə tökülən ilkin şəlalə
        const srcHeight = firstShelf.y - chain.source.y;
        if (srcHeight > 0) {
            if (useEngine) {
                LavaEngine.drawPlatformWaterfall(c, t, chain.source.x - 13, chain.source.y, 26, srcHeight);
                LavaEngine.drawLavaSourceRock(c, chain.source.x - 13, chain.source.y, 26, chain.seed, t);
            }
            // Toqquşma qutusu
            currentLavaFalls.push({
                x: chain.source.x - 13,
                y: chain.source.y,
                w: 26,
                h: srcHeight
            });
        }

        // B) Pillələrin çəkilməsi və pillədən-pilləyə tökülən şəlalələr
        for (let i = 0; i < chain.levels.length; i++) {
            const shelf = chain.levels[i];
            const isLast = (i === chain.levels.length - 1);
            
            // Əgər sonuncu pillədirsə: BİRBAŞA LAVA CANAVARINA (monsterBottomY) tökülür!
            // Əgər aralıq pillədirsə: Aşağıdakı növbəti pilləyə tökülür!
            const nextShelf = isLast ? null : chain.levels[i + 1];
            const nextY = isLast ? monsterBottomY : nextShelf.y + 2;
            const fallHeight = Math.max(10, nextY - (shelf.y + shelf.h - 4));

            // Şəlalə axını (Kənardan aşağı tökülür)
            for (const edge of shelf.out) {
                const streamX = edge - 13;
                const streamY = shelf.y + shelf.h - 4;

                if (useEngine) {
                    LavaEngine.drawPlatformWaterfall(c, t + i * 0.8, streamX, streamY, 26, fallHeight);
                    LavaEngine.drawSpillwayLip(c, streamX, 26, shelf.y + shelf.h);
                }

                // Toqquşma zonası
                currentLavaFalls.push({
                    x: streamX,
                    y: streamY,
                    w: 26,
                    h: fallHeight
                });

                // Əgər canavara tökülürsə, canavarın səthində qaynayan zərbə effekti
                if (isLast && useEngine && fallHeight > 20) {
                    c.save();
                    c.fillStyle = '#ffd567';
                    c.beginPath();
                    c.ellipse(edge, monsterBottomY - 1, 22, 5, 0, 0, Math.PI * 2);
                    c.fill();
                    c.restore();
                }
            }

            // Qayanın özünün və üzərindən axan qızmar mayenin çəkilməsi
            if (useEngine) {
                LavaEngine.drawCascadeShelf(c, t + i * 0.4, shelf);
            }

            // Qayanın üzərindəki qaynayan maye də oyunçunu yandırır!
            if (shelf.hit && shelf.hit.length > 0 && shelf.out && shelf.out.length > 0) {
                const startX = Math.min(shelf.hit[0], shelf.out[0]);
                const endX = Math.max(shelf.hit[0], shelf.out[0]);
                currentLavaFalls.push({
                    x: startX,
                    y: shelf.y - 4,
                    w: Math.max(30, endX - startX),
                    h: 12
                });
            }
        }
    }

    // ========================================================================
    // 2. SƏRBƏST QAYALAR (Oyunçunun təhlükəsiz dayana biləcəyi adacıqlar)
    // ========================================================================
    for (const rock of currentRocks) {
        if (rock.type === 'standalone_rock') {
            c.save();
            c.shadowColor = 'rgba(0, 0, 0, 0.7)';
            c.shadowBlur = 16;
            c.shadowOffsetY = 6;

            const stoneGrad = c.createLinearGradient(0, rock.y, 0, rock.y + rock.h);
            stoneGrad.addColorStop(0, '#56504b');
            stoneGrad.addColorStop(0.25, '#2a2a30');
            stoneGrad.addColorStop(1, '#101219');

            c.beginPath();
            c.roundRect(rock.x, rock.y, rock.w, rock.h, 10);
            c.fillStyle = stoneGrad;
            c.fill();
            c.shadowBlur = 0;

            c.strokeStyle = '#475569';
            c.lineWidth = 2;
            c.stroke();

            // Üst kənar parlaqlığı
            c.strokeStyle = '#94a3b8';
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(rock.x + 10, rock.y + 2);
            c.lineTo(rock.x + rock.w - 10, rock.y + 2);
            c.stroke();

            // Kiber işıqlar
            c.fillStyle = '#38bdf8';
            c.shadowColor = '#0284c7';
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(rock.x + 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
            c.arc(rock.x + rock.w - 8, rock.y + rock.h / 2, 2.5, 0, Math.PI * 2);
            c.fill();

            c.restore();
        }
    }
}
window.drawPlatforms = drawPlatforms;
