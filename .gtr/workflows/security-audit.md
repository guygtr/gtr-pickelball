---
description: Audit de sécurité multicouche (Express/Deep) géré par Luke et Starlink. (v3.4)
---

# Workflow : Security & Compliance Audit 🛡️ (v3.4)

Ce workflow centralise tous les audits de sécurité de la GTR-Team. Il propose deux niveaux d'intervention selon le contexte (routine ou release).

## Agents Impliqués
- **Luke** : Audit de code statique, OWASP et dépendances.
- **Starlink** : Audit d'infrastructure, RLS Supabase et chiffrement.
- **Starship** : Blocage du build en cas de faille critique.

## Niveaux d'Audit

### ⚡ Niveau 1 : Scan Express (Routine)
// turbo
1. **Audit de Dépendances**
   ```powershell
   npm audit
   ```
2. **Contrôle Environnement**
   Vérifier l'absence de secrets hardcodés dans `.env.local` et l'absence de fichiers sensibles committés.
3. **Vérification Zod**
   Scan rapide des Server Actions pour confirmer la présence de schémas de validation.

### 🔍 Niveau 2 : Audit Profond (Full Review / Pre-Release)
1. **Pénétration Statique (OWASP)**
   Luke analyse les risques d'injection, XSS et la gestion des sessions JWT.
2. **Blindage RLS (Supabase)**
   Starlink vérifie que **Row Level Security** est activé sur toutes les tables et que les politiques sont minimalistes.
3. **Audit SSR & Auth**
   Vérification de la sécurité du middleware et de la configuration `@supabase/ssr`.
4. **Logic Hardening**
   Vérification des vérifications de droits (`userId`) au sein même des Server Actions.

## Sceau de Validation
Génération d'un rapport `security_audit_report.md` :
`**[{LUKE}] | [{STARLINK}] → Sécurité certifiée : [STANDARD/PREMIUM].**`

---
**Standard GTR-Team : La sécurité n'est pas une option.**
