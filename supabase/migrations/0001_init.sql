-- TOP PADEL ALICANTE — initial schema for admin-editable content.
-- Run this once in the Supabase SQL Editor (or `supabase db push` if the
-- project is linked). Safe to re-run: every statement is idempotent.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- cards — homepage category cards ("Турниры", "Ближайшая игра", ...)
-- ---------------------------------------------------------------------------
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  title text not null,
  subtitle text,
  href text not null default '#',
  image_path text,
  focus text,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- article_categories / articles — Padel Journal
-- ---------------------------------------------------------------------------
create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_id uuid references public.article_categories(id) on delete set null,
  image_path text,
  body text not null default '',
  seo_title text,
  seo_description text,
  published_at date not null default current_date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_category_id_idx on public.articles(category_id);

-- ---------------------------------------------------------------------------
-- games — игры / мероприятия
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  format text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  description text,
  image_path text,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  spots_total int,
  spots_taken int,
  signup_href text not null default '#',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- price_packages — цены и пакеты тренировок
-- ---------------------------------------------------------------------------
create table if not exists public.price_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(10, 2) not null,
  currency text not null default 'EUR',
  unit text,
  description text,
  features text[] not null default '{}',
  featured boolean not null default false,
  cta_label text not null default 'Записаться',
  cta_href text not null default '#',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- gallery_categories / gallery_photos
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.gallery_categories(id) on delete set null,
  image_path text not null,
  alt text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_category_id_idx on public.gallery_photos(category_id);

-- ---------------------------------------------------------------------------
-- site_settings — singleton row (global title / description / favicon)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_title text not null default 'TOP PADEL ALICANTE',
  site_description text not null default '',
  favicon_path text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, site_title, site_description)
values (
  1,
  'TOP PADEL ALICANTE — падел объединяет людей',
  'Тренировки для любого уровня, турниры и игровые встречи каждую неделю в Аликанте. Учись, играй и становись сильнее.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- seo_pages — SEO title/description for static routes (home, /games, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.seo_pages (
  page_slug text primary key,
  title text,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.seo_pages (page_slug, title, description) values
  ('/', 'TOP PADEL ALICANTE — падел объединяет людей',
   'Тренировки для любого уровня, турниры и игровые встречи каждую неделю в Аликанте. Учись, играй и становись сильнее.'),
  ('/games', 'Игры и мероприятия — TOP PADEL ALICANTE',
   'Турниры, мексикано и игровые встречи в Аликанте. Смотри расписание и записывайся.'),
  ('/prices', 'Цены и пакеты тренировок — TOP PADEL ALICANTE',
   'Стоимость тренировок и абонементов в TOP PADEL ALICANTE.'),
  ('/gallery', 'Галерея — TOP PADEL ALICANTE',
   'Фото с тренировок, турниров и игр TOP PADEL ALICANTE в Аликанте.')
on conflict (page_slug) do nothing;

-- ---------------------------------------------------------------------------
-- Storage — public bucket for all admin-uploaded media
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security — anonymous/public read only; all writes go through
-- the service-role key from Server Actions, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
alter table public.cards enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.games enable row level security;
alter table public.price_packages enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.site_settings enable row level security;
alter table public.seo_pages enable row level security;

drop policy if exists "public read" on public.cards;
create policy "public read" on public.cards for select using (true);

drop policy if exists "public read" on public.article_categories;
create policy "public read" on public.article_categories for select using (true);

-- Only published articles are readable with the anon/publishable key.
-- Admin reads (including drafts) go through the service-role key instead.
drop policy if exists "public read published" on public.articles;
create policy "public read published" on public.articles for select using (published = true);

drop policy if exists "public read" on public.games;
create policy "public read" on public.games for select using (true);

drop policy if exists "public read" on public.price_packages;
create policy "public read" on public.price_packages for select using (true);

drop policy if exists "public read" on public.gallery_categories;
create policy "public read" on public.gallery_categories for select using (true);

drop policy if exists "public read" on public.gallery_photos;
create policy "public read" on public.gallery_photos for select using (true);

drop policy if exists "public read" on public.site_settings;
create policy "public read" on public.site_settings for select using (true);

drop policy if exists "public read" on public.seo_pages;
create policy "public read" on public.seo_pages for select using (true);

-- ---------------------------------------------------------------------------
-- Base table privileges — RLS policies only apply on top of these. Without
-- an explicit GRANT, Postgres denies `anon`/`authenticated` before RLS is
-- even evaluated ("permission denied for table ..."). `service_role` already
-- bypasses RLS entirely but still needs base privileges.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.cards to anon, authenticated;
grant select on public.article_categories to anon, authenticated;
grant select on public.articles to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select on public.price_packages to anon, authenticated;
grant select on public.gallery_categories to anon, authenticated;
grant select on public.gallery_photos to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.seo_pages to anon, authenticated;

grant all on public.cards to service_role;
grant all on public.article_categories to service_role;
grant all on public.articles to service_role;
grant all on public.games to service_role;
grant all on public.price_packages to service_role;
grant all on public.gallery_categories to service_role;
grant all on public.gallery_photos to service_role;
grant all on public.site_settings to service_role;
grant all on public.seo_pages to service_role;
