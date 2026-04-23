-- ============================================================
-- BotanicCatalog — Full Database Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type climate_type as enum (
  'tropical', 'arid', 'temperate', 'continental', 'polar', 'mediterranean'
);

create type duration_type as enum (
  'annual', 'biennial', 'perennial'
);

create type plant_status as enum (
  'pending', 'approved', 'rejected'
);

create type staff_role as enum (
  'super_admin', 'editor', 'reader'
);

-- ============================================================
-- USERS (public profile — extends Supabase auth.users)
-- ============================================================

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text not null unique,
  email       text not null unique,
  bio         text,
  social_links jsonb default '{}',
  created_at  timestamptz default now()
);

-- Index for fast username lookup
create index users_username_idx on public.users (username);

-- Enforce lowercase usernames
alter table public.users
  add constraint users_username_lowercase check (username = lower(username));

-- Enforce username format: alphanumeric + underscore, 3–30 chars
alter table public.users
  add constraint users_username_format check (username ~ '^[a-z0-9_]{3,30}$');

-- ============================================================
-- PLANTS
-- ============================================================

create table public.plants (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  description    text not null,
  origin_country text not null,
  climate        climate_type not null,
  duration       duration_type not null,
  tags           text[] not null default '{}',
  image_url      text not null,
  user_id        uuid not null references public.users(id) on delete cascade,
  status         plant_status not null default 'pending',
  -- Snapshot of original submission for "restore original" feature
  original_data  jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index plants_user_id_idx   on public.plants (user_id);
create index plants_status_idx    on public.plants (status);
create index plants_climate_idx   on public.plants (climate);
create index plants_duration_idx  on public.plants (duration);
create index plants_country_idx   on public.plants (origin_country);
-- GIN index for tag array filtering
create index plants_tags_idx      on public.plants using gin (tags);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plants_updated_at
  before update on public.plants
  for each row execute function update_updated_at();

-- ============================================================
-- STAFF USERS
-- ============================================================

create table public.staff_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  role       staff_role not null default 'reader',
  created_at timestamptz default now()
);

-- ============================================================
-- ACTION LOGS
-- ============================================================

create table public.action_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index action_logs_user_id_idx    on public.action_logs (user_id);
create index action_logs_entity_idx     on public.action_logs (entity_type, entity_id);
create index action_logs_created_at_idx on public.action_logs (created_at desc);

-- ============================================================
-- CONTENT (multi-language editable texts)
-- ============================================================

create table public.content (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null,
  lang       text not null default 'es',
  value      text not null,
  updated_at timestamptz default now(),
  unique (key, lang)
);

create index content_key_lang_idx on public.content (key, lang);

create trigger content_updated_at
  before update on public.content
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users        enable row level security;
alter table public.plants       enable row level security;
alter table public.staff_users  enable row level security;
alter table public.action_logs  enable row level security;
alter table public.content      enable row level security;

-- Helper: check if current user is staff
create or replace function is_staff()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.staff_users
    where id = auth.uid()
  );
$$;

-- Helper: get staff role
create or replace function staff_role()
returns staff_role language sql security definer as $$
  select role from public.staff_users where id = auth.uid();
$$;

-- ── users ──────────────────────────────────────────────────
-- Anyone can read public profiles
create policy "users: public read"
  on public.users for select using (true);

-- Users can update their own profile
create policy "users: self update"
  on public.users for update using (auth.uid() = id);

-- Insert handled by trigger (see below)

-- ── plants ─────────────────────────────────────────────────
-- Approved plants are publicly visible
create policy "plants: public read approved"
  on public.plants for select
  using (status = 'approved' or auth.uid() = user_id or is_staff());

-- Authenticated users can submit plants
create policy "plants: authenticated insert"
  on public.plants for insert
  with check (auth.uid() = user_id);

-- Authors can update their own pending plants
create policy "plants: author update pending"
  on public.plants for update
  using (auth.uid() = user_id and status = 'pending');

-- Staff can update any plant
create policy "plants: staff update"
  on public.plants for update using (is_staff());

-- Staff can delete
create policy "plants: staff delete"
  on public.plants for delete using (is_staff());

-- ── staff_users ────────────────────────────────────────────
-- Only staff can read the staff list
create policy "staff_users: staff read"
  on public.staff_users for select using (is_staff());

-- Only super_admin can manage staff
create policy "staff_users: super_admin manage"
  on public.staff_users for all
  using (staff_role() = 'super_admin');

-- ── action_logs ────────────────────────────────────────────
create policy "action_logs: staff read"
  on public.action_logs for select using (is_staff());

create policy "action_logs: staff insert"
  on public.action_logs for insert with check (is_staff());

-- ── content ────────────────────────────────────────────────
create policy "content: public read"
  on public.content for select using (true);

create policy "content: staff write"
  on public.content for all using (is_staff());

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, name, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'username', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- SEED: default content entries (Spanish fallback)
-- ============================================================

insert into public.content (key, lang, value) values
  ('home.hero.title',    'es', 'Descubre el mundo de las plantas'),
  ('home.hero.subtitle', 'es', 'Un catálogo colaborativo de flora del mundo entero'),
  ('nav.catalog',        'es', 'Catálogo'),
  ('nav.submit',         'es', 'Enviar planta'),
  ('nav.login',          'es', 'Iniciar sesión'),
  ('nav.register',       'es', 'Registrarse')
on conflict (key, lang) do nothing;
