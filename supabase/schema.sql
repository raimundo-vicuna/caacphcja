-- ============================================================
--  Centro de Alumnos · esquema de base de datos para Supabase
-- ============================================================

-- ── Administradores ─────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$ begin
  if to_regclass('public.admin_users') is not null then
    insert into public.admins (user_id, created_at)
    select user_id, created_at from public.admin_users
    on conflict (user_id) do nothing;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── Preferencias personales de notificaciones ───────────────
-- Cada administrador decide qué tipos de mensajes recibe por correo.
create table if not exists public.admin_notification_preferences (
  user_id uuid primary key references public.admins(user_id) on delete cascade,
  enabled boolean not null default true,
  kinds text[] not null default array['Sugerencia','Reclamo','Propuesta','Consulta']::text[],
  updated_at timestamptz not null default now(),
  constraint admin_notification_kinds_chk check (
    kinds <@ array['Sugerencia','Reclamo','Propuesta','Consulta']::text[]
  )
);

-- ── Ajustes de la página ─────────────────────────────────────
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ── Noticias ─────────────────────────────────────────────────
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  body text not null default '',
  image_url text,
  published boolean not null default true,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── Eventos ──────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  event_date date not null,
  created_at timestamptz not null default now()
);

-- ── Propuestas y proyectos ───────────────────────────────────
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null default '',
  status text not null default 'En curso',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Directiva ────────────────────────────────────────────────
create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  name text not null default '',
  course text not null default '',
  photo_url text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Sugerencias (buzón) ──────────────────────────────────────
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  course text not null default '',
  kind text not null default 'Sugerencia',
  message text not null,
  read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  constraint suggestions_kind_chk check (kind in ('Sugerencia','Reclamo','Propuesta','Consulta')),
  constraint suggestions_len_chk check (char_length(message) between 1 and 2000
    and char_length(name) <= 100 and char_length(course) <= 50)
);
create index if not exists suggestions_created_idx on public.suggestions (created_at desc);

-- Tabla antigua conservada por compatibilidad; las notificaciones nuevas
-- ya no usan destinatarios manuales, sino todos los administradores.
create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Seguridad por filas (RLS) ────────────────────────────────
alter table public.admins enable row level security;
alter table public.admin_notification_preferences enable row level security;
alter table public.site_settings enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.proposals enable row level security;
alter table public.board_members enable row level security;
alter table public.suggestions enable row level security;
alter table public.notification_recipients enable row level security;

drop policy if exists "admins ver propia" on public.admins;
create policy "admins ver propia" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "preferencias ver propias" on public.admin_notification_preferences;
create policy "preferencias ver propias" on public.admin_notification_preferences
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "preferencias crear propias" on public.admin_notification_preferences;
create policy "preferencias crear propias" on public.admin_notification_preferences
  for insert to authenticated with check (user_id = auth.uid() and public.is_admin());
drop policy if exists "preferencias editar propias" on public.admin_notification_preferences;
create policy "preferencias editar propias" on public.admin_notification_preferences
  for update to authenticated using (user_id = auth.uid() and public.is_admin())
  with check (user_id = auth.uid() and public.is_admin());

drop policy if exists "settings lectura" on public.site_settings;
create policy "settings lectura" on public.site_settings for select using (true);
drop policy if exists "settings admin" on public.site_settings;
create policy "settings admin" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "news lectura" on public.news;
create policy "news lectura" on public.news for select using (published = true or public.is_admin());
drop policy if exists "news admin" on public.news;
create policy "news admin" on public.news
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "events lectura" on public.events;
create policy "events lectura" on public.events for select using (true);
drop policy if exists "events admin" on public.events;
create policy "events admin" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "proposals lectura" on public.proposals;
create policy "proposals lectura" on public.proposals for select using (true);
drop policy if exists "proposals admin" on public.proposals;
create policy "proposals admin" on public.proposals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "board lectura" on public.board_members;
create policy "board lectura" on public.board_members for select using (true);
drop policy if exists "board admin" on public.board_members;
create policy "board admin" on public.board_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "suggestions enviar" on public.suggestions;
create policy "suggestions enviar" on public.suggestions
  for insert to anon, authenticated
  with check (read = false and archived = false);
drop policy if exists "suggestions admin" on public.suggestions;
create policy "suggestions admin" on public.suggestions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- La tabla antigua solo se mantiene para no romper instalaciones existentes.
drop policy if exists "notification recipients admin" on public.notification_recipients;
create policy "notification recipients admin" on public.notification_recipients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$ begin
  alter publication supabase_realtime add table public.suggestions;
exception when duplicate_object then null; end $$;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media lectura" on storage.objects;
create policy "media lectura" on storage.objects
  for select using (bucket_id = 'media');
drop policy if exists "media subir" on storage.objects;
create policy "media subir" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media editar" on storage.objects;
create policy "media editar" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media borrar" on storage.objects;
create policy "media borrar" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- Primer administrador: ejecuta esto después de crear su usuario Auth.
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'tu-correo@ejemplo.cl';
