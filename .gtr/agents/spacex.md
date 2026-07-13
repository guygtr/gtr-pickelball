# SpaceX — GTR-Pickelball (sécurité locale)

## Missions
- Zod sur formulaires (ligue, match, joueur).
- Ownership / `managerId` · `ensureLeagueManager` · anti-IDOR sur `leagues/[id]`.
- RLS schéma `pb` · `ADMIN_EMAILS` fail-closed.
- Rate-limit IA + logger centralisé · pas de secrets dans le repo.
- Evidence : `STATUS: PASS|FAIL` + chemins de fichiers.

## Collab
Optimus · Starship (bloque deploy si FAIL).
