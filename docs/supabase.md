# Persistance Supabase

L'application fonctionne **sans backend** par défaut (données en `localStorage`).
Supabase est optionnel et s'active dès que les variables d'environnement sont
renseignées. Aucune clé n'est stockée dans le code.

## 1. Créer le projet

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Récupérez dans **Project Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copiez `.env.example` en `.env.local` et collez ces deux valeurs.
   `.env.local` est ignoré par git (jamais de secret committé).

## 2. Appliquer le schéma

Dans le **SQL Editor** de Supabase, exécutez le contenu de
`supabase/migrations/0001_init.sql` (ou `supabase db push` avec la CLI).

Le schéma crée les tables (`households`, `shoppers`, `products`, `list_items`)
et active la **RLS** : chaque ligne n'est accessible qu'aux membres du foyer,
via le lien `shoppers.auth_user_id = auth.uid()`. C'est ce qui permet à
plusieurs utilisateurs de partager la même liste de courses.

## 3. Authentification

Activez le provider **Email** dans **Authentication → Providers**.
À la première connexion, l'utilisateur crée son foyer puis est inséré comme
`shopper` lié à son `auth.uid()`, ce qui lui ouvre l'accès via la RLS.

## Modèle de fonctionnement

- **Sans** `.env.local` → `isSupabaseConfigured()` renvoie `false`, tout reste
  en `localStorage`.
- **Avec** Supabase configuré → l'app lit/écrit dans Postgres et synchronise
  entre appareils.

## Sécurité

- Aucune clé dans le dépôt : uniquement `.env.local` (git-ignored).
- La `service_role` key ne doit **jamais** être exposée côté client ; seule la
  clé `anon` (protégée par la RLS) est utilisée par le navigateur.
