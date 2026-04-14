---
description: Effectuer la validation finale (Definition of Done) avant de clore une tâche ou déployer
---

# Workflow : Quality Gate 🛡️

Ce workflow applique le système Enhanced "Definition of Done". Il doit s'exécuter avant chaque fusion sur la branche master ou la fin d'une tâche importante.

## Étapes du Workflow (Validation Stricte)

1. **Vérification du Context (MASTER_SKILLS)**
   - L'agent charge et lit `d:\GTR-Team\.agents\MASTER_SKILLS.md`.
   - Il valide que les types `any` ne sont pas utilisés, que Zod est en place pour tous les payloads, et que le code ajouté/modifié fait moins de 200 lignes par fichier.

2. **Revue de Sécurité (Starlink/Luke)**
   - Vérification de l'absence de requêtes Base de Données (Prisma) exécutées directement depuis le client.
   - Vérification des RLS si des tables ont été créées/modifiées.

3. **Validation Types & Build**
   // turbo
   ```powershell
   npm run lint; npx tsc --noEmit
   ```

4. **Génération du Rapport DoD**
   - Si les étapes précédentes sont un succès total, l'agent produit le rapport suivant :

   ```markdown
   Definition of Done: PASS

   ☑️ Types & Linting OK
   ☑️ Validation Zod implémentée en entrée/sortie
   ☑️ Commentaires en Français & JSDoc présents
   ☑️ [LUKE] Audit de sécurité validé
   ```

   - Si **FAIL**, l'agent détaille les erreurs et **bloque explicitement** le processus (pas de déploiement, pas de fusion).
