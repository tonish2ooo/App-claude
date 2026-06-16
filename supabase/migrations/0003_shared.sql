-- Comptes du foyer — partage d'un foyer entre plusieurs comptes.
--
-- Modèle : un état JSON unique par foyer (shared_state), une table
-- d'appartenance (household_members), et des codes d'invitation. L'accès en
-- lecture/écriture à l'état est réservé aux membres (RLS). La création, la
-- génération d'invitation et l'adhésion passent par des fonctions SECURITY
-- DEFINER (contournent la RLS de façon contrôlée).
--
-- À exécuter dans le SQL Editor de Supabase (après 0002).

create extension if not exists pgcrypto;

create table if not exists public.shared_state (
  household_id uuid primary key default gen_random_uuid(),
  state        jsonb not null,
  updated_at   timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.shared_state(household_id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_invites (
  code         text primary key,
  household_id uuid not null references public.shared_state(household_id) on delete cascade,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);

-- Helper d'appartenance (SECURITY DEFINER → pas de récursion RLS).
create or replace function public.is_household_member(hid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;

alter table public.shared_state      enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

create policy shared_state_select on public.shared_state
  for select using (public.is_household_member(household_id));
create policy shared_state_update on public.shared_state
  for update using (public.is_household_member(household_id));

create policy members_select on public.household_members
  for select using (public.is_household_member(household_id));

-- Création d'un foyer partagé avec un état initial ; l'appelant en devient membre.
create or replace function public.create_household(initial_state jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.shared_state (state) values (initial_state) returning household_id into hid;
  insert into public.household_members (household_id, user_id) values (hid, auth.uid());
  return hid;
end; $$;

-- Génère un code d'invitation (réservé aux membres), valable 7 jours.
create or replace function public.create_invite(hid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_household_member(hid) then raise exception 'not a member'; end if;
  c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.household_invites (code, household_id, created_by, expires_at)
    values (c, hid, auth.uid(), now() + interval '7 days');
  return c;
end; $$;

-- Rejoint un foyer via un code d'invitation.
create or replace function public.join_household(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select household_id into hid from public.household_invites
    where code = upper(invite_code) and (expires_at is null or expires_at > now());
  if hid is null then raise exception 'invalid or expired code'; end if;
  insert into public.household_members (household_id, user_id)
    values (hid, auth.uid()) on conflict do nothing;
  return hid;
end; $$;

-- Foyer partagé de l'utilisateur courant (null s'il n'en a pas).
create or replace function public.my_household()
returns uuid language sql security definer set search_path = public as $$
  select household_id from public.household_members
  where user_id = auth.uid() order by joined_at limit 1;
$$;

grant execute on function public.create_household(jsonb) to authenticated;
grant execute on function public.create_invite(uuid) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.my_household() to authenticated;
