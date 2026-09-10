// HƏDİYYƏ KODU (GIFT CODE) VƏ KOD GENERATORU MODULU

class GiftCodeManager {
    constructor() {
        this.apiBase = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:4000';
    }

    // Oflayn rejim üçün lokal kodlar
    getLocalCodes() {
        try {
            return JSON.parse(localStorage.getItem('floor_escape_local_gift_codes') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveLocalCodes(codes) {
        localStorage.setItem('floor_escape_local_gift_codes', JSON.stringify(codes));
    }

    // Kodun Generasiyası (Admin / Generator)
    async generateCode(blueDiamonds, redDiamonds, customCode = '') {
        blueDiamonds = Math.max(0, parseInt(blueDiamonds) || 0);
        redDiamonds = Math.max(0, parseInt(redDiamonds) || 0);

        if (blueDiamonds === 0 && redDiamonds === 0) {
            return { success: false, message: 'Almaz sayı ən azı 1 olmalıdır!' };
        }

        // Əvvəlcə API Serveri yoxlayırıq
        try {
            const res = await fetch(`${this.apiBase}/api/giftcode/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blueDiamonds, redDiamonds, customCode })
            });
            if (res.ok) {
                const json = await res.json();
                return json;
            }
        } catch (err) {
            // Server əlçatan deyilsə lokal fallback işə düşür
        }

        // Lokal generator fallback
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = customCode ? customCode.trim().toUpperCase() : `GIFT-${Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('')}-${Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('')}`;
        
        const localCodes = this.getLocalCodes();
        localCodes.push({
            code,
            blueDiamonds,
            redDiamonds,
            used: false,
            createdAt: new Date().toISOString()
        });
        this.saveLocalCodes(localCodes);

        return { success: true, code: { code, blueDiamonds, redDiamonds } };
    }

    // Kodun Aktivləşdirilməsi (Redeem)
    async redeemCode(codeStr) {
        const cleanCode = (codeStr || '').trim().toUpperCase();
        if (!cleanCode) {
            return { success: false, message: 'Zəhmət olmasa kodu daxil edin!' };
        }

        // Server API yoxlanışı
        try {
            const res = await fetch(`${this.apiBase}/api/giftcode/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: cleanCode })
            });
            if (res.ok) {
                const json = await res.json();
                this.applyReward(json.blueDiamonds, json.redDiamonds);
                return json;
            } else {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 400 || res.status === 404) {
                    return { success: false, message: errData.message || 'Kod yanlışdır və ya istifadə edilib!' };
                }
            }
        } catch (err) {
            // Server qoşulmayıbsa lokal bazadan yoxlayırıq
        }

        // Lokal kod yoxlanışı
        const localCodes = this.getLocalCodes();
        const found = localCodes.find(c => c.code === cleanCode);

        if (!found) {
            return { success: false, message: 'Bu hədiyyə kodu mövcud deyil!' };
        }
        if (found.used) {
            return { success: false, message: 'Bu kod artıq istifadə edilib!' };
        }

        found.used = true;
        found.usedAt = new Date().toISOString();
        this.saveLocalCodes(localCodes);

        this.applyReward(found.blueDiamonds, found.redDiamonds);

        return {
            success: true,
            message: 'Kod uğurla aktivləşdirildi!',
            blueDiamonds: found.blueDiamonds,
            redDiamonds: found.redDiamonds
        };
    }

    applyReward(blue, red) {
        blue = parseInt(blue) || 0;
        red = parseInt(red) || 0;

        diamonds += blue;
        redDiamonds += red;

        savePermanentData();
        audio.playChest();
        updateUI();
        updatePermUpgradesUI();
        if (typeof updateDashboardUI === 'function') updateDashboardUI();
    }
}

const giftCodeManager = new GiftCodeManager();

// Modal idarəetməsi
function openGiftCodeModal() {
    document.getElementById('gift-modal-overlay').classList.remove('hidden');
    document.getElementById('gift-code-input').value = '';
    document.getElementById('gift-code-result').innerText = '';
}

function closeGiftCodeModal() {
    document.getElementById('gift-modal-overlay').classList.add('hidden');
}

async function handleRedeemSubmit(isDash = false) {
    const inputId = isDash ? 'dash-gift-code-input' : 'gift-code-input';
    const resultId = isDash ? 'dash-gift-code-result' : 'gift-code-result';
    const input = document.getElementById(inputId);
    const resultBox = document.getElementById(resultId);
    if (!input || !resultBox) return;
    const code = input.value;

    resultBox.innerHTML = '<span class="text-slate-400">Yoxlanılır...</span>';

    const res = await giftCodeManager.redeemCode(code);
    if (res.success) {
        let msg = `🎉 Təbriklər! `;
        if (res.blueDiamonds > 0) msg += `+${res.blueDiamonds} 💎 Mavi Almaz `;
        if (res.redDiamonds > 0) msg += `+${res.redDiamonds} 💎🔴 Qırmızı Almaz `;
        resultBox.innerHTML = `<span class="text-emerald-400 font-bold">${msg}</span>`;
        showToast(msg, 'diamond');
        input.value = '';
        if (!isDash) {
            setTimeout(closeGiftCodeModal, 1800);
        }
    } else {
        resultBox.innerHTML = `<span class="text-rose-400 font-bold">${res.message}</span>`;
        showToast(res.message, 'error');
    }
}
