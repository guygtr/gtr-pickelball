---
description: Diagnostic quotidien de l'état de santé du projet
---

# Daily Health Check — GTR-Pickelball 🏥

Ce workflow automatise les vérifications de routine pour prévenir les régressions.

## 1. Audit Technique
// turbo
- Vérification des types TS : `npx tsc --noEmit`.
- Linting du code : `npm run lint`.

## 2. État Supabase
- Vérification de la connectivité Prisma.
- Consultation des logs Supabase pour d'éventuelles erreurs de schéma.

## 3. Revue de la Dette Technique
- Identifier les composants avec typage `any`.
- Vérifier la présence de TODO dans le code.

## 4. Statut Git
- S'assurer que la branche locale est synchronisée.
