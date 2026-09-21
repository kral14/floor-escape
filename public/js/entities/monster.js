// CANAVAR / LAVA SİNİFİ - 3D OBSİDİAN CANAVARI, GÖZLƏR, BUYNŪZLAR, DİŞLƏR VƏ OYUNÇUNU İZLƏYƏN BAXIŞ

class Monster {
    constructor() {
        this.y = 0;
        this.baseSpeed = 0.22;
        this.speed = 0.22;
        this.wallTimer = 0;      // Fiziki barrikada divarı
        this.shockTimer = 0;     // Şok elektrik iflici
        this.iceTimer = 0;       // Buz ləngitməsi
        this.mineStunTimer = 0;  // Mina zərbəsi
        this.plasmaTimer = 0;    // Plazma əriməsi
        this.shockShake = 0;     // Elektrik titrəməsi
        this.waveOffset = 0;

        // VİZUAL VƏ CANAVAR ÜZ SİSTEMİ (OBSİDİAN)
        this.t = 0;
        this.face = 0.5;
        this.gazeX = 0;
        this.gazeY = 0;
        this.flash = 0;

        // ☄️ CANAVARIN BOSS HÜCUM BACARIQLARI
        this.meteors = [];
        this.shockwaves = [];
        this.meteorCooldown = 320;
        this.roarCooldown = 540;
        this.surgeCooldown = 420;
        this.surgeSide = null;
        this.surgeTimer = 0;
        this.surgeHeight = 0;

        // 👾 BOSS SAĞLAMLIQ (HP) VƏ DALĞA SİSTEMİ
        this.currentBossWave = 1;
        this.totalBossWaves = 3;
        this.hp = 1500;
        this.maxHp = 1500;
        this.displayHp = 1500;
        this.isDefeated = false;
        this.hpBarShake = 0;
        this.initBossWave(1, 1);
    }

    reset() {
        const fl = (typeof gameState !== 'undefined' && gameState.floor) ? gameState.floor : 1;
        const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(fl) : canvasHeight;
        this.y = worldH - 38;
        this.baseSpeed = 0.22 + (fl - 1) * 0.06;
        this.speed = this.baseSpeed;
        this.wallTimer = 0;
        this.shockTimer = 0;
        this.iceTimer = 0;
        this.mineStunTimer = 0;
        this.plasmaTimer = 0;
        this.shockShake = 0;
        this.waveOffset = Math.random() * 100;
        this.t = 0;
        this.face = 0.5;
        this.gazeX = 0;
        this.gazeY = 0;
        this.flash = 0;

        // Boss dalğası və canını sıfırla
        this.isDefeated = false;
        this.initBossWave(fl, 1);

        // Boss hücumlarını sıfırla
        this.meteors = [];
        this.shockwaves = [];
        this.meteorCooldown = 280;
        this.roarCooldown = 500;
        this.surgeCooldown = 400;
        this.surgeSide = null;
        this.surgeTimer = 0;
        this.surgeHeight = 0;
        if (typeof audio !== 'undefined') {
            audio.nextMonsterBeatTime = 0;
        }
    }

    // Köməkçi elips çəkmə
    ellipse(c, x, y, rx, ry, color) {
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
        c.fill();
    }

    // Eyni hücum ritmi dalğanı, üzü və çənəni birlikdə idarə edir
    attackPose() {
        const p = (this.t % 3.6) / 3.6;
        const smooth = v => {
            v = Math.max(0, Math.min(1, v));
            return v * v * (3 - 2 * v);
        };
        if (p < 0.48) return 0.1 * smooth(p / 0.48);
        if (p < 0.60) return 0.1;
        if (p < 0.70) return 0.1 + 0.9 * smooth((p - 0.60) / 0.10);
        return 1 - smooth((p - 0.70) / 0.30);
    }

    // Bütün eni tutan dinamik lava səthi (Lava Surge / Wave təsiri ilə)
    surface(x, top) {
        const w = canvasWidth;
        let s = top + Math.sin(x * 0.019 + this.t * 1.5) * 5 + Math.sin(x * 0.037 - this.t * 1.1) * 2 - Math.exp(-Math.pow((x - this.face * w) / (w * 0.16), 2)) * this.attackPose() * 24;

        // 🔥 LAVA QABARMASI (LAVA SURGE)
        if (this.surgeTimer > 0) {
            const sideFactor = this.surgeSide === 'left' 
                ? Math.max(0, 1 - x / (w * 0.6)) 
                : Math.max(0, (x - w * 0.4) / (w * 0.6));
            s -= sideFactor * this.surgeHeight;
        }

        return s;
    }

    // Başın anker nöqtəsi (lava sərhədinin altında sabit durması üçün)
    headAnchor(top, scale) {
        const w = canvasWidth;
        let boundary = -Infinity;
        for (let dx = -140; dx <= 140; dx += 5) {
            boundary = Math.max(boundary, this.surface(this.face * w + dx * scale, top));
        }
        return boundary + 119 * scale;
    }

    // Bütün eni tutan lava bədəni və əzələli sinə/qollar
    drawBody(c, top, s, fy) {
        const w = canvasWidth;
        const cx = this.face * w;
        const a = this.attackPose();

        c.save();
        c.translate(cx, fy);
        c.scale(s * 1.35, s * 1.20);
        c.translate(0, -12);
        c.lineJoin = 'round';
        c.lineCap = 'round';

        const shape = (points, fill, edge = '#4b3434') => {
            c.beginPath();
            points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
            c.closePath();
            c.fillStyle = fill;
            c.fill();
            if (edge) {
                c.strokeStyle = edge;
                c.lineWidth = 1.5;
                c.stroke();
            }
        };

        // Geniş daş sinə
        const chest = c.createLinearGradient(0, 40, 0, 260);
        chest.addColorStop(0, '#302831');
        chest.addColorStop(0.45, '#35212bd9');
        chest.addColorStop(1, '#54201b00');
        shape([[-83, 38], [-138, 42], [-173, 81], [-127, 153], [-103, 251], [0, 284], [103, 251], [127, 153], [173, 81], [138, 42], [83, 38]], chest, null);

        // Çiyinlər, qollar və caynaqlar
        for (const side of [-1, 1]) {
            c.save();
            c.scale(side, 1);

            const ex = 173 - 9 * a, ey = 112 - 13 * a, hx = 191 - 29 * a, hy = 44 - 27 * a;
            c.beginPath();
            c.moveTo(105, 62);
            c.bezierCurveTo(138, 53, ex + 23, ey - 19, ex, ey);
            c.quadraticCurveTo(ex + 28, ey - 13, hx, hy);
            c.strokeStyle = '#8e341d';
            c.lineWidth = 48;
            c.stroke();

            c.beginPath();
            c.moveTo(108, 65);
            c.quadraticCurveTo(142, 70, ex, ey);
            c.quadraticCurveTo(ex + 15, ey - 27, hx, hy);
            c.strokeStyle = '#28232b';
            c.lineWidth = 34;
            c.stroke();

            shape([[89, 46], [116, 34], [147, 49], [151, 73], [132, 91], [105, 85], [88, 65]], '#34303a');
            shape([[116, 38], [145, 50], [151, 67], [130, 63]], '#4b3b42');
            shape([[137, 83], [154, 74], [ex + 17, ey - 5], [ex + 6, ey + 19], [ex - 17, ey + 12]], '#29262e');

            const vx = hx - ex, vy = hy - ey, L = Math.hypot(vx, vy) || 1, nx = -vy / L * 16, ny = vx / L * 16;
            shape([[ex - nx, ey - ny], [ex + nx, ey + ny], [hx + nx * 0.8, hy + ny * 0.8], [hx - nx * 0.8, hy - ny * 0.8]], '#24222b');

            c.strokeStyle = '#ff8536';
            c.lineWidth = 2;
            c.shadowColor = '#f75c16';
            c.shadowBlur = 7;
            c.beginPath();
            c.moveTo(122, 49);
            c.lineTo(128, 67);
            c.lineTo(143, 73);
            c.moveTo(ex, ey + 8);
            c.lineTo(ex + 5, ey - 15);
            c.lineTo(hx - 3, hy + 10);
            c.stroke();
            c.shadowBlur = 0;

            // Caynaqlı əllər
            c.save();
            c.translate(hx, hy);
            c.rotate(-0.20 - a * 0.24);
            shape([[-21, 12], [-24, -8], [-14, -24], [11, -26], [25, -12], [24, 10], [12, 25], [-11, 24]], '#302831', '#af5028');
            shape([[-16, -9], [-8, -20], [10, -19], [18, -7], [9, 4], [-9, 4]], '#51404a');
            for (let i = 0; i < 3; i++) {
                const x = -15 + i * 15, len = 29 + (i === 1 ? 7 : 0), curl = a * 14;
                shape([[x - 6, -13], [x - 8, -29], [x - 4, -len - 15 + curl], [x + 5, -len - 19 + curl], [x + 11, -len - 8 + curl], [x + 7, -len + curl], [x + 3, -len - 5 + curl], [x + 1, -27], [x + 6, -13]], '#302731', '#b95b2c');
                shape([[x + 5, -len - 19 + curl], [x + 11, -len - 8 + curl], [x + 7, -len + curl]], '#ffc278', null);
            }
            shape([[-17, 8], [-34, -2], [-38, -17], [-29, -26], [-23, -20], [-28, -14], [-23, -5], [-13, -3]], '#352832', '#b95b2c');
            c.restore();

            // Qabırğalar
            shape([[30, 99], [75, 85], [115, 103], [98, 125], [54, 130]], '#302730');
            shape([[42, 138], [94, 131], [104, 149], [72, 165], [47, 155]], '#39252b');

            c.globalAlpha = 0.65;
            c.strokeStyle = '#ef7130';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(65, 111);
            c.lineTo(84, 117);
            c.lineTo(70, 136);
            c.lineTo(86, 157);
            c.lineTo(67, 192);
            c.stroke();
            c.globalAlpha = 1;
            c.restore();
        }

        // Qəlbi (Lava Core)
        const core = c.createRadialGradient(0, 144, 1, 0, 144, 35);
        core.addColorStop(0, '#ffe290');
        core.addColorStop(0.2, '#ff842b');
        core.addColorStop(1, '#f94c0000');
        this.ellipse(c, 0, 144, 35, 43, core);
        shape([[0, 121], [12, 139], [5, 164], [-8, 151], [-11, 135]], '#ffae48', null);
        c.restore();
    }

    // 3D Perspektiv, Dərinlik Sıralaması və İşıqlandırma ilə Canavar Başı
    drawHead3D(c, cx, cy, scale, attack) {
        c.save();
        const lookPhase = (this.t % 9) / 9;
        const ease = v => {
            v = Math.max(0, Math.min(1, v));
            return v * v * (3 - 2 * v);
        };
        const upward = lookPhase < 0.24 ? 0 : lookPhase < 0.47 ? ease((lookPhase - 0.24) / 0.23) : lookPhase < 0.77 ? 1 : 1 - ease((lookPhase - 0.77) / 0.23);
        const pitch = 0.10 + upward * 0.65 + attack * 0.035;
        const yaw = Math.max(-0.22, Math.min(0.22, this.gazeX * 0.013));
        const faces = [];

        function rotate(p) {
            const [x, y, z] = p;
            const yy = y * Math.cos(pitch) - z * Math.sin(pitch);
            const zz = y * Math.sin(pitch) + z * Math.cos(pitch);
            return [x * Math.cos(yaw) + zz * Math.sin(yaw), yy, -x * Math.sin(yaw) + zz * Math.cos(yaw)];
        }

        function project(p) {
            const [x, y, z] = rotate(p);
            const f = 470 / (470 - z);
            return [cx + x * f * scale, cy + y * f * scale, z];
        }

        function polygon(points, color, glow = false) {
            const rotated = points.map(rotate);
            const p = points.map(project);
            faces.push({ p, rotated, color, glow, depth: p.reduce((n, v) => n + v[2], 0) / p.length });
        }

        // Halqalar (Volkanik Qabıq)
        const rings = [
            [-76, 23, 18, -7],
            [-68, 44, 28, -4],
            [-53, 68, 38, -2],
            [-34, 85, 44, 0],
            [-12, 91, 47, 0],
            [8, 85, 44, -2],
            [25, 73, 37, -5],
            [35, 60, 29, -9]
        ];
        const segments = 24;
        function ringPoint(r, j) {
            const angle = j / segments * Math.PI * 2;
            return [Math.cos(angle) * r[1], r[0], r[3] + Math.sin(angle) * r[2]];
        }
        for (let r = 0; r < rings.length - 1; r++) {
            for (let j = 0; j < segments; j++) {
                const p = ringPoint(rings[r], j), q = ringPoint(rings[r], j + 1), u = ringPoint(rings[r + 1], j + 1), v = ringPoint(rings[r + 1], j);
                polygon([p, q, u, v], ['#51434a', '#493f49', '#453b44'][j % 3]);
            }
        }

        // Qıvrım Buynuzlar
        for (const side of [-1, 1]) {
            const centers = [
                [side * 61, -46, -5, 17],
                [side * 78, -66, -10, 13],
                [side * 87, -90, -16, 8],
                [side * 85, -112, -22, 3],
                [side * 75, -125, -25, 0.5]
            ];
            for (let k = 0; k < centers.length - 1; k++) {
                for (let j = 0; j < 8; j++) {
                    const hp = (r, a) => [r[0] + Math.cos(a) * r[3], r[1], r[2] + Math.sin(a) * r[3]];
                    polygon([hp(centers[k], j * Math.PI / 4), hp(centers[k], (j + 1) * Math.PI / 4), hp(centers[k + 1], (j + 1) * Math.PI / 4), hp(centers[k + 1], j * Math.PI / 4)], '#53444b');
                }
            }
        }

        // Yanaq qabarıqları
        for (const side of [-1, 1]) {
            polygon([[side * 65, -5, 39], [side * 88, -3, 24], [side * 78, 20, 32], [side * 55, 33, 42], [side * 48, 17, 50]], '#64505a');
            polygon([[side * 65, -5, 39], [side * 48, 17, 50], [side * 38, 4, 49]], '#51414c');
            polygon([[side * 78, 20, 32], [side * 64, 36, 26], [side * 55, 33, 42]], '#3d303e');
        }

        // Gözlər və canlı bəbəklər
        for (const side of [-1, 1]) {
            const mx = side * 43;
            polygon([[mx - 28, -27, 39], [mx - 12, -38, 40], [mx + 22, -31, 40], [mx + 27, -13, 42], [mx + 8, -3, 46], [mx - 21, -9, 43]], '#211b28');
            polygon([[mx - 23, -25, 45], [mx - 9, -30, 46], [mx + 22, -26, 45], [mx + 15, -12, 48], [mx - 6, -8, 49], [mx - 20, -14, 47]], '#ffab32', true);
            const look = Math.max(-7, Math.min(7, this.gazeX * 0.55)), up = -4 + this.gazeY * 0.3;
            polygon([[mx + look, -28 + up, 46], [mx + look + 4, -18 + up, 46], [mx + look, -7 + up, 46], [mx + look - 4, -18 + up, 46]], '#1b1017');
            polygon([[mx - 28, -28, 43], [mx - 14, -40, 38], [mx + 13, -36, 41], [mx + 28, -25, 47], [mx + 9, -27, 54], [mx - 12, -30, 51]], '#63505a');
        }

        polygon([[-13, -27, 45], [13, -27, 45], [21, 13, 58], [0, 23, 71], [-21, 13, 58]], '#55434a');
        polygon([[-21, 13, 58], [0, 23, 71], [0, -6, 59]], '#372d36');

        // Boğaz və Açılan Alt Çənə
        const opening = 20 + attack * 33;
        polygon([[-62, 14, 38], [62, 14, 38], [60, 40 + opening, 29], [-60, 40 + opening, 29]], '#170e18');
        polygon([[-37, 28, 39], [37, 28, 39], [28, 45 + opening, 32], [-28, 45 + opening, 32]], '#dd571c', true);
        polygon([[-68, 15, 34], [-46, 7, 48], [-18, 11, 57], [0, 15, 60], [18, 11, 57], [46, 7, 48], [68, 15, 34], [53, 23, 44], [0, 24, 54], [-53, 23, 44]], '#51404b');

        const jy = 40 + opening, jz = 46 - attack * 13;
        const jawRim = [[-65, jy, 12], [-53, jy + 9, jz - 4], [-28, jy + 16, jz + 5], [0, jy + 23, jz + 12], [28, jy + 16, jz + 5], [53, jy + 9, jz - 4], [65, jy, 12]];
        for (let j = 0; j < jawRim.length - 1; j++) {
            const A = jawRim[j], B = jawRim[j + 1];
            polygon([A, B, [B[0] * 0.75, B[1] + 15, B[2] - 15], [A[0] * 0.75, A[1] + 15, A[2] - 15]], '#62505a');
        }

        // Qorxulu Dişlər
        function onEdge(points, x) {
            for (let j = 0; j < points.length - 1; j++) {
                const A = points[j], B = points[j + 1];
                if (x >= A[0] && x <= B[0]) {
                    const u = (x - A[0]) / (B[0] - A[0]);
                    return [x, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u];
                }
            }
            return points[0];
        }

        const upperRim = [[-53, 23, 44], [0, 24, 54], [53, 23, 44]];
        for (let i = -3; i <= 3; i++) {
            const x = i * 15, len = Math.abs(i) === 3 ? 20 : 14;
            for (const lower of [false, true]) {
                const edge = lower ? jawRim : upperRim, A = onEdge(edge, x - 5.5), B = onEdge(edge, x + 5.5), M = onEdge(edge, x);
                A[1] += lower ? 3 : -3;
                B[1] += lower ? 3 : -3;
                A[2] += 0.3;
                B[2] += 0.3;
                const tip = [x, M[1] + (lower ? -len : len), M[2] + 2];
                polygon([A, B, tip], '#ffe0a1');
                polygon([B, [B[0], B[1], B[2] - 5], tip], '#b27743');
                polygon([[A[0], A[1], A[2] - 5], A, tip], '#d29953');
            }
        }

        // Üz qırışları və parıldayan lava çatlar
        for (const side of [-1, 1]) {
            polygon([[side * 22, -50, 37], [side * 37, -45, 39], [side * 56, -40, 40], [side * 52, -37, 42], [side * 35, -42, 41]], '#29222d');
            polygon([[side * 29, -49, 39], [side * 38, -44, 41], [side * 47, -42, 41], [side * 38, -46, 41]], '#d17536', true);
            polygon([[side * 31, -3, 46], [side * 40, 6, 48], [side * 47, 17, 49], [side * 52, 21, 46], [side * 44, 5, 48], [side * 35, -5, 46]], '#271d29');
            polygon([[side * 54, 14, 45], [side * 64, 10, 42], [side * 72, 3, 38], [side * 66, 15, 42], [side * 55, 20, 46]], '#30232e');
            polygon([[side * 54, 20, 46], [side * 65, 15, 43], [side * 61, 19, 44], [side * 54, 23, 46]], '#df823b', true);
            polygon([[side * 8, 9, 62], [side * 15, 14, 62], [side * 10, 17, 64], [side * 6, 15, 64]], '#211924');
        }

        polygon([[-8, -64, 40], [-3, -64, 40], [4, -48, 55], [0, -37, 55], [-4, -39, 55], [0, -48, 55]], '#ff9634', true);
        polygon([[-88, -9, 49], [-84, -9, 49], [-74, 7, 49], [-81, 24, 49], [-85, 23, 49], [-79, 7, 49]], '#ff7828', true);
        polygon([[71, -9, 49], [75, -9, 49], [84, 8, 49], [78, 28, 49], [74, 27, 49], [80, 8, 49]], '#ff7828', true);

        // Dərinliyə görə çeşidləmə və 3D İşıqlandırma
        faces.sort((a, b) => a.depth - b.depth);

        for (const f of faces) {
            const [A, B, C] = f.rotated;
            const u = B.map((v, i) => v - A[i]);
            const v = C.map((n, i) => n - A[i]);
            let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
            const len = Math.hypot(...n) || 1;
            n = n.map(val => val / len);
            const light = 0.48 + 0.52 * Math.max(0, n[0] * -0.35 + n[1] * -0.6 + n[2] * 0.72);
            const rgb = f.color.slice(1).match(/../g).map(val => parseInt(val, 16));
            c.fillStyle = f.glow ? f.color : 'rgb(' + rgb.map(val => Math.round(val * light)).join(',') + ')';
            c.shadowColor = '#ff761b';
            c.shadowBlur = f.glow ? 8 : 0;
            c.beginPath();
            f.p.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
            c.closePath();
            c.fill();
            if (!f.glow) {
                c.strokeStyle = c.fillStyle;
                c.lineWidth = 0.45;
                c.stroke();
            }
        }
        c.shadowBlur = 0;
        c.restore();
    }

    update() {
        if (gameState.transitioning) return;

        // 1. Taymerlərin azaldılması
        if (this.wallTimer > 0) this.wallTimer--;
        if (this.shockTimer > 0) {
            this.shockTimer--;
            this.shockShake = (Math.random() - 0.5) * 6;
        } else {
            this.shockShake = 0;
        }
        if (this.mineStunTimer > 0) this.mineStunTimer--;
        if (this.iceTimer > 0) this.iceTimer--;
        if (this.plasmaTimer > 0) this.plasmaTimer--;
        if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.02);

        this.t += 0.025;

        // 2. Üzün və baxışın oyunçunu izləməsi
        const w = canvasWidth;
        const h = canvasHeight;
        if (typeof player !== 'undefined' && player) {
            const targetFace = Math.max(0.10, Math.min(0.90, player.x / w));
            this.face += (targetFace - this.face) * 0.045;

            const scale = Math.min(w / 500, h / 400) * 0.85;
            const eyeY = this.headAnchor(this.y, scale) - 5 * scale;
            const wantX = Math.max(-13, Math.min(13, (player.x - this.face * w) / (w * 0.28) * 13));
            const wantY = Math.max(-5, Math.min(5, (player.y - eyeY) / (h * 0.4) * 5));
            this.gazeX += (wantX - this.gazeX) * 0.12;
            this.gazeY += (wantY - this.gazeY) * 0.12;
        }

        // 3. PLAZMA ƏRİDİCİ
        if (this.plasmaTimer > 0) {
            const currentH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
            this.y = Math.min(currentH + 50, this.y + 0.22);
        }

        // 🔥 LAVA QABARMASI (SURGE) TAYMERİ
        if (this.surgeTimer > 0) {
            this.surgeTimer--;
            if (this.surgeTimer <= 0) {
                this.surgeHeight = 0;
                this.surgeSide = null;
            }
        }

        // ☄️ CANAVARIN BOSS HÜCUM DÖVRÜ (Sərhəd hələ açılmamışkən)
        if (typeof gameState !== 'undefined' && !gameState.gameOver && !gameState.paused && !gameState.borderOpen) {
            // 1. Lava Meteor Yağışı
            this.meteorCooldown--;
            if (this.meteorCooldown <= 0) {
                this.meteorCooldown = Math.max(220, 380 - (gameState.floor || 1) * 15);
                const meteorCount = Math.min(3, 1 + Math.floor((gameState.floor || 1) / 3));
                const currentH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(typeof gameState !== 'undefined' ? gameState.floor : 1) : canvasHeight;
                for (let m = 0; m < meteorCount; m++) {
                    const tx = Math.random() * (canvasWidth - 140) + 70;
                    const ty = Math.max(80, Math.min(currentH - 120, (typeof player !== 'undefined' && player ? player.y : currentH - 200) + (Math.random() - 0.5) * 350));
                    this.spawnMeteor(tx, ty);
                }
                if (typeof audio !== 'undefined' && audio.playMeteorWarning) {
                    audio.playMeteorWarning();
                }
            }

            // 2. Zərbə Qışqırığı (Shockwave Roar)
            this.roarCooldown--;
            if (this.roarCooldown <= 0) {
                this.roarCooldown = Math.max(360, 520 - (gameState.floor || 1) * 12);
                this.triggerRoar();
            }

            // 3. Lava Qabarması (Lava Surge)
            this.surgeCooldown--;
            if (this.surgeCooldown <= 0) {
                this.surgeCooldown = Math.max(280, 440 - (gameState.floor || 1) * 10);
                this.surgeSide = Math.random() < 0.5 ? 'left' : 'right';
                this.surgeTimer = 160;
                this.surgeHeight = 50;
            }
        }

        // Meteorların və Şok dalğalarının yenilənməsi
        this.updateMeteors();
        this.updateShockwaves();

        // 4. TAM DAYANMA ŞƏRTLƏRİ
        if (this.wallTimer > 0 || this.shockTimer > 0 || this.mineStunTimer > 0) {
            return;
        }

        // 5. LƏNGİTMƏ VƏ DİNAMİK TƏQİB SÜRƏTİ
        let currentSpeed = this.baseSpeed;

        // 🔥 DİNAMİK LAVA TƏQİBİ: Oyunçu irəlilədikcə lavın arxada gözdən itməsinin qarşısını alır
        if (typeof player !== 'undefined' && player && typeof player.y === 'number') {
            const distToPlayer = this.y - player.y;
            // Əgər lav oyunçunun ekranından çox aşağıda qalıbsa (dist > 520px), təbii təqib sürəti əlavə olunur
            if (distToPlayer > 520) {
                const catchup = Math.min(2.0, ((distToPlayer - 520) / 650) * 1.5);
                currentSpeed += catchup;
            }
        }

        if (this.iceTimer > 0) {
            const factor = (typeof this.iceSlowFactor === 'number') ? this.iceSlowFactor : 0.75;
            currentSpeed *= Math.max(0, 1 - factor); // Dinamik yavaşlatma və ya 100% donma
        }
        if (this.plasmaTimer > 0) {
            currentSpeed *= 0.20; // 80% ləngimə
        }
        // ⏱️ ZAMAN LƏNGİDİCİ GÜCÜ (CHRONO SHIFT)
        if (typeof gameState !== 'undefined' && gameState.chronoTimer > 0) {
            currentSpeed *= 0.25; // 75% qlobal zaman ləngiməsi
        }

        // 6. YÜKSƏLİŞ
        this.y -= currentSpeed;

        // 💓 CANAVARIN YÜKSƏLİŞ HƏYƏCANI VƏ QATLARLA DƏYİŞƏN DİNAMİK RİTM
        if (typeof audio !== 'undefined' && typeof audio.updateMonsterBeat === 'function') {
            const ch = typeof canvasHeight !== 'undefined' ? canvasHeight : 680;
            const isPaused = typeof gameState !== 'undefined' ? (gameState.paused || gameState.transitioning) : false;
            const isOver = typeof gameState !== 'undefined' ? gameState.gameOver : false;
            const fl = typeof gameState !== 'undefined' ? (gameState.floor || 1) : 1;
            audio.updateMonsterBeat(this.y, ch, isPaused, isOver, fl);
        }
    }

    draw(context) {
        const c = context || (typeof ctx !== 'undefined' ? ctx : (typeof window !== 'undefined' && window.ctx ? window.ctx : (document.getElementById('gameCanvas') ? document.getElementById('gameCanvas').getContext('2d') : null)));
        if (!c) return;
        c.save(); // Monster draw() state izolyasiyası
        const w = typeof canvasWidth !== 'undefined' ? canvasWidth : (c.canvas ? c.canvas.width : 800);
        const h = typeof canvasHeight !== 'undefined' ? canvasHeight : (c.canvas ? c.canvas.height : 680);
        const fl = (typeof gameState !== 'undefined' && gameState.floor) ? gameState.floor : 1;
        const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(fl) : (typeof canvasHeight !== 'undefined' ? canvasHeight : 680);
        const bottomH = worldH + 350;
        // ☄️ METEORLAR VƏ ŞOK DALĞALARI HƏMİŞƏ ÇƏKİLİR (Lava aşağıda olsa belə göydən enən hücumlar görünməlidir)
        this.drawMeteors(c);
        this.drawShockwaves(c);

        const top = this.y + this.shockShake;

        // Əgər lava tamamilə dünyanın altındadırsa mayeni çəkməyə ehtiyac yoxdur
        if (top > worldH + 250) {
            c.restore();
            return;
        }

        // A) LAVA MAYESİ VƏ QABARCIQLAR
        const grad = c.createLinearGradient(0, top, 0, bottomH);
        if (this.iceTimer > 0) {
            grad.addColorStop(0, '#7ee7ff');
            grad.addColorStop(0.23, '#0284c7');
            grad.addColorStop(0.65, '#0369a1');
            grad.addColorStop(1, '#082f49');
        } else {
            grad.addColorStop(0, this.flash > 0 ? '#ff8a64' : '#ff7c22');
            grad.addColorStop(0.23, '#b72b08');
            grad.addColorStop(0.65, '#571914');
            grad.addColorStop(1, '#400417');
        }

        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(0, bottomH);
        for (let x = 0; x <= w + 6; x += 6) {
            c.lineTo(x, this.surface(x, top));
        }
        c.lineTo(w, bottomH);
        c.fill();

        // Parıldayan dalğavari səth xətti
        c.strokeStyle = this.iceTimer > 0 ? '#bbf7d0' : '#ffc15b';
        c.lineWidth = 3;
        c.shadowColor = this.iceTimer > 0 ? '#38bdf8' : '#ff8b32';
        c.shadowBlur = 18;
        c.beginPath();
        for (let x = 0; x <= w + 6; x += 6) {
            const y = this.surface(x, top);
            if (x === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
        }
        c.stroke();
        c.shadowBlur = 0;

        // Qabarcıqlar
        const depth = Math.max(1, bottomH - top);
        for (let i = 0; i < 26; i++) {
            const x = (i * 137.3) % w;
            const y = top + 35 + ((i * 43 - this.t * 25) % depth + depth) % depth;
            if (y < bottomH) {
                c.globalAlpha = 0.22;
                this.ellipse(c, x, y, 5 + i % 5, 7 + i % 4, this.iceTimer > 0 ? '#bae6fd' : '#ff9b14');
                this.ellipse(c, x - 1, y + 1, 3, 4, this.iceTimer > 0 ? '#0284c7' : '#ef4800');
            }
        }
        c.globalAlpha = 1;

        // B) BƏDƏN VƏ 3D BAŞ
        const s = Math.min(w / 500, 680 / 400) * 0.85;
        const attack = this.attackPose();
        const fy = this.headAnchor(top, s);

        this.drawBody(c, top, s, fy);
        this.drawHead3D(c, this.face * w, fy + 10 * s, s * 1.12, attack);

        // C) XÜSUSİ EFFEKTLƏR (BUZ / ŞOK / PLAZMA / DİVAR İNDİKATORLARI)
        if (this.iceTimer > 0) {
            c.save();
            c.fillStyle = 'rgba(147, 197, 253, 0.25)';
            c.fillRect(0, top, w, Math.max(0, bottomH - top));
            c.fillStyle = '#bae6fd';
            c.font = 'bold 13px Orbitron, sans-serif';
            c.textAlign = 'center';
            c.fillText('❄ DONDURULUB', this.face * w, top - 18);
            c.restore();
        }

        if (this.shockTimer > 0) {
            c.save();
            c.strokeStyle = '#facc15';
            c.lineWidth = 3;
            c.shadowColor = '#eab308';
            c.shadowBlur = 15;
            for (let i = 0; i < 4; i++) {
                c.beginPath();
                const sx = this.face * w + (Math.random() - 0.5) * 220;
                const sy = top + Math.random() * 80;
                c.moveTo(sx, sy);
                c.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
                c.stroke();
            }
            c.shadowBlur = 0;
            c.restore();
        }

        // 🧱 FİZİKİ BARRİKADA DİVARI
        if (this.wallTimer > 0) {
            c.save();
            const wallHeight = 26;
            const topY = top - 16;
            const barW = w - 24;
            const barX = 12;

            // 1. Güclü arxa fon kölgəsi və parıltı
            c.shadowColor = '#f59e0b';
            c.shadowBlur = 20;

            // 2. Əsas zirehli divar gövdəsi
            c.fillStyle = 'rgba(28, 16, 8, 0.94)';
            c.strokeStyle = '#f59e0b';
            c.lineWidth = 3;
            c.beginPath();
            if (typeof c.roundRect === 'function') {
                c.roundRect(barX, topY, barW, wallHeight, 6);
            } else {
                c.rect(barX, topY, barW, wallHeight);
            }
            c.fill();
            c.stroke();
            c.shadowBlur = 0;

            // 3. Sənaye Təhlükəsizlik (Hazard) zolaqları
            c.save();
            c.beginPath();
            if (typeof c.roundRect === 'function') {
                c.roundRect(barX, topY, barW, wallHeight, 6);
            } else {
                c.rect(barX, topY, barW, wallHeight);
            }
            c.clip();

            c.fillStyle = 'rgba(245, 158, 11, 0.38)';
            for (let bx = barX - 10; bx < barX + barW + 30; bx += 32) {
                c.beginPath();
                c.moveTo(bx, topY + wallHeight);
                c.lineTo(bx + 14, topY);
                c.lineTo(bx + 24, topY);
                c.lineTo(bx + 10, topY + wallHeight);
                c.closePath();
                c.fill();
            }
            c.restore();

            // 4. Polad bərkidici pərçimlər
            c.fillStyle = '#fef08a';
            for (let bx = barX + 16; bx < barX + barW; bx += 40) {
                c.beginPath();
                c.arc(bx, topY + 6, 2.5, 0, Math.PI * 2);
                c.arc(bx, topY + wallHeight - 6, 2.5, 0, Math.PI * 2);
                c.fill();
            }

            // 5. Parıldayan üst qoruyucu lazer səddi
            c.strokeStyle = '#fde047';
            c.lineWidth = 2;
            c.shadowColor = '#facc15';
            c.shadowBlur = 12;
            c.beginPath();
            c.moveTo(barX + 4, topY + 1);
            c.lineTo(barX + barW - 4, topY + 1);
            c.stroke();
            c.shadowBlur = 0;

            // 6. Divarın üzərində mərkəzi status etiketi
            const wallSec = (this.wallTimer / 60).toFixed(1);
            const wallLabel = '🧱 BARRİKADA: ' + wallSec + 's';
            c.font = 'bold 12px Orbitron, sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            const labelW = c.measureText(wallLabel).width + 16;
            const midX = w / 2;
            const midY = topY + wallHeight / 2;

            c.fillStyle = 'rgba(20, 10, 4, 0.9)';
            c.strokeStyle = '#f59e0b';
            c.lineWidth = 1.5;
            c.beginPath();
            if (typeof c.roundRect === 'function') {
                c.roundRect(midX - labelW / 2, midY - 9, labelW, 18, 4);
            } else {
                c.rect(midX - labelW / 2, midY - 9, labelW, 18);
            }
            c.fill();
            c.stroke();

            c.fillStyle = '#fef08a';
            c.fillText(wallLabel, midX, midY);

            c.restore();
        }

        // 🏷️ AKTİV EFFEKT STATUS NİŞANLARI (Ekranın yuxarısında / lava üstündə)
        const activeBadges = [];
        if (this.wallTimer > 0) {
            activeBadges.push({
                txt: '🧱 ' + (this.wallTimer / 60).toFixed(1) + 's',
                clr: '#facc15',
                border: '#f59e0b',
                bg: 'rgba(48, 28, 8, 0.92)'
            });
        }
        if (this.iceTimer > 0) {
            activeBadges.push({
                txt: '❄ ' + (this.iceTimer / 60).toFixed(1) + 's',
                clr: '#38bdf8',
                border: '#0284c7',
                bg: 'rgba(6, 38, 50, 0.92)'
            });
        }
        if (this.shockTimer > 0) {
            activeBadges.push({
                txt: '⚡ ' + (this.shockTimer / 60).toFixed(1) + 's',
                clr: '#c084fc',
                border: '#a855f7',
                bg: 'rgba(38, 12, 58, 0.92)'
            });
        }
        if (typeof gameState !== 'undefined' && gameState.chronoTimer > 0) {
            activeBadges.push({
                txt: '⏱️ ' + (gameState.chronoTimer / 60).toFixed(1) + 's',
                clr: '#e879f9',
                border: '#c026d3',
                bg: 'rgba(50, 10, 50, 0.92)'
            });
        }
        if (this.plasmaTimer > 0) {
            activeBadges.push({
                txt: '☣ ' + (this.plasmaTimer / 60).toFixed(1) + 's',
                clr: '#34d399',
                border: '#10b981',
                bg: 'rgba(8, 42, 28, 0.92)'
            });
        }
        if (this.mineStunTimer > 0) {
            activeBadges.push({
                txt: '💥 STUN',
                clr: '#fb7185',
                border: '#f43f5e',
                bg: 'rgba(48, 10, 20, 0.92)'
            });
        }

        if (activeBadges.length > 0) {
            c.save();
            c.font = 'bold 11px Orbitron, sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';

            const badgeHeight = 22;
            const badgeY = Math.max(70, top - 45);
            const gap = 8;
            
            const measured = activeBadges.map(b => ({
                ...b,
                width: c.measureText(b.txt).width + 18
            }));

            const totalWidth = measured.reduce((sum, b) => sum + b.width, 0) + (measured.length - 1) * gap;
            let startX = (w - totalWidth) / 2;

            for (const b of measured) {
                const centerX = startX + b.width / 2;
                c.fillStyle = b.bg;
                c.strokeStyle = b.border;
                c.lineWidth = 1.8;
                c.shadowBlur = 12;
                c.shadowColor = b.clr;
                c.beginPath();
                if (typeof c.roundRect === 'function') {
                    c.roundRect(startX, badgeY - badgeHeight / 2, b.width, badgeHeight, 6);
                } else {
                    c.rect(startX, badgeY - badgeHeight / 2, b.width, badgeHeight);
                }
                c.fill();
                c.stroke();

                c.shadowBlur = 0;
                c.fillStyle = b.clr;
                c.fillText(b.txt, centerX, badgeY);

                startX += b.width + gap;
            }
            c.restore();
        }
    
        c.restore(); // Monster draw() state izolyasiyasının sonu
        c.globalAlpha = 1;
        c.shadowBlur = 0;
    }

    // ☄️ METEOR YARATMAQ (Lavanın göydən oyunçunun başına düşməsi)
    spawnMeteor(tx, ty) {
        // Kameranın yuxarı kənarından / hədəfdən 420px yuxarıdan enir
        const startY = Math.max(0, ty - 420);
        this.meteors.push({
            targetX: tx,
            targetY: ty,
            x: tx + (Math.random() - 0.5) * 50,
            y: startY,
            speed: 14,
            radius: 18,
            warningTimer: 45, // 45 kadr (~0.75s) yerdə qırpınan xəbərdarlıq halqası
            landed: false
        });
    }

    // ☄️ METEORLARIN YENİLƏNMƏSİ VƏ ZƏRBƏ TOXUNUŞU
    updateMeteors() {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            if (m.warningTimer > 0) {
                m.warningTimer--;
                continue;
            }

            // Düşmə hərəkəti
            m.y += m.speed;

            // ☄️ Havada oyunçuya birbaşa dəymə (Falling lava hit)
            if (typeof player !== 'undefined' && player && typeof gameState !== 'undefined' && gameState.dashInvulnerable <= 0) {
                const airDist = Math.hypot(player.x - m.x, player.y - m.y);
                if (airDist < (m.radius + (player.radius || 16))) {
                    m.landed = true;
                    m.y = m.targetY;
                    if (typeof player.takeDamage === 'function') {
                        player.takeDamage(1, 'meteor');
                    } else if (typeof triggerGameOver === 'function') {
                        triggerGameOver();
                    }
                    return;
                }
            }


            // Hədəfə çatdıqda partlayış
            if (m.y >= m.targetY) {
                m.landed = true;
                if (typeof audio !== 'undefined' && audio.playMeteorExplode) {
                    audio.playMeteorExplode();
                }

                // Ekran silkələnməsi
                const mainView = document.getElementById('main-view');
                if (mainView) {
                    mainView.classList.add('shake');
                    setTimeout(() => mainView.classList.remove('shake'), 250);
                }

                // Partlayış qığılcımları və alov tüstüsü
                if (typeof particles !== 'undefined') {
                    for (let p = 0; p < 28; p++) {
                        particles.push(new Particle(
                            m.targetX,
                            m.targetY,
                            Math.random() < 0.6 ? '#f97316' : '#ef4444',
                            4.5
                        ));
                    }
                }

                // Oyunçu partlayış yaxınlığındadırsa zərbə və ölüm
                if (typeof player !== 'undefined' && player && typeof gameState !== 'undefined' && gameState.dashInvulnerable <= 0) {
                    const dist = Math.hypot(player.x - m.targetX, player.y - m.targetY);
                    if (dist < 48) {
                        if (typeof player.takeDamage === 'function') {
                            player.takeDamage(1, 'meteor');
                        } else if (typeof triggerGameOver === 'function') {
                            triggerGameOver();
                        }
                        return;
                    }
                }


                this.meteors.splice(i, 1);
            }
        }
    }

    // ☄️ METEORLARIN ÇƏKİLMƏSİ (İNDİKATOR VƏ ALOVLU DAŞ)
    drawMeteors(c) {
        // 1. Hədəf nöqtələrində xəbərdarlıq indikatoru
        this.meteors.forEach(m => {
            if (m.warningTimer > 0) {
                c.save();
                const blink = Math.floor(m.warningTimer / 6) % 2 === 0;
                c.strokeStyle = blink ? '#ef4444' : '#f59e0b';
                c.lineWidth = 2.5;
                c.shadowColor = '#ef4444';
                c.shadowBlur = 15;
                c.setLineDash([6, 6]);

                // Hədəf halqası
                c.beginPath();
                c.arc(m.targetX, m.targetY, 26, 0, Math.PI * 2);
                c.stroke();
                c.setLineDash([]);

                // Nişangah mərkəzi
                c.beginPath();
                c.arc(m.targetX, m.targetY, 4, 0, Math.PI * 2);
                c.fillStyle = '#ef4444';
                c.fill();

                // Xəbərdarlıq mətni
                c.font = 'bold 10px Orbitron, sans-serif';
                c.fillStyle = '#f87171';
                c.textAlign = 'center';
                c.fillText('⚠️ METEOR', m.targetX, m.targetY - 32);

                c.restore();
            } else {
                // Göydən enən alovlu meteor
                c.save();
                c.fillStyle = '#f97316';
                c.shadowColor = '#ef4444';
                c.shadowBlur = 25;

                // Alov quyruğu
                c.beginPath();
                c.moveTo(m.x - m.radius * 0.8, m.y);
                c.lineTo(m.x + m.radius * 0.8, m.y);
                c.lineTo(m.x, m.y - 45);
                c.fillStyle = 'rgba(239, 68, 68, 0.7)';
                c.fill();

                // Əsas obsidian-lava nüvəsi
                c.beginPath();
                c.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
                const grad = c.createRadialGradient(m.x, m.y, 2, m.x, m.y, m.radius);
                grad.addColorStop(0, '#fef08a');
                grad.addColorStop(0.4, '#f97316');
                grad.addColorStop(1, '#7f1d1d');
                c.fillStyle = grad;
                c.fill();
                c.restore();
            }
        });
    }

    // 📢 ZƏRBƏ QİŞQIRIĞINI TETİKLƏMƏK (SHOCKWAVE ROAR)
    triggerRoar() {
        const w = canvasWidth;
        const h = canvasHeight;
        this.shockwaves.push({
            x: this.face * w,
            y: this.headAnchor(this.y, 0.85) - 20,
            radius: 20,
            maxRadius: 520,
            alpha: 1.0,
            speed: 8.5
        });

        // Ekran silkələnməsi
        const mainView = document.getElementById('main-view');
        if (mainView) {
            mainView.classList.add('shake');
            setTimeout(() => mainView.classList.remove('shake'), 350);
        }
    }

    // 📢 ŞOK DALĞASININ YENİLƏNMƏSİ
    updateShockwaves() {
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed;
            sw.alpha -= 0.016;

            // Oyunçuya çatan zərbə dalğası
            if (typeof player !== 'undefined' && player) {
                const pDist = Math.hypot(player.x - sw.x, player.y - sw.y);
                if (Math.abs(pDist - sw.radius) < 22 && !sw.hitPlayer) {
                    sw.hitPlayer = true;
                    player.stunTimer = 50; // ~0.85s ləngimə və duruxma
                    if (typeof particles !== 'undefined') {
                        for (let k = 0; k < 12; k++) {
                            particles.push(new Particle(player.x, player.y, '#c084fc', 3));
                        }
                    }
                }
            }

            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }
    }

    // 📢 ŞOK DALĞASININ ÇƏKİLMƏSİ
    drawShockwaves(c) {
        this.shockwaves.forEach(sw => {
            c.save();
            c.strokeStyle = `rgba(234, 88, 12, ${sw.alpha * 0.9})`;
            c.lineWidth = 4;
            c.shadowColor = '#f97316';
            c.shadowBlur = 20;

            c.beginPath();
            c.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            c.stroke();

            // Daxili ikinci nazik neon dalğa
            c.strokeStyle = `rgba(254, 240, 138, ${sw.alpha * 0.7})`;
            c.lineWidth = 2;
            c.beginPath();
            c.arc(sw.x, sw.y, Math.max(0, sw.radius - 12), 0, Math.PI * 2);
            c.stroke();

            c.restore();
        });
    }

    // ========================================================================
    // 👾 BOSS SAĞLAMLIQ, ZƏDƏ VƏ DALĞA İDARƏETMƏ SİSTEMİ
    // ========================================================================

    initBossWave(floor = 1, wave = 1) {
        this.currentBossWave = wave;
        this.totalBossWaves = (floor % 10 === 0) ? 4 : 3;

        // Baza HP şkalası: 1-ci qatda:
        // Boss 1 = 1500 HP
        // Boss 2 = 2500 HP
        // Boss 3 = 3000 HP
        // 10-cu qatda 4-cü Nəhəng Boss = 5000 HP
        let baseHp = 1500;
        if (wave === 2) baseHp = 2500;
        else if (wave === 3) baseHp = 3000;
        else if (wave >= 4) baseHp = 5000;

        // Sonrakı qatlarda HP əvvəlkilərdən daha çox olur
        const floorScale = 1 + (floor - 1) * 0.25;
        this.maxHp = Math.round(baseHp * floorScale);
        this.hp = this.maxHp;
        this.displayHp = this.hp;
        this.flash = 0;
        this.hpBarShake = 0;
    }

    takeDamage(amount, type = 'normal', hitX = null, hitY = null) {
        if (this.hp <= 0 || this.isDefeated) return;

        this.hp = Math.max(0, this.hp - amount);
        this.flash = 0.22;
        this.hpBarShake = 9;

        // Uçan zədə rəqəmi (Floating Damage Text)
        const posX = hitX !== null ? hitX : (typeof canvasWidth !== 'undefined' ? canvasWidth / 2 : 400);
        const posY = hitY !== null ? (hitY - 20) : (this.y - 30);
        const dmgColors = {
            wall: '#f59e0b',
            ice: '#38bdf8',
            shock: '#c084fc',
            mine: '#f43f5e',
            plasma: '#34d399'
        };
        const color = dmgColors[type] || '#f87171';

        if (typeof addFloatingText === 'function') {
            addFloatingText(posX + (Math.random() - 0.5) * 20, posY, `-${amount}`, color, amount >= 150 ? 18 : 14);
        }

        // Zədə qığılcımları
        if (typeof particles !== 'undefined') {
            const count = amount >= 150 ? 16 : 8;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(posX + (Math.random() - 0.5) * 35, posY, color, 3.5));
            }
        }

        // Əgər Boss öldüsə
        if (this.hp <= 0) {
            this.onBossDefeated();
        }
    }

    onBossDefeated() {
        const fl = (typeof gameState !== 'undefined' && gameState.floor) ? gameState.floor : 1;
        
        // Hər bossu öldürdükdə: azca qızıl (+50) və 1 almaz (Diamond)!
        const goldReward = 50;
        if (typeof gameState !== 'undefined') {
            gameState.gold += goldReward;
        }
        if (typeof diamonds !== 'undefined') {
            diamonds += 1;
        }
        if (typeof savePermanentData === 'function') {
            savePermanentData();
        }

        // Təntənəli səs
        if (typeof audio !== 'undefined') {
            if (typeof audio.playDiamond === 'function') audio.playDiamond();
            if (typeof audio.playSuccess === 'function') audio.playSuccess();
        }

        // Geniş partlayış zərrəcikləri
        const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 60; i++) {
                particles.push(new Particle(
                    w * (0.2 + Math.random() * 0.6),
                    this.y + (Math.random() - 0.5) * 40,
                    ['#fcd34d', '#f59e0b', '#38bdf8', '#ef4444'][i % 4],
                    5
                ));
            }
        }

        // Ekran titrəməsi
        const mainView = document.getElementById('main-view');
        if (mainView) {
            mainView.classList.add('shake');
            setTimeout(() => mainView.classList.remove('shake'), 400);
        }

        const waveNum = this.currentBossWave;
        const totalWaves = this.totalBossWaves;

        if (waveNum < totalWaves) {
            // NÖVBƏTİ BOSS DALĞASI
            if (typeof showToast === 'function') {
                showToast(`🎉 BOSS ${waveNum}/${totalWaves} MƏHV EDİLDİ! (+1 Almaz 💎, +${goldReward} Qızıl 🪙)`, 'success');
            }

            // Növbəti boss məğlub olan bossun mövqeyindən davam edir.
            this.wallTimer = 180; // Təhlükəsizlik barrikadası

            this.currentBossWave++;
            this.initBossWave(fl, this.currentBossWave);

            setTimeout(() => {
                if (typeof showToast === 'function') {
                    showToast(`⚠️ NÖVBƏTİ BOSS ${this.currentBossWave}/${totalWaves} OYANIR! (${this.maxHp} HP)`, 'warning');
                }
            }, 1200);

        } else {
            // 📜 3-CÜ (VƏ YA SONUNCU) BOSS MƏHV EDİLDİ: KEÇİD KAĞIZI DÜŞÜR!
            this.isDefeated = true;
            const worldH = (typeof getFloorWorldHeight === 'function') ? getFloorWorldHeight(fl) : (typeof canvasHeight !== 'undefined' ? canvasHeight : 680);
            this.y = worldH + 250; // Lava tamamilə aşağı çəkilir

            if (typeof showToast === 'function') {
                showToast(`🏆 BÜTÜN BOSSLAR MƏĞLUB EDİLDİ! (+1 Almaz 💎, +${goldReward} Qızıl 🪙)`, 'success');
            }

            // Keçid Kağızını arenaya salırıq (Oyunçunun çatacağı əlçatan nöqtəyə)
            const passY = Math.max(120, Math.min(worldH - 220, (typeof player !== 'undefined' && player ? player.y - 120 : worldH / 2)));
            if (typeof spawnEscapePass === 'function') {
                spawnEscapePass(w / 2 - 45, passY);
            }

            // 🛡️ QAT QORUMA KAĞIZI ÇIXMA ŞANSI (Qat Keçmə Kağızının dərhal yanında)
            // Yalnız Mağazada Fancy Elmasla alınıb aktiv edildikdə (floorProtectionLvl >= 1) şans açılır!
            const fpLvl = (typeof permUpgrades !== 'undefined' && permUpgrades.floorProtectionLvl) ? permUpgrades.floorProtectionLvl : 0;
            if (fpLvl >= 1 && typeof spawnFloorProtection === 'function') {
                // Səviyyə 1: 5%, Səviyyə 2: 8%, Səviyyə 3: 12%, Səviyyə 4: 16%, Səviyyə 5: 20%
                const dropChances = [0, 0.05, 0.08, 0.12, 0.16, 0.20];
                const chance = dropChances[Math.min(fpLvl, 5)] || 0.05;
                if (Math.random() < chance) {
                    spawnFloorProtection(w / 2 + 45, passY);
                    setTimeout(() => {
                        if (typeof showToast === 'function') {
                            showToast('✨ ƏLA HADİSƏ: Qat Keçmə Kağızının yanında Qat Qoruması düşdü! 🛡️📜', 'success');
                        }
                    }, 800);
                }
            }

            setTimeout(() => {
                if (typeof showToast === 'function') {
                    showToast('📜 KEÇİD KAĞIZI DÜŞDÜ! Onu götürün və sərhəd qapısından keçin!', 'info');
                }
            }, 1500);
        }

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveActiveRun === 'function') saveActiveRun();
    }

    drawBossHpBar(c) {
        if (this.isDefeated && this.hp <= 0) return;

        const w = typeof canvasWidth !== 'undefined' ? canvasWidth : 800;
        const barWidth = 360;
        const barHeight = 16;
        const barX = (w - barWidth) / 2;
        const barY = 48; // Sərhəd xəttinin bir az altında

        // Hamar can gecikməsi (Display HP lerp)
        if (this.displayHp > this.hp) {
            this.displayHp -= Math.max(2, (this.displayHp - this.hp) * 0.08);
        } else {
            this.displayHp = this.hp;
        }

        // Titrəmə
        let shakeX = 0;
        if (this.hpBarShake > 0) {
            shakeX = (Math.random() - 0.5) * this.hpBarShake;
            this.hpBarShake *= 0.85;
            if (this.hpBarShake < 0.5) this.hpBarShake = 0;
        }

        c.save();
        c.translate(shakeX, 0);

        // 1. Üst Məlumat Başlığı (Boss Dalğası və Adı)
        c.font = '900 11px Orbitron, sans-serif';
        c.textAlign = 'left';
        c.fillStyle = '#f87171';
        c.shadowColor = '#ef4444';
        c.shadowBlur = 10;
        c.fillText(`👾 LAVA OBSİDİAN BOSS — DALĞA ${this.currentBossWave}/${this.totalBossWaves}`, barX, barY - 7);

        c.textAlign = 'right';
        c.fillStyle = '#fef08a';
        c.shadowColor = '#f59e0b';
        c.shadowBlur = 8;
        c.fillText(`${Math.ceil(this.hp)} / ${this.maxHp} HP`, barX + barWidth, barY - 7);

        // 2. Fon qutusu
        c.fillStyle = 'rgba(6, 7, 21, 0.88)';
        c.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        c.lineWidth = 1.8;
        c.shadowColor = 'rgba(239, 68, 68, 0.35)';
        c.shadowBlur = 14;
        c.beginPath();
        c.roundRect(barX, barY, barWidth, barHeight, 5);
        c.fill();
        c.stroke();

        // 3. Ağ Zədə Kölgəsi (Damage Lag Bar)
        const lagRatio = Math.max(0, Math.min(1, this.displayHp / this.maxHp));
        if (lagRatio > 0) {
            c.fillStyle = 'rgba(254, 240, 138, 0.7)';
            c.beginPath();
            c.roundRect(barX + 2, barY + 2, (barWidth - 4) * lagRatio, barHeight - 4, 3);
            c.fill();
        }

        // 4. Əsas Can Zolağı (Fiery Gradient)
        const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
        if (hpRatio > 0) {
            const hpGrad = c.createLinearGradient(barX, 0, barX + barWidth, 0);
            hpGrad.addColorStop(0, '#dc2626');
            hpGrad.addColorStop(0.5, '#ea580c');
            hpGrad.addColorStop(1, '#f59e0b');

            c.fillStyle = hpGrad;
            c.shadowColor = '#f97316';
            c.shadowBlur = 12;
            c.beginPath();
            c.roundRect(barX + 2, barY + 2, (barWidth - 4) * hpRatio, barHeight - 4, 3);
            c.fill();
        }

        // 5. Zolaq Bölmə Xətləri (Segment Dividers - 4 bərabər hissəyə bölür)
        c.strokeStyle = 'rgba(15, 23, 42, 0.5)';
        c.lineWidth = 1.5;
        for (let s = 1; s <= 3; s++) {
            const segX = barX + (barWidth / 4) * s;
            c.beginPath();
            c.moveTo(segX, barY + 2);
            c.lineTo(segX, barY + barHeight - 2);
            c.stroke();
        }

        c.restore();
    }
}
