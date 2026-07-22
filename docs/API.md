# API — Inventario de endpoints HTTP

Documentación de todos los endpoints Next.js (App Router) del proyecto `calculadora-ahorro`.
Un cliente (humano o LLM) debe poder integrarse con cualquier endpoint leyendo solo este fichero.

Base URL en desarrollo: `http://localhost:3003` (puerto configurado del dev server).

## Índice

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/blog/articles` | Lista artículos del blog (vista admin), con filtros por estado y texto |
| POST | `/api/blog/articles` | Crea un artículo del blog (borrador o publicado) |
| GET | `/api/blog/articles/[id]` | Obtiene un artículo por id |
| PATCH | `/api/blog/articles/[id]` | Actualiza campos de un artículo (incluye publicar/despublicar) |
| DELETE | `/api/blog/articles/[id]` | Elimina un artículo en borrador y sus imágenes |
| POST | `/api/blog/auth` | Login del admin del blog con contraseña; setea cookie de sesión |
| GET | `/api/blog/auth` | Comprueba si hay sesión admin activa |
| DELETE | `/api/blog/auth` | Logout del admin (borra la cookie de sesión) |
| POST | `/api/blog/upload` | Sube una imagen a Supabase Storage asociada a un artículo |
| POST | `/api/chat` | Chat con el asistente "Kromi" (Claude) y guardado de la conversación como lead |
| POST | `/api/chat/summary` | Genera un resumen de la conversación para enviarlo por WhatsApp |
| GET | `/api/demos/asesoria-emails/bandeja` | Lee por IMAP los emails de demo de la cuenta Gmail configurada |
| POST | `/api/demos/asesoria-emails/clasificar` | Clasifica un email de asesoría con Claude (tipo, cliente, archivado) |
| POST | `/api/save-lead` | Extrae email del historial de chat y guarda un lead en Supabase |

---

## Autenticación admin del blog (común a `/api/blog/articles*` y `/api/blog/upload`)

Los endpoints de gestión del blog están **restringidos**. La auth se basa en una cookie de sesión:

- Cookie: `blog_admin_session` — token `payload.firma` (HMAC-SHA256 con `BLOG_ADMIN_SESSION_SECRET`), `HttpOnly; SameSite=Lax; Path=/` (+`Secure` en producción). TTL: 30 días.
- Se obtiene con `POST /api/blog/auth` (ver abajo).
- Sin cookie válida (ausente, mal firmada o expirada), cualquier endpoint protegido responde `401 {"error":"unauthorized"}`.
- No hay configuración CORS explícita en ningún endpoint: aplican los defaults de Next.js (mismo origen; no se envían cabeceras `Access-Control-Allow-*`). Todos los endpoints se consumen desde la propia web.

---

## GET /api/blog/articles

- **Descripción:** Lista todos los artículos (borradores y publicados) para el panel de administración del blog. Ordenados por `updated_at` descendente.
- **Auth:** restringido (cookie admin, ver arriba). CORS: mismo origen.
- **Query params:**
  - `status` (opcional): `draft` | `published`. Cualquier otro valor se ignora (no filtra).
  - `q` (opcional): búsqueda de texto (ILIKE) sobre `title` y `summary`.
- **Headers:** `Cookie: blog_admin_session=<token>`.
- **Body:** ninguno.
- **Respuesta de éxito:** `200`

```json
{
  "items": [
    {
      "id": "8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d",
      "slug": "automatizar-facturas",
      "title": "Cómo automatizar facturas",
      "summary": "Guía para pymes",
      "contentMd": "## Intro\n...",
      "coverImageUrl": "https://xyz.supabase.co/storage/v1/object/public/blog-images/8f0c.../cover.webp",
      "status": "published",
      "tags": ["automatizacion"],
      "readingTimeMinutes": 6,
      "authorDisplayName": "Kroomix",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-10T09:30:00.000Z",
      "publishedAt": "2026-07-02T08:00:00.000Z"
    }
  ]
}
```

- **Errores:**
  - `401 {"error":"unauthorized"}` — sin sesión admin.
  - `500 {"error":"internal_error","message":"<detalle>"}` — fallo de Supabase.
- **Efectos colaterales:** ninguno (lectura pura de la tabla `articles` de Supabase).
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET` (validar cookie), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin activa; tabla `articles` existente en Supabase.
- **Idempotencia:** lectura pura, idempotente, seguro reintentar. Sin transición de estado.
- **Ejemplo:**

```bash
curl -s "http://localhost:3003/api/blog/articles?status=draft&q=facturas" \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9..."
```

```json
{"items":[{"id":"8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d","slug":"automatizar-facturas","title":"Cómo automatizar facturas","summary":"Guía para pymes","contentMd":"## Intro\n...","coverImageUrl":null,"status":"draft","tags":["automatizacion"],"readingTimeMinutes":6,"authorDisplayName":"Kroomix","createdAt":"2026-07-01T10:00:00.000Z","updatedAt":"2026-07-10T09:30:00.000Z","publishedAt":null}]}
```

---

## POST /api/blog/articles

- **Descripción:** Crea un artículo nuevo. Por defecto se crea como `draft`. Si se crea directamente como `published` exige título, resumen, contenido y `coverImageUrl` no nulos, y revalida las páginas públicas del blog.
- **Auth:** restringido (cookie admin). CORS: mismo origen.
- **Headers:** `Content-Type: application/json`, `Cookie: blog_admin_session=<token>`.
- **Body:**

```json
{
  "title": "Cómo automatizar facturas",        // obligatorio, no vacío
  "summary": "Guía para pymes",                // obligatorio, no vacío
  "contentMd": "## Intro\n...",                // obligatorio (markdown)
  "coverImageUrl": null,                        // opcional; obligatorio si status=published
  "tags": ["automatizacion", "pymes"],         // opcional; se normalizan (minúsculas, slug)
  "status": "draft",                            // opcional: "draft" (default) | "published"
  "slug": "automatizar-facturas"               // opcional; si se omite se genera del título con sufijo único
}
```

- **Respuesta de éxito:** `201` con `{"article": {…}}` (mismo shape de artículo que en GET, incluye `slug` final y `readingTimeMinutes` calculado).
- **Errores:**
  - `400 {"error":"validation_failed","fields":{"body":"invalid_json"}}` — body no es JSON.
  - `400 {"error":"validation_failed","fields":{"title":"required", ...}}` — faltan campos (al publicar también `coverImageUrl`).
  - `400 {"error":"validation_failed","fields":{"slug":"invalid"}}` — slug no genera valor válido.
  - `409 {"error":"slug_taken","suggestedSlug":"automatizar-facturas-2"}` — slug explícito ya en uso; incluye sugerencia libre.
  - `401 {"error":"unauthorized"}`.
  - `500 {"error":"internal_error", "message": "..."}`.
- **Efectos colaterales:** INSERT en tabla `articles` de Supabase (y un UPDATE adicional para fijar `published_at` si nace publicado). Si `status=published`, llama a `revalidatePath` de `/blog`, `/blog/<slug>` y `/blog/tag/<tag>` por cada tag.
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin; si `status=published`, `coverImageUrl` debe apuntar a una imagen ya subida (ver `/api/blog/upload` — que a su vez requiere que el artículo exista, por lo que el flujo normal es: crear draft → subir imagen → publicar con PATCH).
- **Idempotencia:** NO idempotente. Cada llamada crea un artículo nuevo (con slug autogenerado crea duplicados con sufijo `-2`, `-3`…; con slug explícito el reintento devuelve `409 slug_taken`). Transición: (nada) → `draft` o (nada) → `published`.
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/blog/articles \
  -H "Content-Type: application/json" \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9..." \
  -d '{"title":"Cómo automatizar facturas","summary":"Guía para pymes","contentMd":"## Intro\nTexto...","tags":["automatizacion"]}'
```

```json
{"article":{"id":"8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d","slug":"como-automatizar-facturas","title":"Cómo automatizar facturas","summary":"Guía para pymes","contentMd":"## Intro\nTexto...","coverImageUrl":null,"status":"draft","tags":["automatizacion"],"readingTimeMinutes":1,"authorDisplayName":"Kroomix","createdAt":"2026-07-22T10:00:00.000Z","updatedAt":"2026-07-22T10:00:00.000Z","publishedAt":null}}
```

---

## GET /api/blog/articles/[id]

- **Descripción:** Devuelve un artículo por su id (UUID) para el editor admin.
- **Auth:** restringido (cookie admin). CORS: mismo origen.
- **Parámetros de URL:** `id` — UUID del artículo.
- **Body:** ninguno.
- **Respuesta de éxito:** `200 {"article": {…}}` (mismo shape que en el listado).
- **Errores:**
  - `401 {"error":"unauthorized"}`.
  - `404 {"error":"not_found"}` — el id no existe.
  - `500 {"error":"internal_error","message":"..."}`.
- **Efectos colaterales:** ninguno.
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin; el artículo debe existir.
- **Idempotencia:** lectura pura, idempotente.
- **Ejemplo:**

```bash
curl -s http://localhost:3003/api/blog/articles/8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9..."
```

```json
{"article":{"id":"8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d","slug":"como-automatizar-facturas","title":"Cómo automatizar facturas","summary":"Guía para pymes","contentMd":"## Intro\nTexto...","coverImageUrl":null,"status":"draft","tags":["automatizacion"],"readingTimeMinutes":1,"authorDisplayName":"Kroomix","createdAt":"2026-07-22T10:00:00.000Z","updatedAt":"2026-07-22T10:00:00.000Z","publishedAt":null}}
```

---

## PATCH /api/blog/articles/[id]

- **Descripción:** Actualiza campos parciales de un artículo. Sirve también para publicar (`status: "published"`) y despublicar (`status: "draft"`). Revalida las rutas públicas del blog afectadas.
- **Auth:** restringido (cookie admin). CORS: mismo origen.
- **Parámetros de URL:** `id` — UUID del artículo.
- **Headers:** `Content-Type: application/json`, cookie admin.
- **Body:** todos los campos opcionales; solo se aplican los presentes con el tipo correcto (los de tipo incorrecto se ignoran silenciosamente):

```json
{
  "title": "Nuevo título",
  "summary": "Nuevo resumen",
  "contentMd": "## Contenido actualizado",
  "coverImageUrl": "https://.../cover.webp",   // string o null (null borra la portada)
  "tags": ["automatizacion"],
  "status": "published",                        // "draft" | "published"
  "slug": "nuevo-slug"                          // solo modificable si el artículo NUNCA se ha publicado
}
```

- **Respuesta de éxito:** `200 {"article": {…}}` con el artículo actualizado. Un body `{}` válido devuelve el artículo sin cambios.
- **Errores:**
  - `400 {"error":"validation_failed","fields":{"body":"invalid_json"}}`.
  - `400 {"error":"validation_failed","fields":{"title":"required","coverImageUrl":"required", ...}}` — al publicar sin requisitos completos.
  - `400 {"error":"validation_failed","fields":{"slug":"invalid"}}`.
  - `409 {"error":"slug_locked"}` — se intenta cambiar el slug de un artículo que ya fue publicado alguna vez (`publishedAt != null`).
  - `409 {"error":"slug_taken","suggestedSlug":"nuevo-slug-2"}`.
  - `404 {"error":"not_found"}`.
  - `401 {"error":"unauthorized"}`.
  - `500 {"error":"internal_error","message":"..."}`.
- **Efectos colaterales:** UPDATE en tabla `articles`; recalcula `reading_time_minutes` si cambia `contentMd`; `revalidatePath` de `/blog`, `/blog/<slug-anterior>`, `/blog/<slug-nuevo>` (si cambió) y `/blog/tag/<tag>` para la unión de tags antes/después.
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin; artículo existente. Para publicar: `title`, `summary`, `contentMd` no vacíos y `coverImageUrl` no nulo (combinando body + valores existentes). Para cambiar slug: `publishedAt` debe ser `null`.
- **Idempotencia:** idempotente para el mismo body (aplicar dos veces deja el mismo estado). Transiciones de estado posibles: `draft → published` (fija `published_at` la primera vez, gestionado en BD) y `published → draft`.
- **Ejemplo (publicar):**

```bash
curl -s -X PATCH http://localhost:3003/api/blog/articles/8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d \
  -H "Content-Type: application/json" \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9..." \
  -d '{"status":"published","coverImageUrl":"https://xyz.supabase.co/storage/v1/object/public/blog-images/8f0c7a4e/1753178400000-cover.webp"}'
```

```json
{"article":{"id":"8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d","slug":"como-automatizar-facturas","title":"Cómo automatizar facturas","summary":"Guía para pymes","contentMd":"## Intro\nTexto...","coverImageUrl":"https://xyz.supabase.co/storage/v1/object/public/blog-images/8f0c7a4e/1753178400000-cover.webp","status":"published","tags":["automatizacion"],"readingTimeMinutes":1,"authorDisplayName":"Kroomix","createdAt":"2026-07-22T10:00:00.000Z","updatedAt":"2026-07-22T10:05:00.000Z","publishedAt":"2026-07-22T10:05:00.000Z"}}
```

---

## DELETE /api/blog/articles/[id]

- **Descripción:** Elimina un artículo **en borrador y nunca publicado** y, en best-effort, todas sus imágenes del bucket `blog-images`. Los artículos publicados (o que lo fueron) no se pueden borrar: hay que despublicarlos primero (y aun así, si `publishedAt` no es null, sigue bloqueado).
- **Auth:** restringido (cookie admin). CORS: mismo origen.
- **Parámetros de URL:** `id` — UUID del artículo.
- **Body:** ninguno.
- **Respuesta de éxito:** `200 {"ok":true}`.
- **Errores:**
  - `401 {"error":"unauthorized"}`.
  - `404 {"error":"not_found"}`.
  - `409 {"error":"cannot_delete_published","hint":"unpublish_first"}` — `status=published` o `publishedAt != null`.
  - `500 {"error":"internal_error","message":"..."}`.
- **Efectos colaterales:** DELETE en tabla `articles`; borrado de hasta 1000 objetos bajo el prefijo `<articleId>/` en el bucket Supabase Storage `blog-images` (si falla, se ignora); `revalidatePath("/blog")`.
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin; artículo existente, en estado `draft` y con `publishedAt = null`.
- **Idempotencia:** el efecto es idempotente, pero el reintento tras un borrado exitoso devuelve `404`. Transición: `draft → eliminado`.
- **Ejemplo:**

```bash
curl -s -X DELETE http://localhost:3003/api/blog/articles/8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9..."
```

```json
{"ok":true}
```

---

## POST /api/blog/auth

- **Descripción:** Login del panel admin del blog. Compara la contraseña (comparación timing-safe) con `BLOG_ADMIN_PASSWORD` y, si coincide, setea la cookie de sesión `blog_admin_session` (30 días).
- **Auth:** público (es el endpoint de login). Rate limit en memoria: máx. **5 intentos por IP por minuto** (IP tomada de `X-Forwarded-For` o `X-Real-IP`; `"unknown"` si faltan). CORS: mismo origen.
- **Headers:** `Content-Type: application/json`. Opcionalmente `X-Forwarded-For` afecta al rate limit.
- **Body:**

```json
{ "password": "mi-contraseña-admin" }
```

- **Respuesta de éxito:** `200` con header `Set-Cookie: blog_admin_session=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000[; Secure]` y body:

```json
{ "ok": true, "expiresAt": "2026-08-21T10:00:00.000Z" }
```

- **Errores:**
  - `400 {"error":"missing_password"}` — body no-JSON o sin `password` string.
  - `401 {"error":"invalid_password"}`.
  - `429 {"error":"too_many_attempts"}` — rate limit por IP superado.
  - `500 {"error":"admin_not_configured"}` — faltan `BLOG_ADMIN_PASSWORD` o `BLOG_ADMIN_SESSION_SECRET`.
- **Efectos colaterales:** registra timestamps de intentos por IP en un `Map` en memoria del proceso (se pierde al reiniciar; en serverless no es global). Emite cookie firmada.
- **Variables de entorno:** `BLOG_ADMIN_PASSWORD` (contraseña esperada), `BLOG_ADMIN_SESSION_SECRET` (firma HMAC), `NODE_ENV` (`production` añade `Secure` a la cookie).
- **Precondiciones:** ambas variables de entorno configuradas.
- **Idempotencia:** reintentable (cada éxito genera un token nuevo equivalente), pero cada intento —fallido o no— consume cuota del rate limit. Transición: sin sesión → sesión admin activa.
- **Ejemplo:**

```bash
curl -si -X POST http://localhost:3003/api/blog/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"mi-contraseña-admin"}'
```

```
HTTP/1.1 200 OK
Set-Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9uQ...; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000

{"ok":true,"expiresAt":"2026-08-21T10:00:00.000Z"}
```

---

## GET /api/blog/auth

- **Descripción:** Comprueba el estado de la sesión admin. Usado por el panel para decidir si mostrar el login.
- **Auth:** público (responde `authenticated:false` en vez de 401). CORS: mismo origen.
- **Headers:** `Cookie: blog_admin_session=<token>` (opcional).
- **Body:** ninguno.
- **Respuesta de éxito:** siempre `200`:
  - Sin sesión válida (o `BLOG_ADMIN_PASSWORD` sin configurar): `{"authenticated":false}`
  - Con sesión válida: `{"authenticated":true,"expiresAt":"2026-08-21T10:00:00.000Z"}`
- **Errores:** ninguno específico (nunca devuelve 4xx/5xx en operación normal).
- **Efectos colaterales:** ninguno.
- **Variables de entorno:** `BLOG_ADMIN_PASSWORD` (si falta, siempre `authenticated:false`), `BLOG_ADMIN_SESSION_SECRET`.
- **Precondiciones:** ninguna.
- **Idempotencia:** lectura pura, idempotente.
- **Ejemplo:**

```bash
curl -s http://localhost:3003/api/blog/auth \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9uQ..."
```

```json
{"authenticated":true,"expiresAt":"2026-08-21T10:00:00.000Z"}
```

---

## DELETE /api/blog/auth

- **Descripción:** Logout del admin: responde con una cookie vacía y `Max-Age=0` que borra `blog_admin_session`.
- **Auth:** público (no valida la sesión antes de borrarla). CORS: mismo origen.
- **Body:** ninguno.
- **Respuesta de éxito:** `200 {"ok":true}` con header `Set-Cookie: blog_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0[; Secure]`.
- **Errores:** ninguno.
- **Efectos colaterales:** ninguno en servidor (el token no se invalida server-side; solo se borra la cookie del navegador).
- **Variables de entorno:** `NODE_ENV` (flag `Secure`).
- **Precondiciones:** ninguna.
- **Idempotencia:** idempotente, seguro reintentar. Transición: sesión activa → sin sesión (en ese navegador).
- **Ejemplo:**

```bash
curl -si -X DELETE http://localhost:3003/api/blog/auth
```

```
HTTP/1.1 200 OK
Set-Cookie: blog_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0

{"ok":true}
```

---

## POST /api/blog/upload

- **Descripción:** Sube una imagen (portada o imagen de contenido) al bucket público `blog-images` de Supabase Storage, bajo la carpeta del artículo. Devuelve la URL pública para usar en `coverImageUrl` o en el markdown.
- **Auth:** restringido (cookie admin). CORS: mismo origen. Runtime forzado: `nodejs`.
- **Headers:** `Content-Type: multipart/form-data`, cookie admin.
- **Body (multipart/form-data):**
  - `file` — el fichero de imagen. MIME permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Tamaño máx.: **5 MB**.
  - `articleId` — UUID de un artículo existente.
- **Respuesta de éxito:** `200`

```json
{
  "url": "https://xyz.supabase.co/storage/v1/object/public/blog-images/8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d/1753178400000-portada.webp",
  "path": "8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d/1753178400000-portada.webp"
}
```

  El path del objeto es `<articleId>/<timestamp>-<nombre-slugificado>.<ext>` (extensión derivada del MIME, no del nombre original).
- **Errores:**
  - `401 {"error":"unauthorized"}`.
  - `400 {"error":"invalid_file","reason":"missing_form"}` — body no es form-data.
  - `400 {"error":"invalid_file","reason":"missing_file"}` — falta el campo `file`.
  - `400 {"error":"invalid_file","reason":"missing_articleId"}` — falta `articleId`.
  - `404 {"error":"article_not_found"}` — el `articleId` no existe.
  - `400 {"error":"invalid_file","reason":"unsupported_mime"}` — MIME no permitido.
  - `400 {"error":"invalid_file","reason":"size_too_large"}` — > 5 MB.
  - `500 {"error":"invalid_file","reason":"upload_failed"}` — fallo de Supabase Storage.
  - `500 {"error":"internal_error","message":"..."}`.
- **Efectos colaterales:** crea un objeto en el bucket `blog-images` (upsert deshabilitado: nunca sobreescribe). No modifica la tabla `articles` — el cliente debe hacer PATCH con la `url` devuelta.
- **Variables de entorno:** `BLOG_ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** sesión admin; el artículo `articleId` debe existir (flujo: crear draft primero, subir imagen después); bucket `blog-images` creado en Supabase.
- **Idempotencia:** NO idempotente: cada llamada crea un objeto nuevo (timestamp en el path). Reintentar es seguro pero deja objetos huérfanos.
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/blog/upload \
  -H "Cookie: blog_admin_session=eyJleHAiOjE3ODY3MDA4MDB9.k3v9uQ..." \
  -F "file=@portada.webp;type=image/webp" \
  -F "articleId=8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d"
```

```json
{"url":"https://xyz.supabase.co/storage/v1/object/public/blog-images/8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d/1753178400000-portada.webp","path":"8f0c7a4e-1234-4a5b-9c1d-2e3f4a5b6c7d/1753178400000-portada.webp"}
```

---

## POST /api/chat

- **Descripción:** Endpoint del chat "Kromi" de la web. Dos modos según `isManualSave`:
  - **Modo conversación** (default): envía el historial a Claude (`claude-haiku-4-5-20251001`, máx. 1024 tokens, system prompt cargado de `src/i18n/chatSystem.<locale>.txt`), devuelve la respuesta del asistente y persiste toda la conversación como lead en Supabase.
  - **Modo guardado** (`isManualSave: true`): no llama a Claude; solo guarda/actualiza los mensajes del lead.
- **Auth:** público, sin autenticación ni rate limit. CORS: mismo origen (defaults de Next.js).
- **Headers:** `Content-Type: application/json`.
- **Body:**

```json
{
  "messages": [                       // obligatorio, no vacío; roles alternos user/assistant
    { "role": "user", "content": "Hola, tengo una empresa de metales" }
  ],
  "leadId": "b2c3d4e5-...",          // opcional; si se pasa, actualiza ese lead; si no, crea uno nuevo
  "isManualSave": false,              // opcional; true = solo guardar, sin llamar a Claude
  "locale": "es"                      // opcional: "es" (default) | "en" | "ca" — idioma del system prompt
}
```

- **Respuesta de éxito:** `200`
  - Modo conversación: `{"message":"<respuesta del asistente>","leadId":"b2c3d4e5-..."}` (`leadId` puede venir `null`/ausente si tanto el guardado como el lead previo fallan; el error de BD se traga y solo se loguea).
  - Modo guardado: `{"leadId":"b2c3d4e5-..."}` (si creó lead nuevo devuelve su id; si falló el guardado, devuelve el `leadId` recibido tal cual).
- **Errores:**
  - `400 {"error":"Se requiere un historial de mensajes"}` — `messages` ausente o vacío.
  - `500 {"error":"<mensaje del error>"}` — fallo de la API de Anthropic, body no-JSON, o error inesperado.
- **Efectos colaterales:** llamada a la API de Anthropic (coste por tokens); INSERT o UPDATE en la tabla `leads` de Supabase (leads anónimos con `nombre: "Anónimo"`, `email: "sin-email@example.com"`, `messages` = array de strings con el contenido de cada mensaje incluida la respuesta del asistente); lectura con caché en memoria del fichero de system prompt; logs `[CHAT API]` en consola del servidor.
- **Variables de entorno:** `ANTHROPIC_API_KEY` (SDK Anthropic), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** tabla `leads` en Supabase; ficheros `src/i18n/chatSystem.{es,en,ca}.txt` presentes; si se pasa `leadId`, debe ser un id existente en `leads` (si no, el update no encuentra fila y el error se traga silenciosamente).
- **Idempotencia:** NO idempotente sin `leadId` (cada llamada crea un lead nuevo). Con `leadId` el guardado es idempotente (sobrescribe `messages`), pero cada llamada en modo conversación genera una respuesta distinta de Claude y consume tokens. Transición: crea lead anónimo o actualiza los mensajes de uno existente.
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola, tengo un taller y pierdo horas pasando pedidos a mano"}],"locale":"es"}'
```

```json
{"message":"Hola. Entiendo, entrar pedidos a mano come muchas horas. ¿Por dónde os llegan los pedidos ahora mismo: WhatsApp, email, teléfono? Así te digo qué se puede automatizar.","leadId":"b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"}
```

---

## POST /api/chat/summary

- **Descripción:** Genera un resumen corto (4-5 líneas, primera persona, texto plano) de la conversación del chat, pensado para que el potencial cliente lo envíe por WhatsApp a Kroomix. Usa `claude-haiku-4-5-20251001` (máx. 300 tokens).
- **Auth:** público, sin autenticación ni rate limit. CORS: mismo origen.
- **Headers:** `Content-Type: application/json`.
- **Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Tengo una empresa de metales, unos 30 pedidos al día a mano" },
    { "role": "assistant", "content": "¿Por dónde entran esos pedidos?" }
  ],
  "locale": "es"    // opcional: "es" (default) | "en" | "ca" — idioma del resumen
}
```

- **Respuesta de éxito:** `200`

```json
{ "summary": "Tengo una empresa de metales y entramos unos 30 pedidos al día a mano. Me interesa ver cómo automatizar la entrada de pedidos." }
```

- **Errores:**
  - `400 {"error":"Se requiere un historial de mensajes"}` — `messages` ausente o vacío.
  - `500 {"error":"No se pudo generar el resumen"}` — fallo de la API de Anthropic o body no-JSON.
- **Efectos colaterales:** llamada a la API de Anthropic (coste por tokens). No toca BD ni ficheros.
- **Variables de entorno:** `ANTHROPIC_API_KEY`.
- **Precondiciones:** ninguna más allá de la API key configurada.
- **Idempotencia:** sin efectos sobre estado; seguro reintentar (la respuesta puede variar entre llamadas y cada una consume tokens).
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/chat/summary \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tengo una empresa de metales, unos 30 pedidos al día a mano por email"}],"locale":"es"}'
```

```json
{"summary":"Tengo una empresa de metales y entramos unos 30 pedidos al día a mano que nos llegan por email. Quiero ver cómo automatizar esa entrada de pedidos."}
```

---

## GET /api/demos/asesoria-emails/bandeja

- **Descripción:** Alimenta la demo "bandeja inteligente de asesoría". Se conecta por IMAP a la cuenta Gmail configurada, busca en INBOX los emails cuyo asunto contiene `[DEMO KROOMIX]`, los parsea y los devuelve normalizados (el prefijo `[DEMO KROOMIX]` se elimina del asunto), ordenados por fecha descendente.
- **Auth:** público, sin autenticación. CORS: mismo origen. **Ojo:** expone contenido real de la bandeja Gmail configurada a cualquiera que llame al endpoint.
- **Parámetros:** ninguno.
- **Body:** ninguno.
- **Respuesta de éxito:** `200` — array (posiblemente vacío `[]`) de emails:

```json
[
  {
    "id": "4821",
    "remitenteNombre": "Endesa Facturación",
    "remitenteEmail": "facturas@endesa.es",
    "asunto": "Factura abril Garatge Puig",
    "cuerpo": "Adjuntamos la factura del mes de abril...",
    "fechaRecibido": "2026-07-21T09:15:00.000Z",
    "adjuntos": [ { "nombre": "factura-abril.pdf", "tamano": "245 KB" } ]
  }
]
```

  `id` es el UID IMAP del mensaje; `tamano` es legible (`B` / `KB` / `MB`).
- **Errores:**
  - `500 {"error":"No se pudo conectar a Gmail"}` — credenciales inválidas, red, o cualquier fallo IMAP/parseo.
- **Efectos colaterales:** abre y cierra una conexión IMAP (`imap.gmail.com:993`) por cada llamada. Lectura pura del buzón (no marca, mueve ni borra mensajes).
- **Variables de entorno:** `GMAIL_USER` (cuenta Gmail), `GMAIL_APP_PASSWORD` (app password de Google).
- **Precondiciones:** cuenta Gmail con IMAP habilitado y app password válida; para obtener resultados, deben existir en INBOX emails con `[DEMO KROOMIX]` en el asunto (si no, devuelve `[]`).
- **Idempotencia:** lectura pura, idempotente, seguro reintentar. Sin transición de estado.
- **Ejemplo:**

```bash
curl -s http://localhost:3003/api/demos/asesoria-emails/bandeja
```

```json
[{"id":"4821","remitenteNombre":"Endesa Facturación","remitenteEmail":"facturas@endesa.es","asunto":"Factura abril Garatge Puig","cuerpo":"Adjuntamos la factura del mes de abril...","fechaRecibido":"2026-07-21T09:15:00.000Z","adjuntos":[{"nombre":"factura-abril.pdf","tamano":"245 KB"}]}]
```

---

## POST /api/demos/asesoria-emails/clasificar

- **Descripción:** Clasifica un email entrante de una asesoría contable usando Claude (`claude-sonnet-4-6`, máx. 1024 tokens, system prompt con caché ephemeral). Determina tipo de documento, cliente, nombre de archivo final según la convención `YYYY-MM-DD_TipoDocumento_Proveedor_Cliente.ext`, carpeta destino y una narración paso a paso para la animación de la demo. Además marca `esUrgente` si el asunto/cuerpo contiene palabras clave (urgente, vencimiento, embargo, requerimiento, sanción, último aviso…).
- **Auth:** público, sin autenticación. CORS: mismo origen.
- **Headers:** `Content-Type: application/json`.
- **Body** (shape `EmailEntrada`; todos los campos obligatorios, `adjuntos` puede ser `[]`):

```json
{
  "id": "4821",
  "remitenteNombre": "Endesa Facturación",
  "remitenteEmail": "facturas@endesa.es",
  "asunto": "Factura abril Garatge Puig",
  "cuerpo": "Adjuntamos la factura del mes de abril del suministro del taller.",
  "fechaRecibido": "2026-07-21T09:15:00.000Z",
  "adjuntos": [ { "nombre": "factura-abril.pdf", "tamano": "245 KB" } ]
}
```

- **Valores cerrados que devuelve:**
  - `tipo`: `Factura` | `Nómina` | `Modelo 303` | `Modelo 111` | `Contrato` | `Justificante bancario` | `Otros`.
  - `clienteSlug` / `clienteNombre` (clientes registrados de la demo): `garatge-puig` (Garatge Puig SL), `bistro-merce` (Bistró Mercè), `fusteria-vidal` (Fusteria Vidal), `oliveres-vall` (Oliveres del Vall SCP), `consultora-mas` (Consultora Mas, fallback), `constructora-roca` (Constructora Roca).
  - `destino`: `/<clienteSlug>/<carpeta>/` donde carpeta ∈ `01_Facturas`, `02_Nóminas`, `03_Modelos/303`, `03_Modelos/111`, `04_Contratos`, `05_Bancos`, `99_Otros`.
  - `pasos`: siempre 6 pasos con etiquetas fijas `Lectura`, `Adjuntos`, `Tipo de documento`, `Cliente`, `Renombrado`, `Archivado` y duraciones fijas `[350,280,450,300,250,200]` ms.
- **Respuesta de éxito:** `200`

```json
{
  "tipo": "Factura",
  "clienteSlug": "garatge-puig",
  "clienteNombre": "Garatge Puig SL",
  "fechaDocumento": "2026-04-30",
  "confianza": 0.95,
  "razon": "Factura de Endesa dirigida al taller Garatge Puig.",
  "nombreFinal": "2026-04-30_Factura_Endesa_GaratgePuig.pdf",
  "destino": "/garatge-puig/01_Facturas/",
  "esUrgente": false,
  "pasos": [
    { "etiqueta": "Lectura", "texto": "Veo un email de Endesa Facturación con asunto de factura de abril.", "duracionMs": 350 },
    { "etiqueta": "Adjuntos", "texto": "Hay un PDF adjunto que parece la factura.", "duracionMs": 280 },
    { "etiqueta": "Tipo de documento", "texto": "El asunto y el adjunto indican que es una factura de suministro.", "duracionMs": 450 },
    { "etiqueta": "Cliente", "texto": "El asunto menciona Garatge Puig, cliente registrado.", "duracionMs": 300 },
    { "etiqueta": "Renombrado", "texto": "Construyo el nombre con fecha, tipo, proveedor y cliente.", "duracionMs": 250 },
    { "etiqueta": "Archivado", "texto": "La guardo en la carpeta de facturas de Garatge Puig.", "duracionMs": 200 }
  ]
}
```

  `fechaDocumento` se omite si el modelo no puede inferirla. `confianza` ∈ [0.0, 1.0].
- **Errores:**
  - `500 {"error":"Error al clasificar"}` — fallo de la API de Anthropic o JSON del modelo no parseable. (Un body no-JSON también acaba en error 500 no controlado.)
- **Efectos colaterales:** llamada a la API de Anthropic (coste por tokens). No toca BD, ficheros ni el buzón: el "archivado" es simulado, solo devuelve la propuesta.
- **Variables de entorno:** `ANTHROPIC_API_KEY`.
- **Precondiciones:** API key configurada. El email suele venir de `GET /api/demos/asesoria-emails/bandeja`, pero acepta cualquier objeto con el shape indicado.
- **Idempotencia:** sin efectos sobre estado; seguro reintentar (la clasificación puede variar ligeramente entre llamadas y cada una consume tokens).
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/demos/asesoria-emails/clasificar \
  -H "Content-Type: application/json" \
  -d '{"id":"4821","remitenteNombre":"Endesa Facturación","remitenteEmail":"facturas@endesa.es","asunto":"Factura abril Garatge Puig","cuerpo":"Adjuntamos la factura del mes de abril del suministro del taller.","fechaRecibido":"2026-07-21T09:15:00.000Z","adjuntos":[{"nombre":"factura-abril.pdf","tamano":"245 KB"}]}'
```

Respuesta: como el JSON de éxito de arriba.

---

## POST /api/save-lead

- **Descripción:** Guardado oportunista de leads desde el chat. Recorre los mensajes, busca la primera dirección de email con regex sobre el texto combinado y, si la encuentra, crea un lead en Supabase con ese email y como nombre el primer mensaje corto (<100 caracteres) del usuario. Diseñado para no romper nunca la UX: **siempre responde éxito**, incluso con errores internos.
- **Auth:** público, sin autenticación. CORS: mismo origen.
- **Headers:** `Content-Type: application/json`.
- **Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Lleir" },
    { "role": "assistant", "content": "¿Me dejas un email de contacto?" },
    { "role": "user", "content": "claro, lleirgarcia@gmail.com" }
  ]
}
```

- **Respuesta de éxito:** `200 {"success":true}` — siempre, con o sin email detectado, incluso si Supabase falla o el body es inválido.
- **Errores:** ninguno observable vía HTTP (todos los fallos devuelven igualmente `200 {"success":true}` y se loguean en consola del servidor).
- **Efectos colaterales:** si detecta un email, INSERT en la tabla `leads` de Supabase (`empresa` y `tamano` = `"Por especificar"`, `messages` = contenidos de los mensajes). Si no detecta email, no hace nada.
- **Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Precondiciones:** tabla `leads` en Supabase (si no existe, el fallo es silencioso).
- **Idempotencia:** NO idempotente cuando hay email en los mensajes: cada llamada crea un lead nuevo (duplicados si se reintenta). Sin email, es un no-op. Transición: (nada) → lead creado.
- **Ejemplo:**

```bash
curl -s -X POST http://localhost:3003/api/save-lead \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Lleir"},{"role":"user","content":"mi correo es lleirgarcia@gmail.com"}]}'
```

```json
{"success":true}
```

---

## Resumen de variables de entorno

| Variable | Usada por |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | blog articles/upload, chat, save-lead |
| `SUPABASE_SERVICE_ROLE_KEY` | blog articles/upload, chat, save-lead |
| `BLOG_ADMIN_PASSWORD` | blog auth (login y check) |
| `BLOG_ADMIN_SESSION_SECRET` | blog auth + todos los endpoints admin del blog |
| `ANTHROPIC_API_KEY` | chat, chat/summary, demos clasificar |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | demos bandeja (IMAP Gmail) |
| `NODE_ENV` | flag `Secure` de la cookie admin |
