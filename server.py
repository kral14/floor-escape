import http.server
import json
import os
import sys
from urllib.parse import urlparse

from server.db import init_db
from server.ws import init_ws, WS_PORT
from server.handlers import handle_get, handle_post

# Windows konsol kodlaşdırma xətasının qarşısını almaq
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = int(os.environ.get('PORT', 4000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

# SQLite bazasını və WebSocket canlı serverini başladırıq
init_db()
init_ws()

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
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
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/realtime-config':
            self.send_json({'port': WS_PORT})
            return

        # Favicon
        if parsed.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        # API GET marşrutları (server/handlers.py)
        if handle_get(self, parsed):
            return

        # Statik fayllar (HTML, JS, CSS, Media)
        try:
            return super().do_GET()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            data = json.loads(post_data)
        except Exception:
            data = {}

        # API POST marşrutları (server/handlers.py)
        if handle_post(self, parsed, data):
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

def run_server():
    httpd = http.server.ThreadingHTTPServer(("", PORT), GameHTTPRequestHandler)
    print("======================================================")
    print("  ⚡ Floor Escape Modulyar Server Aktivdir!")
    print(f"  Unvan: http://localhost:{PORT}")
    print(f"  Qovluq: {PUBLIC_DIR}")
    print("======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dayandirildi.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()
