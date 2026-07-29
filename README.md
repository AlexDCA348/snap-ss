# Saint Seiya Snap

Prototype web de jeu de cartes solo inspiré de Marvel Snap, dans l’univers de
Saint Seiya. Affrontez l’IA sur trois lieux, gérez votre Cosmos pendant six
tours et remportez deux lieux sur trois.

## Aperçu

Après publication sur GitHub Pages :  
**https://alexdca348.github.io/snap-ss/preview/**

L’aperçu est une version statique complète : il ne nécessite aucun backend.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir ensuite l’URL affichée par Vite (généralement `http://localhost:5173/`).

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Lance l’environnement de développement local. |
| `npm run build` | Vérifie TypeScript et génère le build de production. |
| `npm run build:preview` | Génère l’aperçu GitHub Pages dans `preview/`. |
| `npm run lint` | Analyse statiquement le code. |

## Jouer

- La partie dure six tours ; le Cosmos disponible augmente à chaque tour.
- Jouez une carte de votre main sur un lieu, puis validez avec **Fin du tour**.
- Les cartes sont révélées simultanément et leurs effets se résolvent.
- Gagnez deux lieux sur trois ; à égalité, la puissance totale départage.
- La collection et le deck builder sont accessibles depuis le menu principal.

## Fichiers importants

| Chemin | Rôle |
| --- | --- |
| `src/game/` | Règles, cartes, effets, IA et moteur de partie pur. |
| `src/store/` | État global Zustand pour la partie, les decks et la collection. |
| `src/components/` | Plateau, cartes, main, HUD, modales et interfaces de collection. |
| `src/screens/` | Écrans de jeu, menu, collection et deck builder. |
| `src/collection/` | Chapitres, armures, fragments et récompenses de campagne. |
| `public/` | Illustrations de cartes, lieux, effets et fonds de menu. |
| `preview/` | Build statique consultable par GitHub Pages. |
| `vite.config.ts` | Configuration Vite du site de production. |

## Design et conventions

- React, TypeScript, Vite et Tailwind CSS.
- Palette sombre « cosmos », accents dorés pour les actions et couleurs par
  faction pour les cartes.
- Police `Cinzel` pour les titres et actions, `Inter` pour les informations.
- L’interface est pensée d’abord pour le mobile : zones tactiles larges,
  cartes compactes et panneau d’action inférieur.
- Les effets de jeu doivent rester dans `src/game/` ; les composants affichent
  l’état sans modifier directement les règles.

## Ajouter une carte ou un effet

1. Ajouter la définition dans `src/game/cards.ts`.
2. Pour une capacité originale, déclarer son handler dans
   `src/game/abilities.ts`.
3. Ajouter l’illustration éventuelle sous `public/cards/`.

## Éditer depuis un téléphone

1. Ouvrir le dépôt dans Safari ou Chrome.
2. Appuyer sur la touche `.` ou ouvrir `https://github.dev/AlexDCA348/snap-ss`.
3. Modifier les fichiers texte puis créer un commit depuis l’interface.

`github.dev` permet d’éditer le code, mais ne lance pas Vite, TypeScript ou
Tailwind dans le navigateur. Les fichiers TypeScript et les classes Tailwind
doivent donc être compilés avec `npm run build:preview` sur une machine ou via
CI pour mettre à jour `preview/`.

## Crédits

Saint Seiya est une œuvre de Masami Kurumada et Toei Animation. Ce projet est
un prototype de fan non officiel, sans affiliation.
