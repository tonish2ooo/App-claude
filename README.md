# App Courses

Liste de courses **dictée à la voix**, partagée entre plusieurs utilisateurs,
avec un **filtre tickets restaurant** et une **base de données de produits**
(mobile-first, Next.js 14 + TypeScript + Tailwind).

L'app fonctionne hors-ligne (localStorage) par défaut ; Supabase est optionnel
pour synchroniser une liste commune entre plusieurs téléphones.

## Fonctionnalités

- 🎤 **Dictée vocale** : un gros bouton micro (Web Speech API) transforme la
  parole en articles. L'analyseur comprend les quantités et unités
  (« deux litres de lait », « trois baguettes », « un kilo de carottes »).
- 🛒 **Liste de courses** rangée par rayon, avec quantités, articles cochables
  et regroupement automatique des doublons.
- 🎫 **Filtre tickets restaurant** : n'afficher que les produits éligibles au
  paiement par titre-restaurant en France (ou les exclure). L'éligibilité est
  estimée automatiquement à partir du libellé et reste corrigeable à la main.
- 👥 **Multi-utilisateurs** : plusieurs membres partagent une même liste ;
  chaque ajout est attribué à son auteur.
- 📦 **Base de produits** : chaque article dicté crée/enrichit une fiche produit
  (nom descriptif, marque, prix, rayon, unité, code-barres, éligibilité TR).
  Les fiches peuvent être réutilisées en un tap pour remplir la liste.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # vérification TypeScript
npm test           # tests unitaires (Vitest)
```

> La reconnaissance vocale nécessite un navigateur compatible (Chrome, Edge,
> Safari) et l'autorisation d'accès au micro. Une saisie texte de secours est
> toujours disponible.

## Persistance (optionnelle)

Voir [`docs/supabase.md`](docs/supabase.md). Sans configuration, tout est
stocké dans le navigateur.

## Pistes d'évolution

- Synchronisation temps réel multi-appareils (Supabase Realtime).
- Suggestions de prix et historique d'achats par produit.
- Scan de code-barres (caméra) pour retrouver/créer une fiche produit.
- Estimation du total du panier et de la part payable en tickets restaurant.
- Listes multiples (courses hebdo, drive, occasions) et modèles récurrents.
