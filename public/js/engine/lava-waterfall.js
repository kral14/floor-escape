/**
 * ============================================================================
 * 🌋 FLOOR ESCAPE - ULTRA-DİNAMİK QAYADAN AXAN LAVA VƏ ŞƏLALƏ MÜHƏRRİKİ
 * ============================================================================
 * Təbii axıcı maye fizikası, 3-pilləli temperatur lifləri (qızmar nüvə, alovlu gövdə,
 * soyuyan bazalt qabığı), qaya daxilindən çıxan lava qaynağı (source aperture),
 * qaya üzərində toplanan gölməçə dalğaları və sıçrayan köz damcıları.
 */

(function (global) {
    'use strict';

    // 1. DİNAMİK LAVA ŞƏLALƏSİ (MOLTEN WATERFALL STRANDS & CRUST)
    function drawPlatformWaterfall(c, t, x, y, width, height, opts = {}) {
        if (!c || width <= 0 || height <= 0) return;
        c.save();

        const flowSpread = opts.spread || 0.10;
        const wobbleIntensity = opts.wobble !== undefined ? opts.wobble : 1.0;

        // Axıcı kənar trayektoriyası
        const flow = (u, p) => {
            const wave1 = Math.sin(p * 15 - t * 3.2 + u * 9) * 5 * wobbleIntensity;
            const wave2 = Math.sin(p * 31 - t * 5.4 + u * 22) * 2 * wobbleIntensity;
            return x + u * width + (wave1 + wave2) * Math.sin(p * 2.3);
        };

        // Əsas Qızmar Maye Qradiyenti (Nüvədən soyuma zonasına)
        const grad = c.createLinearGradient(0, y, 0, y + height);
        grad.addColorStop(0, '#fff07d');     // Üst çıxış qızmar ağ-qızıl
        grad.addColorStop(0.10, '#ffcc4b');  // İsti sarı
        grad.addColorStop(0.28, '#fa6514');  // Alovlu narıncı
        grad.addColorStop(0.68, '#b82006');  // Dərin tünd maqma
        grad.addColorStop(1, '#ff7815');     // Dibə çatanda sıçrayış parlaqlığı

        c.beginPath();
        c.moveTo(x, y);

        // Sol dalğalı axın kənarı
        const steps = 36;
        for (let i = 0; i <= steps; i++) {
            const p = i / steps;
            c.lineTo(flow(0, p) + p * width * flowSpread, y + p * height);
        }

        // Sağ dalğalı axın kənarı
        for (let i = steps; i >= 0; i--) {
            const p = i / steps;
            c.lineTo(flow(1, p) - p * width * (flowSpread * 0.75), y + p * height);
        }
        c.closePath();

        // Parlaq istilik aurası
        c.shadowColor = '#ff4500';
        c.shadowBlur = Math.min(28, width * 0.45);
        c.fillStyle = grad;
        c.fill();
        c.shadowBlur = 0;
        c.clip(); // Bütün daxili liflər və qabıqlar maye sərhədi daxilində qalır

        // A) QAT-QAT AXAN QIZMAR LİFLƏR (Continuous Molten Strands)
        const numStrands = Math.max(28, Math.min(80, Math.floor(width * 1.2)));
        for (let j = 0; j < numStrands; j++) {
            const u = j / (numStrands - 1 || 1);
            c.beginPath();
            for (let k = 0; k <= 32; k++) {
                const p = k / 32;
                const xx = flow(u, p) + Math.sin(p * 11 - t * (1.6 + u) + u * 31) * 5.5 * p;
                if (k === 0) c.moveTo(xx, y);
                else c.lineTo(xx, y + p * height);
            }
            const hot = (Math.sin(j * 13.7) + 1) * 0.5;
            if (hot > 0.75) {
                c.strokeStyle = 'rgba(255, 246, 160, 0.88)'; // Ən qaynar plazma
                c.lineWidth = 1.2 + hot * 2.2;
            } else if (hot > 0.40) {
                c.strokeStyle = 'rgba(255, 142, 20, 0.78)';  // Maye gövdə
                c.lineWidth = 1.0 + hot * 1.6;
            } else {
                c.strokeStyle = 'rgba(92, 11, 4, 0.65)';    // Soyuyan xarici cığır
                c.lineWidth = 1.8 + hot * 1.5;
            }
            c.stroke();
        }

        // B) AŞAĞI DOĞRU SÜRÜŞƏN SOYUMUŞ BAZALT QABIQLARI (Drifting Crusts)
        const numCrusts = Math.max(20, Math.min(65, Math.floor(width * 0.9)));
        for (let j = 0; j < numCrusts; j++) {
            const u = ((j * 0.618033) % 1);
            const p = ((t * (0.22 + u * 0.12) + j * 0.137) % 1);
            c.beginPath();
            for (let k = 0; k < 6; k++) {
                const q = p + k * 0.011;
                if (q > 1) break;
                const xx = flow(u, q) + Math.sin(q * 28 + j) * 2.8;
                if (k === 0) c.moveTo(xx, y + q * height);
                else c.lineTo(xx, y + q * height);
            }
            c.strokeStyle = (j % 3 === 0) ? 'rgba(255, 205, 58, 0.72)' : 'rgba(56, 8, 3, 0.78)';
            c.lineWidth = (j % 3 === 0) ? 1.6 : 3.4;
            c.stroke();
        }

        c.restore();

        // C) KƏNARLARDAN SIÇRAYAN QIZMAR DAMCILAR VƏ KÖZLƏR (Splattering Embers)
        c.save();
        c.globalCompositeOperation = 'lighter';
        const numDrops = Math.min(24, Math.floor(width * 0.35));
        for (let j = 0; j < numDrops; j++) {
            const p = (t * 0.8 + j * 0.173) % 1;
            const side = (j % 2 === 0) ? 1 : -1;
            const xx = x + width * 0.5 + side * (width * 0.44 + p * 38) * Math.sin(j * 17);
            const yy = y + height - p * 60 + 85 * p * p;
            c.globalAlpha = (1 - p) * 0.75;
            c.fillStyle = (j % 3 === 0) ? '#ffec8b' : '#ff941a';
            c.beginPath();
            c.ellipse(xx, yy, 1.4, 3.0, side * 0.5, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();
    }

    // 2. QAYANIN DAXİLİNDƏKİ VULKANİK QAYNAQ OYUĞU (SOURCE ROCK OVERHANG & APERTURE)
    function drawLavaSourceRock(c, x, y, ww, seed = 0, t = 0) {
        if (!c || ww <= 0) return;
        c.save();

        const left = x - 26 - (seed % 3) * 7;
        const right = x + ww + 24;
        const top = y - 34 - (seed % 4) * 8;

        // Qaya Qapağı (Basalt / Obsidian)
        const rock = c.createLinearGradient(left, top, right, y + 24);
        rock.addColorStop(0, '#47464f');
        rock.addColorStop(0.35, '#292b34');
        rock.addColorStop(0.75, '#151821');
        rock.addColorStop(1, '#090b11');

        c.beginPath();
        c.moveTo(left - 8, top + 16);
        c.lineTo(left + 8, top + 3);
        c.lineTo(x + ww * 0.25, top - 4);
        c.lineTo(x + ww * 0.65, top + 3);
        c.lineTo(right - 6, top + 7);
        c.lineTo(right + 8, y - 9);
        c.lineTo(right - 2, y + 14);
        c.lineTo(x + ww + 6, y + 20);
        c.lineTo(x + ww - 2, y + 2);
        c.lineTo(x + 2, y + 1);
        c.lineTo(x - 8, y + 18);
        c.lineTo(left + 6, y + 9);
        c.closePath();
        c.fillStyle = rock;
        c.fill();
        c.strokeStyle = '#4a4445';
        c.lineWidth = 1.2;
        c.stroke();

        // Daxili Dərin Boşluq / Maqma Oyuğu
        c.beginPath();
        c.moveTo(x - 6, y + 2);
        c.bezierCurveTo(x - 9, y - 16, x + ww * 0.16, y - 22, x + ww * 0.44, y - 19);
        c.bezierCurveTo(x + ww * 0.76, y - 24, x + ww + 9, y - 16, x + ww + 5, y + 3);
        c.closePath();
        c.fillStyle = '#06070a';
        c.fill();

        // Oyuq daxilində qaynayan maye səthi
        const molten = c.createLinearGradient(0, y - 16, 0, y + 6);
        molten.addColorStop(0, '#59160a');
        molten.addColorStop(0.42, '#be3a0c');
        molten.addColorStop(0.80, '#ff9e28');
        molten.addColorStop(1, '#ffcb4b');

        c.beginPath();
        c.moveTo(x, y + 4);
        c.bezierCurveTo(x - 1, y - 5, x + ww * 0.1, y - 11, x + ww * 0.3, y - 10);
        c.bezierCurveTo(x + ww * 0.6, y - 13, x + ww * 0.92, y - 11, x + ww, y - 2);
        c.lineTo(x + ww, y + 5);
        c.closePath();
        c.fillStyle = molten;
        c.fill();

        // Oyuq kənarından aşağı şırnaqlanan qızmar xətlər
        c.save();
        c.clip();
        for (let k = 0; k < 10; k++) {
            const u = (k + 0.5) / 10;
            const xx = x + u * ww;
            c.beginPath();
            c.moveTo(x + ww * 0.5 + (u - 0.5) * ww * 0.82, y - 12);
            c.bezierCurveTo(xx + Math.sin(t * 1.5 + k) * 1.4, y - 6, xx, y, xx, y + 6);
            c.strokeStyle = (k % 3 === 0) ? 'rgba(255, 198, 65, 0.65)' : 'rgba(125, 33, 8, 0.7)';
            c.lineWidth = (k % 3 === 0) ? 1.2 : 2.0;
            c.stroke();
        }
        c.restore();

        // Üst Asılmış Qaya Dodağı (Overhang Lip)
        c.beginPath();
        c.moveTo(x - 8, y - 14);
        c.quadraticCurveTo(x + ww * 0.12, y - 24, x + ww * 0.36, y - 20);
        c.lineTo(x + ww * 0.53, y - 17);
        c.lineTo(x + ww * 0.69, y - 20);
        c.quadraticCurveTo(x + ww + 7, y - 22, x + ww + 8, y - 9);
        c.lineTo(x + ww + 2, y - 11);
        c.quadraticCurveTo(x + ww * 0.7, y - 17, x + ww * 0.5, y - 13);
        c.quadraticCurveTo(x + ww * 0.2, y - 17, x - 8, y - 9);
        c.closePath();
        c.fillStyle = '#1e1f26';
        c.fill();

        // Dodaq altından közərən narıncı işıq
        c.strokeStyle = 'rgba(245, 105, 28, 0.45)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x - 2, y - 11);
        c.quadraticCurveTo(x + ww * 0.25, y - 18, x + ww * 0.5, y - 13);
        c.quadraticCurveTo(x + ww * 0.75, y - 17, x + ww + 2, y - 11);
        c.stroke();

        c.restore();
    }

    // 3. ORGANİK BAZALT / OBSİDİAN QAYA PLATFORMASI (NATURAL ROCK SHELF WITH CRACKS & LIPS)
    function drawRockPlatform(c, x, y, width, height, t = 0, style = {}) {
        if (!c || width <= 0 || height <= 0) return;
        c.save();

        const lip = y + height;

        // Xarici Qaya Kölgəsi
        c.shadowColor = 'rgba(0, 0, 0, 0.75)';
        c.shadowBlur = 18;
        c.shadowOffsetY = 7;

        // Təbii Bucaqlı Qaya Gövdəsi
        const body = c.createLinearGradient(x, y - 15, x, y + height + 35);
        body.addColorStop(0, '#3a3e4c');
        body.addColorStop(0.25, '#222835');
        body.addColorStop(0.72, '#121721');
        body.addColorStop(1, '#070912');

        c.beginPath();
        c.moveTo(x + 10, y + 8);
        c.lineTo(x + width * 0.15, y - 4);
        c.lineTo(x + width * 0.38, y + 2);
        c.lineTo(x + width * 0.55, y - 6);
        c.lineTo(x + width * 0.82, y + 3);
        c.lineTo(x + width - 6, y + 8);
        c.lineTo(x + width - 14, lip + 12);
        c.lineTo(x + width * 0.68, lip + 7);
        c.lineTo(x + width * 0.50, lip + 14);
        c.lineTo(x + width * 0.32, lip + 6);
        c.lineTo(x + 18, lip + 11);
        c.lineTo(x - 2, lip + 3);
        c.closePath();

        c.fillStyle = body;
        c.fill();
        c.shadowBlur = 0;

        c.strokeStyle = '#4b5364';
        c.lineWidth = 1.8;
        c.stroke();

        // Üst Kənar Parlaqlığı (Specular Rock Ridge)
        c.strokeStyle = '#8291a5';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(x + 14, y + 6);
        c.lineTo(x + width * 0.5, y - 2);
        c.lineTo(x + width - 12, y + 6);
        c.stroke();

        // Qaya Daxilində Közərən Magma Çatları (Volcanic Fissures)
        c.strokeStyle = 'rgba(255, 115, 30, 0.32)';
        c.lineWidth = 1.6;
        const numCracks = Math.max(3, Math.min(7, Math.floor(width / 65)));
        for (let i = 0; i < numCracks; i++) {
            const sx = x + 35 + i * (width / (numCracks + 1));
            c.beginPath();
            c.moveTo(sx, y + Math.sin(t + i) * 3);
            c.lineTo(sx + 14, y + 14 + (i % 2) * 10);
            c.lineTo(sx + 4, lip + 4);
            c.stroke();
        }

        // Qaya üzərində mikro daş pürüzləri
        for (let i = 0; i < 8; i++) {
            const px = x + 18 + (i * 63) % Math.max(1, width - 40);
            const py = y + (i * 17) % Math.max(1, height - 10);
            const r = 4 + (i % 3) * 2;
            c.globalAlpha = 0.15;
            c.fillStyle = (i % 2 === 0) ? '#64748b' : '#090d16';
            c.beginPath();
            c.ellipse(px, py, r * 1.5, r * 0.6, 0.2, 0, Math.PI * 2);
            c.fill();
        }
        c.globalAlpha = 1.0;

        // Kiber / Texnoloji Qeyd İşıqları (Oyunun Kiber-fantastika mövzusunu qorumaq üçün)
        if (style.cyber !== false) {
            c.save();
            c.fillStyle = '#38bdf8';
            c.shadowColor = '#0284c7';
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(x + 10, y + height * 0.45, 2.5, 0, Math.PI * 2);
            c.arc(x + width - 10, y + height * 0.45, 2.5, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }

        c.restore();
    }

    // 4. ŞƏLALƏNİN QAYAYA VƏ YA DÖŞƏMƏYƏ DƏYDİYİ SIÇRAYIŞ GÖLMƏÇƏSİ (IMPACT POOL & SPLASH)
    function drawLavaImpactPool(c, t, hitX, hitY, hitWidth = 36) {
        if (!c) return;
        c.save();

        // Parlaq Qızmar Əsas Gölməçə
        const poolGrad = c.createRadialGradient(hitX, hitY, 2, hitX, hitY, hitWidth * 0.85);
        poolGrad.addColorStop(0, '#fff39e');
        poolGrad.addColorStop(0.35, '#ff981f');
        poolGrad.addColorStop(0.75, '#b92107');
        poolGrad.addColorStop(1, 'rgba(163, 43, 9, 0)');

        c.fillStyle = poolGrad;
        c.beginPath();
        c.ellipse(hitX, hitY, hitWidth * 0.85, 6.5, 0, 0, Math.PI * 2);
        c.fill();

        // Konsentrik Qaynama Dalğaları (Boiling Ripples)
        c.strokeStyle = 'rgba(255, 230, 110, 0.75)';
        c.lineWidth = 1.2;
        for (let r = 1; r <= 3; r++) {
            const phase = (t * 2.2 + r * 0.33) % 1;
            c.globalAlpha = (1 - phase) * 0.85;
            c.beginPath();
            c.ellipse(hitX, hitY, hitWidth * 0.4 + phase * (hitWidth * 0.5), 3.0 + phase * 4.0, 0, 0, Math.PI * 2);
            c.stroke();
        }

        // Yuxarı Fışqıran Lava Damcıları (Vertical Splashes)
        c.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 12; j++) {
            const q = (t * 1.35 + j * 0.163) % 1;
            const side = (j % 2 === 0) ? 1 : -1;
            const xx = hitX + side * q * (hitWidth * 0.55 + (j % 4) * 4);
            const yy = hitY - 3 - 34 * q * (1 - q);
            c.globalAlpha = (1 - q) * 0.9;
            c.fillStyle = (j % 3 === 0) ? '#ffec84' : '#ff7a18';
            c.beginPath();
            c.ellipse(xx, yy, 1.2, 2.2, side * q * 0.5, 0, Math.PI * 2);
            c.fill();
        }

        c.restore();
    }

    // 5. İNTEQRASİYA OBYEKTİ: Qlobal `window.LavaEngine`
    global.LavaEngine = {
        drawPlatformWaterfall,
        drawLavaSourceRock,
        drawRockPlatform,
        drawLavaImpactPool
    };

})(typeof window !== 'undefined' ? window : this);
