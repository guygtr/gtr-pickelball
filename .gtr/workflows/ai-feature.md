---
description: Standardiser le cycle de vie d'une nouvelle fonctionnalité IA
---

# Workflow : AI Feature 🛠️ (v3.3)

Ce workflow définit les étapes pour concevoir, implémenter et valider une nouvelle fonctionnalité au sein de la GTR-Team.

## Étapes du Workflow

### 1. Initialisation & Planification (Yoda)
1. **Dossier Documentation**
   Créez un fichier `implementation_plan.md` décrivant la fonctionnalité, les composants impactés et le plan de test.
2. **Assignation**
   Assignez la tâche à **Yoda** pour validation de la cohérence globale.

### 2. Validation Stratégique (Elon)
1. **Feu Vert VISION**
   Obtenez le feu vert d'**Elon** pour s'assurer que la feature s'aligne avec la vision du produit.

### 3. Implémentation Core (Pixer Heroes)
1. **Frontend (TombRaider)**
   Céation des composants UI, animations et expérience utilisateur Premium.
2. **Backend (Altair)**
   Implémentation des routes API, Server Actions, schémas Prisma et RLS Supabase.

### 4. Revue de Code & Optimisation (Optimus)
1. **Audit de Clarté**
   Optimus effectue une revue de code pour garantir la performance, la propreté et les commentaires en Français.

### 5. Validation QA (DarthVader & Anakin)
1. **Tests Manuels**
   Validation fonctionnelle par DarthVader.
2. **Tests Automatisés (Optionnel)**
   Ajout de tests unitaires ou d'intégration par Anakin.

### 6. Finalisation & Notification
1. **Walkthrough**
   Générez un `walkthrough.md` pour documenter les changements.
2. **Notification Discord**
   // turbo
   ```powershell
   python d:\GTR-Team\scripts\discord_notify.py "🛠️ Nouvelle fonctionnalité IA finalisée et documentée v3.3 [READY]"
   ```
3. **Release**
   Utilisez le workflow **Release Master** pour pousser en production.
