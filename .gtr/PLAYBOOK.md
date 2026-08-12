# PLAYBOOK — GTR-Pickelball

> Lire avant toute feature. Hub : `D:\GrokBuild` · Session : `Agents/.agents/SESSION.md`

## Identité

| | |
|--|--|
| Path | `D:\GrokBuild\Projects\GTR-Pickelball` |
| Prod | https://pickelball.gtremblay.com |
| GitHub | https://github.com/guygtr/gtr-pickelball |
| Branche | `master` |
| Rôle | Ligues pickleball multi-tenant, mobile-first, jour de match |

## Stack réelle (package.json)

| Couche | Version |
|--------|---------|
| Next.js | **16.3.x** |
| React | **19.2** |
| Prisma | **7.x** + **adapter-pg** |
| Zod | **4.x** |
| Tailwind | **4** |
| Auth | Supabase SSR |
| IA | xAI Grok |
| Edge | **`src/proxy.ts`** (pas middleware.ts) |
| UI | GlassCard / NeonButton (`shared-ui` + local) |

## Structure code (réelle)

```
src/
  app/                 # /, leagues, admin, auth/login, settings
    leagues/[id]/      # dashboard, players, sessions, settings, hall-of-fame
  actions/             # Server Actions centralisées (league, matches, sessions, …)
  components/          # layout, leagues, sessions, matches, ui/gtr
  lib/                 # prisma, session-utils, …
prisma/                # schema + config Prisma 7
```

**Convention** : nouvelles actions dans `src/actions/` ; pages dans `src/app/`.

## Commandes

```powershell
cd D:\GrokBuild\Projects\GTR-Pickelball
npm run dev
npm run lint
npm run build          # prisma generate && next build --turbopack
# Deploy prod (confirm humain) :
powershell -File D:\GrokBuild\scripts\vercel-deploy.ps1 -Project GTR-Pickelball -Prod
powershell -File D:\GrokBuild\scripts\quality-gate.ps1 -Project GTR-Pickelball
```

## Où mettre une feature

| Type | Emplacement |
|------|-------------|
| Route | `src/app/...` |
| Server Action | `src/actions/<domaine>.ts` |
| UI | `src/components/<domaine>/` |
| Shared glass | aligner sur `D:\GrokBuild\shared-ui` |

## Environnements data (canon flotte)

| Palier | Supabase | Env app |
|--------|----------|---------|
| **Local / Preview** | **GTR-Database-Dev** | `.env.local` · tokens `GTR_DB_DEV_*` |
| **Production** | **GTR-Database** | Vercel Production · tokens `GTR_DB_*` |

Schema / tables : **`pb` / `pb_*`**.  
Runbook clone : `D:\GrokBuild\scripts\GTR-DATABASE-ENV.md` · scripts `scripts/export-gtr-data.cjs`, `scripts/import-gtr-data.cjs`.

## Pièges connus

1. **Prisma 7** ≠ bar-manager (6.3) — `prisma.config.ts`, adapter-pg, preview flags.
2. **ensureLeagueManager** : layout `[id]` + mutations (anti-IDOR lecture/écriture). Prisma **contourne RLS**.
3. Schema Supabase **`pb`** + RLS — défense PostgREST seulement.
4. **ADMIN_EMAILS** fail-closed en prod.
5. UI : accent **pickle lime** / ton outil — pas le gold bar-manager.
6. Mobile-first : jour de match = gros boutons, sticky bottom.
7. Rate-limit IA + logger centralisé (pas de query SQL en logs prod).
8. Routes privées protégées par `proxy` → login si non authentifié.
9. Rollback UI Option B : `git revert fdf5591` (si besoin historique).
10. **Ne jamais** pointer `.env.local` sur GTR-Database **prod**.

## DoD express

- [ ] Dual-env : `.env.local` = **GTR-Database-Dev** · prod Vercel = **GTR-Database**  
- [ ] `powershell -File D:\GrokBuild\scripts\check-dual-env.ps1 -Project GTR-Pickelball` PASS  
- [ ] `npm run build` OK  
- [ ] Zod + ownership / ensureLeagueManager  
- [ ] Pas d’IDOR sur `leagues/[id]`  
- [ ] M/L : SpaceX + Optimus (evidence + chemins)  

