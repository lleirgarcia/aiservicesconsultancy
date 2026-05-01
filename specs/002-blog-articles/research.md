# Research — Blog de artículos

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Date**: 2026-04-30

Documento que consolida las decisiones técnicas del Phase 0. No quedan ítems `NEEDS CLARIFICATION` abiertos al cierre de esta fase.

---

## 1. Autenticación de la zona privada

**Decision**: Contraseña única configurada por la variable de entorno `BLOG_ADMIN_PASSWORD`, validada en una API route server-only que firma una cookie httpOnly (`blog_admin_session`) con HMAC SHA-256 y la marca `Secure` + `SameSite=Lax`. Expira a 30 días con renovación deslizante.

**Rationale**:
- El MVP tiene un único autor (el propietario), por lo que un sistema completo de usuarios añade superficie sin valor.
- La spec lo permite explícitamente como assumption ("acceso por contraseña configurada por variable de entorno").
- Se evita acoplar el roadmap de autenticación de la app entera al blog. Si en futuras specs se añaden más autores, migrar a Supabase Auth es un cambio aislado.
- Evita pedir SMTP / OAuth para este MVP.

**Implementation notes**:
- `BLOG_ADMIN_PASSWORD` (secreto) y `BLOG_ADMIN_SESSION_SECRET` (32 bytes random) en `.env.local`. Carga centralizada en `src/lib/env.ts` que falla rápido si faltan.
- Cookie firmada: payload `{ exp: <timestamp> }` + `.` + `hmacSha256(payload, secret)`. Validación en `src/lib/blog/adminAuth.ts`.
- Middleware o `layout.tsx` de `/blog/admin/*` valida la cookie en cada petición. Si falta o está expirada, redirige a `/blog/admin/login`.
- Las API routes `/api/blog/articles*` y `/api/blog/upload` validan la cookie antes de tocar Supabase. Sin cookie ⇒ 401.
- Logout: `DELETE /api/blog/auth` borra la cookie.

**Alternatives considered**:
- **Supabase Auth (magic link)** — descartado: requiere configurar SMTP para un único usuario y exige UI de "comprueba tu email". Sobredimensionado para el MVP.
- **NextAuth.js** — descartado: dependencia adicional + tablas adicionales para 1 usuario.
- **Basic Auth (Vercel password)** — descartado: protegería todo el deployment, no sólo `/blog/admin`.

---

## 2. Persistencia de artículos

**Decision**: Tabla `articles` en Supabase Postgres (proyecto existente `lheltgehwtavkmdumior`). Acceso server-only mediante `service_role` ya configurada en `src/lib/supabase.ts`. RLS desactivada en la tabla porque ningún cliente accede directamente; toda lectura/escritura va por API routes o Server Components que ya viven server-side.

**Rationale**:
- Supabase ya está en el stack y se usa para `leads`. Reutilizar evita nueva infra.
- Toda la lectura pública se hace desde Server Components (Next App Router), así que las consultas viven server-side sin exponer claves al navegador.
- El render público es SSG/ISR (`revalidate = 60`), lo que minimiza la presión sobre Supabase.

**Schema** (detalles completos en `data-model.md`):
- `articles` (id uuid PK, slug text unique, title, summary, content_md, cover_image_url, status `draft|published`, created_at, updated_at, published_at, author_id, reading_time_minutes int)
- `article_tags` (article_id uuid FK, tag text) — relación N a N libre, sin tabla maestra de tags (etiquetas como strings normalizados; simplifica el MVP)

**Alternatives considered**:
- **Archivos markdown en repo (MDX)** — descartado: la spec exige zona privada con CRUD vivo y guardado de borrador, no commit-and-redeploy.
- **Tabla `tags` separada con join** — descartado para el MVP por simplicidad; se puede normalizar más tarde si crece la UX de gestión de etiquetas.
- **JSON column con tags inline** — descartado: dificulta filtrar por tag con índice.

---

## 3. Almacenamiento de imágenes

**Decision**: Supabase Storage, bucket público `blog-images`. Subidas vía route handler `/api/blog/upload` (server-only con service role); las URLs públicas se almacenan tal cual en `articles.cover_image_url` y en el contenido markdown.

**Rationale**:
- Mantiene infra unificada con el resto del stack.
- Bucket público simplifica el render público (no firma de URLs, no expiraciones).
- `next/image` + `remotePatterns` habilitando el dominio Supabase da lazy loading + responsive automáticos.

**Implementation notes**:
- Configurar `next.config.ts` con `images.remotePatterns: [{ protocol: 'https', hostname: '<project>.supabase.co' }]`.
- Validación en upload: tipo `image/jpeg|png|webp|avif`, tamaño máx 5 MB. Errores devueltos como JSON.
- Naming: `<articleId>/<random>-<originalName>` para evitar colisiones y poder borrar al eliminar artículo.

**Alternatives considered**:
- **Vercel Blob** — descartado: añade dependencia y proveedor extra cuando Supabase ya cubre el caso.
- **Imgix / Cloudinary** — descartado: sobredimensionado para el volumen del MVP.

---

## 4. Renderizado de markdown

**Decision**: `react-markdown` (10.x) + `remark-gfm` (4.x), ambos ya en `package.json`. Mapping de componentes en `src/components/blog/markdown/components.tsx` para que cada elemento (`h1`–`h4`, `p`, `a`, `code`, `blockquote`, `ul`, `ol`, `img`, `pre`, `hr`, `table`) renderice con clases Tailwind/Stitch coherentes con la app (estilo similar a `.legal-prose` y `.chat-markdown` de `globals.css`).

**Rationale**:
- Cero dependencias nuevas.
- `react-markdown` sanitiza HTML por defecto (no permite raw HTML), suficiente para un único autor de confianza.
- Mapping explícito de componentes garantiza coherencia visual con el resto de la app (FR-013, FR-014).

**Implementation notes**:
- Imágenes en markdown (`![alt](url)`) se renderizan con `next/image` envuelto. Si la URL es relativa, se prefija con el dominio público de Supabase.
- Bloques de código sin highlighter en el MVP (la app no tiene contenido técnico esperado). Se deja un `<pre><code>` con tipografía mono y estilo del bloque del chat.
- `remark-gfm` da tablas, tachados, task lists, autolinks (alineado con expectativa de un blog moderno).

**Alternatives considered**:
- **MDX** — descartado: requiere compilación y limita el editor a markdown puro (no HTML embebido).
- **Tiptap / Lexical (WYSIWYG)** — descartado por scope del MVP (la spec lo excluye explícitamente).
- **Rehype-highlight** — descartado para el MVP; añadir cuando aparezca el primer artículo con código.

---

## 5. Estrategia de render público (SSR vs ISR vs SSG)

**Decision**: ISR (Incremental Static Regeneration) en Next.js App Router.
- `/blog` (listado): `export const revalidate = 60` (1 minuto). `generateStaticParams` no aplica (es una sola ruta).
- `/blog/[slug]` (detalle): `export const revalidate = 60` + `generateStaticParams` que devuelve los slugs publicados en build → primer render estático, regeneraciones a demanda.
- `/blog/tag/[tag]`: `export const revalidate = 60`. `generateStaticParams` devuelve los tags presentes.

**Rationale**:
- Cumple SC-003 (< 2 s en 4G estándar) sin esfuerzo: HTML servido de la edge cache de Vercel.
- Tras publicar un artículo, el autor lo ve en su URL en ≤ 60 s (suficiente para un blog).
- Indexación SEO inmediata porque el HTML se sirve desde el servidor.

**Implementation notes**:
- Si tras publicar se quiere invalidación inmediata, se usa `revalidatePath('/blog')` y `revalidatePath('/blog/${slug}')` desde la API route que muta el estado, eliminando la espera del TTL.
- Borradores se renderizan sólo bajo `/blog/admin/editor/[id]/preview` (Client Component), nunca SSG.

**Alternatives considered**:
- **SSR puro** — descartado: TTFB peor sin justificación, mayor coste de Supabase.
- **SSG total** — descartado: requiere redeploy para publicar.
- **CSR** — descartado: rompe SEO (FR-011, SC-005).

---

## 6. Generación de slugs y unicidad

**Decision**: Implementación propia en `src/lib/blog/slug.ts`. Pasos:
1. `String.prototype.normalize('NFD').replace(/[̀-ͯ]/g, '')` para eliminar diacríticos.
2. Lowercase, reemplazar caracteres no alfanuméricos por `-`, colapsar guiones y trim.
3. `ensureUniqueSlug(base)` consulta Supabase y, si existe, añade `-2`, `-3`, … hasta encontrar libre.
4. El slug se genera al **crear** el artículo a partir del título; el autor puede sobrescribirlo manualmente.
5. Una vez publicado, **no se regenera** aunque cambie el título (FR-005, edge case del spec).

**Rationale**:
- Evita dependencia (`slugify`) por algo trivial.
- Manejo correcto de eñes y acentos (edge case del spec: `ahorrá-energía` → `ahorra-energia`).
- Unicidad garantizada con sufijo numérico legible.

**Alternatives considered**:
- **`slugify` (npm)** — descartado por dependencia para 15 líneas de código.
- **`nanoid` como sufijo** — descartado: URLs menos legibles.

---

## 7. Tiempo de lectura

**Decision**: `src/lib/blog/readingTime.ts`. Cuenta palabras del markdown bruto (split por whitespace, descartando líneas vacías y URLs de imágenes), divide entre 220 wpm (lectura media en español), redondea hacia arriba a minutos. Mínimo 1.

**Rationale**:
- 220 wpm es la media estándar para español.
- Se calcula en server al guardar/publicar y se persiste en `articles.reading_time_minutes` para evitar recálculos en cada render.

**Alternatives considered**:
- **`reading-time` (npm)** — descartado por dependencia para 10 líneas.
- **Cálculo en cliente** — descartado: redundante y añade JS al bundle público.

---

## 8. SEO y sitemap

**Decision**:
- `app/blog/[slug]/page.tsx` exporta `generateMetadata` que devuelve `title`, `description` (= summary), `openGraph` y `twitter` con la portada como `image`.
- `app/sitemap.ts` (a crear o extender si ya existe) lista todos los artículos `published` con `lastModified = updated_at`.
- Borradores y despublicados emiten `<meta name="robots" content="noindex,nofollow">` y se omiten del sitemap (FR-011).
- Alcance: la canonical es `https://<dominio>/blog/<slug>`.

**Rationale**: Cumple SC-005 directamente. Aprovecha la API nativa de Next 16 sin libs externas.

**Alternatives considered**:
- **`next-sitemap`** — descartado: el módulo `sitemap.ts` nativo de App Router cubre el caso.

---

## 9. Internacionalización

**Decision**: El **contenido** del blog es ES-only (assumption del spec). La **UI no editorial** del blog (botones, navegación, etiquetas de campos del editor, mensajes de error, estado vacío) lee de `dict.{es,ca,en}.json` bajo una nueva rama `blog`. Si la app está en CA o EN, los textos del chrome del blog se traducen pero el contenido del artículo se sirve tal cual está en la base de datos.

**Rationale**: Cumple el principio IV de la constitución sin imponer i18n del contenido (que sería desproporcionado para un único autor publicando en español).

**Implementation notes**: Las claves `blog.list.empty`, `blog.list.readMore`, `blog.detail.backToList`, `blog.editor.*`, `blog.admin.login.*`, etc. se definen en Phase 1 y se consumen vía `useTranslations` (cliente) o `getTranslations` (server, si existe; si no, lectura directa del dict en el Server Component).

---

## 10. Testing strategy

**Decision**:
- **Unit (Jest + RTL)**: utilidades puras (`slug.ts`, `readingTime.ts`, `adminAuth.ts`) y componentes presentacionales sin estado externo (`ArticleCard`).
- **Integration (Jest)**: API routes `/api/blog/articles*` contra una **base Supabase de pruebas** (proyecto separado, configurado con vars `*_TEST`). Cubre los acceptance scenarios de US1 (publicar) y US3 (editar/despublicar).
- **Manual (quickstart.md)**: pasos para arrancar local, crear un artículo, verificar listado público y SEO.

**Rationale**: Alineado con el principio V (integration over mocks) y proporcional al alcance del MVP. No se introduce Playwright/Cypress; no hay flujo cliente complejo más allá del editor (validable por integración server-side + revisión visual).

**Alternatives considered**:
- **E2E con Playwright** — diferido: el editor admin tiene poco JS interactivo; el coste de mantener una suite E2E supera el beneficio en este MVP.

---

## Resumen de decisiones

| # | Tema | Decisión |
|---|------|----------|
| 1 | Auth admin | Password env + cookie httpOnly firmada (HMAC) |
| 2 | Persistencia | Supabase Postgres, tablas `articles` + `article_tags` |
| 3 | Imágenes | Supabase Storage bucket público `blog-images` |
| 4 | Markdown | `react-markdown` + `remark-gfm` (ya en deps), mapping Stitch |
| 5 | Render público | App Router con ISR (`revalidate = 60`) + `revalidatePath` al publicar |
| 6 | Slugs | Implementación propia, unicidad con sufijo numérico |
| 7 | Reading time | Implementación propia, 220 wpm, persistido en BD |
| 8 | SEO | `generateMetadata` + `app/sitemap.ts` nativos |
| 9 | i18n | Contenido ES-only; UI del blog en `dict.{es,ca,en}.json` rama `blog` |
| 10 | Tests | Unit + integration server-side; sin E2E para el MVP |
