---
description: Procédure de déploiement sécurisée pour GTR-Pickelball
---

# Workflow de Release — GTR-Pickelball 🚀

Ce workflow doit être suivi lors de chaque montée en version.

## 1. Préparation Supabase
- Vérifier que les migrations Prisma sont synchronisées : `npx prisma db push`.
- S'assurer que le schéma cible est `pb`.

## 2. build Local
// turbo
- Exécuter le build local pour identifier les erreurs TS : `npm run build`.

## 3. Déploiement Vercel
- Pousser sur la branche `master` : `git push origin master`.
- Vérifier le statut du déploiement sur le dashboard Vercel.

## 4. Post-Déploiement
- Tester l'URL de production : [https://pickelball.gtremblay.com](https://pickelball.gtremblay.com).
- Exécuter un test de fumée sur la session utilisateur.
