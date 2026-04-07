---
description: Sécuriser et automatiser le déploiement sur Vercel via GitHub (Fusion v3.3)
---

# Workflow : Release Master 🚀 (v3.3)

Ce workflow est opéré par **Starship** pour garantir un déploiement atomique, sécurisé et parfaitement synchronisé avec Vercel. Il fusionne le déploiement standard et le redéploiement d'urgence.

> [!CAUTION]
> Ce workflow **bloque** impérativement si le build échoue ou si le Quality Gate renvoie une erreur.

## Étapes du Workflow (Protocole Fleet Admiral)

### 0. Cleanup (Optionnel)
// turbo
1. **Arrêt des processus Node**
   ```powershell
   taskkill /F /IM node.exe /T 2>$null; echo "Nettoyage Node terminé."
   ```

### 1. Préparation & Sync (GTR-Sync)
// turbo
1. **Synchronisation de l'environnement**
   Garantit que les secrets `.env` sont à jour sur Vercel via le script central.
   ```powershell
   d:\GTR-Team\gtr-teams-agents\scripts\sync-env.ps1
   ```
2. **Installation & Génération**
   ```powershell
   npm ci; npx prisma generate
   ```

### 2. Validation & Security (Quality Gate)
1. **Audit de Sécurité**
   Exécution du workflow `/security-review`.
2. **Definition of Done**
   Exécution du workflow `/quality-gate`.

### 3. Build & Flight Test
// turbo
1. **Build de Production**
   ```powershell
   npm run build
   ```
2. **Smoke Tests Locaux**
   ```powershell
   npm run dev
   ```
   *Vérification rapide par DarthVader.*

### 4. Deployment Launch
// turbo
1. **Commit & Push (GitHub)**
   ```powershell
   git add .; git commit -m "rel(fleet): master release validated by Starship"; git push origin master
   ```
2. **Vercel Deploy (Production)**
   ```powershell
   npx vercel deploy --prod --yes
   ```

### 5. Post-Flight & Notification
1. **Health Check**
   Vérifier que l'URL de production répond (HTTP 200).
2. **Notification Discord**
   // turbo
   ```powershell
   python d:\GTR-Team\scripts\discord_notify.py "🚀 Release Master déployée avec succès v3.3 [STABLE]"
   ```

---

## Résumé Final par **[YODA]**

Yoda produit un résumé structuré après chaque release :
- ✅ **Sync Env** : Réussi / ❌ Échoué
- ✅ **Quality Gate** : PASS / ❌ FAIL
- 🔗 **URL Production** : https://[url-vercel].vercel.app
- 🔒 **Sceau de Luke** : Validé
