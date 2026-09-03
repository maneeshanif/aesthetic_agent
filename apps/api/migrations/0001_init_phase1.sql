-- Vespera AI — Phase 1 schema, indexes, triggers, and Row Level Security.
-- Apply to the Supabase Postgres database. See docs/phase-1-architecture.md.
-- Idempotent-ish: safe to re-run on a fresh database.

create extension if not exists pg_trgm;

-- ─────────────────────────────────────────────────────────────
-- Shared: updated_at trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────
-- spas
-- ─────────────────────────────────────────────────────────────
create table if not exists public.spas (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{2,48}$'),
  booking_url  text check (booking_url is null or booking_url ~* '^https?://'),
  timezone     text not null default 'America/New_York',
  pms_provider text not null default 'internal' check (pms_provider in ('internal')),
  status       text not null default 'active' check (status in ('active','suspended')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_spas_updated_at on public.spas;
create trigger trg_spas_updated_at before update on public.spas
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- spa_members
-- ─────────────────────────────────────────────────────────────
create table if not exists public.spa_members (
  id            uuid primary key default gen_random_uuid(),
  spa_id        uuid not null references public.spas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner','manager','front_desk')),
  status        text not null default 'active' check (status in ('active','invited','disabled')),
  invited_email text,
  invited_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (spa_id, user_id)
);

create index if not exists idx_spa_members_user on public.spa_members (user_id);
create index if not exists idx_spa_members_spa  on public.spa_members (spa_id, role);

drop trigger if exists trg_spa_members_updated_at on public.spa_members;
create trigger trg_spa_members_updated_at before update on public.spa_members
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- patients
-- ─────────────────────────────────────────────────────────────
create table if not exists public.patients (
  id                  uuid primary key default gen_random_uuid(),
  spa_id              uuid not null references public.spas(id) on delete cascade,
  full_name           text,
  phone               text check (phone is null or phone ~ '^\+?[0-9 ().-]{7,20}$'),
  email               text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram_handle    text,
  channel             text not null default 'chat_tester'
                        check (channel in ('chat_tester','instagram','web','voice')),
  requested_treatment text,
  status              text not null default 'new'
                        check (status in ('new','qualifying','medically_cleared',
                                          'contraindication_flagged','booked','abandoned')),
  medical_flags       jsonb not null default '[]'::jsonb,
  estimated_value     numeric(10,2) check (estimated_value is null or estimated_value >= 0),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_patients_spa_created on public.patients (spa_id, created_at desc);
create index if not exists idx_patients_spa_status  on public.patients (spa_id, status);
create unique index if not exists uniq_patients_spa_phone
  on public.patients (spa_id, phone) where phone is not null;
create unique index if not exists uniq_patients_spa_email
  on public.patients (spa_id, lower(email)) where email is not null;
create index if not exists idx_patients_spa_name_trgm
  on public.patients using gin (full_name gin_trgm_ops);

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- triage_sessions
-- ─────────────────────────────────────────────────────────────
create table if not exists public.triage_sessions (
  id                 uuid primary key default gen_random_uuid(),
  spa_id             uuid not null references public.spas(id) on delete cascade,
  patient_id         uuid references public.patients(id) on delete set null,
  channel            text not null default 'chat_tester'
                       check (channel in ('chat_tester','instagram','web','voice')),
  status             text not null default 'active'
                       check (status in ('active','qualifying','completed','abandoned','error')),
  external_thread_id text,
  messages           jsonb not null default '[]'::jsonb,
  ai_transcript      jsonb not null default '[]'::jsonb,
  booking_url_issued text,
  last_message_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_sessions_spa_created on public.triage_sessions (spa_id, created_at desc);
create index if not exists idx_sessions_spa_status  on public.triage_sessions (spa_id, status);
create index if not exists idx_sessions_patient     on public.triage_sessions (patient_id);
create unique index if not exists uniq_sessions_spa_thread
  on public.triage_sessions (spa_id, external_thread_id) where external_thread_id is not null;

drop trigger if exists trg_sessions_updated_at on public.triage_sessions;
create trigger trg_sessions_updated_at before update on public.triage_sessions
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- knowledge_documents
-- ─────────────────────────────────────────────────────────────
create table if not exists public.knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  spa_id        uuid not null references public.spas(id) on delete cascade,
  filename      text not null,
  file_type     text not null check (file_type in ('pdf','markdown')),
  storage_path  text,
  byte_size     bigint check (byte_size is null or byte_size >= 0),
  status        text not null default 'uploaded'
                  check (status in ('uploaded','chunking','embedded','failed')),
  chunk_count   integer not null default 0 check (chunk_count >= 0),
  error_message text,
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  embedded_at   timestamptz
);

create index if not exists idx_knowledge_spa_created
  on public.knowledge_documents (spa_id, created_at desc);

drop trigger if exists trg_knowledge_updated_at on public.knowledge_documents;
create trigger trg_knowledge_updated_at before update on public.knowledge_documents
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS helpers + policies
-- ─────────────────────────────────────────────────────────────
create or replace function auth.spa_ids() returns uuid[]
language sql stable as $$
  select coalesce(array(
    select jsonb_array_elements_text(
      coalesce(auth.jwt() -> 'app_metadata' -> 'spa_ids', '[]'::jsonb)
    )::uuid
  ), '{}'::uuid[]);
$$;

create or replace function auth.spa_role(target uuid) returns text
language sql stable as $$
  select auth.jwt() -> 'app_metadata' -> 'memberships' ->> target::text;
$$;

alter table public.spas                enable row level security;
alter table public.spa_members         enable row level security;
alter table public.patients            enable row level security;
alter table public.triage_sessions     enable row level security;
alter table public.knowledge_documents enable row level security;

drop policy if exists spas_select on public.spas;
create policy spas_select on public.spas for select
  using (id = any (auth.spa_ids()));
drop policy if exists spas_update on public.spas;
create policy spas_update on public.spas for update
  using (auth.spa_role(id) in ('owner','manager'))
  with check (auth.spa_role(id) in ('owner','manager'));

drop policy if exists members_select on public.spa_members;
create policy members_select on public.spa_members for select
  using (spa_id = any (auth.spa_ids()));
drop policy if exists members_write on public.spa_members;
create policy members_write on public.spa_members for all
  using (auth.spa_role(spa_id) = 'owner')
  with check (auth.spa_role(spa_id) = 'owner');

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select
  using (spa_id = any (auth.spa_ids()));
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert
  with check (spa_id = any (auth.spa_ids()));
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update
  using (auth.spa_role(spa_id) in ('owner','manager'))
  with check (auth.spa_role(spa_id) in ('owner','manager'));

drop policy if exists sessions_select on public.triage_sessions;
create policy sessions_select on public.triage_sessions for select
  using (spa_id = any (auth.spa_ids()));
drop policy if exists sessions_write on public.triage_sessions;
create policy sessions_write on public.triage_sessions for all
  using (spa_id = any (auth.spa_ids()))
  with check (spa_id = any (auth.spa_ids()));

drop policy if exists knowledge_select on public.knowledge_documents;
create policy knowledge_select on public.knowledge_documents for select
  using (spa_id = any (auth.spa_ids()));
drop policy if exists knowledge_write on public.knowledge_documents;
create policy knowledge_write on public.knowledge_documents for all
  using (auth.spa_role(spa_id) in ('owner','manager'))
  with check (auth.spa_role(spa_id) in ('owner','manager'));

-- Storage bucket for original knowledge files (objects prefixed `<spa_id>/`).
insert into storage.buckets (id, name, public)
values ('knowledge', 'knowledge', false)
on conflict (id) do nothing;
