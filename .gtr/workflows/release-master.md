---
description: Déploiement atomique, sécurisé et synchronisé vers la production (Standard Fleet Admiral v3.4).
---

# Workflow : Release Master 🚀 (v3.4)

Opéré par **Starship**, ce workflow garantit une livraison sans faille en production. Il intègre tous nos verrous de sécurité et de qualité.

> [!CAUTION]
> Ce workflow **bloque** impérativement si l'un des "Quality Gates" (Sécurité ou Tests) renvoie une erreur.

## Étapes du Workflow (Protocole Fleet Admiral)

### 0. Sanity Cleanup
// turbo
1. **Reset Processus Node**
   ```powershell
   taskkill /F /IM node.exe /T 2>$null; echo "Nettoyage des verrous Node terminé."
   ```

### 1. Synchronisation Fleet (GTR-Sync)
// turbo
1. **Sync Environnement**
   ```powershell
   d:\GTR-Team\gtr-teams-agents\scripts\sync-env.ps1
   ```
2. **Fresh Install & Build**
   ```powershell
   npm ci; npx prisma generate; npm run build
   ```

### 2. Validation & Security Gates
1. **Audit de Sécurité (Full Deep)**
   Exécution du workflow `/security-audit` en mode **Profond** (Starlink & Luke).
2. **Quality Gate (DoD)**
   Exécution du workflow `/quality-gate`. Validation Zod et typage strict.

### 3. Flight Test (Smoke Scan)
1. **Vérification Darth Vader**
   Lancement manuel ou automatisé du workflow `/smoke-test`.
2. **Visual Audit (Optionnel)**
   Si impact UI majeur, lancement de `/ux-ui-audit`.

### 4. Deployment Launch (Starship)
// turbo
1. **Commit de Certification**
   ```powershell
   git add .; git commit -m "rel(fleet): certifiée par Starship v3.4 [MASTER]"; git push origin master
   ```
2. **Vercel Deploy (Production)**
   ```powershell
   npx vercel deploy --prod --yes
   ```

### 5. Finalisation Yoda
1. **Health Check Production**
   Confirmation que le site répond correctement à l'URL finale.
2. **Notification Discord**
   // turbo
   ```powershell
   python d:\\GTR-Team\\scripts\\discord_notify.py "🚀 Release Master v3.4 DÉPLOYÉE avec succès [FLEET STABLE]"
   ```

---

## Rapport Final Yoda
Yoda produit une synthèse finale incluant :
- ✅ **Statut Sécurité** : [PASS]
- ✅ **Statut Build** : [OK]
- 🔗 **URL** : https://[final-url].vercel.app
- 🏆 **Score Performance (Leia)** : Lighthouse OK.
