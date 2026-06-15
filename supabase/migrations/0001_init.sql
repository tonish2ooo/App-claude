-- App Courses — schéma initial Supabase (PostgreSQL).
--
-- À appliquer dans votre projet Supabase (SQL Editor ou `supabase db push`).
-- Les identifiants sont des `text` car générés côté application (makeId),
-- ce qui évite de réécrire la génération d'ID existante.
-- Tous les prix sont en centimes (entiers).
--
-- Sécurité : RLS activée partout. Une ligne n'est accessible qu'aux membres
-- du foyer (lien via shoppers.auth_user_id = auth.uid()), ce qui permet une
-- liste de courses commune à plusieurs utilisateurs.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id                text primary key,
  name              text not null,
  default_currency  text not null default 'EUR',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.shoppers (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  auth_user_id  uuid references auth.users(id) on delete set null,
  name          text not null,
  emoji         text not null default '🛒',
  color         text not null default '#007aff',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists shoppers_household_idx on public.shoppers(household_id);
create index if not exists shoppers_auth_user_idx on public.shoppers(auth_user_id);

create table if not exists public.products (
  id                       text primary key,
  household_id             text not null references public.households(id) on delete cascade,
  name                     text not null,
  description              text,
  category                 text not null default 'autre',
  brand                    text,
  price_cents              bigint,
  unit                     text,
  barcode                  text,
  image_url                text,
  ticket_resto             text not null default 'unknown', -- eligible | ineligible | unknown
  ticket_resto_overridden  boolean not null default false,
  times_added              integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists products_household_idx on public.products(household_id);

create table if not exists public.list_items (
  id                  text primary key,
  household_id        text not null references public.households(id) on delete cascade,
  product_id          text references public.products(id) on delete set null,
  label               text not null,
  quantity            integer not null default 1,
  unit                text,
  category            text not null default 'autre',
  ticket_resto        text not null default 'unknown',
  checked             boolean not null default false,
  note                text,
  added_by_shopper_id text references public.shoppers(id) on delete set null,
  source              text not null default 'manual', -- voice | manual | catalog
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists list_items_household_idx on public.list_items(household_id);

-- ---------------------------------------------------------------------------
-- Helper d'accès (SECURITY DEFINER pour éviter la récursion RLS sur shoppers)
-- ---------------------------------------------------------------------------

create or replace function public.is_household_member(hid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shoppers s
    where s.household_id = hid and s.auth_user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.shoppers   enable row level security;
alter table public.products   enable row level security;
alter table public.list_items enable row level security;

-- households : lisibles/modifiables par leurs membres ; création libre pour un
-- utilisateur authentifié (qui s'ajoute ensuite comme membre).
create policy households_select on public.households
  for select using (public.is_household_member(id));
create policy households_insert on public.households
  for insert with check (auth.uid() is not null);
create policy households_update on public.households
  for update using (public.is_household_member(id));
create policy households_delete on public.households
  for delete using (public.is_household_member(id));

-- shoppers : un utilisateur peut s'ajouter lui-même (bootstrap) ; les membres
-- d'un foyer gèrent les autres membres.
create policy shoppers_select on public.shoppers
  for select using (public.is_household_member(household_id));
create policy shoppers_insert on public.shoppers
  for insert with check (auth_user_id = auth.uid() or public.is_household_member(household_id));
create policy shoppers_update on public.shoppers
  for update using (public.is_household_member(household_id));
create policy shoppers_delete on public.shoppers
  for delete using (public.is_household_member(household_id));

-- Tables enfant : accès réservé aux membres du foyer.
do $$
declare t text;
begin
  foreach t in array array['products','list_items']
  loop
    execute format('create policy %1$s_select on public.%1$s for select using (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.is_household_member(household_id));', t);
  end loop;
end $$;
