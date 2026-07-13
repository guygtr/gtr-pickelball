# État du Projet — GTR Pickelball

- **Projet** : GTR Pickelball
- **Version** : v3.3.5 (co-gestion & sécu)
- **Environnement** : Production Vercel + Supabase
- **Statut** : Opérationnel
- **Hub** : D:\GrokBuild (v3.6)

## Stack actuelle
- Next.js 15.5 · React 19 · Prisma 7.6 · Supabase · Zod
- Écart flotte : cible STACK = Next 16 + Prisma 6.x (plus tard)

## Dernier jalon (2026-07-13)
- [x] P0 hygiène : tmp + debug-ai retirés du tracking
- [x] P1 sécu : rate-limit IA, logger, ADMIN_EMAILS fail-closed, RLS SQL schema pb
- [x] ADMIN_EMAILS confirmé sur Vercel prod (utilisateur)

## Roadmap
- [ ] Aligner Next 16 / proxy.ts si besoin
- [ ] Harmoniser UI avec shared-ui GrokBuild
- [ ] Smoke QA ownership + deploy prod post-P0/P1

## Notes agents locaux
- `agents/yoda.md`, `mario.md`, `ezio.md`, `leia.md` conservés

---
**Alignement .gtr v3.6** : 2026-07-13