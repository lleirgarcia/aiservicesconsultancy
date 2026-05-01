---
description: "Tasks for feature 002-blog-articles"
---

# Tasks: Blog de artículos

**Input**: Design documents from `/specs/002-blog-articles/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: La spec menciona pruebas (acceptance scenarios verificables) y la constitución exige integration testing over mocks. Se incluyen unit tests para utilidades puras (slug, readingTime, adminAuth) y tests de integración server-side para el CRUD admin. **No** se incluyen E2E (Playwright/Cypress) — fuera de scope MVP.

**Organization**: Tareas agrupadas por User Story (P1 → P2 → P3) para entrega incremental. La US1 + US2 forman el MVP mínimo publicable.

## Format: `[ID] [P?] [Story] Description`

- **[P]** = puede ejecutarse en paralelo (ficheros distintos, sin deps abiertas)
- **[US#]** = pertenece a User Story N
- Las rutas son absolutas relativas a la raíz del repo (`src/...`, `specs/...`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar entorno, dependencias y configuración base. Sin estas tareas no se puede arrancar nada.

- [X] T001 Crear migración SQL `supabase/migrations/20260430_blog_articles.sql` con la tabla `articles`, índices, triggers y `disable row level security` (script completo en `specs/002-blog-articles/data-model.md` §2). Aplicarla en el proyecto Supabase principal.
- [ ] T002 Crear bucket público `blog-images` en Supabase Storage (panel) con MIME `image/jpeg|png|webp|avif` y límite 5 MB.
- [X] T003 [P] Añadir variables a `.env.example` (`BLOG_ADMIN_PASSWORD`, `BLOG_ADMIN_SESSION_SECRET`, `BLOG_PUBLIC_SITE_URL`) sin valores. Documentar generación de secret con `openssl rand -hex 32`.
- [X] T004 [P] Extender `next.config.ts` (verificado existente) con `images.remotePatterns` apuntando al host `lheltgehwtavkmdumior.supabase.co` y path `/storage/v1/object/public/blog-images/**`. Mantener cualquier configuración previa.
- [X] T005 [P] Crear `src/lib/env.ts` con carga + validación de las variables nuevas (falla rápido en server start si faltan en producción).
- [X] T005a [P] Instalar dependencias de testing: `npm i -D jest @types/jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-node`. `jest.config.js` y `jest.setup.js` ya existen en la raíz; verificar que `jest.setup.js` importa `@testing-library/jest-dom`. Añadir scripts en `package.json`: `"test": "jest"`, `"test:watch": "jest --watch"`.

**Checkpoint**: BD migrada, Storage listo, vars y `next.config` preparados.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos, utilidades, auth admin y el shell de servicios server-only. Toda US1/US2/US3/US4 depende de esta fase.

**⚠️ CRITICAL**: Ninguna User Story arranca hasta cerrar esta fase.

### Tipos y dominio

- [X] T006 [P] Crear `src/types/blog.ts` con los tipos `ArticleStatus`, `Article`, `ArticleRow`, `ArticleListItem`, `CreateArticleInput`, `UpdateArticleInput` (definiciones exactas en `data-model.md` §4).

### Utilidades puras

- [X] T007 [P] Crear `src/lib/blog/slug.ts` con `generateSlug(title)` (NFD + lowercase + replace) y `ensureUniqueSlug(supabase, baseSlug, ignoreId?)` que añade `-2`, `-3`… si existe.
- [X] T008 [P] Crear `src/lib/blog/readingTime.ts` con `calculateReadingTime(markdown)` a 220 wpm, mínimo 1.
- [X] T009 [P] Crear `src/lib/blog/markdown.ts` con `extractFirstParagraph(md)` (helper para fallback de summary) y sanitizadores básicos.
- [X] T010 [P] Crear `src/lib/blog/adminAuth.ts` con `signSession(payload, secret)`, `verifySession(cookie, secret)`, `buildSessionCookie(value, opts)`, constante `BLOG_ADMIN_COOKIE = 'blog_admin_session'`. Usar `crypto.timingSafeEqual` y `node:crypto` HMAC-SHA256. Cookie format en `contracts/auth.md`.

### Tests unitarios de utilidades (escribir antes de marcar fase como completa)

- [X] T011 [P] Tests `src/__tests__/unit/blog/slug.test.ts`: ASCII pass-through, acentos (`ahorrá-energía` → `ahorra-energia`), eñes, símbolos, espacios múltiples, ensureUniqueSlug con colisión.
- [X] T012 [P] Tests `src/__tests__/unit/blog/readingTime.test.ts`: vacío → 1 min, 220 palabras → 1 min, 1500 palabras → 7 min, ignora URLs y bloques de código.
- [X] T013 [P] Tests `src/__tests__/unit/blog/adminAuth.test.ts`: sign/verify round-trip, expirado, hmac mal firmado, payload manipulado, secret diferente.

### Servicios server-only (shell)

- [X] T014 [P] Crear `src/services/blog/articleService.ts` con `rowToArticle`, `articleToRow`, `createArticle`, `updateArticle`, `deleteArticle`, `listArticlesAdmin`, `getArticleById`. Usa el cliente `supabase` de `src/lib/supabase.ts`. Reglas explícitas:
  - **Reading time**: `createArticle` y `updateArticle` recalculan `reading_time_minutes = calculateReadingTime(input.contentMd)` cada vez que `contentMd` está presente en el input. Si no se pasa, se conserva el valor existente.
  - **Slug locked**: si la fila tiene `published_at !== null` y el input intenta cambiar `slug`, devolver error `slug_locked` (el handler lo traduce a 409).
  - **Validación al publicar**: al pasar `status` a `published` (o crear directamente con `status: 'published'`), verificar que `title`, `summary`, `cover_image_url` y `content_md` no están vacíos. Si falta alguno, devolver `validation_failed` con `fields` (handler 400).
  - **Tags**: aplicar `tagService.normalizeTags()` antes de persistir.
- [X] T015 [P] Crear `src/services/blog/articleQueries.ts` con `listPublished({ limit, offset })`, `countPublished()`, `getBySlug(slug)`, `listByTag(tag)`, `listAllTags()`. Sólo lee artículos `published` (excepto donde se indique).
- [X] T016 [P] Crear `src/services/blog/storageService.ts` con `uploadImage(file, articleId)` y `deleteArticleImages(articleId)` contra el bucket `blog-images`. (Eliminado `moveTmpToArticle` tras simplificación del flujo — ver T031).
- [X] T017 [P] Crear `src/services/blog/tagService.ts` con `normalizeTags(tags[])` (reusa generateSlug por tag) y `mergeTagSuggestions()` (devuelve `DISTINCT unnest(tags)`).

### i18n

- [X] T018 Añadir rama `blog` a `src/i18n/dict/dict.es.json`, `dict.ca.json`, `dict.en.json` con claves: `blog.list.title`, `blog.list.empty`, `blog.list.readMore`, `blog.list.readingTime`, `blog.list.loadMore`, `blog.detail.backToList`, `blog.detail.publishedOn`, `blog.editor.*`, `blog.admin.login.*`, `blog.admin.list.*`, `blog.notFound.title`, `blog.notFound.cta`.

**Checkpoint**: Tipos, utilidades testeadas, servicios server-only listos. Las User Stories pueden arrancar.

---

## Phase 3: User Story 1 — Publicar un artículo nuevo (Priority: P1) 🎯 MVP

**Goal**: El propietario, autenticado en `/blog/admin`, puede crear un artículo (título, resumen, cuerpo markdown, portada), previsualizarlo con la estética Stitch y publicarlo en `/blog/<slug>`.

**Independent Test**: Loguearse en `/blog/admin/login`, crear un artículo con todos los campos, publicarlo y verificar que `/blog/<slug>` lo sirve público con metadatos OG correctos y estilo Stitch (Quickstart §6 US1).

### Tests para US1 (server-side integration)

- [X] T019 [P] [US1] Test integración `src/__tests__/integration/blog/admin-auth.test.ts`: POST `/api/blog/auth` con pwd correcta setea cookie y devuelve `expiresAt`; pwd incorrecta devuelve 401; sin pwd 400; rate limit a la 6ª llamada en < 1 min.
- [X] T020 [P] [US1] Test integración `src/__tests__/integration/blog/admin-create-publish.test.ts`: POST `/api/blog/articles` con cookie crea draft; PATCH a `published` cumple reglas. **No mockear `next/cache`**: validar el efecto observable (tras PATCH, `articleQueries.getBySlug(slug)` devuelve el artículo con `status='published'` y los campos actualizados).

### Auth admin (route handlers)

- [X] T021 [US1] Crear `src/app/api/blog/auth/route.ts` con `POST` (valida pwd timing-safe, set cookie HMAC), `DELETE` (limpia cookie), `GET` (devuelve `{ authenticated, expiresAt }`). Rate limit en memoria 5/min/IP usando `Map<ip, timestamps[]>` — aceptable degradación en serverless multi-instance (cada instancia mantiene su contador; sigue limitando ataques masivos sin romper UX). Contract: `contracts/auth.md`.
- [X] T022 [US1] Crear helper `src/lib/blog/requireAdmin.ts` que lee cookies desde `next/headers`, verifica con `adminAuth.verifySession` y devuelve `{ ok: true }` o lanza `Response` 401. Usado por todos los handlers admin.

### API routes de artículos (CRUD admin)

- [X] T023 [US1] Crear `src/app/api/blog/articles/route.ts` con `GET` (lista admin, filtros `status`/`q`) y `POST` (crear artículo, llama `articleService.createArticle`, gestiona 409 slug_taken). Usa `requireAdmin`.
- [X] T024 [US1] Crear `src/app/api/blog/articles/[id]/route.ts` con `GET` (artículo completo), `PATCH` (actualiza, valida slug_locked si publicado, dispara `revalidatePath('/blog')` y `revalidatePath('/blog/${slug}')` en éxito), `DELETE` (sólo drafts, devuelve 409 si publicado, llama `storageService.deleteArticleImages`).
- [X] T025 [US1] Crear `src/app/api/blog/upload/route.ts` con `POST` multipart: valida MIME y tamaño, exige `articleId` válido (uuid existente en `articles`), sube a `blog-images/<articleId>/<timestamp>-<filename>`, devuelve `{ url, path }`. Usa `requireAdmin`. Elimina cualquier referencia al flujo `tmp/`.

### Zona admin UI (Client Components)

- [X] T026 [US1] Crear `src/app/blog/admin/login/page.tsx` con `<AdminLoginForm/>` (Client Component). Lee `searchParams.from`. Form de password → POST `/api/blog/auth` → redirect a `searchParams.from` (validado: debe empezar por `/blog/admin`) o `/blog/admin` por defecto.
- [X] T027 [US1] Crear `src/components/blog/admin/AdminLoginForm.tsx` con estado dirty/loading/error, estilo Stitch (botón `cta-discover` o equivalente, label-accent en título).
- [X] T028 [US1] Crear `src/app/blog/admin/layout.tsx` (Server Component) que verifica cookie con `requireAdmin`. Si falta o expira, `redirect('/blog/admin/login?from=' + encodeURIComponent(currentPath))`. Renderiza shell admin (header con logout button, link a listado, link a "Nuevo artículo").
- [X] T029 [US1] Crear `src/app/blog/admin/page.tsx` (Server Component) que llama `articleService.listArticlesAdmin()` y renderiza tabla con columnas (estado, título, slug, updated_at, acciones editar/borrar). i18n vía dict.
- [X] T030 [US1] Crear `src/app/blog/admin/editor/[id]/page.tsx` (Client Component, `'use client'`). Si `id === 'new'`, estado vacío; en otro caso, fetch a GET `/api/blog/articles/[id]` en mount. Renderiza `<ArticleEditor/>`.
- [X] T031 [US1] Crear `src/components/blog/admin/ArticleEditor.tsx`: layout 2 columnas (editor markdown a la izquierda, preview a la derecha — toggle "Vista previa"). Campos: título, slug (auto + edit, sólo editable si draft sin `publishedAt`), resumen, contentMd (textarea), portada, tags. Botones via `<PublishBar/>`. **Flujo de creación simplificado**: si `id === 'new'`, los campos `title`/`summary`/`contentMd` permiten edición pero el `<CoverUploader/>` y la imagen aparecen **deshabilitados** con mensaje "Guarda como borrador para subir portada"; al primer "Guardar borrador" se hace `POST /api/blog/articles` y se navega (sin reload) a `/blog/admin/editor/<newId>` desbloqueando uploads. Esto elimina la necesidad de `tmp/` paths. Autosave a borrador cada 15 s y al blur (sólo cuando ya hay `id` real).
- [X] T032 [US1] Crear `src/components/blog/admin/CoverUploader.tsx` con drag/drop + click. POST a `/api/blog/upload` con `articleId` (siempre real; el componente recibe `articleId` como prop y se desactiva si es null). Muestra preview + botón quitar (al quitar: PATCH del artículo con `coverImageUrl: null`).
- [X] T033 [US1] Crear `src/components/blog/admin/PublishBar.tsx` con botones "Guardar borrador", "Vista previa", "Publicar"/"Despublicar" (según estado). Confirma despublicar.
- [X] T034 [US1] Crear `src/hooks/blog/useArticleEditor.ts` con estado del editor (`article`, `dirty`, `saving`, `error`), funciones `save()`, `publish()`, `unpublish()`. Maneja autosave con debounce 15 s.

### Render del markdown con tema Stitch

- [X] T035 [P] [US1] Crear `src/components/blog/markdown/components.tsx` exportando un objeto `markdownComponents` para `<ReactMarkdown components={...}/>`: mapea `h1`-`h4`, `p`, `a`, `code`, `pre`, `blockquote`, `ul`, `ol`, `li`, `img`, `hr`, `table` con clases Tailwind/Stitch coherentes con `.legal-prose` y `.chat-markdown`.
- [X] T036 [P] [US1] Crear `src/components/blog/ArticleContent.tsx` (Server Component) que recibe `markdown: string` y renderiza con `<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>`. Imágenes con `next/image` envuelto.

### Detalle público + SEO

- [X] T037 [US1] Crear `src/app/blog/layout.tsx` (Server Component) con header/footer Stitch, link a home, lang ES.
- [X] T038 [US1] Crear `src/app/blog/[slug]/page.tsx` (Server Component) con `export const revalidate = 60`, `generateStaticParams` (lista slugs publicados) y `generateMetadata` (title = artículo.title, description = summary, openGraph.image = coverImageUrl, alternates.canonical). Si `getBySlug` devuelve null ⇒ `notFound()`. Renderiza `<ArticleContent/>`, `<ArticleMeta/>` y un breadcrumb a `/blog`.
- [X] T039 [P] [US1] Crear `src/components/blog/ArticleMeta.tsx` con fecha de publicación formateada (`Intl.DateTimeFormat('es-ES')`), tiempo de lectura, lista de etiquetas (sin link en US1; el link lo añade US4).
- [X] T040 [US1] Crear `src/app/not-found.tsx` (o variante en `src/app/blog/[slug]/not-found.tsx`) con estilo Stitch (label-accent, CTA volver a `/blog`).

### Preview privado del editor

- [X] T041 [US1] En `<ArticleEditor/>` el toggle "Vista previa" renderiza inline (sin navegación) usando `<ArticleContent/>` + `<ArticleMeta/>` con los datos del estado en memoria. Cumple US1 acceptance scenario 2.

**Checkpoint US1**: Login admin funcional, crear artículo, publicar, ver `/blog/<slug>` público con SEO + ISR. La spec US1 (acceptance scenarios 1-5) pasa manualmente.

---

## Phase 4: User Story 2 — Listado público del blog (Priority: P1) 🎯 MVP

**Goal**: Visitante anónimo entra en `/blog` y ve tarjetas de artículos publicados ordenadas por fecha desc, con paginación.

**Independent Test**: Publicar 2+ artículos y comprobar `/blog` (Quickstart §6 US2).

### Tests US2

- [X] T042 [P] [US2] Test integración `src/__tests__/integration/blog/public-render.test.tsx`: render server de `/blog` con 12 artículos ⇒ 10 en primera página + indicador "ver más"; estado vacío con 0 artículos.

### Listado y tarjetas

- [X] T043 [P] [US2] Crear `src/components/blog/ArticleCard.tsx` (Server Component) con `next/image` para portada (aspect-ratio 16:9, recorte cover), título Space Grotesk, resumen Inter, meta (fecha + reading time). Link a `/blog/<slug>` envolviendo toda la tarjeta.
- [X] T044 [P] [US2] Crear `src/components/blog/EmptyState.tsx` con label-accent y mensaje desde dict (`blog.list.empty`).
- [X] T045 [US2] Crear `src/app/blog/page.tsx` (Server Component) con `export const revalidate = 60`. Lee `searchParams.page` (1-based, default 1, page size 10). Llama `articleQueries.listPublished({ limit, offset })` y `countPublished()`. Renderiza `<ArticleList/>` con grid responsive.
- [X] T046 [US2] Crear `src/components/blog/ArticleList.tsx` (Server Component) con grid Tailwind (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`). Recibe items + paginación. Renderiza tarjetas. Si `hasMore`, muestra link `?page=N+1` ("Cargar más").
- [X] T047 [US2] `generateMetadata` en `src/app/blog/page.tsx`: title "Blog | …", description del meta global del sitio.

### Sitemap y robots

- [X] T048 [P] [US2] Crear `src/app/sitemap.ts` (verificado: no existe en el repo, se crea desde cero): exporta `default` async function que devuelve un `MetadataRoute.Sitemap` con la home + entradas `${BLOG_PUBLIC_SITE_URL}/blog/<slug>` para todos los artículos `published` (`lastModified = updated_at`). Si el proyecto añade más rutas estáticas en el futuro, se incluyen aquí. Excluye drafts.
- [X] T049 [P] [US2] Crear `src/app/robots.ts` (verificado: no existe en el repo) con `disallow: ['/blog/admin/']` y `sitemap: ${BLOG_PUBLIC_SITE_URL}/sitemap.xml`.

### Integración en navegación global

- [X] T050 [US2] Añadir enlace "Blog" → `/blog` en el header de la home. Verificado: el header está inline en `src/app/page.tsx` (elemento `<header>` directo). Insertar el link como `<Link href="/blog">{t('blog.list.title')}</Link>` con estilo coherente al resto del header. Usa la clave i18n `blog.list.title`.

**Checkpoint US2**: Listado público con tarjetas, paginación, estado vacío, sitemap. MVP entregable.

---

## Phase 5: User Story 3 — Editar y despublicar artículos (Priority: P2)

**Goal**: El autor edita un artículo publicado o lo retira temporalmente; los cambios se reflejan en público.

**Independent Test**: Editar título de un publicado y verificar en `/blog/<slug>`. Despublicar y verificar 404 + ausencia del listado (Quickstart §6 US3).

### Tests US3

- [ ] T051 [P] [US3] Test integración `src/__tests__/integration/blog/admin-edit-unpublish.test.ts`: PATCH editando título mantiene slug; PATCH a `draft` desde `published` revalida y elimina del listado público; DELETE de un draft borra; DELETE de publicado devuelve 409.

### Edit flow (reusa Phase 3)

- [ ] T052 [US3] Extender `<ArticleEditor/>` para detectar edición (id ≠ 'new'): cargar datos vía GET `/api/blog/articles/[id]`, mostrar slug bloqueado si `publishedAt !== null`. Botones cambian a "Guardar cambios" y "Despublicar".
- [ ] T053 [US3] Extender `<PublishBar/>` para mostrar botón "Despublicar" cuando `status === 'published'`. Confirma con modal nativo (`window.confirm`) antes de PATCH a `draft`.
- [ ] T054 [US3] Extender `articleService.updateArticle` para preservar `slug` cuando `published_at !== null` (devolver 409 `slug_locked` desde el handler si el cliente intenta cambiarlo).
- [ ] T055 [US3] Extender `src/app/api/blog/articles/[id]/route.ts` `DELETE` para: si `status === 'published'` ⇒ 409 `cannot_delete_published`. Si `draft`, borra fila + imágenes Storage.
- [ ] T056 [US3] Añadir botón "Borrar" en la tabla del admin (`src/app/blog/admin/page.tsx`) con confirm modal. Sólo visible si `status === 'draft'`.

**Checkpoint US3**: Edición y despublicación cubren los 3 acceptance scenarios. Sin regresiones en US1/US2.

---

## Phase 6: User Story 4 — Organización por etiquetas (Priority: P3)

**Goal**: Asignar etiquetas a artículos y filtrar el listado público por etiqueta.

**Independent Test**: Crear 3 artículos con etiquetas distintas; comprobar `/blog/tag/<tag>` filtra correctamente y los chips son clicables (Quickstart §6 US4).

### Editor

- [ ] T057 [P] [US4] Crear `src/components/blog/admin/TagInput.tsx` (Client Component) con input + chips. Autocompletado vía GET nuevo `/api/blog/articles/tags`. Normaliza con `tagService.normalizeTags` antes de añadir.
- [ ] T058 [US4] Crear `src/app/api/blog/articles/tags/route.ts` con `GET` que devuelve `{ tags: string[] }`. Dos comportamientos según auth: si la cookie admin es válida, devuelve `mergeTagSuggestions({ includeDrafts: true })` (autocompletado del editor); si no, devuelve sólo tags de artículos `published` (consumo público). `tagService.mergeTagSuggestions` debe aceptar el parámetro y filtrar la query con `WHERE status='published'` cuando corresponda.
- [ ] T059 [US4] Integrar `<TagInput/>` en `<ArticleEditor/>` debajo del campo summary.

### Render público con tags

- [ ] T059a [P] [US4] Crear `src/components/blog/TagChip.tsx` (Server Component) que recibe `tag: string` y renderiza `<Link href={`/blog/tag/${tag}`} className="...">#tag</Link>` con estilo chip Stitch (border + accent). Componente reusable para `ArticleMeta` y `ArticleCard`.
- [ ] T060 [P] [US4] Actualizar `<ArticleMeta/>` para usar `<TagChip/>` en lugar del render plano de tags introducido en T039.
- [ ] T061 [P] [US4] Actualizar `<ArticleCard/>` para usar `<TagChip/>` (links chip clicables); el wrapper `<Link>` exterior de la tarjeta debe excluir los chips para evitar nesting de `<a>` (alternativa: tarjeta sin link envolvente, link sólo en título e imagen).

### Listado por tag

- [ ] T062 [US4] Crear `src/app/blog/tag/[tag]/page.tsx` (Server Component) con `revalidate = 60`, `generateStaticParams` (tags existentes), `generateMetadata` (title = "Artículos sobre <tag>"). Llama `articleQueries.listByTag(tag)`. Reusa `<ArticleList/>`. Si tag desconocido o sin artículos publicados, muestra `<EmptyState/>` con mensaje específico.
- [ ] T063 [US4] Extender `src/app/sitemap.ts` para añadir `/blog/tag/<tag>` por cada tag con artículos publicados.
- [ ] T064 [US4] Extender el `PATCH` de `src/app/api/blog/articles/[id]/route.ts` para llamar `revalidatePath('/blog/tag/${tag}')` por cada tag (antes y después del cambio si los tags se modificaron).

**Checkpoint US4**: Filtrado por tag funcional, sitemap completo, chips clicables.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Pulido final, performance, accesibilidad, documentación.

- [ ] T065 [P] Validar accesibilidad del editor: focus visible, navegación por teclado en `<TagInput/>`, labels asociadas a inputs, contraste de chips ≥ AA.
- [ ] T066 [P] Validar accesibilidad del público: jerarquía de headings correcta en `<ArticleContent/>`, alt en portadas, foco visible en cards.
- [ ] T067 [P] Smoke test de rendimiento (Quickstart §9): build prod + Lighthouse mobile/4G en `/blog` con 10 artículos. Confirmar LCP < 2 s, TTFB < 500 ms (SC-003).
- [ ] T068 [P] Confirmar `<meta name="robots" content="noindex,nofollow">` en preview de borradores y página 404; comprobar que `sitemap.xml` excluye drafts (SC-005).
- [ ] T069 [P] Limpiar imágenes huérfanas en `blog-images` (uploads abortados antes de PATCHear `coverImageUrl`): añadir TODO en `storageService.ts` con cron sugerido — comparar paths del bucket contra `coverImageUrl` referenciados en `articles` (fuera de scope MVP, dejar documentado).
- [ ] T070 Repasar el `quickstart.md` end-to-end ejecutando los 4 user stories manualmente. Marcar la spec como `COMPLETADA` si todos los acceptance scenarios pasan.
- [ ] T071 Actualizar el spec status: cambiar `Status: Draft` por `Status: COMPLETADA` en `specs/002-blog-articles/spec.md` cuando T070 pase.

---

## Dependencies

```
Phase 1 (Setup)            ──┐
                              ▼
Phase 2 (Foundational)     ──┤  (blocking: utilidades + servicios + i18n)
                              ▼
Phase 3 (US1) ─┐
               ├─▶ MVP entregable (US1 + US2)
Phase 4 (US2) ─┘
               │
Phase 5 (US3) ─┤  (depende de Phase 3 — reusa editor)
               │
Phase 6 (US4) ─┤  (depende de Phase 3 — reusa editor + ArticleMeta/Card)
               │
               ▼
Phase 7 (Polish)
```

Dependencias granulares destacadas:
- T021 (auth route) bloquea T028 (admin layout) y T023/T024/T025 (CRUD routes).
- T014 (articleService) bloquea T023, T024, T031.
- T015 (articleQueries) bloquea T038, T045, T062.
- T035 (markdown components) bloquea T036 (ArticleContent) que bloquea T038 + T041.
- T018 (i18n) puede atrasarse pero bloquea T029, T038, T044, T045 al renderizar.
- US3 reusa todo el editor de US1; sólo añade reglas de slug-lock + flujo despublicar.
- US4 reusa `<ArticleList/>` + `<ArticleCard/>` y añade tag input + ruta tag.

---

## Parallel Execution Examples

### Phase 1 (independientes tras T001/T002)
Ejecutar en paralelo: T003, T004, T005.

### Phase 2 (todas independientes — distintos ficheros)
Ejecutar en paralelo: T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016, T017.
Tras cerrar T006-T017, lanzar T018 (i18n) en paralelo con el inicio de Phase 3.

### Phase 3 (US1)
Tras T021 (auth route) y T022 (requireAdmin), pueden ir en paralelo:
- T023 + T024 + T025 (3 route handlers)
- T035 + T036 (markdown render)
- T039 (ArticleMeta)

Las UI (T026-T034) son secuenciales por dependencia de estado pero los componentes presentacionales (T027, T032, T033) pueden hacerse en paralelo si los hace personas distintas.

### Phase 4 (US2)
Tras T015 (queries) en paralelo: T043, T044, T048, T049. Luego T045 + T046 + T050 secuenciales.

### Phase 6 (US4)
T057 + T060 + T061 en paralelo (distintos componentes). T058 antes de T057 (autocompletado depende del endpoint). T062 + T063 + T064 al final.

### Phase 7
T065, T066, T067, T068, T069 todos paralelos. T070 secuencial al final.

---

## Implementation Strategy

### MVP (entregable mínimo)
**Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)** = blog publicable. Cumple FR-001 a FR-015 y los Success Criteria SC-001, SC-002, SC-003, SC-004, SC-005. Faltarían sólo SC-006 (cadencia) que es operacional.

### Iteración 2
Phase 5 (US3) — gestión continua del contenido. Importante en cuanto haya 3-4 artículos publicados.

### Iteración 3
Phase 6 (US4) — etiquetas. Sólo cuando haya ≥ 8-10 artículos para que el filtrado aporte valor.

### Cierre
Phase 7 — pulido y validación. Pasar la spec a `COMPLETADA`.

---

## Format validation

- ✅ Todas las tareas siguen `- [ ] T### [P?] [US?] descripción con ruta`.
- ✅ Setup, Foundational y Polish sin label de story; Phases 3-6 siempre con `[USN]`.
- ✅ Cada tarea cita el path concreto donde editar/crear el archivo.
- ✅ Las dependencias están marcadas en la sección Dependencies y en los checkpoints.
- ✅ Cada User Story es independientemente testeable según su Independent Test.

**Total tasks**: 73 (Setup: 6 [+T005a], Foundational: 13, US1: 23, US2: 9, US3: 6, US4: 9 [+T059a], Polish: 7).

**MVP scope**: T001-T050 (51 tareas con T005a) entregan US1 + US2 publicables.

---

## Changelog post-`/speckit-analyze`

- **C1 fix** (T014): regla explícita de recálculo de `reading_time_minutes` en create/update.
- **C5 fix** (T048, T049): confirmado que ni `sitemap.ts` ni `robots.ts` existen; tareas dicen "crear" sin ambigüedad.
- **C6 fix** (T025, T031, T032): eliminado el flujo `tmp/` — la portada se sube SOLO tras crear el draft (con `articleId` real). Simplifica el upload route, el editor y el storageService.
- **C7 fix** (T020): test de integración valida efecto observable post-PATCH sin mockear `next/cache`.
- **C9 fix** (T004): confirmado `next.config.ts`.
- **C10 fix** (T026, T028): redirect tras login preserva `?from=` con validación (debe empezar por `/blog/admin`).
- **C13 fix** (T050): confirmado que el header está inline en `src/app/page.tsx`.
- **C14 fix** (T005a): añadida tarea de instalación de Jest + Testing Library; `jest.config.js` ya existe.
- **C15 doc** (T021): documentada degradación aceptable del rate limit en serverless.
- **C16 fix** (T059a, T060, T061): extraído `<TagChip/>` reusable para evitar duplicación.
- **C12 fix** (T058): endpoint `/api/blog/articles/tags` filtra drafts cuando no hay cookie admin.

Issues sin remediar (intencionalmente):
- **C3** (tags como `text[]` vs Key Entities en spec): se documentará en spec separadamente si el usuario lo pide. Decisión técnica deliberada y razonable.
- **C4** (test de pérdida de conexión): no añadido — autosave usa `fetch` con manejo de error UI; la pérdida de conexión genera un toast pero no se persiste offline. Aceptable en MVP.
- **C8, C11, C17**: confirmadas como falsas alarmas o sin acción.
