import http.server
import json
import os
import sys
from urllib.parse import urlparse

# Windows konsol kodlaşdırma xətasının qarşısını almaq
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# .env faylını server işə düşərkən dərhal yükləmək
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

from server.proxy import is_remote_mode, proxy_request, REMOTE_SERVER_URL

PORT = int(os.environ.get('PORT', 4000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

REMOTE_MODE = is_remote_mode()

if not REMOTE_MODE:
    from server.db import init_db
    from server.ws import init_ws, WS_PORT
    from server.handlers import handle_get, handle_post
    # Yalnız uzaq serverin özündə olduqda yerli baza və WS işə salınır
    init_db()
    init_ws()
else:
    # Lokal rejimdə yerli baza YARADILMIR, hər şey uzaq VM-ə yönləndirilir
    WS_PORT = None

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Accept')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)

        # Favicon
        if parsed.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        # Əgər uzaq VM rejimindəyiksə, bütün /api/* sorğuları birbaşa uzaq serverə yönləndirilir
        if parsed.path.startswith('/api/'):
            if REMOTE_MODE:
                proxy_request(self, 'GET', self.path)
                return
            else:
                if parsed.path == '/api/realtime-config':
                    self.send_json({'port': WS_PORT})
                    return
                if handle_get(self, parsed):
                    return

        # Statik fayllar (HTML, JS, CSS, Media)
        try:
            return super().do_GET()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            content_length = int(self.headers.get('Content-Length', 0))
            post_bytes = self.rfile.read(content_length) if content_length > 0 else b''

            # Əgər uzaq VM rejimindəyiksə, bütün /api/* sorğuları birbaşa uzaq serverə yönləndirilir
            if parsed.path.startswith('/api/'):
                if REMOTE_MODE:
                    proxy_request(self, 'POST', self.path, post_bytes)
                    return
                else:
                    try:
                        data = json.loads(post_bytes.decode('utf-8')) if post_bytes else {}
                    except Exception:
                        data = {}
                    if handle_post(self, parsed, data):
                        return

            self.send_response(404)
            self.end_headers()
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json({'success': False, 'error': str(e)}, 500)

    def log_message(self, format, *args):
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

def run_server():
    httpd = http.server.ThreadingHTTPServer(("", PORT), GameHTTPRequestHandler)
    print("======================================================")
    print("  ⚡ Floor Escape Server Aktivdir!")
    print(f"  Lokal Port: http://localhost:{PORT}")
    print(f"  Statik Qovluq: {PUBLIC_DIR}")
    if REMOTE_MODE:
        print(f"  🌐 BAZA VƏ APİ REJİMİ: Uzaq VM Serverinə Bağlıdır!")
        print(f"  🔗 Mərkəzi Server: {REMOTE_SERVER_URL}")
        print(f"  🛡️ Lokal Verilənlər Bazası: DEAKTİV (İstifadə edilmir)")
    else:
        print(f"  🗄️ BAZA VƏ APİ REJİMİ: Yerli Server Rejimi (Host)")
    print("======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dayandirildi.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()

