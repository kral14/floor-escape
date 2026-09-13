// ============================================================================
// 🏔️ PLATFORMALAR, QAYALAR VƏ AXAN LAVA BÖLMƏLƏRİ (ARENA WORLD & HAZARDS)
// Hər qatın şaquli dırmaşma hündürlüyünü, qayaları və yandıran axan lavanı idarə edir.
// ============================================================================

let currentWorldHeight = 1800; // Qat 1 üçün baza hündürlük
let currentRocks = [];         // Qaya maneələri
let currentLavaFalls = [];     // Axan lava şəlalələri və kanalları
let lavaFlowOffset = 0;        // Animasiyalı axın fazası
let lavaDripParticles = [];    // Lavadan damcılayan közlər

// 1. Qat hündürlüyünün hesablanması (Hər qat getdikcə daha uzun olur)
function getFloorWorldHeight(floor = 1) {
    // Qat 1: 1800px (~2.6 ekran)
    // Qat 2: 2400px (~3.5 ekran)
    // Qat 3: 3000px (~4.4 ekran)
    return 1400 + floor * 500;
}
window.getFloorWorldHeight = getFloorWorldHeight;

// 2. Qatın qaya və lava xəritəsinin generasiyası
function initFloorPlatforms(floor = 1) {
    currentWorldHeight = getFloorWorldHeight(floor);
    currentRocks = [];
    currentLavaFalls = [];
    lavaDripParticles = [];

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
    const totalHeight = currentWorldHeight;

    // Yuxarı qapı zonası (y = 0 ... 160) və başlanğıc alt zona (y = totalHeight - 200 ... totalHeight) boş saxlanılır.
    const startY = totalHeight - 260;
    const endY = 220;
    const heightSpan = startY - endY;

    // A) QAYA PLATFORMALARI (Obsidian / Daş Bloklar)
    // Hər 220-280 pikseldən bir alternativ sol, orta və sağ qaya adacıqları
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

    // B) AXAN LAVA BÖLMƏLƏRİ VƏ ŞƏLALƏLƏRİ (Flowing Lava Falls / Streams)
    // Təhlükəli axan lava cığırları - toxunduqda yandırır!
    const numLavaFalls = Math.min(6, 2 + Math.floor(floor / 2));
    for (let i = 0; i < numLavaFalls; i++) {
        const fallY = startY - 150 - (i * (heightSpan / numLavaFalls)) + (Math.random() - 0.5) * 60;
        const sideChoice = i % 3;
        let fallX = 0;
        let fallW = 55;
        let fallH = 160 + Math.random() * 80;

        if (sideChoice === 0) {
            fallX = 18; // Sol divar boyu axan lava
            fallW = 65;
        } else if (sideChoice === 1) {
            fallX = w - 83; // Sağ divar boyu axan lava
            fallW = 65;
        } else {
            fallX = w / 2 - 35; // Ortadan tökülən şaquli lava axını
            fallW = 70;
            fallH = 140;
        }

        currentLavaFalls.push({
            x: fallX,
            y: fallY,
            w: fallW,
            h: fallH,
            speed: 140 + Math.random() * 60
        });
    }
}
window.initFloorPlatforms = initFloorPlatforms;

// 3. Toqquşma və Yanma Fizikası
function updatePlatformsPhysics(player, dt = 0.016) {
    if (!player) return;

    // Axın fazasını yenilə
    lavaFlowOffset += dt * 220;
    if (lavaFlowOffset > 1000) lavaFlowOffset -= 1000;

    // Lavadan damcılayan közlərin hərəkəti
    for (let i = lavaDripParticles.length - 1; i >= 0; i--) {
        const dp = lavaDripParticles[i];
        dp.y += dp.vy * dt;
        dp.vy += 180 * dt; // Qravitasiya
        dp.life -= dt;
        if (dp.life <= 0) {
            lavaDripParticles.splice(i, 1);
        }
    }

    // Təsadüfi yeni lava damcıları
    if (currentLavaFalls.length > 0 && Math.random() < 0.35) {
        const fall = currentLavaFalls[Math.floor(Math.random() * currentLavaFalls.length)];
        lavaDripParticles.push({
            x: fall.x + Math.random() * fall.w,
            y: fall.y + Math.random() * fall.h,
            vy: 90 + Math.random() * 80,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 0.8,
            size: 2.5 + Math.random() * 3
        });
    }

    // A) QAYALARLA TOQQUŞMA (Solid Obstacle Collision)
    const pr = player.radius || 16;
    for (const rock of currentRocks) {
        // Oyunçu dairəsi ilə düzbucaqlı qaya toqquşması
        const closestX = Math.max(rock.x, Math.min(player.x, rock.x + rock.w));
        const closestY = Math.max(rock.y, Math.min(player.y, rock.y + rock.h));

        const distX = player.x - closestX;
        const distY = player.y - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < pr * pr && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const overlap = pr - dist;
            const nx = distX / dist;
            const ny = distY / dist;

            // Oyunçunu qayadan kənara itələyir
            player.x += nx * overlap;
            player.y += ny * overlap;

            // Sürəti söndür
            if (player.vx !== undefined && player.vy !== undefined) {
                const dot = player.vx * nx + player.vy * ny;
                if (dot < 0) {
                    player.vx -= dot * nx;
                    player.vy -= dot * ny;
                }
            }
        }
    }

    // B) AXAN LAVAYA TOXUNMA VƏ YANMA MEXANİZMİ ("Lava deysek yaniriq")
    if (typeof gameState !== 'undefined' && !gameState.transitioning && gameState.dashInvulnerable <= 0) {
        for (const fall of currentLavaFalls) {
            // Dairə ilə lava düzbucaqlısı toqquşması
            const cX = Math.max(fall.x, Math.min(player.x, fall.x + fall.w));
            const cY = Math.max(fall.y, Math.min(player.y, fall.y + fall.h));
            const dX = player.x - cX;
            const dY = player.y - cY;

            if (dX * dX + dY * dY < pr * pr) {
                // 🔥 OYUNÇU AXAN LAVAYA TOXUNDU - YANIR!
                onPlayerTouchLava(player, fall);
                break;
            }
        }
    }
}
window.updatePlatformsPhysics = updatePlatformsPhysics;

// 4. Yanma və Qorunma Hadisəsi
function onPlayerTouchLava(player, lavaSource) {
    if (typeof gameState !== 'undefined' && gameState.dashInvulnerable > 0) return;

    // Yanma reaksiyası: Oyunçunu geriyə sıçradır
    const pushAngle = Math.atan2(player.y - (lavaSource.y + lavaSource.h / 2), player.x - (lavaSource.x + lavaSource.w / 2));
    player.x += Math.cos(pushAngle) * 35;
    player.y += Math.sin(pushAngle) * 35;

    // Yanma alov hissəcikləri
    if (typeof particles !== 'undefined') {
        for (let i = 0; i < 24; i++) {
            particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 30,
                player.y + (Math.random() - 0.5) * 30,
                ['#ef4444', '#f97316', '#fcd34d', '#7f1d1d'][i % 4],
                4.5
            ));
        }
    }

    // Yanma səsi
    if (typeof audio !== 'undefined') {
        if (typeof audio.playExplosion === 'function') audio.playExplosion();
    }

    // Ekran qırmızı yanıb-sönür
    if (typeof screenPulse !== 'undefined') {
        screenPulse.color = 'rgba(239, 68, 68, 0.45)';
        screenPulse.alpha = 0.85;
    }

    // QALXAN VƏ YA YAŞAM ÇİÇƏYİ QORUYURMU?
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

    // Heç bir qorunma yoxdursa: Yanaraq ölür və oyun bitir!
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

// 5. Qaya və Axan Lava Renderi
function drawPlatforms(ctx) {
    const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
    if (!c) return;

    // A) QAYALAR (Rock Platforms - Obsidian / Cyber Slate)
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
    }

    // B) ANIMASIYALI AXAN LAVA BÖLMƏLƏRİ (Flowing Magma Streams / Waterfalls)
    for (const fall of currentLavaFalls) {
        c.save();

        // 1. Qaynar Alov Aurası
        c.shadowColor = '#f97316';
        c.shadowBlur = 25;

        // 2. Axan Maye Qradiyenti (Animasiyalı axın üçün faza ilə)
        const lavaGrad = c.createLinearGradient(fall.x, fall.y, fall.x + fall.w, fall.y);
        lavaGrad.addColorStop(0, '#7f1d1d');
        lavaGrad.addColorStop(0.2, '#ef4444');
        lavaGrad.addColorStop(0.5, '#facc15'); // İsti mərkəz
        lavaGrad.addColorStop(0.8, '#ef4444');
        lavaGrad.addColorStop(1, '#7f1d1d');

        c.fillStyle = lavaGrad;
        c.strokeStyle = '#fef08a';
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(fall.x, fall.y, fall.w, fall.h, 6);
        c.fill();
        c.stroke();

        // 3. Axan Lava Şırnaqları (Flowing Wave Streaks)
        c.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        c.lineWidth = 2.2;
        c.setLineDash([14, 10]);
        c.lineDashOffset = -lavaFlowOffset;

        for (let s = 1; s <= 3; s++) {
            const streakX = fall.x + (fall.w / 4) * s;
            c.beginPath();
            c.moveTo(streakX, fall.y + 4);
            c.lineTo(streakX, fall.y + fall.h - 4);
            c.stroke();
        }
        c.setLineDash([]);

        // 4. Təhlükə / Yanma Xəbərdarlıq Nişanı
        c.font = '900 11px Orbitron, sans-serif';
        c.fillStyle = '#450a0a';
        c.textAlign = 'center';
        c.fillText('🔥 LAVA', fall.x + fall.w / 2, fall.y + 16);

        c.restore();
    }

    // C) DAMCILAYAN LAVA KÖZLƏRİ (Dripping Embers)
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

// 6. Şaquli Hündürlük Tərəqqisi İndikatoru (Minimap / Height Bar on HUD)
function drawHeightMinimap(ctx, player, worldHeight) {
    if (!player) return;
    const c = ctx || (typeof window !== 'undefined' ? window.ctx : null);
    if (!c) return;

    const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
    const h = typeof canvasHeight !== 'undefined' ? canvasHeight : 680;

    const mapX = w - 24;
    const mapY = 80;
    const mapW = 10;
    const mapH = 220;

    c.save();

    // 1. Şaquli Şkala Gövdəsi
    c.fillStyle = 'rgba(15, 23, 42, 0.85)';
    c.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(mapX, mapY, mapW, mapH, 4);
    c.fill();
    c.stroke();

    // 2. Qapı Zirvəsi Nişanı (Top Portal Flag)
    c.fillStyle = '#4ade80';
    c.shadowColor = '#4ade80';
    c.shadowBlur = 8;
    c.beginPath();
    c.arc(mapX + mapW / 2, mapY + 4, 4, 0, Math.PI * 2);
    c.fill();

    // 3. Oyunçunun Hündürlük Göstəricisi
    const progress = Math.max(0, Math.min(1, (worldHeight - player.y) / worldHeight));
    const playerIndicatorY = (mapY + mapH - 6) - progress * (mapH - 12);

    // Dırmaşma doldurma xətti
    c.fillStyle = 'rgba(56, 189, 248, 0.6)';
    c.beginPath();
    c.roundRect(mapX + 2, playerIndicatorY, mapW - 4, (mapY + mapH - 2) - playerIndicatorY, 2);
    c.fill();

    // Oyunçu işarəsi
    c.fillStyle = '#38bdf8';
    c.shadowColor = '#00f0ff';
    c.shadowBlur = 10;
    c.beginPath();
    c.arc(mapX + mapW / 2, playerIndicatorY, 5, 0, Math.PI * 2);
    c.fill();

    // Zirvə faizi mətni
    c.font = '900 9px Orbitron, monospace';
    c.textAlign = 'right';
    c.fillStyle = '#38bdf8';
    c.shadowBlur = 6;
    c.fillText(`${Math.round(progress * 100)}%`, mapX - 6, playerIndicatorY + 3);

    c.restore();
}
window.drawHeightMinimap = drawHeightMinimap;
