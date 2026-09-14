// ============================================================================
// 🏔️ PLATFORMALAR, QAYALAR VƏ KASKAD AXAN LAVA SİSTEMİ (ARENA WORLD & HAZARDS)
// Orijinal qaya platformalarını saxlayır, yuxarıdakı mənbələrdən axan lavanı
// platformalara dəydikdə sağa/sola yönləndirir və ən aşağıdakı LAVA CANAVARINA tökür.
// ============================================================================

let currentWorldHeight = 1800; // Qat 1 üçün baza hündürlük
let currentRocks = [];         // Orijinal qaya maneələri
let initialLavaSources = [];   // Orijinal lava axını mənbələri
let activeLavaHazardBoxes = []; // Toqquşma üçün aktiv lava qutuları
let lavaFlowOffset = 0;        // Animasiya zamanı (saniyə ilə)
let lavaDripParticles = [];    // Lavadan damcılayan közlər

// 1. Qat hündürlüyünün hesablanması (Hər qat getdikcə daha uzun olur)
function getFloorWorldHeight(floor = 1) {
    return 1400 + floor * 500;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// 2. Qatın orijinal qaya və lava xəritəsinin generasiyası
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

    // A) ORİJİNAL QAYA PLATFORMALARI (Obsidian / Daş Bloklar)
    const numRows = Math.floor(heightSpan / 240);

    for (let r = 0; r < numRows; r++) {
        const rowY = startY - (r * 240) - Math.random() * 40;
        const pattern = (r + floor) % 4;

        if (pattern === 0) {
            // Sol qaya və Sağ qaya (Mərkəz açıq)
            currentRocks.push({ x: 30, y: rowY, w: 220, h: 42, type: 'rock', color: '#1e293b' });
            currentRocks.push({ x: w - 250, y: rowY, w: 220, h: 42, type: 'rock', color: '#1e293b' });
        } else if (pattern === 1) {
            // Nəhəng Mərkəzi Qaya (Kənarlardan keçid)
            currentRocks.push({ x: w / 2 - 160, y: rowY, w: 320, h: 46, type: 'rock', color: '#1e293b' });
        } else if (pattern === 2) {
            // Sol-Mərkəz pilləsi
            currentRocks.push({ x: 70, y: rowY + 30, w: 260, h: 44, type: 'rock', color: '#1e293b' });
            currentRocks.push({ x: w - 340, y: rowY - 30, w: 270, h: 44, type: 'rock', color: '#1e293b' });
        } else {
            // 3 Kiçik Ada Blokları
            currentRocks.push({ x: 60, y: rowY, w: 160, h: 40, type: 'rock', color: '#1e293b' });
            currentRocks.push({ x: w / 2 - 80, y: rowY - 20, w: 160, h: 40, type: 'rock', color: '#1e293b' });
            currentRocks.push({ x: w - 220, y: rowY, w: 160, h: 40, type: 'rock', color: '#1e293b' });
        }
    }

    // B) ORİJİNAL AXAN LAVA MƏNBƏLƏRİ
    const numLavaFalls = Math.min(6, 2 + Math.floor(floor / 2));
    for (let i = 0; i < numLavaFalls; i++) {
        const fallY = startY - 150 - (i * (heightSpan / numLavaFalls)) + (Math.random() - 0.5) * 60;
        const sideChoice = i % 3;
        let fallX = 0;
        let fallW = 42;

        if (sideChoice === 0) {
            fallX = 55; // Sol divara yaxın axan lava
            fallW = 42;
        } else if (sideChoice === 1) {
            fallX = w - 97; // Sağ divara yaxın axan lava
            fallW = 42;
        } else {
            fallX = w / 2 - 21; // Ortadan tökülən lava
            fallW = 46;
        }

        initialLavaSources.push({
            x: fallX,
            y: fallY,
            w: fallW,
            seed: i
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
                if (rock.y > currY + 8 && rock.y < minHitY) {
                    if (streamCenter >= rock.x - 4 && streamCenter <= rock.x + rock.w + 4) {
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

            // 2. Qayaya dəydi! Lavanın qaya üzərində sağa və ya sola axması
            const hitX = Math.max(hitRock.x + 12, Math.min(hitRock.x + hitRock.w - 12, streamCenter));
            const distToLeft = hitX - hitRock.x;
            const distToRight = (hitRock.x + hitRock.w) - hitX;
            // Qayanın daha geniş tərəfinə və ya növbəli istiqamətə axır
            const goRight = (d % 2 === 0) ? (distToRight >= distToLeft || distToRight >= 60) : (distToLeft < 60);
            const outX = goRight ? (hitRock.x + hitRock.w - 14) : (hitRock.x + 14);

            path.shelves.push({
                rock: hitRock,
                hitX: hitX,
                outX: outX,
                goRight: goRight,
                d: d
            });

            // Növbəti şəlalə bu qayanın alt dodağından tökülməyə başlayır!
            currW = Math.min(currW, 36);
            currX = outX - currW * 0.5;
            currY = hitRock.y + hitRock.h - 2;
        }

        paths.push(path);
    }

    return paths;
}

// 6. ƏSAS RENDER: KASKAD LAVA VƏ ORİJİNAL PLATFORMALAR
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

            activeLavaHazardBoxes.push({
                x: fall.x,
                y: fall.y,
                w: fall.w,
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
    // B) ORİJİNAL QAYA PLATFORMALARI (Cyber Obsidian Dizaynı Saxlanılır)
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
        // ====================================================================
        for (const path of cascadePaths) {
            for (const shelf of path.shelves) {
                if (shelf.rock === rock) {
                    // Qayanın üzərində qaynayan və kənara axan maye
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

                    c.restore();

                    // Qayanın üzərindəki qaynayan maye də oyunçunu yandırır
                    activeLavaHazardBoxes.push({
                        x: startX,
                        y: rock.y - 4,
                        w: Math.max(24, endX - startX),
                        h: 12
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
