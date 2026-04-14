---
description: Création standardisée d'une nouvelle feature GTR-Team (v3.4 - Architecture 3-Tiers Strict).
---

# Workflow : Create Feature 🚀 (v3.4)

Ce workflow automatise le lancement d'une nouvelle fonctionnalité selon nos règles d'architecture (Composant UI -> Server Action -> Data Logic).

## Étapes de Scaffolding

1. **Identification**
   Demander le nom de la feature (ex: `billing-dashboard`) et identifier le dossier cible dans `src/`.

2. **Génération de la Structure (Mario)**
   // turbo
   Créer l'arborescence suivante :
   - `src/features/[name]/components/` : Composants UI (Client/Server).
   - `src/features/[name]/actions/` : Server Actions sécurisées.
   - `src/features/[name]/lib/validations/` : Schémas **Zod** (Obligatoires).
   - `src/features/[name]/types.ts` : Interfaces TypeScript strictes.

3. **Boilerplate Architecture (Optimus)**
   - **Validation** : Créer `lib/validations/schema.ts` avec un schéma Zod de base.
   - **Action** : Créer `actions/index.ts` avec une structure de Server Action sécurisée (`use server`) et validation Zod intégrée.
   - **UI** : Créer le composant d'entrée avec le style "GTR-Glass" et appel à l'Action.

4. **Documentation (C-3PO)**
   - Ajouter des blocs JSDoc en **Français** pour chaque fonction exportée.
   - Mettre à jour le fichier d'export central si nécessaire.

5. **Validation Technique (Starship)**
   // turbo
   ```powershell
   npm run build
   ```
   Vérifier que le scaffolding est 100% fonctionnel et typé.

---
**Standard GTR-Team : La structure est la base de la sécurité.**
