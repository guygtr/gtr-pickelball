# GTR-Pickelball — Cas d’essais NFR (non-régression)

**Cible** : GTR-Database-Dev uniquement  
**Commandes** :

```powershell
cd D:\GrokBuild\Projects\GTR-Pickelball
npm test                 # Vitest unit + intégration
npm run test:e2e         # Playwright smoke
npm run test:e2e:headed  # navigateur visible
```

| Suite | Contenu |
|-------|---------|
| Vitest | matchmaking, ELO, admin fail-closed, rate-limit, dual-env, ligues multi-tenant |
| Playwright | login, logout, /leagues, ouverture ligue |

**E2E** : `e2e/global-setup.ts` reset MDP **Dev** du compte admin (`E2E-Admin-Pb-2026!` par défaut). Prod non touchée.
