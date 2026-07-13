# GTR-Pickelball

Plateforme de gestion de ligues de Pickleball — flotte **GTR-Team** · Hub `D:\GrokBuild`

- **Prod** : https://pickelball.gtremblay.com  
- **Repo** : https://github.com/guygtr/gtr-pickelball  
- **Version métier** : ~3.3.5 · **Alignement hub** : v3.6 (2026-07)

---

## Stack exacte (package.json)

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js** | **16.2.10** | App Router · **`src/proxy.ts`** (session Supabase) |
| **React** | **19.2.3** | UI |
| **TypeScript** | 5.9 | Strict |
| **Tailwind CSS** | 4 | Styles + tokens pickle |
| **Prisma** | **7.x** (+ `@prisma/adapter-pg`) | ORM · schema PostgreSQL **`pb`** |
| **pg** | 8.x | Driver Prisma |
| **Supabase** | `@supabase/ssr` 0.10 · `supabase-js` 2.x | Auth SSR |
| **Zod** | 4.x | Validation Server Actions |
| **OpenAI SDK** | 6.x → **xAI Grok** (`api.x.ai`) | Recap / niveaux IA |
| **Framer / Lucide / papaparse** | — | UX, icônes, import CSV |

> **Note flotte** : bar-manager est en Prisma **6.3**. Pickelball reste en Prisma **7** (adapter-pg) — migration Prisma 6 non requise pour l’instant.

---

## Architecture 3 couches

1. **UI** — `src/app`, `src/components` (dont `components/ui/gtr` = GlassCard / NeonButton alignés **shared-ui**)
2. **Actions + Zod** — `src/actions`, validations
3. **Domaine** — `src/lib/domain` (matchmaking, ELO…)
4. **Données** — `prisma/schema.prisma` (schema `pb`, multi-tenant ligue / co-managers)

---

## Sécurité (P0/P1 2026-07)

- `ensureLeagueManager` / co-gestion sur les actions sensibles  
- RLS Postgres schema **`pb`** (13 policies) — `supabase/migrations/20260713_rls_league_manager.sql`  
- Rate-limit login + IA recap  
- `ADMIN_EMAILS` fail-closed  
- Routes `debug-ai` et dossier `tmp/` retirés du repo  
- Logger centralisé `src/lib/logger.ts`

---

## Shared UI

Source flotte : `D:\GrokBuild\shared-ui\`  
Projet : `src/components/ui/gtr/{glass-card,neon-button}.tsx` (API alignée + palette pickle).

---

## Développement local

```bash
npm install
npx prisma generate
npm run dev
```

Variables : voir `.env.example` (ou `.env` local) — `DATABASE_URL`, `DIRECT_URL`, Supabase, `GROK_API_KEY`, `ADMIN_EMAILS`.

```bash
# Réappliquer RLS si besoin
node scripts/apply-rls-p1.mjs
```

---

## Déploiement

- Branche Git : **`master`**  
- Vercel + éventuellement :
  ```powershell
  powershell -File D:\GrokBuild\scripts\vercel-deploy.ps1 -Project GTR-Pickelball -Prod
  ```

---

## Contexte agents

`.gtr/project.json` · `.gtr/memory/status.md` · Hub : `D:\GrokBuild\Agents\.agents\SESSION.md`

*GTR-Team v3.6*
