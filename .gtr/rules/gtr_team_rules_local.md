# Règles Spécifiques au Projet — GTR-Pickelball 🎾

Ce fichier définit les contraintes critiques pour garantir l'intégrité du projet Pickleball au sein de l'écosystème GTR.

## 1. Isolation de la Base de Données (CRITIQUE)
- **Schéma PostgreSQL** : Toutes les tables du projet DOIVENT résider dans le schéma `pb`.
- **Isolation Partagée** : Ce projet partage l'instance Supabase avec `GTR-Bourse`. Ne JAMAIS modifier ou lire les tables hors du schéma `pb`.
- **Prisma** : Le `schema.prisma` doit inclure `@@map("pb_tableName")` pour chaque modèle.

## 2. Design System — GTR-Glass 2026
- **Esthétique** : Utiliser exclusivement les tokens GTR-Glass (Glassmorphism, gradients vibrants, flous d'arrière-plan).
- **Mobile-First** : Toute nouvelle interface doit être testée et optimisée pour mobile avant validation desktop.
- **Logo** : Utiliser uniquement `GTR-PickelballNew.png`.

## 3. Architecture & Qualité
- **Server Actions** : Toutes les mutations de données doivent passer par des Server Actions validées par `Zod`.
- **Schémas Zod** : Chaque mutation doit avoir son schéma de validation exporté.
