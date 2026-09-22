/**
 * ============================================================================
 * 🌋 FLOOR ESCAPE - ULTRA-MÜKƏMMƏL QAYADAN AXAN KASKAD LAVA SİSTEMİ
 * ============================================================================
 * 1. Platformadan axan 95 qat qızmar lif və 105 soyuyan bazalt qabığı
 * 2. Kaskad axın: Yuxarıdan tökülən lava qayanın üstünə dəyir (hit)
 * 3. Qaya üzərində gölməçə yaradır, qayanın sağına/soluna doğru hərəkət edir
 * 4. Kənardan (out) yenidən aşağı qatdakı qayaya tökülür
 * 5. Ən altda isə birbaşa aşağıdakı LAVA CANAVARINA (monster.y) tökülür!
 */

(function (global) {
    'use strict';

    // 1. TƏBİİ ŞƏLALƏ AXINI (İstifadəçinin tam dəqiq alqoritmi)
    // 1. TƏBİİ ŞƏLALƏ AXINI (Yumşaq, orqanik axan və qayanın üstünə yayılan və ya havada damcılayan magma)
    function drawPlatformWaterfall(c, t, x, y, width, height, isTerminated = false, isMidAir = false) {
        if (!c || width <= 0 || height <= 0) return;
        c.save();

        const flareAmount = isTerminated ? 18 : 6;
        const flow = (u, p) => {
            const baseWobble = (Math.sin(p * 15 - t * 3 + u * 9) * 5 + Math.sin(p * 31 - t * 5 + u * 22) * 2) * Math.sin(p * 2.3);
            let offset = 0;

            if (isMidAir) {
                // Havada sonlanma: Alt uca yaxınlaşdıqda axın təbii viskoz lava kimi yumşaq daralır və incələşir
                if (p > 0.40) {
                    const tp = (p - 0.40) / 0.60;
                    const taper = Math.pow(tp, 1.4);
                    offset = (0.5 - u) * width * (taper * 0.88);
                }
            } else if (p > 0.72) {
                // Qayaya dəyən axın: Kənarlara doğru təbii yayılma
                const fp = (p - 0.72) / 0.28;
                offset = (u - 0.5) * 2 * (fp * fp) * flareAmount;
            }
            return x + u * width + baseWobble + offset;
        };

        const grad = c.createLinearGradient(0, y, 0, y + height + 10);
        grad.addColorStop(0, '#ffcc4b');
        grad.addColorStop(0.12, '#fa6514');
        grad.addColorStop(0.65, '#bf2708');
        grad.addColorStop(0.90, '#ff7815');
        grad.addColorStop(1, isMidAir ? '#ff9922' : '#ffce55');

        c.beginPath();
        c.moveTo(flow(0, 0), y);
        // Sol tərəf aşağı
        for (let i = 0; i <= 20; i++) {
            let p = i / 20;
            c.lineTo(flow(0, p), y + p * height);
        }

        // Alt ucu: Təbii sivri damcı qövsü
        const rightBottomX = flow(1, 1);
        const leftBottomX = flow(0, 1);
        const midBottomX = (rightBottomX + leftBottomX) * 0.5;

        if (isMidAir) {
            // Havada sonlananda incə, zərif və təbii damcı ucluq
            const dropHang = 8 + Math.sin(t * 3.5) * 1.5;
            c.quadraticCurveTo(midBottomX, y + height + dropHang, rightBottomX, y + height);
        } else {
            // Qayanın üstünə yayılan qabarıq təbii qövs
            const bottomDrop = isTerminated ? 8 : 4;
            c.quadraticCurveTo(midBottomX, y + height + bottomDrop, rightBottomX, y + height);
        }

        // Sağ tərəf yuxarı
        for (let i = 20; i >= 0; i--) {
            let p = i / 20;
            c.lineTo(flow(1, p), y + p * height);
        }
        c.closePath();
        c.fillStyle = grad;
        c.shadowColor = '#ff4b00';
        c.shadowBlur = 0;
        c.fill();
        c.shadowBlur = 0;
        c.clip();

        // 95 Ədəd qızmar bükülən maye lifləri
        for (let j = 0; j < 6; j++) {
            let u = (j + 1) / 7;
            c.beginPath();
            for (let k = 0; k <= 8; k++) {
                let p = k / 8;
                let xx = flow(u, p) + Math.sin(p * 10 - t * (1.5 + u) + u * 31) * 6 * p;
                if (k === 0) c.moveTo(xx, y);
                else c.lineTo(xx, y + p * height);
            }
            const hot = (Math.sin(j * 13.7) + 1) * 0.5;
            c.strokeStyle = hot > 0.78 ? 'rgba(255,236,118,.85)' : hot > 0.43 ? 'rgba(255,142,20,.8)' : 'rgba(94,12,4,.65)';
            c.lineWidth = 1 + hot * 2.6;
            c.stroke();
        }

        // 105 Ədəd aşağı sürüşən soyumuş bazalt qabıqları
        for (let j = 0; j < 6; j++) {
            const u = ((j * 0.618033) % 1);
            const p = ((t * (0.20 + u * 0.12) + j * 0.137) % 1);
            c.beginPath();
            for (let k = 0; k < 3; k++) {
                let q = p + k * 0.009;
                let xx = flow(u, q) + Math.sin(q * 28 + j) * 3;
                if (k === 0) c.moveTo(xx, y + q * height);
                else c.lineTo(xx, y + q * height);
            }
            c.strokeStyle = j % 3 ? 'rgba(255,196,48,.66)' : 'rgba(65,9,3,.72)';
            c.lineWidth = j % 3 ? 1.5 : 3.5;
            c.stroke();
        }
        c.restore();

        // Yalnız qayanın üstünə çırpılan lavadan kənara köz sıçrayır (Havada sonlananda fəvvarə sıçrayışı qətiyyən yoxdur)
        if (!isMidAir) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            for (let j = 0; j < 24; j++) {
                let p = (t * 0.7 + j * 0.173) % 1;
                let side = j % 2 ? 1 : -1;
                let xx = x + width * 0.5 + side * (width * 0.45 + p * 45) * Math.sin(j * 17);
                let yy = y + height - p * 65 + 90 * p * p;
                c.globalAlpha = (1 - p) * 0.7;
                c.fillStyle = '#ffb938';
                c.beginPath();
                c.ellipse(xx, yy, 1.3, 2.8, side * 0.5, 0, Math.PI * 2);
                c.fill();
            }
            c.restore();
        }
    }

    // 2. QAYANIN DAXİLİNDƏKİ VULKANİK MƏNBƏ OYUĞU (Source Rock Overhang)
    function drawLavaSourceRock(c, x, y, ww, seed = 0, t = 0) {
        c.save();
        const left = x - 31 - (seed % 3) * 8;
        const right = x + ww + 29;
        const top = y - 39 - (seed % 4) * 9;
        const rock = c.createLinearGradient(left, top, right, y + 27);
        rock.addColorStop(0, '#44414a');
        rock.addColorStop(0.35, '#292a32');
        rock.addColorStop(0.75, '#14171f');
        rock.addColorStop(1, '#0a0c13');

        c.beginPath();
        c.moveTo(left - 11, top + 19);
        c.lineTo(left + 8, top + 4);
        c.lineTo(x + ww * 0.24, top - 5);
        c.lineTo(x + ww * 0.66, top + 3);
        c.lineTo(right - 7, top + 8);
        c.lineTo(right + 10, y - 11);
        c.lineTo(right - 3, y + 15);
        c.lineTo(x + ww + 8, y + 24);
        c.lineTo(x + ww - 1, y + 3);
        c.lineTo(x + 3, y + 1);
        c.lineTo(x - 9, y + 20);
        c.lineTo(left + 8, y + 10);
        c.closePath();
        c.fillStyle = rock;
        c.fill();
        c.strokeStyle = '#4b4140';
        c.lineWidth = 1;
        c.stroke();

        // Oyuq boşluğu
        c.beginPath();
        c.moveTo(x - 6, y + 2);
        c.bezierCurveTo(x - 10, y - 17, x + ww * 0.16, y - 23, x + ww * 0.43, y - 20);
        c.bezierCurveTo(x + ww * 0.76, y - 25, x + ww + 10, y - 17, x + ww + 6, y + 3);
        c.closePath();
        c.fillStyle = '#080809';
        c.fill();

        let molten = c.createLinearGradient(0, y - 16, 0, y + 7);
        molten.addColorStop(0, '#57180c');
        molten.addColorStop(0.42, '#bc390d');
        molten.addColorStop(0.8, '#ff9d28');
        molten.addColorStop(1, '#ffcb4b');
        c.beginPath();
        c.moveTo(x, y + 5);
        c.bezierCurveTo(x - 1, y - 5, x + ww * 0.1, y - 12, x + ww * 0.3, y - 11);
        c.bezierCurveTo(x + ww * 0.6, y - 14, x + ww * 0.92, y - 12, x + ww, y - 2);
        c.lineTo(x + ww, y + 5);
        c.closePath();
        c.fillStyle = molten;
        c.fill();

        c.save();
        c.clip();
        for (let k = 0; k < 12; k++) {
            let u = (k + 0.5) / 12;
            let xx = x + u * ww;
            c.beginPath();
            c.moveTo(x + ww * 0.5 + (u - 0.5) * ww * 0.82, y - 13);
            c.bezierCurveTo(xx + Math.sin(t * 1.5 + k) * 1.4, y - 7, xx, y, xx, y + 7);
            c.strokeStyle = k % 3 ? 'rgba(255,194,61,.42)' : 'rgba(115,31,7,.55)';
            c.lineWidth = k % 3 ? 1 : 2;
            c.stroke();
        }
        c.restore();

        // Asılmış daş dodaq
        c.beginPath();
        c.moveTo(x - 9, y - 15);
        c.quadraticCurveTo(x + ww * 0.12, y - 26, x + ww * 0.36, y - 21);
        c.lineTo(x + ww * 0.53, y - 18);
        c.lineTo(x + ww * 0.69, y - 21);
        c.quadraticCurveTo(x + ww + 7, y - 23, x + ww + 9, y - 10);
        c.lineTo(x + ww + 2, y - 12);
        c.quadraticCurveTo(x + ww * 0.7, y - 18, x + ww * 0.5, y - 14);
        c.quadraticCurveTo(x + ww * 0.2, y - 18, x - 9, y - 10);
        c.closePath();
        c.fillStyle = '#202027';
        c.fill();

        c.strokeStyle = 'rgba(236,92,25,.38)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - 3, y - 12);
        c.quadraticCurveTo(x + ww * 0.25, y - 19, x + ww * 0.5, y - 14);
        c.quadraticCurveTo(x + ww * 0.75, y - 18, x + ww + 3, y - 12);
        c.stroke();
        c.restore();
    }

    // 3. KASKAD PLATFORMASI VƏ ÜZƏRİNDƏN AXAN LAVA (Cascade Shelf & Molten Surface Pool)
    function drawCascadeShelf(c, t, p) {
        c.save();
        const stone = c.createLinearGradient(0, p.y, 0, p.y + p.h);
        stone.addColorStop(0, '#56504b');
        stone.addColorStop(0.25, '#2a2a30');
        stone.addColorStop(1, '#101219');

        c.beginPath();
        c.moveTo(p.x + 5, p.y + 3);
        c.lineTo(p.x + p.w - 5, p.y + 3);
        c.lineTo(p.x + p.w + 3, p.y + 15);
        c.lineTo(p.x + p.w - 12, p.y + p.h - 7);
        c.lineTo(p.x + p.w * 0.66, p.y + p.h);
        c.lineTo(p.x + p.w * 0.4, p.y + p.h - 8);
        c.lineTo(p.x + 12, p.y + p.h - 1);
        c.lineTo(p.x - 3, p.y + 17);
        c.closePath();
        c.fillStyle = stone;
        c.fill();
        c.strokeStyle = '#15151a';
        c.lineWidth = 2;

        for (let j = 1; j < 7; j++) {
            let xx = p.x + p.w * j / 7;
            c.beginPath();
            c.moveTo(xx, p.y + 12);
            c.lineTo(xx - 6, p.y + 24);
            c.lineTo(xx + 6, p.y + 35);
            c.stroke();
        }

        // Qayanın üzərində qaynayan və axan lava qatı
        if (p.hit && p.hit.length > 0 && p.out && p.out.length > 0) {
            const start = Math.min(...p.hit, ...p.out) - 8;
            const end = Math.max(...p.hit, ...p.out) + 8;
            let surface = c.createLinearGradient(0, p.y - 7, 0, p.y + 9);
            surface.addColorStop(0, '#ffce55');
            surface.addColorStop(0.4, '#fa7b16');
            surface.addColorStop(1, '#98210a');
            c.beginPath();
            c.moveTo(start, p.y + 8);
            for (let xx = start; xx <= end; xx += 3) {
                c.lineTo(xx, p.y - 2 + Math.sin(xx * 0.08 - t * 3) * 1.1);
            }
            c.lineTo(end, p.y + 8);
            c.closePath();
            c.fillStyle = surface;
            c.fill();

            // Səth boyu çıxış kənarına doğru axan maye cərəyanları (Streaks)
            for (let edge of p.out) {
                let hit = p.hit.reduce((a, b) => Math.abs(a - edge) < Math.abs(b - edge) ? a : b);
                for (let j = 0; j < 16; j++) {
                    let q = (t * 0.48 + j / 16) % 1;
                    let xx = hit + (edge - hit) * q;
                    c.strokeStyle = j % 3 ? '#ffb532' : '#ffe28a';
                    c.lineWidth = 1.2;
                    c.beginPath();
                    c.moveTo(xx, p.y + 1 + (j % 3) * 1.5);
                    c.lineTo(xx + Math.sign(edge - hit) * 6, p.y + 1 + (j % 3) * 1.5);
                    c.stroke();
                }
            }

            // Lavanın qayanın üzərinə zərbə ilə töküldüyü nöqtə (Hit splash)
            for (let hit of p.hit) {
                c.fillStyle = '#ffd567';
                c.beginPath();
                c.ellipse(hit, p.y - 1, 16, 3, 0, 0, Math.PI * 2);
                c.fill();
                for (let j = 0; j < 16; j++) {
                    let q = (t * 1.2 + j * 0.163) % 1;
                    let side = j % 2 ? 1 : -1;
                    let xx = hit + side * q * (13 + (j % 4) * 5);
                    let yy = p.y - 3 - 38 * q * (1 - q);
                    c.globalAlpha = 1 - q;
                    c.fillStyle = '#ffac36';
                    c.beginPath();
                    c.ellipse(xx, yy, 1.1, 2.0, side * q, 0, Math.PI * 2);
                    c.fill();
                }
                c.globalAlpha = 1;
            }

            // Tək tərəfə axanda əks tərəfdəki qoruyucu qaya maneəsi (Retaining bank)
            if (p.out.length === 1) {
                const closed = p.out[0] === p.x ? p.x + p.w : p.x;
                c.fillStyle = '#353239';
                c.beginPath();
                c.moveTo(closed - 7, p.y + 10);
                c.lineTo(closed - 6, p.y - 9);
                c.lineTo(closed + 4, p.y - 12);
                c.lineTo(closed + 8, p.y + 10);
                c.closePath();
                c.fill();
            }
        }
        c.restore();
    }

    // 4. KƏNAR LAVA DODAĞI PARLAQLIĞI (Spillway Lip)
    function drawSpillwayLip(c, xx, ww, lip) {
        c.save();
        c.shadowColor = '#ff6500';
        c.shadowBlur = 0;
        c.strokeStyle = '#ff901e';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(xx - 9, lip);
        c.quadraticCurveTo(xx, lip - 5, xx + 10, lip - 3);
        c.lineTo(xx + ww - 10, lip - 3);
        c.quadraticCurveTo(xx + ww, lip - 4, xx + ww + 9, lip);
        c.stroke();
        c.strokeStyle = '#ffdf73';
        c.lineWidth = 1.4;
        c.stroke();
        c.restore();
    }

    // 5. PLATFORMADA SONLANAN ORQANİK QAYNAR LAVA GÖLMƏÇƏSİ (Düz kəsik olmadan, təbii yayılma)
    function drawTerminatedLavaPool(c, t, hitX, rockY, streamWidth = 24) {
        if (!c) return;
        c.save();

        const poolW = Math.max(34, streamWidth * 1.7);
        const pulse = Math.sin(t * 3.5) * 2;
        const wave1 = Math.sin(t * 5) * 1.5;

        // 1. Platformanın üzərinə yayılan qızmar obsidian-magma aurası
        c.shadowColor = '#ff4500';
        c.shadowBlur = 0;

        const baseGrad = c.createRadialGradient(hitX, rockY + 2, 4, hitX, rockY + 3, poolW * 0.9);
        baseGrad.addColorStop(0, '#ffec70');
        baseGrad.addColorStop(0.35, '#ff6a00');
        baseGrad.addColorStop(0.7, '#d92600');
        baseGrad.addColorStop(1, 'rgba(74, 14, 5, 0)');

        c.fillStyle = baseGrad;
        c.beginPath();
        c.ellipse(hitX, rockY + 3, poolW * 0.85 + pulse, 11 + wave1 * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;

        // 2. Qayanın səthinə axan dalğalı orqanik maqma qatı (düzbucaqlı deyil!)
        const moltenGrad = c.createLinearGradient(0, rockY - 6, 0, rockY + 10);
        moltenGrad.addColorStop(0, '#fff382');
        moltenGrad.addColorStop(0.25, '#ff8a00');
        moltenGrad.addColorStop(0.7, '#bc1d00');
        moltenGrad.addColorStop(1, '#4a0500');

        c.fillStyle = moltenGrad;
        c.beginPath();
        const startX = hitX - poolW * 0.75;
        const endX = hitX + poolW * 0.75;
        c.moveTo(startX, rockY + 4);
        
        // Dalğalı, canlı maye səthi
        for (let xx = startX; xx <= endX; xx += 4) {
            const norm = (xx - startX) / (endX - startX);
            const dome = Math.sin(norm * Math.PI) * 4; // Mərkəzdə qabaran lava gümbəzi
            const ripple = Math.sin(xx * 0.15 + t * 4) * 1.2;
            c.lineTo(xx, rockY - 2 - dome + ripple);
        }
        c.quadraticCurveTo(endX + 4, rockY + 4, endX, rockY + 7);
        c.quadraticCurveTo(hitX, rockY + 10, startX, rockY + 7);
        c.quadraticCurveTo(startX - 4, rockY + 4, startX, rockY + 4);
        c.closePath();
        c.fill();

        // 3. Qızmar liflər və qabaran cərəyanlar
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 8; j++) {
            const p = (t * 0.4 + j * 0.125) % 1;
            const side = (j % 2 === 0) ? 1 : -1;
            const lx = hitX + side * (p * poolW * 0.55);
            const ly = rockY - 1 + Math.sin(j * 3 + t * 3) * 2;
            c.strokeStyle = (j % 2 === 0) ? 'rgba(255, 235, 130, 0.9)' : 'rgba(255, 120, 30, 0.75)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(lx - side * 4, ly);
            c.quadraticCurveTo(lx, ly - 2, lx + side * 4, ly);
            c.stroke();
        }

        // 4. Qaynayan və partlayan lava qabarcıqları (Lava Bubbles & Sparks)
        for (let k = 0; k < 10; k++) {
            const q = (t * 0.8 + k * 0.231) % 1;
            const side = ((k % 3) - 1);
            const bx = hitX + side * (poolW * 0.38 * (1 - q * 0.3));
            const by = rockY - 1 - q * 18 + Math.sin(k * 7) * 2;
            const bAlpha = Math.sin(q * Math.PI);

            c.globalAlpha = Math.max(0, bAlpha);
            c.fillStyle = (k % 2 === 0) ? '#ffec66' : '#ff7b1a';
            c.beginPath();
            c.arc(bx, by, 1.4 + (1 - q) * 1.6, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        // 5. Ən parlaq mərkəzi nüvə (Plop Core)
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.ellipse(hitX, rockY - 2, Math.max(6, streamWidth * 0.3), 2.5, 0, 0, Math.PI * 2);
        c.fill();

        c.restore();
    }

    // 6. HAVADA SONLANAN DAMCILAYAN LAVA UCLUĞU (Süni toplar və şarlar qətiyyən yoxdur - orqanik süzülən damcı)
    function drawMidAirLavaTip(c, t, x, y, width = 24) {
        if (!c) return;
        c.save();

        const midX = x + width * 0.5;

        // Ucdan zərif şəkildə şaquli olaraq aşağı süzülən 2-3 xırda köz damcısı (radius 1-1.5px)
        for (let i = 0; i < 3; i++) {
            const progress = (t * 1.15 + i * 0.33) % 1;
            const dropY = y + 8 + progress * 42;
            const dropX = midX + Math.sin(i * 11 + t * 1.8) * 1.2;
            const size = Math.max(0.6, (1 - progress) * 1.8);
            const alpha = (1 - progress) * 0.8;

            c.globalAlpha = alpha;
            c.fillStyle = progress < 0.4 ? '#ffe570' : '#e64a19';
            c.beginPath();
            c.ellipse(dropX, dropY, size * 0.75, size * 1.2, 0, 0, Math.PI * 2);
            c.fill();
        }

        c.restore();
    }

    global.LavaEngine = {
        drawPlatformWaterfall,
        drawLavaSourceRock,
        drawCascadeShelf,
        drawSpillwayLip,
        drawTerminatedLavaPool,
        drawMidAirLavaTip
    };

})(typeof window !== 'undefined' ? window : this);
