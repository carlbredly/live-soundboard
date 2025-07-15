# live-soundboard
# Soundboard Perso

Ce projet est une application web de soundboard personnalisable, développée en HTML, CSS et JavaScript. Il permet à chaque utilisateur d'ajouter ses propres sons avec une image et un nom, et de les jouer directement depuis le navigateur.

## Fonctionnalités
- Ajout de sons personnalisés (nom, image, fichier audio)
- Interface moderne et responsive
- Stockage local des sons (IndexedDB, pas de limite de taille bloquante)
- Persistance des sons même après rechargement de la page
- Fonctionne 100% côté client, sans serveur

## Utilisation
1. **Ajouter un son** :
   - Clique sur "Add a new sound"
   - Remplis le nom, choisis une image et un fichier audio
   - Clique sur "Ajouter" : le bouton apparaît dans le soundboard
2. **Jouer un son** :
   - Clique sur le bouton du son pour le jouer
   - Clique à nouveau pour arrêter la lecture
3. **Persistance** :
   - Les sons ajoutés restent enregistrés dans ton navigateur (IndexedDB)
   - Chaque utilisateur a sa propre collection locale


## Limitations
- Les sons ne sont pas synchronisés entre utilisateurs
- Si tu changes d'appareil ou de navigateur, ta collection ne sera pas transférée
- Pour un soundboard partagé, il faudrait un backend (non inclus ici)

## Dépendances
Aucune dépendance externe. Tout est en HTML/CSS/JS natif.

## Licence
Projet libre, à utiliser et modifier comme tu veux ! 
