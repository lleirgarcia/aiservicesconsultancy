# Contract — Articles API

Base path: `/api/blog/articles`

Todas las rutas mutadoras y la lectura administrativa requieren cookie `blog_admin_session` válida (ver `auth.md`). Sin cookie ⇒ `401 { "error": "unauthorized" }`.

Todas las respuestas son JSON. Las fechas son ISO 8601 (UTC). Los nombres de campos siguen `camelCase` (mapping desde la BD se hace en `articleService`).

---

## GET `/api/blog/articles`

**Auth**: admin. Devuelve la lista completa (drafts + published) ordenada por `updated_at desc` para el panel admin.

**Query params**:
- `status` — opcional: `draft` | `published`. Filtra por estado.
- `q` — opcional: búsqueda case-insensitive en `title` y `summary`.

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "como-ahorrar-energia",
      "title": "Cómo ahorrar energía",
      "summary": "...",
      "status": "published",
      "tags": ["ahorro", "energia"],
      "readingTimeMinutes": 5,
      "coverImageUrl": "https://...",
      "createdAt": "2026-04-30T10:00:00.000Z",
      "updatedAt": "2026-04-30T11:00:00.000Z",
      "publishedAt": "2026-04-30T10:30:00.000Z"
    }
  ]
}
```

> No devuelve `contentMd` en el listado para no inflar la respuesta.

---

## POST `/api/blog/articles`

**Auth**: admin. Crea un artículo nuevo (siempre como `draft` salvo que se pase `status: 'published'` con todos los campos válidos).

**Request**:
```json
{
  "title": "string (1..200)",
  "summary": "string (1..400)",
  "contentMd": "string (markdown)",
  "coverImageUrl": "string | null",
  "tags": ["string"],
  "status": "draft | published",
  "slug": "string (opcional, generado del título si falta)"
}
```

**Response 201**:
```json
{ "article": Article }
```

**Response 400** — validación:
```json
{ "error": "validation_failed", "fields": { "title": "required", ... } }
```

**Response 409** — slug ya existe (el cliente puede reintentar con sufijo o dejar que el servidor genere otro):
```json
{ "error": "slug_taken", "suggestedSlug": "como-ahorrar-energia-2" }
```

**Reglas**:
- Si `status: 'published'`, todos los campos imprescindibles (`title`, `summary`, `contentMd`, `coverImageUrl`) deben estar presentes y no vacíos. Si falta alguno ⇒ 400.
- El `readingTimeMinutes` se calcula server-side y NO se acepta del cliente.
- El `slug` se normaliza con `generateSlug` y, si colisiona, el server prueba con sufijos `-2`, `-3` hasta encontrar libre (a no ser que el cliente lo haya pasado explícitamente; en ese caso devuelve 409).

---

## GET `/api/blog/articles/[id]`

**Auth**: admin. Devuelve un artículo completo (incluyendo `contentMd`) por id.

**Response 200**:
```json
{ "article": Article }
```

**Response 404**:
```json
{ "error": "not_found" }
```

---

## PATCH `/api/blog/articles/[id]`

**Auth**: admin. Actualiza campos parciales.

**Request** (todos opcionales):
```json
{
  "title": "...",
  "summary": "...",
  "contentMd": "...",
  "coverImageUrl": "...",
  "tags": ["..."],
  "status": "draft | published",
  "slug": "..."
}
```

**Response 200**:
```json
{ "article": Article }
```

**Response 400** — al cambiar `status` a `published` faltan campos obligatorios.

**Response 409** — al cambiar `slug` y el nuevo ya existe; o al intentar cambiar el slug de un artículo ya publicado:
```json
{ "error": "slug_locked" } // si el artículo ya tiene published_at
{ "error": "slug_taken", "suggestedSlug": "..." } // colisión
```

**Side effects al éxito**:
- Si el `status` cambia a `published` o el contenido público se modifica, el handler invoca:
  ```ts
  revalidatePath('/blog');
  revalidatePath(`/blog/${article.slug}`);
  for (const tag of article.tags) revalidatePath(`/blog/tag/${tag}`);
  ```
- Si el `status` cambia a `draft` (despublicar), se revalida igual para que el listado público desaparezca el artículo y `/blog/[slug]` devuelva 404 inmediatamente.

---

## DELETE `/api/blog/articles/[id]`

**Auth**: admin. Borra un artículo en estado `draft`.

**Response 200**:
```json
{ "ok": true }
```

**Response 409** — el artículo está publicado:
```json
{ "error": "cannot_delete_published", "hint": "unpublish_first" }
```

**Side effects**:
- Borra recursivamente las imágenes de Storage bajo `blog-images/<id>/*`.
- Revalida `/blog` y, si tenía `published_at`, también `/blog/<slug>` (defensivo).

---

## POST `/api/blog/upload`

**Auth**: admin. Sube una imagen al bucket `blog-images`.

**Request** (multipart/form-data):
- `file` — archivo (`image/jpeg|png|webp|avif`, ≤ 5 MB)
- `articleId` — uuid del artículo (debe existir; el cliente sólo puede subir tras haber creado el draft)

**Response 200**:
```json
{
  "url": "https://lheltgehwtavkmdumior.supabase.co/storage/v1/object/public/blog-images/<articleId>/<file>",
  "path": "<articleId>/<file>"
}
```

**Response 400** — tipo o tamaño no válido:
```json
{ "error": "invalid_file", "reason": "size_too_large | unsupported_mime" }
```

**Response 404** — el `articleId` no existe en `articles`:
```json
{ "error": "article_not_found" }
```

**Flujo de creación (sin `tmp/`)**:
1. El editor en `/blog/admin/editor/new` muestra el `<CoverUploader/>` deshabilitado con la indicación "Guarda como borrador para subir portada".
2. Al primer "Guardar borrador" (con título mínimo + summary + contentMd), el cliente hace `POST /api/blog/articles` y recibe el `id`. Navega sin reload a `/blog/admin/editor/<id>`.
3. Con `id` real, `<CoverUploader/>` se activa y los uploads van a `blog-images/<id>/...`.
4. Al actualizar `coverImageUrl`, el cliente hace `PATCH /api/blog/articles/<id>` con la URL devuelta por `/api/blog/upload`.

---

## Lecturas públicas

Las lecturas públicas (listado y detalle) NO se exponen como API REST. Se ejecutan directamente desde Server Components (`src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`) usando funciones de `articleQueries.ts`. Esto evita un layer HTTP extra y aprovecha la cache de Next (ISR).

Si en el futuro un consumidor externo necesita leer artículos (por ejemplo, una integración con el chat), se añadirá `GET /api/blog/public/articles` y `GET /api/blog/public/articles/[slug]` con respuestas equivalentes a las queries públicas.

---

## Esquema de error común

Todos los handlers devuelven errores con la forma:
```json
{ "error": "<machine_code>", "message"?: "<texto opcional>", ...extras }
```

Códigos máquina usados:
- `unauthorized`, `forbidden`
- `validation_failed`
- `not_found`
- `slug_taken`, `slug_locked`
- `cannot_delete_published`
- `invalid_file`
- `internal_error`

Códigos HTTP:
- 200 OK · 201 Created · 204 No Content (no se usa)
- 400 Bad Request · 401 Unauthorized · 403 Forbidden · 404 Not Found
- 409 Conflict · 429 Too Many Requests
- 500 Internal Server Error
