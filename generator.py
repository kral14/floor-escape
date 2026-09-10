import json
import base64
import hmac
import hashlib
import time
import secrets
import sys

# Windows konsol kodlaşdırması
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SECRET_KEY = "FLOOR_ESCAPE_SECRET_KEY_2026_AGY_SECURE_TOKEN_SYSTEM"

def create_signed_gift_code(blue_diamonds, red_diamonds):
    nonce = secrets.token_hex(4).upper() # 8 simvol
    payload = {
        "b": int(blue_diamonds),
        "r": int(red_diamonds),
        "n": nonce,
        "t": int(time.time())
    }
    
    # JSON-u Base64URL formatına çeviririk
    json_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(json_bytes).decode('utf-8').rstrip('=')
    
    # HMAC-SHA256 imzası
    sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()[:12].upper()
    
    # Təmiz və səliqəli Hədiyyə Kodu formatı
    token = f"GIFT-{payload_b64}-{sig}"
    return token, payload

def verify_signed_gift_code(token):
    try:
        parts = token.strip().split('-')
        if len(parts) != 3 or parts[0] != "GIFT":
            return False, "Kod formatı düzgün deyil!"
        
        payload_b64 = parts[1]
        received_sig = parts[2].upper()
        
        # İmzanı yoxlayırıq
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()[:12].upper()
        if not hmac.compare_digest(received_sig, expected_sig):
            return False, "Təhlükəsizlik xətası: Saxta və ya dəyişdirilmiş kod!"
        
        # Base64 padding əlavə edib deşifrələyirik
        padded_b64 = payload_b64 + '=' * (-len(payload_b64) % 4)
        json_bytes = base64.urlsafe_b64decode(padded_b64)
        payload = json.loads(json_bytes.decode('utf-8'))
        
        return True, payload
    except Exception as e:
        return False, f"Kodu oxumaq mümkün olmadı: {str(e)}"

def main():
    print("=" * 60)
    print("🎁 FLOOR ESCAPE - RƏSMİ HƏDİYYƏ KODU GENERATORU (HMAC-SHA256)")
    print("=" * 60)
    print("Bu alət yalnız admin üçündür. Yaradılan kodlar kriptoqrafik")
    print("olaraq imzalanır və oyun API-si tərəfindən avtomatik yoxlanılır.\n")
    
    try:
        blue_input = input("💎 Mavi Almaz sayını daxil edin (məs: 20): ").strip()
        blue = int(blue_input) if blue_input else 0
        
        red_input = input("💎🔴 Qırmızı Almaz sayını daxil edin (məs: 10): ").strip()
        red = int(red_input) if red_input else 0
        
        if blue <= 0 and red <= 0:
            print("\n❌ Xəta: Ən azı 1 almaz daxil edilməlidir!")
            return
            
        token, payload = create_signed_gift_code(blue, red)
        
        print("\n" + "=" * 60)
        print("✅ HƏDİYYƏ KODU UĞURLA YARADILDI:")
        print(f"\n👉  {token}  👈\n")
        print(f"Məlumat: {blue} Mavi Almaz 💎 | {red} Qırmızı Almaz 💎🔴")
        print(f"Unikal Nonce ID: {payload['n']}")
        print("=" * 60)
        print("Bu kodu kopyalayaraq oyunçulara verə və ya oyunda 'KOD' bölməsinə yaza bilərsiniz.\n")
        
    except ValueError:
        print("\n❌ Xəta: Zəhmət olmasa rəqəm daxil edin!")
    except KeyboardInterrupt:
        print("\nGenerator dayandırıldı.")

if __name__ == '__main__':
    main()
