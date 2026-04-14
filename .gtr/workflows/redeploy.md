---
description: Déploiement ou redéploiement manuel rapide sur Vercel après modification locale.
---

Ce workflow sécurise le déploiement manuel en production ou staging tout en utilisant le mode Turbo pour les opérations locales de build.

1. Vérifier si le projet est lié à une CLI Vercel. Demander à l'utilisateur si besoin.
// turbo
2. Lancer un nettoyage temporaire (`npx rimraf .next`).
// turbo
3. Lancer un build de validation local : `npm run build`. S'il échoue, arrêter le workflow et avertir l'utilisateur.
// turbo
4. Si le build réussit, exécuter la commande de déploiement Vercel : `vercel --prod`. (L'utilisateur devra potentiellement s'authentifier si c'est la première fois).
5. Fournir l'URL générée par Vercel à l'utilisateur.
