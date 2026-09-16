import os
import sys
import json
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BASE_DIR, '.env')
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

REMOTE_SERVER_URL = os.environ.get('REMOTE_SERVER_URL', '').rstrip('/')

def is_remote_mode():
    """
    Əgər DATABASE_URL və ya IS_REMOTE_SERVER=1 təyin olunubsa, server birbaşa öz bazası ilə işləyir.
    Yalnız və yalnız xüsusi olaraq REMOTE_SERVER_URL verildikdə və yerli baza olmadıqda proxy edilir.
    """
    if os.environ.get('DATABASE_URL'):
        return False
    is_remote_env = os.environ.get('IS_REMOTE_SERVER', '0').lower() in ('1', 'true', 'yes')
    if is_remote_env:
        return False
    return bool(REMOTE_SERVER_URL)

def proxy_request(handler, method, path, body_bytes=None):
    """
    Klientdən gələn sorğunu uzaq serverə (REMOTE_SERVER_URL) yönləndirir və cavabı klientə çatdırır.
    """
    target_url = f"{REMOTE_SERVER_URL}{path}"
    
    headers = {
        'User-Agent': handler.headers.get('User-Agent', 'FloorEscapeLocalProxy/1.0'),
        'Accept': handler.headers.get('Accept', '*/*')
    }
    
    content_type = handler.headers.get('Content-Type')
    if content_type:
        headers['Content-Type'] = content_type

    req = urllib.request.Request(target_url, data=body_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.status
            resp_body = resp.read()
            resp_content_type = resp.headers.get('Content-Type', 'application/json; charset=utf-8')
            
            handler.send_response(status_code)
            handler.send_header('Content-Type', resp_content_type)
            handler.end_headers()
            handler.wfile.write(resp_body)
            return True
            
    except urllib.error.HTTPError as e:
        err_body = e.read()
        err_content_type = e.headers.get('Content-Type', 'application/json; charset=utf-8')
        handler.send_response(e.code)
        handler.send_header('Content-Type', err_content_type)
        handler.end_headers()
        handler.wfile.write(err_body)
        return True
        
    except Exception as e:
        err_payload = json.dumps({
            'success': False,
            'error': f'Uzaq serverə qoşulmaq mümkün olmadı ({REMOTE_SERVER_URL}): {str(e)}'
        }, ensure_ascii=False).encode('utf-8')
        
        handler.send_response(502) # Bad Gateway
        handler.send_header('Content-Type', 'application/json; charset=utf-8')
        handler.end_headers()
        handler.wfile.write(err_payload)
        return True
