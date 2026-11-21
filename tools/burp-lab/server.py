#!/usr/bin/env python3
"""Intentionally vulnerable, loopback-only training app. No production data."""
import html
import json
import sqlite3
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).parent
LOCK = threading.Lock()
DB = sqlite3.connect(':memory:', check_same_thread=False)
DB.executescript("""
CREATE TABLE products(id INTEGER, name TEXT, price INTEGER, hidden INTEGER);
INSERT INTO products VALUES (1,'Teclado mecánico',89,0),(2,'Monitor de estudio',249,0),(3,'Producto secreto',1,1);
""")
COMMENTS = []
USERS = {'1': {'id': 1, 'name': 'Ana Demo', 'email': 'ana@example.test', 'balance': 120},
         '2': {'id': 2, 'name': 'Bruno Demo', 'email': 'bruno@example.test', 'balance': 980}}
counter = 1000


class Handler(BaseHTTPRequestHandler):
    def reply(self, value, status=200, kind='text/html; charset=utf-8', headers=None):
        data = value.encode() if isinstance(value, str) else value
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        for key, val in (headers or {}).items():
            self.send_header(key, val)
        self.end_headers()
        self.wfile.write(data)

    def json(self, value, status=200, headers=None):
        self.reply(json.dumps(value, ensure_ascii=False), status, 'application/json; charset=utf-8', headers)

    def valid_host(self):
        # Reject non-local Host headers, including DNS rebinding to loopback.
        return self.headers.get('Host') in ('127.0.0.1:8090', 'localhost:8090')

    def do_GET(self):
        global counter
        if not self.valid_host():
            return self.json({'error': 'Solo localhost:8090 o 127.0.0.1:8090'}, 403)
        url = urlsplit(self.path)
        q = parse_qs(url.query, keep_blank_values=True)
        value = lambda key, default='': q.get(key, [default])[0]
        if url.path == '/':
            return self.reply((ROOT / 'index.html').read_bytes())
        if url.path == '/health':
            return self.json({'status': 'ok', 'lab': 'Burp Playground', 'localOnly': True})
        if url.path == '/search':
            # Deliberately reflected HTML: XSS exercise.
            return self.reply('<h1>Buscador de laboratorio</h1><p>Resultado: ' + value('q') + '</p><a href="/">Volver</a>')
        if url.path == '/products':
            query = "SELECT id,name,price FROM products WHERE hidden=0 AND name LIKE '%" + value('q') + "%'"
            try:
                with LOCK:
                    rows = DB.execute(query).fetchall()
                return self.json({'products': rows})
            except sqlite3.Error as error:
                return self.json({'error': str(error), 'query': query}, 500)
        if url.path == '/api/profile':
            # Intentionally missing authorization: fictional records only.
            user = USERS.get(value('id', '1'))
            return self.json(user or {'error': 'Usuario inexistente'}, 200 if user else 404)
        if url.path == '/comments':
            with LOCK:
                body = ''.join('<article>' + c + '</article><hr>' for c in COMMENTS)
            return self.reply('<h1>Tablón de pruebas</h1>' + body + '<a href="/">Volver</a>')
        if url.path == '/redirect':
            target = value('next', '/')
            if '\r' in target or '\n' in target:
                return self.json({'error': 'Cabecera inválida'}, 400)
            return self.reply('', 302, headers={'Location': target})
        if url.path == '/token':
            with LOCK:
                counter += 1
                token = str(counter)
            return self.json({'token': token}, headers={'Set-Cookie': f'lab_session={token}; Path=/'})
        if url.path == '/download':
            # Virtual filesystem only; never reads host paths.
            virtual_files = {'guide.txt': 'Bienvenido al laboratorio.', '../private/demo.txt': 'DEMO_SECRET=fictional-training-value'}
            content = virtual_files.get(value('file', 'guide.txt'))
            return self.reply(content or 'Archivo virtual no encontrado', 200 if content else 404, 'text/plain; charset=utf-8')
        if url.path == '/robots.txt':
            return self.reply('User-agent: *\nDisallow: /admin-demo\n', kind='text/plain')
        if url.path == '/admin-demo':
            return self.json({'environment': 'dummy', 'debug': True, 'api_key': 'DEMO-ONLY-NOT-A-REAL-KEY'})
        return self.json({'error': 'Ruta no encontrada'}, 404)

    def do_POST(self):
        if not self.valid_host():
            return self.json({'error': 'Host no permitido'}, 403)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0 or length > 65536:
                return self.json({'error': 'Máximo 64 KB'}, 413)
            raw = self.rfile.read(length).decode()
            data = json.loads(raw) if 'application/json' in self.headers.get('Content-Type', '') else {k: v[0] for k, v in parse_qs(raw, keep_blank_values=True).items()}
            if not isinstance(data, dict):
                raise ValueError('Expected object')
        except (ValueError, UnicodeError):
            return self.json({'error': 'Cuerpo inválido'}, 400)
        path = urlsplit(self.path).path
        if path == '/login':
            if data.get('username') != 'demo':
                return self.json({'error': 'Usuario desconocido'}, 401)
            if data.get('password') != 'burp123':
                return self.json({'error': 'Contraseña incorrecta'}, 401)
            return self.json({'ok': True, 'userId': 1}, headers={'Set-Cookie': 'lab_user=1; Path=/; SameSite=Lax'})
        if path == '/comments':
            with LOCK:
                COMMENTS.append(str(data.get('message', ''))[:4000])
                del COMMENTS[:-50]
            return self.reply('', 303, headers={'Location': '/comments'})
        if path == '/api/checkout':
            try:
                price = float(data.get('price', 89))
                quantity = int(data.get('quantity', 1))
                if not (-1000000 < price < 1000000 and -1000 < quantity < 1000):
                    raise ValueError()
            except (ValueError, TypeError, OverflowError):
                return self.json({'error': 'Números inválidos'}, 400)
            return self.json({'accepted': True, 'total': price * quantity, 'currency': 'EUR', 'note': 'Pedido ficticio: precio confiado al cliente'})
        if path == '/api/email':
            if 'lab_user=1' not in self.headers.get('Cookie', '').split('; '):
                return self.json({'error': 'Primero inicia sesión como demo'}, 401)
            # Intentionally no CSRF token or Origin validation.
            with LOCK:
                USERS['1']['email'] = str(data.get('email', 'ana@example.test'))[:200]
            return self.json({'updated': True, 'email': USERS['1']['email']})
        if path == '/reset':
            with LOCK:
                COMMENTS.clear()
                USERS['1']['email'] = 'ana@example.test'
            return self.json({'reset': True})
        return self.json({'error': 'Ruta no encontrada'}, 404)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8090), Handler)
    print('Burp Playground · http://127.0.0.1:8090 · Ctrl+C para detener', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
