-- 002-blog-articles: tabla `articles`, índices, triggers
-- Aplicar en Supabase SQL Editor (panel) o vía CLI.
-- Sin RLS: todo el acceso pasa por API routes / Server Components con service_role.

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

alter table public.articles disable row level security;
