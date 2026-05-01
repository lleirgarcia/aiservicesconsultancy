# Contract — Admin Auth API

Base path: `/api/blog/auth`

Toda la respuesta es JSON con `Content-Type: application/json`. Errores devuelven `{ error: string }` con código HTTP correspondiente.

---

## POST `/api/blog/auth`

Inicia sesión de admin verificando la contraseña configurada en `BLOG_ADMIN_PASSWORD`.

**Request**:
```json
{ "password": "string" }
```

**Response 200**:
```json
{ "ok": true, "expiresAt": "2026-05-30T10:00:00.000Z" }
```
- `Set-Cookie: blog_admin_session=<payload>.<hmac>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`

**Response 400** — body inválido:
```json
{ "error": "missing_password" }
```

**Response 401** — contraseña incorrecta:
```json
{ "error": "invalid_password" }
```

**Response 429** — rate limit superado (5 intentos/min/IP):
```json
{ "error": "too_many_attempts" }
```

**Notas**:
- La validación se hace con comparación de tiempo constante (`crypto.timingSafeEqual`).
- En entorno dev sin `BLOG_ADMIN_PASSWORD` configurada, devuelve 500 con `{ "error": "admin_not_configured" }`.

---

## DELETE `/api/blog/auth`

Cierra la sesión.

**Request**: vacío.

**Response 200**:
```json
{ "ok": true }
```
- `Set-Cookie: blog_admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`

---

## GET `/api/blog/auth`

Devuelve si la sesión actual es válida (usado por el `useBlogAdminSession` hook para mostrar/ocultar enlaces a admin).

**Response 200**:
```json
{ "authenticated": true, "expiresAt": "2026-05-30T10:00:00.000Z" }
```

**Response 200 (sin sesión)**:
```json
{ "authenticated": false }
```

> Nunca devuelve 401 — siempre 200 con `authenticated: false`. Esto evita logs ruidosos en consola.

---

## Cookie format

```
blog_admin_session = base64url(JSON.stringify({ exp: <unixSeconds> })) + "." + base64url(hmacSha256(payload, SECRET))
```

Validación (en `src/lib/blog/adminAuth.ts`):
1. Split por `.`.
2. Verificar HMAC con `crypto.timingSafeEqual`.
3. Parsear payload, comprobar `exp > now`.
4. Si todo OK ⇒ `{ valid: true, expiresAt }`. En cualquier otro caso ⇒ `{ valid: false }`.

Renovación deslizante: cada vez que el usuario navega bajo `/blog/admin/*`, si quedan < 7 días, se reescribe la cookie con un nuevo `exp` a +30 días (sin nueva petición de login).
