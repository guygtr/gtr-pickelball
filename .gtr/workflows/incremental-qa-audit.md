---
description: Validation des derniers changements (Bugfixes/Features) et exécution de tests de non-régression.
---

# Workflow : Incremental & Regression QA 🔄🛡️ (v3.3)

Ce workflow est conçu pour garantir qu'aucune régression n'est introduite lors d'une mise à jour mineure. Il mobilise **Darth Vader**, **Leia** et **Mario** pour valider l'incrément tout en sécurisant la stabilité globale du système.

## Étapes du Workflow

### 1. Analyse de l'Incrément (Mario)
1. **Diff Audit**
   Analyser les fichiers modifiés pour identifier les impacts directs sur l'architecture.
2. **Standard de Validation**
   Vérifier que les nouveaux payloads sont validés par Zod et que le typage est strict.
3. **Definition of Done (DoD)**
   S'assurer que les changements respectent les critères de sortie immédiats.

### 2. Smoke Tests & Stabilité (Darth Vader)
1. **Build Verification**
   S'assurer que la solution compile sans erreur (`npm run build`).
2. **Infrastructure Check**
   Vérifier les variables d'environnement et les connexions aux services tiers (Supabase, etc.).
3. **Sceau de Stabilité**
   `**[{DARTHVADER}] → Signaux vitaux opérationnels.**`

### 3. Validation Fonctionnelle & Non-Régression (Leia)
1. **Test de la Feature**
   Tester spécifiquement la nouvelle fonctionnalité ou le correctif selon la User Story.
2. **Suite de Non-Régression**
   Parcours rapide (Smoke scan) des fonctionnalités critiques adjacentes pour vérifier qu'elles n'ont pas été impactées.
3. **Feedback Utilisateur**
   Valider que le changement améliore l'expérience sans introduire de nouvelle friction.

## Sceau de Validation
`**[{MARIO}] | [{DARTHVADER}] | [{LEIA}] → Incrément validé. Prêt pour merge.**`

---
**Standard GTR-Team : Stabilité, Rapidité, Fiabilité.**
