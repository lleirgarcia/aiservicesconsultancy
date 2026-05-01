# Quickstart — Blog de artículos

Cómo arrancar la feature en local y validar manualmente los acceptance scenarios principales.

---

## 1. Prerequisitos

- Node 20+, npm.
- Acceso al proyecto Supabase `lheltgehwtavkmdumior` (panel + service role key).
- Repo en branch `002-blog-articles`.

---

## 2. Migrar la base de datos

En el SQL Editor de Supabase ejecuta el script de `data-model.md` §2 (tabla `articles`, índices y triggers).

> Para entornos efímeros (CI/test), aplica el mismo script a un proyecto Supabase separado y exporta sus credenciales como `NEXT_PUBLIC_SUPABASE_URL_TEST` / `SUPABASE_SERVICE_ROLE_KEY_TEST`.

---

## 3. Crear el bucket de Storage

En el panel Supabase → Storage:
1. Crear bucket `blog-images`.
2. Marcar como **público**.
3. Copiar las policies por defecto del bucket público.

---

## 4. Variables de entorno

Añade a `.env.local` (sin commitear):

```bash
# Ya existentes:
NEXT_PUBLIC_SUPABASE_URL=https://lheltgehwtavkmdumior.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Nuevas:
BLOG_ADMIN_PASSWORD=<una contraseña fuerte>
BLOG_ADMIN_SESSION_SECRET=<32 bytes hex; openssl rand -hex 32>
BLOG_PUBLIC_SITE_URL=http://localhost:3000
```

Y en `.env.example` añade las mismas claves con valores vacíos.

---

## 5. Arrancar el dev server

```bash
npm install      # asegura react-markdown / remark-gfm
npm run dev
```

Visita `http://localhost:3000/blog` → ves el listado vacío con la estética Stitch.

---

## 6. Acceptance scenarios manuales

### US1 — Publicar un artículo

1. Navega a `/blog/admin/login`. Introduce la contraseña de `BLOG_ADMIN_PASSWORD` → te redirige a `/blog/admin`.
2. Pulsa **Nuevo artículo**. Rellena título, resumen y un cuerpo markdown corto.
3. Sube una imagen de portada (≤ 5 MB).
4. Pulsa **Vista previa** → ves el artículo renderizado con paleta Stitch, Space Grotesk en títulos e Inter en cuerpo.
5. Pulsa **Publicar**. Verifica que se redirige al admin y el artículo aparece como `published`.
6. Abre `/blog/<slug>` en otra pestaña anónima → el artículo se ve público y los `<meta>` Open Graph contienen título, resumen y portada (Inspecciona → `<head>`).

✅ Cumple US1, FR-001 a FR-014.

### US2 — Listado público

1. Crea un segundo artículo con fecha posterior.
2. Visita `/blog` → ambos aparecen con tarjetas (portada, título, resumen, fecha, tiempo de lectura), el más reciente primero.
3. Despublica uno desde admin → tras ≤ 60 s (o invalidación inmediata si pulsas refrescar después de despublicar) deja de aparecer en `/blog` y `/blog/<slug>` devuelve 404.

✅ Cumple US2, FR-008 a FR-012.

### US3 — Editar y despublicar

1. En `/blog/admin` abre un artículo publicado, edita el título → guarda.
2. Visita `/blog/<slug>` → el título cambió, la URL no.
3. Despublica el artículo → `/blog/<slug>` devuelve 404 con la estética de la app.
4. Borra un draft → desaparece del listado admin.
5. Intenta borrar uno publicado → la API devuelve 409 `cannot_delete_published`.

✅ Cumple US3, FR-001, FR-008, FR-011.

### US4 — Etiquetas (P3)

1. Edita un artículo y añade tags `ahorro`, `digitalización`.
2. Visita `/blog/tag/ahorro` → solo aparece(n) los artículos con esa etiqueta.
3. Click en una etiqueta desde el detalle → te lleva a `/blog/tag/<tag>`.

✅ Cumple US4, FR-016, FR-017.

---

## 7. SEO y sitemap

1. Visita `http://localhost:3000/sitemap.xml` → contiene los `loc` de los artículos publicados, no los drafts.
2. Visita `http://localhost:3000/robots.txt` → bloquea `/blog/admin/`.
3. Inspecciona `/blog/<draft-slug>` (estando autenticado) en preview → `<meta name="robots" content="noindex,nofollow">`.

✅ Cumple FR-011, SC-005.

---

## 8. Tests automatizados

```bash
# Unit + componentes presentacionales
npm test -- --testPathPattern='blog'

# Integration (requiere las vars *_TEST configuradas)
SUPABASE_TEST=true npm test -- --testPathPattern='integration/blog'
```

---

## 9. Smoke test de rendimiento (SC-003)

Con 10 artículos publicados:
1. `npm run build && npm start`.
2. Lighthouse contra `/blog` (móvil, 4G simulado): LCP < 2 s, TTFB < 500 ms.
3. Si no se cumple, revisa que `revalidate = 60` esté activo y que `next/image` esté sirviendo las portadas con `sizes` adecuados.

---

## 10. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `/blog/admin/login` no redirige tras introducir contraseña | Cookie no se setea (HTTPS-only en local) | En dev, marcar `Secure: false` si `NODE_ENV !== 'production'` |
| Imagen de portada rota | `next.config.ts` sin `remotePatterns` para Supabase | Añadir el host (ver `data-model.md` §3) |
| Tras publicar, no aparece en `/blog` durante 60 s | ISR cacheada | `revalidatePath('/blog')` se llama en el handler; si no, esperar TTL |
| 401 al guardar borrador | Cookie expirada o secret cambiado | Re-login en `/blog/admin/login` |
| 500 con `admin_not_configured` | Falta `BLOG_ADMIN_PASSWORD` o `BLOG_ADMIN_SESSION_SECRET` | Añadir al `.env.local` y reiniciar |
