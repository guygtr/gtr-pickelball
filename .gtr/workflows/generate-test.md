---
description: Scaffold automatiquement un fichier de test unitaire pour un composant ou une fonction.
---

Ce workflow assure la qualité en générant des tests unitaires standardisés.

1. Demander à l'utilisateur le chemin relatif du fichier à tester.
2. Déterminer l'emplacement du fichier de test (ex: dossier `__tests__` ou fichier avec l'extension `.test.ts`).
// turbo
3. Créer le fichier de test s'il n'existe pas.
4. Générer l'import correct du fichier cible.
5. Générer une suite de tests basique (describe, it) incluant au moins "should render/execute successfully" et "should handle invalid input".
6. Utiliser les librairies de test standards de la flotte GTR (Jest ou Vitest).
// turbo
7. Lancer les tests sur ce fichier spécifique (ex: `npm run test -- <filename>`).
