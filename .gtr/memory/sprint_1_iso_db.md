# Mémoire Technique — Sprint 1 : Isolation PostgreSQL Multi-Schéma 🛡️

Ce document consigne les décisions d'architecture prises pour garantir l'isolation de **GTR-Pickelball** sur une instance Supabase partagée.

## 1. Contexte & Problématique
Le projet partage la même base de données que `GTR-Bourse`. Le risque de collision de noms de tables (`User`, `Profile`, etc.) est critique.

## 2. Solution d'Isolation : Schéma `pb`
Plutôt que d'utiliser des préfixes manuels dans le code, nous utilisons les schémas PostgreSQL natifs.
- **Schéma cible** : `pb`.
- **Mapping Prisma** : Utilisation de l'attribut `@@map` dans `schema.prisma`.

### Configuration Prisma
Nous utilisons le client Prisma v7.6.0 avec support natif multi-schéma.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["pb"]
}
```

## 3. Sécurité & Droits
- L'utilisateur `postgres` (via Supabase) possède les droits sur le schéma `pb`.
- Les migrations (`npx prisma migrate dev`) créent les structures uniquement dans `pb`.

## 4. Maintenance
Toute nouvelle table ajoutée doit impérativement spécifier `@@map("pb_nom_table")` pour maintenir l'isolation physique.
