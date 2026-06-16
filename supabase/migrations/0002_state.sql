-- Comptes du foyer — stockage cloud de l'état (sauvegarde / synchronisation).
--
-- Approche pragmatique : l'état applicatif complet (le même objet qu'en
-- localStorage) est stocké en JSON, une ligne par utilisateur authentifié.
-- RLS stricte : chacun n'accède qu'à sa propre ligne.
--
-- À exécuter dans le SQL Editor de Supabase (suffit pour la sauvegarde cloud ;
-- le schéma normalisé 0001_init.sql reste optionnel / pour une évolution
-- ultérieure vers un partage multi-comptes).

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy app_state_select on public.app_state
  for select using (user_id = auth.uid());
create policy app_state_insert on public.app_state
  for insert with check (user_id = auth.uid());
create policy app_state_update on public.app_state
  for update using (user_id = auth.uid());
create policy app_state_delete on public.app_state
  for delete using (user_id = auth.uid());
