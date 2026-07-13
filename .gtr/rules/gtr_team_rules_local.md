# Règles locales projet (template v3.6)

En plus du hub `D:\GrokBuild\Agents` :

1. Lire `.gtr/project.json` pour l'identité et les URLs.
2. Secrets : `.env.local` projet et/ou `D:\GrokBuild\.tokens\`.
3. Architecture 3 couches + Zod + RLS.
4. Build First, Push Never.
5. Shared UI : `D:\GrokBuild\shared-ui\` via workflow `/use-shared-ui`.
6. Workflows globaux : hub Agents (pas de copies locales obsolètes).
