# Data Model — Blog de artículos

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)

Define el esquema en Supabase Postgres, los tipos TypeScript y los recursos de Supabase Storage. Sin RLS: todo el acceso pasa por API routes / Server Components con `service_role`.

---

## 1. Tablas Postgres

### 1.1 `articles`

Tabla principal del blog. Cada fila = una entrada.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador interno |
| `slug` | `text` | NOT NULL, UNIQUE, índice btree | URL canónica (`/blog/<slug>`); inmutable tras publicar |
| `title` | `text` | NOT NULL, length 1..200 | Título del artículo |
| `summary` | `text` | NOT NULL, length 1..400 | Resumen mostrado en la tarjeta del listado |
| `content_md` | `text` | NOT NULL | Cuerpo en markdown (con GFM) |
| `cover_image_url` | `text` | NULL | URL pública en Supabase Storage; obligatorio para publicar (FR-005) |
| `status` | `text` | NOT NULL, CHECK in (`'draft'`, `'published'`), default `'draft'` | Estado de publicación |
| `tags` | `text[]` | NOT NULL, default `'{}'` | Etiquetas normalizadas (lowercase, slugificadas). Vacío permitido. |
| `reading_time_minutes` | `int` | NOT NULL, default 1, CHECK ≥ 1 | Tiempo de lectura calculado al guardar |
| `author_display_name` | `text` | NOT NULL, default `'Autor'` | Nombre mostrado del autor (MVP: 1 autor) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de última edición |
| `published_at` | `timestamptz` | NULL | Fecha de primera publicación; NULL si nunca publicado |

**Índices adicionales**:
- `idx_articles_status_published_at` sobre `(status, published_at DESC)` — para el listado público.
- `idx_articles_tags` sobre `tags` con tipo `gin` — para filtrado por tag (P3).

**Triggers**:
- `set_updated_at`: BEFORE UPDATE — actualiza `updated_at = now()`.
- `set_published_at_on_first_publish`: BEFORE UPDATE — si `OLD.status = 'draft'` y `NEW.status = 'published'`, setea `NEW.published_at = COALESCE(OLD.published_at, now())`.

**Reglas de negocio (validadas en `articleService.ts` antes de tocar la BD)**:
- Para pasar a `status = 'published'`: `title`, `summary`, `cover_image_url` y `content_md` no pueden estar vacíos.
- El `slug` no se actualiza una vez `published_at` deja de ser NULL (FR-005, assumption del spec).
- Las etiquetas se normalizan con la misma función de slug del título antes de insertar (lowercase, sin acentos, guiones).

### 1.2 ¿Tabla de tags separada?

**No** en el MVP. Las etiquetas viven como `text[]` dentro de `articles`. Razones:
- Simplifica el editor (un solo campo con autocompletado leyendo `DISTINCT unnest(tags)`).
- Filtrar por tag se hace con `WHERE tags @> ARRAY['<tag>']` aprovechando el índice GIN.
- Si en el futuro se quieren atributos por tag (descripción, color), se migra a tabla maestra.

---

## 2. Migración SQL inicial

Se crea como `supabase/migrations/20260430_blog_articles.sql` (o equivalente; si el proyecto no usa la CLI de Supabase, se ejecuta a mano vía SQL Editor):

```sql
create extension if not exists "pgcrypto";

create table if not exists public.articles (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null check (char_length(title) between 1 and 200),
  summary               text not null check (char_length(summary) between 1 and 400),
  content_md            text not null,
  cover_image_url       text,
  status                text not null default 'draft' check (status in ('draft','published')),
  tags                  text[] not null default '{}',
  reading_time_minutes  int    not null default 1 check (reading_time_minutes >= 1),
  author_display_name   text   not null default 'Autor',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  published_at          timestamptz
);

create index if not exists idx_articles_status_published_at
  on public.articles (status, published_at desc);

create index if not exists idx_articles_tags
  on public.articles using gin (tags);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create or replace function public.set_published_at_on_first_publish() returns trigger as $$
begin
  if old.status = 'draft' and new.status = 'published' then
    new.published_at := coalesce(old.published_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_first_publish on public.articles;
create trigger trg_articles_first_publish
  before update on public.articles
  for each row execute function public.set_published_at_on_first_publish();

-- Sin RLS: el acceso público se hace server-side con service_role.
alter table public.articles disable row level security;
```

---

## 3. Supabase Storage

### Bucket `blog-images`

| Atributo | Valor |
|---|---|
| Nombre | `blog-images` |
| Público | **Sí** (lectura anónima) |
| Tamaño máx por objeto | 5 MB |
| MIME permitidos | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |

**Convención de paths**:
```
blog-images/<articleId>/<timestamp>-<originalNameSlugified>.<ext>
```

Esto permite limpiar las imágenes de un artículo borrando recursivamente la carpeta del `articleId` en el `DELETE /api/blog/articles/[id]`.

**`next.config.ts`** debe incluir:

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lheltgehwtavkmdumior.supabase.co',
      pathname: '/storage/v1/object/public/blog-images/**',
    },
  ],
}
```

---

## 4. Tipos TypeScript

`src/types/blog.ts`:

```ts
export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentMd: string;
  coverImageUrl: string | null;
  status: ArticleStatus;
  tags: string[];
  readingTimeMinutes: number;
  authorDisplayName: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  publishedAt: string | null; // ISO 8601 o null
}

// Snapshot de Supabase (snake_case) — usado por articleService.ts internamente
export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_md: string;
  cover_image_url: string | null;
  status: ArticleStatus;
  tags: string[];
  reading_time_minutes: number;
  author_display_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Vista mínima para el listado público (evita cargar content_md)
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: string;
}

export interface CreateArticleInput {
  title: string;
  summary: string;
  contentMd: string;
  coverImageUrl?: string | null;
  tags?: string[];
  status?: ArticleStatus; // default 'draft'
  slug?: string;          // si no se pasa, se genera del título
}

export type UpdateArticleInput = Partial<
  Omit<CreateArticleInput, 'slug'>
> & {
  // El slug puede actualizarse SOLO si el artículo es draft (nunca publicado).
  slug?: string;
};
```

### Mapping Row ↔ Domain

`articleService.ts` expone helpers `rowToArticle(row): Article` y `articleToRow(article): ArticleRow` para mantener la frontera limpia entre la BD (snake_case) y el dominio (camelCase).

---

## 5. State machine: estados de un artículo

```
              ┌───────────┐  publish (con todos los campos válidos)   ┌───────────────┐
   create ──▶ │   DRAFT   │ ───────────────────────────────────────▶ │   PUBLISHED   │
              │           │ ◀─────────────────────────────────────── │               │
              └───────────┘            unpublish                      └───────────────┘
                  │  ▲                                                       │
                  │  │ edit (PATCH)                                          │ edit (PATCH)
                  │  └───────────────────────────────────────────────────────┤
                  │                                                          │
                  ▼                                                          ▼
              ┌───────────┐                                              (no DELETE
              │  DELETED  │ ◀──── delete (sólo si status='draft')         desde published)
              └───────────┘
```

Reglas:
- `DELETE` sólo permitido sobre `draft` (acceptance scenario US3-3).
- `unpublish` ⇒ `status = 'draft'`. `published_at` se preserva (para histórico) pero deja de ser visible públicamente.
- Cambio de slug ⇒ permitido sólo si `published_at IS NULL` (assumption del spec).

---

## 6. Queries clave

**Listado público** (`articleQueries.listPublished`):
```sql
select id, slug, title, summary, cover_image_url, tags,
       reading_time_minutes, published_at
from public.articles
where status = 'published'
order by published_at desc
limit $1 offset $2;
```

**Detalle público** (`articleQueries.getBySlug`):
```sql
select * from public.articles
where slug = $1 and status = 'published'
limit 1;
```
> Devuelve `null` si no existe o si está en `draft` ⇒ el Server Component dispara `notFound()` (404).

**Listado por tag** (`articleQueries.listByTag`, P3):
```sql
select id, slug, title, summary, cover_image_url, tags,
       reading_time_minutes, published_at
from public.articles
where status = 'published' and tags @> array[$1]
order by published_at desc;
```

**Tags existentes** (autocompletado del editor):
```sql
select distinct unnest(tags) as tag from public.articles order by tag;
```

**Conteo para paginación**:
```sql
select count(*) from public.articles where status = 'published';
```

---

## 7. Variables de entorno requeridas

| Variable | Ámbito | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | Ya existente |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Ya existente |
| `BLOG_ADMIN_PASSWORD` | server-only | Contraseña del admin (texto plano en env, NUNCA en código) |
| `BLOG_ADMIN_SESSION_SECRET` | server-only | Secreto HMAC para firmar la cookie (32 bytes random hex) |
| `BLOG_PUBLIC_SITE_URL` | server-only | Base URL de producción (usada en `generateMetadata` y `sitemap.xml`) |

`.env.example` se actualiza con las nuevas variables (sin valores).

`src/lib/env.ts` valida la presencia al arrancar y lanza si faltan en producción.
