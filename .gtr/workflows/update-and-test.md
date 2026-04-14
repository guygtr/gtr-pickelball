---
description: Mettre à jour automatiquement les composantes d’un projet (dépendances, Prisma, Next.js) et vérifier la non-régression.
---

# Workflow : MAJ Composantes & QA 🚀 (v3.3)

Ce workflow automatise la mise à jour des dépendances, la migration de la base de données et la validation complète (sécurité, tests, performance).

## Agents Impliqués
- **Yoda** : Orchestrateur principal.
- **Mario** : Validation architecture et compatibilité.
- **Starship** : Exécution des commandes techniques.
- **Anakin + Leia** : Tests automatisés et performance (Lighthouse).
- **Luke + Starlink** : Audit de sécurité complet.

## Étapes du Workflow

### 1. Planification & Audit Pré-MAJ
1. **Analyse package.json**
   Mario identifie les mises à jour critiques (Next.js 16, Prisma 6).
2. **Scan de Sécurité Inicial**
   Luke établit une base de référence via `npm audit`.

### 2. Mise à jour & Migration (Starship)
// turbo
```powershell
npm update; npx prisma generate; npx prisma db push --accept-data-loss=false
```

### 3. Tests de Non-Régression
// turbo
1. **Unit & Integration Tests**
   ```powershell
   npm test
   ```
2. **E2E Tests (Playwright)**
   ```powershell
   npx playwright test
   ```

### 4. Audit Post-MAJ & Performance
1. **Re-validation Sécurité**
   Luke + Starlink vérifient RLS et JWT après les MAJ.
2. **Scan Performance (Leia)**
   Vérifier que le build est toujours optimal.

### 5. Rapport & Documentation
1. **Rapport Documentation (C-3PO)**
   Mettre à jour le `README.md` et générer le rapport final.
2. **Sceau de Yoda**
   `**[{YODA}] → Système mis à jour et validé. Statut: STABLE.**`

---
> [!IMPORTANT]
> Aucune mise à jour ne doit être poussée sans la triple validation de **Mario**, **Optimus** et **Luke**.
