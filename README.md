# GTR-Pickelball 🥒🎾

La plateforme moderne de gestion de ligues de Pickleball par la **GTR-Team**. 🛸

## Architecture GTR-2026 👽

Le projet suit une **Architecture 3-couches** stricte pour garantir l'isolation de la logique métier et la sécurité des données.

1. **Couche UI (React/Next.js)** : Composants dynamiques et responsives conçus pour la performance mobile.
   - Localisation : `src/app`, `src/components`.
2. **Couche Actions / Validation (Zod)** : Server Actions Next.js avec validation systématique des entrées via schémas Zod.
   - Localisation : `src/actions`, `src/lib/validations`.
3. **Couche Domaine (Business Logic)** : Cœur algorithmique isolé (ex: Matchmaking Monte-Carlo).
   - Localisation : `src/lib/domain`.
4. **Couche Données (Prisma/Supabase)** : Persistance PostgreSQL avec Prisma ORM.
   - Localisation : `prisma/schema.prisma`.

## Standards Techniques

- **Langue** : Français exclusif pour les commentaires, la documentation technique et les messages d'erreur utilisateurs.
- **Typage** : TypeScript strict. Interdiction formelle du type `any`.
- **Validation** : Zod obligatoire pour toutes les interfaces d'écriture en base de données.
- **Matchmaking** : Algorithme Monte-Carlo paramétrable via le champ `iterations` configure en base de données pour chaque session.

## Développement Local

```bash
# Installation des dépendances
npm install

# Synchronisation de la base de données
npx prisma db push

# Lancement du serveur de développement
npm run dev
```

## Déploiement

Le projet est optimisé pour un déploiement sur **Vercel** avec synchronisation automatique via le workflow GTR-Team.
