"""Integration checks against the running local-only lab."""
import http.client
import json
from urllib.parse import urlencode


def request(path, data=None, headers=None):
    connection = http.client.HTTPConnection('127.0.0.1', 8090, timeout=5)
    head = headers or {}
    body = None if data is None else urlencode(data)
    if body is not None:
        head = {'Content-Type': 'application/x-www-form-urlencoded', **head}
    connection.request('GET' if body is None else 'POST', path, body, head)
    response = connection.getresponse()
    result = response.status, dict(response.getheaders()), response.read().decode()
    connection.close()
    return result

assert request('/')[0] == 200
assert request('/health', headers={'Host': 'evil.example'})[0] == 403
assert '<b>demo</b>' in request('/search?' + urlencode({'q': '<b>demo</b>'}))[2]
normal = json.loads(request('/products?q=')[2])['products']
injected = json.loads(request('/products?' + urlencode({'q': "' OR 1=1 -- "}))[2])['products']
assert len(normal) == 2 and len(injected) == 3
assert request('/products?' + urlencode({'q': "'"}))[0] == 500
assert json.loads(request('/api/profile?id=2')[2])['name'] == 'Bruno Demo'
assert request('/api/email', {'email': 'check@example.test'})[0] == 401
status, headers, _ = request('/login', {'username': 'demo', 'password': 'burp123'})
assert status == 200
cookie = headers['Set-Cookie'].split(';')[0]
try:
    assert request('/api/email', {'email': 'check@example.test'}, {'Cookie': cookie, 'Origin': 'https://example.test'})[0] == 200
    assert json.loads(request('/api/profile?id=1')[2])['email'] == 'check@example.test'
    assert request('/login', {'username': 'absent', 'password': 'bad'})[2] != request('/login', {'username': 'demo', 'password': 'bad'})[2]
    assert json.loads(request('/api/checkout', {'price': '0.01', 'quantity': '1'})[2])['total'] == .01
    assert request('/api/checkout', {'price': 'nan'})[0] == 400
    assert request('/comments', {'message': '<b>check-marker</b>'})[0] == 303
    assert '<b>check-marker</b>' in request('/comments')[2]
    assert request('/redirect?next=https://example.com')[1]['Location'] == 'https://example.com'
    assert 'DEMO_SECRET' in request('/download?' + urlencode({'file': '../private/demo.txt'}))[2]
    assert request('/download?' + urlencode({'file': '/etc/passwd'}))[0] == 404
    a = int(json.loads(request('/token')[2])['token'])
    b = int(json.loads(request('/token')[2])['token'])
    assert b == a + 1
finally:
    assert request('/reset', {})[0] == 200
assert 'check-marker' not in request('/comments')[2]
assert json.loads(request('/api/profile?id=1')[2])['email'] == 'ana@example.test'
print('OK: 20 comprobaciones de rutas, fallos didácticos, aislamiento y reinicio.')
