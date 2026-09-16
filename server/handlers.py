import os
import json
import random
from datetime import datetime, timezone
from urllib.parse import parse_qs

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from server.db import (
    get_db, hash_pin, generate_player_id,
    read_codes, save_codes, read_used_tokens, save_used_tokens, generate_random_code
)
from server.ws import broadcast_inbox_message

try:
    from generator import verify_signed_gift_code, create_signed_gift_code
except Exception:
    verify_signed_gift_code = None
    create_signed_gift_code = None

def safe_parse_json(val, default=None):
    if val is None:
        return default if default is not None else {}
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return default if default is not None else {}
    return default if default is not None else {}

def handle_get(req, parsed):
    # 1. API: Hədiyyə kodlarının siyahısı
    if parsed.path == '/api/giftcode/list':
        codes = read_codes()
        req.send_json({'success': True, 'codes': codes})
        return True

    # 2. API: Liderlər Cədvəli
    if parsed.path == '/api/leaderboard':
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT player_id, username, best_floor, diamonds, red_diamonds, gold, total_score, last_login
                    FROM players
                    ORDER BY best_floor DESC, diamonds DESC, red_diamonds DESC, total_score DESC
                    LIMIT 50
                ''')
                rows = [dict(r) for r in cursor.fetchall()]
                req.send_json({'success': True, 'leaderboard': rows})
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 3. API: Qlobal Çat Mesajları
    if parsed.path == '/api/chat/messages':
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, player_id, username, message, created_at
                    FROM chat_messages
                    ORDER BY id DESC
                    LIMIT 50
                ''')
                rows = [dict(r) for r in cursor.fetchall()]
                rows.reverse()
                req.send_json({'success': True, 'messages': rows})
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 4. API: Oyunçuların Siyahısı (Admin Generator GUI üçün)
    if parsed.path == '/api/players/list':
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, last_login, created_at
                    FROM players
                    ORDER BY last_login DESC
                ''')
                rows = [dict(r) for r in cursor.fetchall()]
                req.send_json({'success': True, 'players': rows})
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 5. API: Oyunçunun İnbox / Məktub Qutusu
    if parsed.path == '/api/inbox':
        qs = parse_qs(parsed.query)
        player_id = (qs.get('playerId', [''])[0] or qs.get('player_id', [''])[0]).strip()
        if not player_id:
            req.send_json({'success': False, 'message': 'Player ID tələb olunur!'}, 400)
            return True
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT m.*, 
                           CASE 
                               WHEN m.is_claimed = 1 THEN 1
                               WHEN c.id IS NOT NULL THEN 1 
                               ELSE 0 
                           END as is_claimed,
                           COALESCE(c.claimed_at, m.claimed_at) as claimed_at
                    FROM inbox_messages m
                    LEFT JOIN claimed_messages c ON m.id = c.message_id AND c.player_id = ?
                    WHERE m.target_type = 'ALL' OR m.player_id = ?
                    ORDER BY m.id DESC
                    LIMIT 50
                ''', (player_id, player_id))
                rows = [dict(r) for r in cursor.fetchall()]
                print(f" [INBOX] playerId={player_id} üçün sorğu gəldi. Bazadan tapılan məktub sayı: {len(rows)}")
                req.send_json({'success': True, 'messages': rows})
                return True
        except Exception as e:
            print(f" [INBOX XƏTASI] {e}")
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 6. API: Tək Oyunçu Profili (Ən son baza balansı)
    if parsed.path == '/api/player/profile':
        qs = parse_qs(parsed.query)
        player_id = (qs.get('playerId', [''])[0] or qs.get('player_id', [''])[0]).strip()
        if not player_id:
            req.send_json({'success': False, 'message': 'Player ID tələb olunur!'}, 200)
            return True
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT player_id, username, diamonds, red_diamonds, gold, best_floor, perm_upgrades, claimed_chests FROM players WHERE player_id = ?', (player_id,))
                row = cursor.fetchone()
                if row:
                    req.send_json({
                        'success': True,
                        'player': {
                            'playerId': row['player_id'],
                            'username': row['username'],
                            'diamonds': row['diamonds'] or 0,
                            'redDiamonds': row['red_diamonds'] or 0,
                            'gold': row['gold'] or 0,
                            'bestFloor': row['best_floor'] or 1,
                            'permUpgrades': safe_parse_json(row['perm_upgrades'], {}),
                            'claimedChests': safe_parse_json(row['claimed_chests'], [])
                        }
                    })
                else:
                    req.send_json({'success': False, 'message': 'Oyunçu tapılmadı!'}, 200)
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 200)
            return True

    return False


def handle_post(req, parsed, data):
    # 1. API: Oyunçu Qeydiyyatı (Register)
    if parsed.path == '/api/auth/register':
        username = (data.get('username') or '').strip()
        pin = str(data.get('pin') or '').strip()

        if len(username) < 2 or len(username) > 20:
            req.send_json({'success': False, 'message': 'Oyunçu adı 2-20 simvol arasında olmalıdır!'}, 400)
            return True

        if len(pin) < 3 or len(pin) > 12:
            req.send_json({'success': False, 'message': 'PIN şifrə 3-12 rəqəm/simvol olmalıdır!'}, 400)
            return True

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT 1 FROM players WHERE LOWER(username) = LOWER(?)', (username,))
                if cursor.fetchone():
                    req.send_json({'success': False, 'message': 'Bu oyunçu adı artıq istifadə olunur! Başqa ad seçin.'}, 400)
                    return True

                player_id = generate_player_id()
                pin_h = hash_pin(pin)

                init_gold = max(75, float(data.get('gold', 75)))
                init_diamonds = max(0, int(data.get('diamonds', 0)))
                init_red = max(0, int(data.get('redDiamonds', 0)))
                init_floor = max(1, int(data.get('bestFloor', 1)))
                init_upgrades = json.dumps(data.get('permUpgrades', {}))
                init_chests = json.dumps(data.get('claimedChests', []))

                cursor.execute('''
                    INSERT INTO players (player_id, username, pin_hash, gold, diamonds, red_diamonds, best_floor, perm_upgrades, claimed_chests)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (player_id, username, pin_h, init_gold, init_diamonds, init_red, init_floor, init_upgrades, init_chests))
                conn.commit()

                req.send_json({
                    'success': True,
                    'message': 'Qeydiyyat uğurla tamamlandı!',
                    'player': {
                        'playerId': player_id,
                        'username': username,
                        'gold': init_gold,
                        'diamonds': init_diamonds,
                        'redDiamonds': init_red,
                        'bestFloor': init_floor,
                        'permUpgrades': json.loads(init_upgrades),
                        'claimedChests': json.loads(init_chests)
                    }
                })
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': f'Qeydiyyat xətası: {str(e)}'}, 500)
            return True

    # 2. API: Oyunçu Girişi (Login)
    if parsed.path == '/api/auth/login':
        login_key = (data.get('login') or data.get('username') or '').strip()
        pin = str(data.get('pin') or data.get('password') or '').strip()

        if not login_key or not pin:
            req.send_json({'success': False, 'message': 'İstifadəçi adı/ID və PIN daxil edilməlidir!'}, 400)
            return True

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM players 
                    WHERE LOWER(username) = LOWER(?) OR player_id = ?
                ''', (login_key, login_key))
                row = cursor.fetchone()

                if not row:
                    req.send_json({'success': False, 'message': 'Bu adda və ya ID-də oyunçu tapılmadı! Əgər ilk dəfə daxil olursunuzsa, zəhmət olmasa Qeydiyyatdan keçin.'}, 400)
                    return True

                if row['pin_hash'] != hash_pin(pin):
                    req.send_json({'success': False, 'message': 'PIN şifrə yanlışdır!'}, 401)
                    return True

                cursor.execute('UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE player_id = ?', (row['player_id'],))
                conn.commit()

                upgrades = safe_parse_json(row['perm_upgrades'], {})
                chests = safe_parse_json(row['claimed_chests'], [])

                req.send_json({
                    'success': True,
                    'message': f'Xoş gəldin, {row["username"]}!',
                    'player': {
                        'playerId': row['player_id'],
                        'username': row['username'],
                        'gold': row['gold'],
                        'diamonds': row['diamonds'],
                        'redDiamonds': row['red_diamonds'],
                        'bestFloor': row['best_floor'],
                        'totalScore': row['total_score'],
                        'permUpgrades': upgrades,
                        'claimedChests': chests
                    }
                })
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': f'Giriş xətası: {str(e)}'}, 500)
            return True

    # 3. API: Oyunçu Tərəqqisinin Sinxronizasiyası (Sync)
    if parsed.path == '/api/player/sync':
        player_id = (data.get('playerId') or data.get('player_id') or '').strip()
        if not player_id:
            req.send_json({'success': False, 'message': 'Oyunçu ID tələb olunur!'}, 200)
            return True

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT diamonds, red_diamonds, gold, best_floor, total_score FROM players WHERE player_id = ?', (player_id,))
                existing = cursor.fetchone()
                if not existing:
                    req.send_json({'success': False, 'message': 'Oyunçu tapılmadı!'}, 200)
                    return True

                gold = float(data.get('gold', 0))
                client_diamonds = int(data.get('diamonds', 0))
                client_red = int(data.get('redDiamonds', 0))
                best_floor = int(data.get('bestFloor', 1))
                total_score = int(data.get('totalScore', 0))
                upgrades_json = json.dumps(data.get('permUpgrades', {}))
                chests_json = json.dumps(data.get('claimedChests', []))

                final_diamonds = max(0, client_diamonds)
                final_red = max(0, client_red)
                final_floor = max(existing['best_floor'] or 1, best_floor)
                final_score = max(existing['total_score'] or 0, total_score)

                cursor.execute('''
                    UPDATE players 
                    SET gold = ?, diamonds = ?, red_diamonds = ?, best_floor = ?,
                        total_score = ?, perm_upgrades = ?, claimed_chests = ?,
                        last_login = CURRENT_TIMESTAMP
                    WHERE player_id = ?
                ''', (gold, final_diamonds, final_red, final_floor, final_score, upgrades_json, chests_json, player_id))
                conn.commit()

                req.send_json({
                    'success': True,
                    'message': 'Məlumatlar mərkəzi bazada saxlanıldı!',
                    'diamonds': final_diamonds,
                    'redDiamonds': final_red,
                    'bestFloor': final_floor
                })
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': f'Sinxronizasiya xətası: {str(e)}'}, 200)
            return True

    # 4. API: Çata Mesaj Göndərmək
    if parsed.path == '/api/chat/send':
        player_id = (data.get('playerId') or 'Qonaq').strip()
        username = (data.get('username') or 'Oyunçu').strip()
        msg = (data.get('message') or '').strip()

        if not msg:
            req.send_json({'success': False, 'message': 'Mesaj boş ola bilməz!'}, 400)
            return True

        if len(msg) > 200:
            msg = msg[:200]

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO chat_messages (player_id, username, message)
                    VALUES (?, ?, ?)
                ''', (player_id, username, msg))
                conn.commit()

                req.send_json({'success': True, 'message': 'Mesaj göndərildi!'})
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 5. API: Hədiyyə Kodu Generasiyası (Standart)
    if parsed.path == '/api/giftcode/generate':
        blue = max(0, int(data.get('blueDiamonds', 0) or 0))
        red = max(0, int(data.get('redDiamonds', 0) or 0))
        custom = (data.get('customCode') or '').strip().upper()

        if blue == 0 and red == 0:
            req.send_json({'success': False, 'message': 'Almaz sayı 0-dan böyük olmalıdır!'}, 400)
            return True

        codes = read_codes()
        code_str = custom if custom else generate_random_code()
        if any(c.get('code') == code_str for c in codes):
            code_str = generate_random_code()

        new_entry = {
            'code': code_str,
            'blueDiamonds': blue,
            'redDiamonds': red,
            'used': False,
            'createdAt': datetime.now(timezone.utc).isoformat()
        }
        codes.append(new_entry)
        save_codes(codes)

        req.send_json({'success': True, 'code': new_entry})
        return True

    # 6. API: Admin Hədiyyə Kodu Yaratmaq və Məktub Göndərmək
    if parsed.path == '/api/admin/send_gift':
        target_type = (data.get('targetType') or 'ALL').strip().upper()
        player_id = (data.get('playerId') or 'ALL').strip()
        blue = int(data.get('blueDiamonds') or 0)
        red = int(data.get('redDiamonds') or 0)
        title = (data.get('title') or '🎁 Xüsusi Admin Hədiyyəsi!').strip()
        note = (data.get('note') or '').strip()
        expires_at = data.get('expiresAt')

        if blue <= 0 and red <= 0:
            req.send_json({'success': False, 'message': 'Ən azı 1 almaz daxil edilməlidir!'}, 400)
            return True

        if target_type == 'SINGLE' and (not player_id or player_id == 'ALL'):
            req.send_json({'success': False, 'message': 'Fərdi oyunçu üçün Player ID seçilməlidir!'}, 400)
            return True

        if create_signed_gift_code:
            token, _ = create_signed_gift_code(blue, red)
        else:
            token = generate_random_code()

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                target_name = 'Bütün Oyunçular'
                if target_type == 'SINGLE':
                    cursor.execute('SELECT username FROM players WHERE player_id = ?', (player_id,))
                    p_row = cursor.fetchone()
                    if not p_row:
                        req.send_json({'success': False, 'message': f'ID {player_id} olan oyunçu tapılmadı!'}, 404)
                        return True
                    target_name = p_row['username']

                cursor.execute('''
                    INSERT INTO gift_codes_advanced (code, target_type, target_player_id, blue_diamonds, red_diamonds, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (token, target_type, player_id, blue, red, expires_at))

                cursor.execute('''
                    INSERT INTO inbox_messages (target_type, player_id, title, note, gift_code, blue_diamonds, red_diamonds, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (target_type, player_id, title, note, token, blue, red, expires_at))
                new_msg_id = cursor.lastrowid
                conn.commit()

                broadcast_inbox_message(target_type, player_id, {
                    'id': new_msg_id,
                    'title': title,
                    'note': note,
                    'gift_code': token,
                    'blue_diamonds': blue,
                    'red_diamonds': red,
                    'expires_at': expires_at,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'is_claimed': 0
                })

                req.send_json({
                    'success': True,
                    'message': f'Hədiyyə kodu yaradıldı və {"hamıya" if target_type == "ALL" else target_name + "-a"} məktub göndərildi!',
                    'code': token,
                    'target': target_name,
                    'blueDiamonds': blue,
                    'redDiamonds': red
                })
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
            return True

    # 7. API: Generator və ya Xarici Skriptdən Real-Time WebSocket Bildirişi
    if parsed.path == '/api/inbox/notify':
        target_type = (data.get('targetType') or 'ALL').strip().upper()
        player_id = (data.get('playerId') or 'ALL').strip()
        msg_data = data.get('message') or {}
        broadcast_inbox_message(target_type, player_id, msg_data)
        req.send_json({'success': True, 'message': 'WebSocket bildirişi yayımlandı!'})
        return True

    # 🗺️ API: Track Studio Yolunu Yadda Saxlamaq
    if parsed.path == '/api/tracks/save':
        track = data.get('track') or {}
        all_tracks = data.get('allTracks') or []
        json_path = os.path.join(BASE_DIR, 'public', 'data', 'floor_patterns.json')
        js_path = os.path.join(BASE_DIR, 'public', 'js', 'data', 'floor_patterns.js')

        payload = {
            'totalTracks': len(all_tracks),
            'description': 'Floor Escape 30 ədəd sınaq yolu. Track Studio tərəfindən idarə olunur.',
            'tracks': all_tracks
        }
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
            with open(js_path, 'w', encoding='utf-8') as f:
                f.write(f"// Avtomatik yenilənmiş Floor Escape Sınaq Yolları\nwindow.FLOOR_PATTERNS = {json.dumps(payload, indent=2, ensure_ascii=False)};\n")
            req.send_json({'success': True, 'message': f"Yol {track.get('id', '')} uğurla yadda saxlandı!"})
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 500)
        return True

    # 8. API: Məktubdakı Hədiyyəni Qəbul Etmək (Claim & Verify)
    if parsed.path == '/api/inbox/claim':
        player_id = (data.get('playerId') or '').strip()
        message_id = int(data.get('messageId') or 0)

        if not player_id or not message_id:
            req.send_json({'success': False, 'message': 'Məlumatlar natamamdır! (Player ID və Message ID tələb olunur)'}, 200)
            return True

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM inbox_messages WHERE id = ?', (message_id,))
                msg = cursor.fetchone()
                if not msg:
                    req.send_json({'success': False, 'message': 'Hədiyyə tapılmadı və ya bazadan silinib!'}, 200)
                    return True

                target_type = msg['target_type'] or 'ALL'
                target_player = str(msg['player_id'] or 'ALL').strip()
                if target_type == 'SINGLE' and target_player != player_id:
                    req.send_json({
                        'success': False, 
                        'message': f'Bu hədiyyə başqa oyunçuya (# {target_player}) məxsusdur! Sizin ID: #{player_id}'
                    }, 200)
                    return True

                if msg['expires_at']:
                    try:
                        exp_val = msg['expires_at']
                        if isinstance(exp_val, str):
                            clean_exp = exp_val.replace('Z', '+00:00')
                            exp_dt = datetime.fromisoformat(clean_exp)
                        else:
                            exp_dt = exp_val
                        if exp_dt.tzinfo is None:
                            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                        if datetime.now(timezone.utc) > exp_dt:
                            req.send_json({
                                'success': False, 
                                'isExpired': True, 
                                'message': 'Bu hədiyyənin istifadə müddəti bitib!'
                            }, 200)
                            return True
                    except Exception as ex:
                        pass

                if msg['is_claimed'] == 1:
                    req.send_json({
                        'success': False, 
                        'alreadyClaimed': True, 
                        'message': 'Bu hədiyyə artıq təsdiqlənib və istifadə edilib!'
                    }, 200)
                    return True

                cursor.execute('SELECT id FROM claimed_messages WHERE message_id = ? AND player_id = ?', (message_id, player_id))
                if cursor.fetchone():
                    req.send_json({
                        'success': False, 
                        'alreadyClaimed': True, 
                        'message': 'Bu hədiyyə artıq sizin tərəfinizdən qəbul edilib!'
                    }, 200)
                    return True

                blue = int(msg['blue_diamonds'] or 0)
                red = int(msg['red_diamonds'] or 0)
                gift_code = msg['gift_code'] or ''

                cursor.execute('''
                    UPDATE inbox_messages 
                    SET is_claimed = 1, claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (player_id, message_id))

                cursor.execute('''
                    INSERT INTO claimed_messages (message_id, player_id)
                    VALUES (?, ?)
                ''', (message_id, player_id))

                if gift_code:
                    cursor.execute('UPDATE gift_codes_advanced SET is_active = 0 WHERE code = ?', (gift_code,))
                    try:
                        used_tokens = read_used_tokens()
                        used_tokens[gift_code] = {
                            'playerId': player_id,
                            'claimedAt': datetime.now(timezone.utc).isoformat()
                        }
                        save_used_tokens(used_tokens)
                    except Exception:
                        pass

                cursor.execute('''
                    UPDATE players 
                    SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                    WHERE player_id = ?
                ''', (blue, red, player_id))

                cursor.execute('SELECT diamonds, red_diamonds FROM players WHERE player_id = ?', (player_id,))
                p_res = cursor.fetchone()
                conn.commit()

                print(f" [CLAIM UĞURLU] Oyunçu {player_id} məktub #{message_id} qəbul etdi. Yeni balans: {p_res['diamonds']} Mavi, {p_res['red_diamonds']} Qırmızı")
                req.send_json({
                    'success': True,
                    'message': f'🎉 Hədiyyə kodu uğurla təsdiqləndi və qəbul edildi! (+{blue} [cyan], +{red} [ruby])',
                    'blueAdded': blue,
                    'redAdded': red,
                    'newDiamonds': p_res['diamonds'] if p_res else blue,
                    'newRedDiamonds': p_res['red_diamonds'] if p_res else red
                })
                return True
        except Exception as e:
            print(f" [CLAIM XƏTASI] {e}")
            req.send_json({'success': False, 'message': f'Baza xətası: {str(e)}'}, 200)
            return True

    # 9. API: Məktubu Silmək (Delete)
    if parsed.path == '/api/inbox/delete':
        message_id = int(data.get('messageId') or 0)
        if not message_id:
            req.send_json({'success': False, 'message': 'Məktub ID tələb olunur!'}, 200)
            return True

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM inbox_messages WHERE id = ?', (message_id,))
                cursor.execute('DELETE FROM claimed_messages WHERE message_id = ?', (message_id,))
                conn.commit()

                req.send_json({'success': True, 'message': 'Məktub uğurla silindi!'})
                return True
        except Exception as e:
            req.send_json({'success': False, 'message': str(e)}, 200)
            return True

    # 10. API: Kodu istifadə etmək (Redeem)
    if parsed.path == '/api/giftcode/redeem':
        target = (data.get('code') or '').strip()
        player_id = (data.get('playerId') or '').strip()
        if not target:
            req.send_json({'success': False, 'message': 'Kod daxil edilməyib!'}, 200)
            return True

        # A) Advanced / Inbox yoxlanışı
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM gift_codes_advanced WHERE code = ?', (target,))
                adv_code = cursor.fetchone()

                inbox_code_match = None
                if not adv_code:
                    cursor.execute('SELECT * FROM inbox_messages WHERE gift_code = ?', (target,))
                    inbox_code_match = cursor.fetchone()

                code_source = adv_code or inbox_code_match

                if code_source:
                    target_type = code_source['target_type'] or 'ALL'
                    target_player = str(code_source.get('target_player_id') or code_source.get('player_id') or 'ALL').strip()
                    
                    if code_source['expires_at']:
                        try:
                            clean_exp = code_source['expires_at'].replace('Z', '+00:00')
                            exp_dt = datetime.fromisoformat(clean_exp)
                            if datetime.now(timezone.utc) > exp_dt:
                                req.send_json({'success': False, 'message': 'Bu kodun istifadə müddəti bitib!'}, 200)
                                return True
                        except Exception:
                            pass

                    if target_type == 'SINGLE':
                        if target_player != player_id:
                            req.send_json({'success': False, 'message': f'Bu hədiyyə kodu başqa oyunçu üçün (#{target_player}) nəzərdə tutulub! Sizin ID: #{player_id}'}, 200)
                            return True

                        is_claimed_state = code_source.get('is_claimed', 0) if inbox_code_match else (1 if code_source.get('is_active', 1) == 0 else 0)
                        if is_claimed_state == 1:
                            req.send_json({'success': False, 'message': 'Bu fərdi hədiyyə kodu artıq istifadə edilib və qəbul olunub!'}, 200)
                            return True

                        cursor.execute('UPDATE gift_codes_advanced SET is_active = 0 WHERE code = ?', (target,))
                        if inbox_code_match:
                            cursor.execute('UPDATE inbox_messages SET is_claimed = 1, claimed_by = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = ?', (player_id, inbox_code_match['id']))
                            cursor.execute('INSERT OR IGNORE INTO claimed_messages (message_id, player_id) VALUES (?, ?)', (inbox_code_match['id'], player_id))
                    else:
                        if inbox_code_match:
                            cursor.execute('SELECT id FROM claimed_messages WHERE message_id = ? AND player_id = ?', (inbox_code_match['id'], player_id))
                            if cursor.fetchone():
                                req.send_json({'success': False, 'message': 'Bu ümumi hədiyyə kodunu artıq istifadə etmisiniz!'}, 200)
                                return True
                            cursor.execute('INSERT OR IGNORE INTO claimed_messages (message_id, player_id) VALUES (?, ?)', (inbox_code_match['id'], player_id))

                        used_dict = read_used_tokens()
                        key = f"{target}_{player_id}"
                        if key in used_dict:
                            req.send_json({'success': False, 'message': 'Bu ümumi hədiyyə kodunu artıq istifadə etmisiniz!'}, 200)
                            return True
                        used_dict[key] = {'usedAt': datetime.now(timezone.utc).isoformat()}
                        save_used_tokens(used_dict)

                    blue = code_source['blue_diamonds'] or 0
                    red = code_source['red_diamonds'] or 0
                    if player_id:
                        cursor.execute('''
                            UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                            WHERE player_id = ?
                        ''', (blue, red, player_id))
                    conn.commit()

                    req.send_json({
                        'success': True,
                        'message': f'🎉 Hədiyyə kodu uğurla aktivləşdirildi! (+{blue} [cyan], +{red} [ruby])',
                        'blueDiamonds': blue,
                        'redDiamonds': red
                    })
                    return True
        except Exception as e:
            print(f"Advanced kod yoxlanışında xəta: {e}")

        # B) Fallback HMAC Token
        if verify_signed_gift_code:
            is_signed, res_payload = verify_signed_gift_code(target)
            if is_signed and isinstance(res_payload, dict):
                nonce = res_payload.get('n')
                used_tokens = read_used_tokens()
                if nonce in used_tokens:
                    req.send_json({'success': False, 'message': 'Bu hədiyyə kodu artıq istifadə edilib!'}, 200)
                    return True

                used_tokens[nonce] = {
                    'blue': res_payload.get('b', 0),
                    'red': res_payload.get('r', 0),
                    'usedAt': datetime.now(timezone.utc).isoformat()
                }
                save_used_tokens(used_tokens)

                blue = res_payload.get('b', 0)
                red = res_payload.get('r', 0)
                if player_id:
                    try:
                        with get_db() as conn:
                            cursor = conn.cursor()
                            cursor.execute('''
                                UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                                WHERE player_id = ?
                            ''', (blue, red, player_id))
                            conn.commit()
                    except Exception:
                        pass

                req.send_json({
                    'success': True,
                    'message': 'Hədiyyə kodu uğurla aktivləşdirildi!',
                    'blueDiamonds': blue,
                    'redDiamonds': red
                })
                return True
            elif target.startswith('GIFT-') and len(target.split('-')) == 3:
                req.send_json({'success': False, 'message': 'Təhlükəsizlik xətası: Saxta və ya dəyişdirilmiş kod!'}, 200)
                return True

        # C) Standart JSON Kodları
        codes = read_codes()
        found = next((c for c in codes if c.get('code') == target), None)

        if not found:
            req.send_json({'success': False, 'message': 'Bu kod mövcud deyil!'}, 200)
            return True

        if found.get('used'):
            req.send_json({'success': False, 'message': 'Bu kod artıq istifadə edilib!'}, 200)
            return True

        found['used'] = True
        found['usedAt'] = datetime.now(timezone.utc).isoformat()
        save_codes(codes)

        blue = found.get('blueDiamonds', 0)
        red = found.get('redDiamonds', 0)
        if player_id:
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        UPDATE players SET diamonds = diamonds + ?, red_diamonds = red_diamonds + ?
                        WHERE player_id = ?
                    ''', (blue, red, player_id))
                    conn.commit()
            except Exception:
                pass

        req.send_json({
            'success': True,
            'message': 'Kod uğurla aktivləşdirildi!',
            'blueDiamonds': blue,
            'redDiamonds': red
        })
        return True

    # 10. API: İnbox Məktubunu Silmək (Delete)
    if parsed.path == '/api/inbox/delete':
        msg_id = data.get('messageId') or data.get('message_id')
        player_id = (data.get('playerId') or data.get('player_id') or '').strip()
        if msg_id and player_id:
            try:
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute('DELETE FROM inbox_messages WHERE id = ? AND player_id = ?', (msg_id, player_id))
                    conn.commit()
            except Exception:
                pass
        req.send_json({'success': True, 'message': 'Məktub silindi!'})
        return True

    return False
