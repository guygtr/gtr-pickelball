# État du Projet — GTR Pickelball

| | |
|--|--|
| **Projet** | GTR Pickelball |
| **Alignement flotte** | **v3.6.1** |
| **Version métier** | ~3.3.5 (co-gestion & sécu) |
| **Statut** | Opérationnel |
| **Prod** | https://pickelball.gtremblay.com |
| **Branche** | `master` |
| **Hub** | `D:\GrokBuild` |

## Stack

- Next.js **16.2.10** · `src/proxy.ts` · React **19.2** · Prisma **7.x** (+ adapter-pg) · Supabase · Zod **4**
- UI : GlassCard / NeonButton alignés `D:\GrokBuild\shared-ui`
- IA : xAI Grok

## Jalons livrés (2026-07)

### Sécurité
- [x] P0 IDOR lecture : garde layout ligue + redirect proxy
- [x] P1 headers CSP/HSTS, logs Prisma prod, co-manager, rate-limit
- [x] P2 admin paginé, export loggé, mdp 12+, typecheck build on
- [x] ADMIN_EMAILS confirmé Vercel prod

### Produit
- [x] Soirée type 4 étapes (présences → générer → scores → clôturer)
- [x] Cards joueurs mobile / table desktop
- [x] Onboarding 3 étapes post-création ligue
- [x] A11y contraste glass + focus-visible
- [x] Matchmaking Social · Compétitif · Tournoi + tests domaine
- [x] Perf génération grilles

## Roster hub (8)

Elon · Tesla · Ezio · Altair · SpaceX · Optimus · Starship · Jarvis  

Notes locales : `elon.md` · `tesla.md` · `ezio.md` · `altair.md` · `spacex.md`

## Roadmap

- [ ] Smoke QA manuel multi-comptes post-sécu
- [ ] (Optionnel) rate-limit Redis multi-instances

## Conformité flotte

- PLAYBOOK : `.gtr/PLAYBOOK.md`
- Skills / workflows : hub `Agents\.agents\` (8 + 9)
- Secrets : `D:\GrokBuild\.tokens`

---
**Alignement flotte v3.6.1** · 2026-07-13 · polish cosmétiques 2026-07-14
