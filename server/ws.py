import json
import asyncio
import threading
import websockets
import os
import time

WS_PORT = int(os.environ.get('WS_PORT', 4001))
ws_clients = set()
ws_player_map = {}
ws_loop = None

def is_player_online(player_id):
    """Oyunçunun hazırda aktiv WebSocket bağlantısında olub-olmadığını yoxlayır"""
    if not player_id:
        return False
    pid_str = str(player_id).strip()
    for ws, pid in list(ws_player_map.items()):
        if str(pid).strip() == pid_str:
            if not ws.closed:
                return True
    return False

def kick_and_sync_player(player_id, reason="Başqa bir cihazdan və ya pəncərədən daxil olundu."):
    """Birinci yerdəki aktiv oyunçuya dərhal bazaya sinxronizasiya əmri verir və bağlantını bağlayır"""
    global ws_loop
    if not ws_loop or not player_id:
        return
    pid_str = str(player_id).strip()
    
    async def _action():
        active_ws_list = [ws for ws, pid in list(ws_player_map.items()) if str(pid).strip() == pid_str and not ws.closed]
        for ws in active_ws_list:
            try:
                await ws.send(json.dumps({
                    'type': 'FORCE_SYNC_AND_LOGOUT',
                    'message': f"⚠️ {reason} Cari irəliləyişiniz bazaya qeyd edilir və bu pəncərə bağlanır..."
                }, ensure_ascii=False))
            except Exception:
                pass
        # Müştərinin /api/player/sync sorğusunun bazaya çatması üçün 200ms gözləyirik
        await asyncio.sleep(0.2)
        for ws in active_ws_list:
            try:
                await ws.close()
            except Exception:
                pass
            ws_clients.discard(ws)
            ws_player_map.pop(ws, None)

    try:
        f = asyncio.run_coroutine_threadsafe(_action(), ws_loop)
        f.result(timeout=0.6)
    except Exception as e:
        print(f"Session handover kick xətası: {e}")


def kick_player_without_sync(player_id, reason="Admin tərəfindən hesab göstəriciləriniz və mağaza dəriləriniz sıfırlandı."):
    """Oyunçunun brauzerindəki köhnə datanın bazanı əzməməsi üçün sinxron etmədən sıfırlayıb çıxarır"""
    global ws_loop
    if not ws_loop or not player_id:
        return
    pid_str = str(player_id).strip()
    
    async def _action():
        active_ws_list = [ws for ws, pid in list(ws_player_map.items()) if str(pid).strip() == pid_str and not ws.closed]
        for ws in active_ws_list:
            try:
                await ws.send(json.dumps({
                    'type': 'ADMIN_FORCE_RESET',
                    'message': f"⚠️ {reason} Bütün mağaza alışları və irəliləyişlər sıfırlandı."
                }, ensure_ascii=False))
                await ws.close()
            except Exception:
                pass
            ws_clients.discard(ws)
            ws_player_map.pop(ws, None)

    try:
        f = asyncio.run_coroutine_threadsafe(_action(), ws_loop)
        f.result(timeout=0.6)
    except Exception as e:
        print(f"Kick without sync xətası: {e}")

async def ws_handler(websocket):
    ws_clients.add(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                mtype = data.get('type')
                if mtype == 'REGISTER':
                    pid = str(data.get('playerId', '')).strip()
                    if pid:
                        # Əgər eyni oyunçu üçün köhnə bağlantı varsa, onu təcili sinxron edib qapadırıq
                        old_connections = [w for w, p in list(ws_player_map.items()) if str(p) == pid and w != websocket and not w.closed]
                        for ow in old_connections:
                            try:
                                await ow.send(json.dumps({
                                    'type': 'FORCE_SYNC_AND_LOGOUT',
                                    'message': '⚠️ Başqa bir pəncərədən yeni giriş edildi. Cari oyununuz bazaya qeyd olunur...'
                                }, ensure_ascii=False))
                                await ow.close()
                            except Exception:
                                pass
                            ws_clients.discard(ow)
                            ws_player_map.pop(ow, None)

                        ws_player_map[websocket] = pid
                elif mtype == 'PING':
                    await websocket.send(json.dumps({'type': 'PONG'}))
            except Exception:
                pass
    except Exception:
        pass
    finally:
        ws_clients.discard(websocket)
        if websocket in ws_player_map:
            ws_player_map.pop(websocket, None)

def broadcast_inbox_message(target_type, player_id, msg_data):
    global ws_loop
    if not ws_loop:
        return
    try:
        asyncio.run_coroutine_threadsafe(_async_broadcast_inbox(target_type, player_id, msg_data), ws_loop)
    except Exception as e:
        print(f"WebSocket broadcast xətası: {e}")

async def _async_broadcast_inbox(target_type, player_id, msg_data):
    if not ws_clients:
        return
    payload = json.dumps({
        'type': 'NEW_INBOX_MESSAGE',
        'targetType': target_type,
        'playerId': player_id,
        'message': msg_data
    }, ensure_ascii=False)
    
    dead = set()
    for ws in list(ws_clients):
        try:
            ws_pid = ws_player_map.get(ws)
            if target_type == 'ALL' or (ws_pid and str(ws_pid) == str(player_id)):
                await ws.send(payload)
        except Exception:
            dead.add(ws)
    for ws in dead:
        ws_clients.discard(ws)
        ws_player_map.pop(ws, None)

def start_websocket_server():
    global ws_loop
    ws_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(ws_loop)
    
    async def main():
        async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
            print(f"  ⚡ WebSocket Real-Time Serveri Aktivdir: ws://localhost:{WS_PORT}")
            await asyncio.Future()
            
    try:
        ws_loop.run_until_complete(main())
    except Exception as e:
        print(f"WebSocket server xətası: {e}")

def init_ws():
    ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
    ws_thread.start()
