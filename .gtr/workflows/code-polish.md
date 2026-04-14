---
description: Revue de code, nettoyage proactif, santé de la stack et documentation (v3.4).
---

# Workflow : Code Polish & Janitor 🧹✨ (v3.4)

Ce workflow garantit l'excellence opérationnelle de la base de code. Il fusionne le nettoyage technique, le polissage visuel et l'audit de santé de la stack technologique.

## agents Impliqués
- **Starship** : Nettoyage et maintenance préventive.
- **Mario** : Audit de santé de la stack et conformité architecture.
- **C-3PO** : Polissage documentaire (JSDoc/Commentaires).

## Étapes du Workflow

### 1. Hygiène & Santé Stack (Mario)
// turbo
1. **Audit de Version**
   Vérifier que le projet utilise Next.js 16+, Prisma 7+ et React 19. Alerter en cas d'obsolescence.
2. **Health Check Environnement**
   Vérifier la validité des variables `.env` et la connexion aux services critiques (Supabase, DB).

### 2. Nettoyage Technique (Starship)
// turbo
1. **Purge Janitor**
   ```powershell
   Remove-Item -Path "**/logs/*.log", "**/tmp/*", "**/dist/*", ".next/" -Recurse -Force -ErrorAction SilentlyContinue
   ```
2. **Auto-Fix Standards**
   ```powershell
   npm run lint -- --fix; npx prettier --write .
   ```

### 3. Polissage Documentaire (C-3PO)
1. **Check Langue (Règle d'Or)**
   Vérifier que 100% des nouveaux commentaires sont en **Français** et qu'aucun commentaire "TODO" n'est resté orphelin.
2. **Richesse JSDoc**
   S'assurer que chaque nouvelle fonction possède son bloc JSDoc descriptif.

### 4. Certification & Notification
1. **Rapport de Polissage**
   Génération d'un rapport `polish_report.md`.
2. **Notification Discord**
   // turbo
   ```powershell
   python d:\GTR-Team\scripts\discord_notify.py "✨ La base de code a été polie et sa santé vérifiée v3.4 [OPTIMAL]"
   ```

---
**Standard GTR-Team : Un code propre est un code performant.**
