import os
import sys
import json
import urllib.request
import urllib.error

REMOTE_SERVER_URL = os.environ.get('REMOTE_SERVER_URL', 'http://132.145.76.194:8082').rstrip('/')

def is_remote_mode():
    """
    Əgər REMOTE_SERVER_URL təyin olunubsa və bu maşın uzaq serverin özü deyilsə (IS_REMOTE_SERVER != '1'),
    onda sistem lokal baza yaratmır və bütün API sorğularını uzaq VM-ə yönləndirir.
    """
    is_remote_env = os.environ.get('IS_REMOTE_SERVER', '0').lower() in ('1', 'true', 'yes')
    return bool(REMOTE_SERVER_URL) and not is_remote_env

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
