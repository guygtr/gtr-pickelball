# État du Projet — GTR Pickelball

- **Projet** : GTR Pickelball
- **Version** : v3.3.5 (co-gestion & sécu)
- **Environnement** : Production Vercel + Supabase
- **Statut** : Opérationnel
- **Hub** : D:\GrokBuild (v3.6)

## Stack actuelle
- Next.js **16.2.10** · `src/proxy.ts` · React **19.2** · Prisma **7.x** · Supabase · Zod 4
- UI : GlassCard / NeonButton alignés `D:\GrokBuild\shared-ui`

## Dernier jalon (2026-07-13)
- [x] P0 hygiène : tmp + debug-ai retirés du tracking
- [x] P1 sécu : rate-limit IA, logger, ADMIN_EMAILS fail-closed, RLS SQL schema pb
- [x] ADMIN_EMAILS confirmé sur Vercel prod (utilisateur)
- [x] P2 : Next 16 + proxy.ts · shared-ui · README stack exacte

## Sécurité (2026-07-13)
- [x] P0 IDOR lecture : garde layout ligue + redirect proxy
- [x] P1 headers CSP/HSTS, logs Prisma prod, co-manager anti-enum, rate-limit renforcé
- [x] P2 admin listUsers paginé, export loggé, mdp 12+, .env.example, typecheck build on

## Roadmap
- [ ] Smoke QA manuel post-sécu (non connecté + autre manager)
- [ ] Deploy prod (confirm humain)
- [ ] (Optionnel) rate-limit Redis multi-instances

## Notes agents locaux
- Alignés roster hub : `elon.md` · `tesla.md` · `ezio.md` · `altair.md` · `spacex.md`
- Anciens yoda/mario/leia retirés

---
**Alignement .gtr v3.6.1** : 2026-07-13 (rename équipe)