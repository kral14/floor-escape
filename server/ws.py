import json
import asyncio
import threading
import websockets

import os
WS_PORT = int(os.environ.get('WS_PORT', 4001))
ws_clients = set()
ws_player_map = {}
ws_loop = None

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
                        ws_player_map[websocket] = pid
                elif mtype == 'PING':
                    await websocket.send(json.dumps({'type': 'PONG'}))
            except Exception:
                pass
    except Exception:
        pass
    finally:
        ws_clients.discard(websocket)
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
