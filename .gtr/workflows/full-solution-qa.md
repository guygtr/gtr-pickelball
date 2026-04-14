---
description: Audit QA exhaustif de l'intégralité d'une solution logicielle avant une release majeure.
---

# Workflow : Full Solution QA 🚀🛡️ (v3.3)

Ce workflow est déclenché pour valider l'intégralité d'un produit. Il mobilise les experts **Mario**, **Ahsoka** et **Yoda** pour garantir que la solution est non seulement fonctionnelle, mais aussi sécurisée, ergonomique et conforme aux standards GTR-Team 2026.

## Étapes du Workflow

### 1. Audit Technique & Logique Métier (Mario)
1. **Validation du Schéma & Données**
   Vérifier l'intégrité de la base de données (Prisma) et la robustesse des Server Actions.
2. **Standard de Codage 2026**
   Scan complet pour éliminer les types `any`, valider les schémas `Zod` et vérifier la couverture des logs.
3. **Stress Test Logiciel**
   Vérifier les cas limites (Edge cases) et la gestion des erreurs sur les flux critiques.

### 2. Expérience Utilisateur & Alignement Produit (Ahsoka)
1. **Audit de Flux (E2E)**
   Parcourir l'application comme un utilisateur novice pour identifier les frictions.
2. **Audit de Croissance**
   Vérifier que les fonctionnalités répondent aux KPIs définis et que le feedback utilisateur est intégré.
3. **Cohérence Visuelle**
   S'assurer que l'identité visuelle est Premium sur tous les modules (en collaboration avec Ezio si nécessaire).

### 3. Sécurité & Intégrité Globale (Yoda)
1. **Audit de Hardening**
   Vérification finale des protections IDOR, CUID et des politiques d'accès (RLS).
2. **Revue de l'Architecture**
   Validation que la structure en 3 couches (Domain, Actions, UI) est strictement respectée.
3. **Sanity Check Final**
   Validation du signal de "Go" pour le déploiement en production.

## Sceau de Validation
Génération d'un rapport final `full_qa_report.md` signé par l'escouade :
`**[{MARIO}] | [{AHSOKA}] | [{YODA}] → Solution Validée à 100%.**`

---
**Standard GTR-Team : Excellence, Sécurité, Performance.**
