# GTR Pickleball - Sommaire de la Solution 🎾🚀

Ce document présente une vue d'ensemble complète de la plateforme **GTR Pickleball**, une application premium conçue pour la gestion de ligues, de sessions et de tournois de Pickleball, respectant les standards **GTR-Team 2026**.

## 📋 Présentation Générale
GTR Pickleball est une solution web centralisée permettant aux gestionnaires de ligues d'organiser des sessions de jeu, de gérer leurs joueurs et de générer des matchs équilibrés grâce à un moteur de matchmaking intelligent.

## 🏗️ Architecture Technique
L'application repose sur une architecture moderne en 3 couches assurant performance, sécurité et maintenabilité.
- **Frontend** : Next.js 15 (App Router) avec TypeScript.
- **Stylisme** : Tailwind CSS 4 avec un design system "GTR Neon" (Glassmorphism & Micro-animations).
- **Backend** : Server Actions isolées pour la logique métier et Zod pour la validation stricte des schémas.
- **Base de données** : PostgreSQL via Prisma ORM.
- **Infrastructure** : Déploiement automatisé sur Vercel avec authentification Supabase.

## 🌟 Fonctionnalités Clés

### 1. Gestion des Ligues et Données
- **Isolation des Données** : Chaque ligue est un silo sécurisé. Un gestionnaire ne peut voir que les données de ses propres ligues.
- **Système de Restauration Robust** : Possibilité de recréer intégralement une ligue supprimée à partir d'un export JSON.
- **Import Intelligent** : 
  - Détection automatique des doublons (Nom + Prénom + Email).
  - **Auto-création** : Lors de l'import de sessions, les joueurs absents de la base sont créés dynamiquement pour ne jamais perdre l'historique des matchs.

### 2. Moteur de Matchmaking (GTR Fair Play Engine)
- **Algorithmes Multi-modes** : Choix entre un mode **Aléatoire** ou **Compétition** (basé sur le Skill Level).
- **Pénalité de Diversité de Quatuor** : Algorithme propriétaire empêchant les mêmes groupes de 4 joueurs de se rencontrer de manière répétitive.
- **Gestion des Terrains** : Répartition optimisée des matchs sur les terrains disponibles.

### 3. Gestion des Joueurs
- **Profils Détaillés** : Niveaux de compétence (1.0 à 5.0), numéros de téléphone, emails.
- **Statuts** : Distinction entre joueurs **Permanents** et **Remplaçants**.
- **Calcul de Performance** : Historique des victoires/défaites et Hall of Fame.

## 🎨 Identité Visuelle (UX/UI Audit)
Le design system a été audité et ajusté pour refléter les couleurs officielles du Pickleball :
- **Rouge Primaire** (`#E31837`) : Pour les actions critiques et accents.
- **Bleu Cyan Électrique** (`#3B82F6`) : Pour les éléments informatifs.
- **Vert Fluo & Jaune** (`#DCFC44`, `#FDE047`) : Pour l'énergie et les badges de statut.
- **Style Glassmorphism** : Utilisation intensive de la transparence, du flou d'arrière-plan et d'effets néon.

## 🛠️ Normes et Standards GTR
- **Langue** : Code, commentaires et interface 100% en Français.
- **Validation** : Toute entrée utilisateur est filtrée par Zod avant d'atteindre la base de données.
- **Sécurité** : Protection contre les attaques par "ID guessing" et isolation stricte par `leagueId`.

---
*Document généré par Antigravity - Agent de Développement GTR-Team 2026*
