---
description: Exécuter une suite de tests rapides pour vérifier la stabilité après un changement ou un déploiement.
---

# Workflow : Smoke Test GTR 💨 (v3.3)

Ce workflow permet de vérifier en quelques minutes que les fonctionnalités critiques de l'application sont toujours opérationnelles après une modification.

## Étapes du Workflow

### 1. Build Local (Starship)
// turbo
1. **Verification Build**
   ```powershell
   npm run build
   ```

### 2. Live Server (DarthVader)
// turbo
1. **Lancement Dev Server**
   ```powershell
   npm run dev
   ```

### 3. Validation Fonctionnelle
1. **Contrôle d'accès**
   Vérifier l'accès à la page d'accueil et la connexion/déconnexion.
2. **Chargement de Données**
   Vérifier que les APIs et Server Actions renvoient les données attendues.
3. **Navigation**
   Vérifier que les routes critiques ne renvoient pas d'erreurs 404/500.

### 4. Sceau de Stabilité
Une fois les tests validés, DarthVader appose son sceau :
`**[{DARTHVADER}] → Smoke Tests OK. Le système est stable.**`

### 5. Notification Équipe
// turbo
```powershell
python d:\GTR-Team\scripts\discord_notify.py "💨 Smoke Tests réussis ! Système opérationnel v3.3 [STABLE]"
```
