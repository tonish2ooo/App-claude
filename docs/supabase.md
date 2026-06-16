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

Pour la **sauvegarde / synchronisation cloud**, exécutez dans le **SQL Editor**
le contenu de `supabase/migrations/0002_state.sql` (table `app_state` + RLS).
C'est le seul schéma nécessaire pour la sauvegarde cloud.

Le schéma normalisé `supabase/migrations/0001_init.sql` (tables séparées avec
RLS par foyer) reste **optionnel**, pour une évolution future vers un partage
multi-comptes.

### Utiliser la synchronisation
Une fois `.env.local` renseigné et le schéma appliqué, ouvrez
**Profil → Paramètres → Synchronisation cloud** : créez un compte / connectez-vous,
puis « Sauvegarder dans le cloud » et « Restaurer depuis le cloud ».

Le schéma crée les tables (`households`, `members`, `incomes`, `budgets`,
`provisions`, `merchants`, `expenses`, `passkeys`) et active la **RLS** :
chaque ligne n'est accessible qu'aux membres du foyer, via le lien
`members.auth_user_id = auth.uid()`.

## 3. Authentification

Activez le provider **Email** dans **Authentication → Providers**.
À la première connexion, l'utilisateur crée son foyer puis est inséré comme
`member` lié à son `auth.uid()`, ce qui lui ouvre l'accès via la RLS.

## Modèle de fonctionnement

- **Sans** `.env.local` → `isSupabaseConfigured()` renvoie `false`, tout reste
  en `localStorage`.
- **Avec** Supabase configuré → l'app lit/écrit dans Postgres et synchronise
  entre appareils.

## Sécurité

- Aucune clé dans le dépôt : uniquement `.env.local` (git-ignored).
- Pas de donnée biométrique stockée (les passkeys ne référencent qu'un
  identifiant opaque de credential).
- La `service_role` key ne doit **jamais** être exposée côté client ; seule la
  clé `anon` (protégée par la RLS) est utilisée par le navigateur.
