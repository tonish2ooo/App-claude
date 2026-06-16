-- Comptes du foyer — schéma initial Supabase (PostgreSQL).
--
-- À appliquer dans votre projet Supabase (SQL Editor ou `supabase db push`).
-- Les identifiants sont des `text` car générés côté application (makeId),
-- ce qui évite de réécrire la génération d'ID existante.
-- Tous les montants sont en centimes (entiers). Le mois est "YYYY-MM".
--
-- Sécurité : RLS activée partout. Une ligne n'est accessible qu'aux membres
-- du foyer (lien via members.auth_user_id = auth.uid()).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id                          text primary key,
  name                        text not null,
  current_month               text not null,
  default_currency            text not null default 'EUR',
  mode                        text not null default 'manual',
  manual_common_balance_cents bigint,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table if not exists public.members (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  auth_user_id  uuid references auth.users(id) on delete set null,
  first_name    text not null,
  last_name     text not null default '',
  email         text,
  photo_url     text,
  birth_date    date,
  role          text not null default 'member',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists members_household_idx on public.members(household_id);
create index if not exists members_auth_user_idx on public.members(auth_user_id);

create table if not exists public.incomes (
  id                    text primary key,
  household_id          text not null references public.households(id) on delete cascade,
  user_id               text not null references public.members(id) on delete cascade,
  month                 text not null,
  salary_cents          bigint not null default 0,
  meal_vouchers_cents   bigint not null default 0,
  notes                 text,
  declared_at           text,
  last_edited_by_user_id text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (household_id, user_id, month)
);
create index if not exists incomes_household_idx on public.incomes(household_id);

create table if not exists public.budgets (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  name          text not null,
  amount_cents  bigint not null,
  type          text not null,
  icon          text not null,
  active        boolean not null default true,
  "order"       integer not null default 0,
  split_rule    jsonb not null default '{"mode":"prorata"}'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists budgets_household_idx on public.budgets(household_id);

create table if not exists public.provisions (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  budget_id     text not null references public.budgets(id) on delete cascade,
  month         text not null,
  amount_cents  bigint not null,
  label         text not null,
  source        text not null,
  kind          text not null,
  status        text not null,
  split_rule    jsonb not null,
  contributions jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists provisions_household_idx on public.provisions(household_id);

create table if not exists public.merchants (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  name          text not null,
  address       text,
  phone         text,
  category      text not null default 'autre',
  logo_url      text,
  photo_url     text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists merchants_household_idx on public.merchants(household_id);

create table if not exists public.expenses (
  id                  text primary key,
  household_id        text not null references public.households(id) on delete cascade,
  merchant_id         text references public.merchants(id) on delete set null,
  user_id             text not null references public.members(id) on delete cascade,
  amount_cents        bigint not null,
  currency            text not null default 'EUR',
  payment_source      text not null,
  meal_voucher_user_id text,
  split_rule          jsonb not null,
  date                text not null,
  budget_id           text references public.budgets(id) on delete set null,
  note                text,
  receipt_url         text,
  source              text not null default 'manual',
  external_id         text, -- id de la transaction bancaire (anti-doublon à la synchro)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (household_id, external_id)
);
create index if not exists expenses_household_idx on public.expenses(household_id);
create index if not exists expenses_budget_idx on public.expenses(budget_id);

create table if not exists public.passkeys (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  user_id       text not null references public.members(id) on delete cascade,
  credential_id text not null,
  label         text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
create index if not exists passkeys_household_idx on public.passkeys(household_id);

-- ---------------------------------------------------------------------------
-- Helper d'accès (SECURITY DEFINER pour éviter la récursion RLS sur members)
-- ---------------------------------------------------------------------------

create or replace function public.is_household_member(hid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.household_id = hid and m.auth_user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.members    enable row level security;
alter table public.incomes    enable row level security;
alter table public.budgets    enable row level security;
alter table public.provisions enable row level security;
alter table public.merchants  enable row level security;
alter table public.expenses   enable row level security;
alter table public.passkeys   enable row level security;

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

-- members : un utilisateur peut s'ajouter lui-même (bootstrap) ; les membres
-- d'un foyer gèrent les autres membres.
create policy members_select on public.members
  for select using (public.is_household_member(household_id));
create policy members_insert on public.members
  for insert with check (auth_user_id = auth.uid() or public.is_household_member(household_id));
create policy members_update on public.members
  for update using (public.is_household_member(household_id));
create policy members_delete on public.members
  for delete using (public.is_household_member(household_id));

-- Tables enfant : accès réservé aux membres du foyer.
do $$
declare t text;
begin
  foreach t in array array['incomes','budgets','provisions','merchants','expenses','passkeys']
  loop
    execute format('create policy %1$s_select on public.%1$s for select using (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.is_household_member(household_id));', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.is_household_member(household_id));', t);
  end loop;
end $$;
