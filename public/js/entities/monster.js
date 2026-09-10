// CANAVAR / LAVA SİNİFİ - HƏR MƏRMİ ÜÇÜN MÜSTƏQİL VƏ XÜSUSİ MEXANİKA

class Monster {
    constructor() {
        this.y = 0;
        this.baseSpeed = 0.22;
        this.speed = 0.22;
        this.wallTimer = 0;      // 🧱 Barrikada fiziki divarı (hərəkəti tam kilidləyir)
        this.shockTimer = 0;     // ⚡ Şok elektrik iflici (lavanı iflic edir və titrədir)
        this.iceTimer = 0;       // ❄️ Buz ləngitməsi (sürəti 75% azaldır)
        this.mineStunTimer = 0;  // 💥 Mina partlayışının zərbə stunu
        this.plasmaTimer = 0;    // ☣️ Plazma əriməsi (sürəti 80% azaldır və korroziya edir)
        this.shockShake = 0;     // Şok elektrik titrəməsi
        this.waveOffset = 0;
    }

    reset() {
        this.y = canvasHeight + 50;
        this.baseSpeed = 0.22 + (gameState.floor - 1) * 0.06;
        this.speed = this.baseSpeed;
        this.wallTimer = 0;
        this.shockTimer = 0;
        this.iceTimer = 0;
        this.mineStunTimer = 0;
        this.plasmaTimer = 0;
        this.shockShake = 0;
        this.waveOffset = Math.random() * 100;
    }

    update() {
        if (gameState.transitioning) return;

        // 1. Taymerlərin azaldılması
        if (this.wallTimer > 0) this.wallTimer--;
        if (this.shockTimer > 0) {
            this.shockTimer--;
            this.shockShake = (Math.random() - 0.5) * 6; // Elektrik titrəməsi
        } else {
            this.shockShake = 0;
        }
        if (this.mineStunTimer > 0) this.mineStunTimer--;
        if (this.iceTimer > 0) this.iceTimer--;
        if (this.plasmaTimer > 0) this.plasmaTimer--;

        // 2. PLAZMA ƏRİDİCİ: Lavanı aktiv şəkildə əridir və aşağıya doğru sıxır!
        if (this.plasmaTimer > 0) {
            this.y = Math.min(canvasHeight + 50, this.y + 0.22);
        }

        // 3. TAM DAYANMA ŞƏRTLƏRİ (Barrikada baryeri, Şok iflici və ya Mina zərbəsi)
        if (this.wallTimer > 0 || this.shockTimer > 0 || this.mineStunTimer > 0) {
            return; // Lava heç bir şəkildə yuxarı qalxa bilməz!
        }

        // 4. SÜRƏTİN HESABLANMASI (Buz və Plazma ləngitmələri)
        if (this.iceTimer > 0 && this.plasmaTimer > 0) {
            this.speed = this.baseSpeed * 0.12; // İkisi birdən olduqda ifrat dərəcədə zəifləyir
        } else if (this.plasmaTimer > 0) {
            this.speed = this.baseSpeed * 0.20; // 80% ləngimə
        } else if (this.iceTimer > 0) {
            this.speed = this.baseSpeed * 0.28; // 72% ləngimə
        } else {
            this.speed = this.baseSpeed;
        }

        this.y -= this.speed;
        this.waveOffset += 0.035;
    }

    draw() {
        ctx.save();

        // 1. ƏSAS LAVA KÜTLƏSİ
        const grad = ctx.createLinearGradient(0, this.y, 0, canvasHeight);
        if (this.shockTimer > 0) {
            // Şok zamanı elektrik bənövşəyi-qırmızı rəng
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.95)');
            grad.addColorStop(0.3, 'rgba(192, 132, 252, 0.85)');
            grad.addColorStop(0.7, 'rgba(88, 28, 135, 0.90)');
            grad.addColorStop(1, 'rgba(30, 10, 50, 0.98)');
        } else if (this.plasmaTimer > 0) {
            // Plazma zamanı zəhərli yaşıl-narıncı rəng
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
            grad.addColorStop(0.3, 'rgba(52, 211, 153, 0.85)');
            grad.addColorStop(0.7, 'rgba(6, 95, 70, 0.90)');
            grad.addColorStop(1, 'rgba(10, 40, 25, 0.98)');
        } else if (this.iceTimer > 0) {
            // Buz zamanı donmuş mavi-siyan rəng
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.95)');
            grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.85)');
            grad.addColorStop(0.7, 'rgba(21, 94, 117, 0.90)');
            grad.addColorStop(1, 'rgba(8, 47, 73, 0.98)');
        } else {
            // Standart qızmar qırmızı lava
            grad.addColorStop(0, 'rgba(255, 0, 85, 0.95)');
            grad.addColorStop(0.25, 'rgba(255, 70, 0, 0.88)');
            grad.addColorStop(0.6, 'rgba(180, 20, 0, 0.82)');
            grad.addColorStop(1, 'rgba(60, 0, 15, 0.96)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);
        
        const time = Date.now() * 0.005;
        const shake = this.shockShake;
        for (let x = 0; x <= canvasWidth; x += 5) {
            const waveY = Math.sin(x * 0.025 + time + this.waveOffset) * 10 + 
                          Math.sin(x * 0.05 + time * 0.7) * 5;
            ctx.lineTo(x + shake, this.y + waveY);
        }
        
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.closePath();
        ctx.fill();

        // 2. SƏRHƏD VURĞUSU
        let strokeClr = '#ff0055';
        if (this.shockTimer > 0) strokeClr = '#c084fc';
        else if (this.wallTimer > 0) strokeClr = '#f59e0b';
        else if (this.iceTimer > 0) strokeClr = '#00ffff';
        else if (this.plasmaTimer > 0) strokeClr = '#10b981';

        ctx.strokeStyle = strokeClr;
        ctx.lineWidth = (this.shockTimer > 0 || this.wallTimer > 0 || this.iceTimer > 0) ? 5 : 3.5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = strokeClr;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. XÜSUSİ VİZUAL EFFEKTLƏR:
        
        // A) 🧱 BARRİKADA BARYERİ (Fiziki Divar)
        if (this.wallTimer > 0) {
            const wallHeight = 22;
            const topY = this.y - 12;

            ctx.save();
            ctx.fillStyle = 'rgba(35, 22, 10, 0.92)';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f59e0b';

            // Əsas bütöv tir
            ctx.beginPath();
            ctx.roundRect(10, topY, canvasWidth - 20, wallHeight, 6);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Kərpic / Polad Hazard zolaqları
            ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
            for (let bx = 20; bx < canvasWidth - 25; bx += 32) {
                ctx.beginPath();
                ctx.moveTo(bx, topY + wallHeight);
                ctx.lineTo(bx + 14, topY);
                ctx.lineTo(bx + 22, topY);
                ctx.lineTo(bx + 8, topY + wallHeight);
                ctx.closePath();
                ctx.fill();
            }

            // Polad pərçimlər
            ctx.fillStyle = '#fde047';
            for (let bx = 18; bx < canvasWidth - 15; bx += 48) {
                ctx.beginPath();
                ctx.arc(bx, topY + 6, 2.5, 0, Math.PI * 2);
                ctx.arc(bx, topY + wallHeight - 6, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // B) ⚡ ELEKTRİK ŞOKU VƏ İLDIRIM ARKLARI
        if (this.shockTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#c084fc';
            ctx.lineWidth = 2;

            for (let bolt = 0; bolt < 4; bolt++) {
                ctx.beginPath();
                let sx = Math.random() * (canvasWidth - 60) + 30;
                let sy = this.y - 15;
                ctx.moveTo(sx, sy);

                for (let seg = 0; seg < 4; seg++) {
                    sx += (Math.random() - 0.5) * 35;
                    sy += 8 + Math.random() * 8;
                    ctx.lineTo(sx, sy);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // C) ❄️ BUZ KRİSTALLARI
        if (this.iceTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00ffff';
            for (let x = 25; x < canvasWidth - 25; x += 45) {
                const cryY = this.y + Math.sin(x * 0.03 + time) * 8 - 4;
                ctx.beginPath();
                ctx.moveTo(x, cryY - 10);
                ctx.lineTo(x + 4, cryY);
                ctx.lineTo(x, cryY + 6);
                ctx.lineTo(x - 4, cryY);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // D) ☣️ PLAZMA ƏRİMƏ EMBERLƏRİ
        if (this.plasmaTimer > 0 && Math.random() < 0.4) {
            particles.push(new Particle(
                Math.random() * canvasWidth,
                this.y + (Math.random() - 0.5) * 15,
                '#34d399',
                3.5
            ));
        }

        // 4. MƏLUMAT VƏ EFFEKT STATUS BADGE-LƏRİ (Bütün aktiv effektlərin eyni anda göstərilməsi)
        const activeBadges = [];
        if (this.wallTimer > 0) {
            activeBadges.push({
                txt: `🧱 ${(this.wallTimer / 60).toFixed(1)}s`,
                clr: '#facc15',
                border: '#f59e0b',
                bg: 'rgba(48, 28, 8, 0.92)'
            });
        }
        if (this.iceTimer > 0) {
            activeBadges.push({
                txt: `❄️ ${(this.iceTimer / 60).toFixed(1)}s`,
                clr: '#00ffff',
                border: '#06b6d4',
                bg: 'rgba(6, 38, 50, 0.92)'
            });
        }
        if (this.shockTimer > 0) {
            activeBadges.push({
                txt: `⚡ ${(this.shockTimer / 60).toFixed(1)}s`,
                clr: '#c084fc',
                border: '#a855f7',
                bg: 'rgba(38, 12, 58, 0.92)'
            });
        }
        if (this.plasmaTimer > 0) {
            activeBadges.push({
                txt: `☣️ ${(this.plasmaTimer / 60).toFixed(1)}s`,
                clr: '#34d399',
                border: '#10b981',
                bg: 'rgba(8, 42, 28, 0.92)'
            });
        }
        if (this.mineStunTimer > 0) {
            activeBadges.push({
                txt: `💥 -35px`,
                clr: '#fb7185',
                border: '#f43f5e',
                bg: 'rgba(48, 10, 20, 0.92)'
            });
        }

        if (activeBadges.length > 0) {
            ctx.save();
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const badgeHeight = 22;
            const badgeY = Math.max(68, this.y - 20);
            const gap = 6;
            
            // Hər nişanın enini hesablamaq
            const measuredBadges = activeBadges.map(b => {
                const w = ctx.measureText(b.txt).width + 18;
                return { ...b, width: w };
            });

            const totalWidth = measuredBadges.reduce((sum, b) => sum + b.width, 0) + (measuredBadges.length - 1) * gap;
            let startX = (canvasWidth - totalWidth) / 2;

            for (const b of measuredBadges) {
                const centerX = startX + b.width / 2;
                ctx.fillStyle = b.bg;
                ctx.strokeStyle = b.border;
                ctx.lineWidth = 1.8;
                ctx.shadowBlur = 14;
                ctx.shadowColor = b.clr;
                ctx.beginPath();
                ctx.roundRect(startX, badgeY - badgeHeight / 2, b.width, badgeHeight, 6);
                ctx.fill();
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = b.clr;
                ctx.fillText(b.txt, centerX, badgeY);

                startX += b.width + gap;
            }
            ctx.restore();
        }

        // Standart lava qığılcımları
        if (this.y < canvasHeight - 60 && Math.random() < 0.25) {
            particles.push(new Particle(
                Math.random() * canvasWidth,
                this.y + 10,
                strokeClr,
                4
            ));
        }

        ctx.restore();
    }
}
