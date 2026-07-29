import type { LocationDefinition } from './types';

/** Lieu neutre après au révélé du Grand Pope (plus d'effet d'origine). */
export const OTHER_DIMENSION_LOCATION: LocationDefinition = {
  id: 'other-dimension',
  name: 'Une autre dimension',
};

/** Lieu neutralisé par la Marine de l'Aigle (aucun effet de lieu). */
export const NO_EFFECT_ZONE_LOCATION: LocationDefinition = {
  id: 'no-effect-zone',
  name: 'Zone sans effet',
};

/**
 * Pool de lieux Saint Seiya. Chaque partie en tire 3 au hasard.
 */
export const LOCATIONS: LocationDefinition[] = [
  {
    id: 'sanctuary',
    name: 'Sanctuaire',
    effect: {
      id: 'loc-sanctuary-double-ongoing',
      kind: 'ongoing',
      text: 'Les effets continus émis depuis ce lieu sont doublés.',
    },
  },
  {
    id: 'five-peaks',
    name: 'Les Cinq Pics',
    effect: {
      id: 'loc-five-peaks-highest-cost',
      kind: 'ongoing',
      text: '+3 à votre carte au coût le plus élevé ici.',
    },
  },
  {
    id: 'galactic-tournament',
    name: 'Tournoi Galactique',
    effect: {
      id: 'loc-galactic-tournament-double-on-reveal',
      kind: 'on-reveal',
      text: 'Les effets au révélé des cartes ici s\u2019exécutent deux fois.',
    },
  },
  {
    id: 'beach',
    name: 'La Plage',
    effect: {
      id: 'loc-beach-silver',
      kind: 'ongoing',
      text: '+1 aux Chevaliers d\u2019Argent sur ce lieu.',
    },
  },
  {
    id: 'death-queen-island',
    name: 'Île de Death Queen',
    effect: {
      id: 'loc-death-queen-destroy-weakest',
      kind: 'end-reveal',
      text: 'Fin de tour : détruit l\u2019ennemi le plus faible ici s\u2019il n\u2019est pas seul (et s\u2019il y a opposition).',
    },
  },
  {
    id: 'jamir',
    name: 'Jamir',
    effect: {
      id: 'loc-jamir-no-decrease',
      kind: 'ongoing',
      text: 'Les cartes sur ce lieu ne peuvent pas voir leur puissance diminuer.',
    },
  },
  {
    id: 'death-valley',
    name: 'La vallée de la mort',
    effect: {
      id: 'loc-death-valley-debuff-non-black',
      kind: 'ongoing',
      text: '\u22121 aux cartes qui ne sont pas Chevaliers Noirs sur ce lieu.',
    },
  },
  {
    id: 'training-ground',
    name: 'Terrain d\u2019entra\u00eenement du Sanctuaire',
    effect: {
      id: 'loc-training-ground-max-cost-3',
      kind: 'restriction',
      text: 'Seules les cartes dont le co\u00fbt effectif est de 2 ou moins peuvent \u00eatre jou\u00e9es ici.',
      params: { maxCost: 2 },
    },
  },
  {
    id: 'seventh-sense',
    name: 'Le 7e Sens',
    effect: {
      id: 'loc-seventh-sense-cosmos-per-card',
      kind: 'cosmos',
      text: 'Chaque joueur gagne +1 Cosmos au tour suivant par carte qu\u2019il a pos\u00e9e ici ce tour-ci.',
      params: { perCard: 1 },
    },
  },
  {
    id: 'siberia',
    name: 'Sib\u00e9rie',
    effect: {
      id: 'loc-siberia-silence-ongoing',
      kind: 'ongoing',
      text: 'Les effets continus ne se d\u00e9clenchent pas sur ce lieu.',
    },
  },
  {
    id: 'jamir-bridge',
    name: 'Pont de Jamir',
    effect: {
      id: 'loc-jamir-bridge-destroy-placed',
      kind: 'end-reveal',
      text: 'Fin de tour : chaque carte jou\u00e9e ici est d\u00e9truite (sauf les doubles, les \u00e2mes perdues, les indestructibles, et si Mu prot\u00e8ge le lieu).',
    },
  },
  {
    id: 'graad-foundation',
    name: 'Fondation Graad',
    effect: {
      id: 'loc-graad-buff-no-ability',
      kind: 'ongoing',
      text: '+1 aux cartes sans effet sur ce lieu.',
    },
  },
  {
    id: 'pope-palace',
    name: 'Palais du Grand Pope',
    effect: {
      id: 'loc-pope-palace-min-cost-3',
      kind: 'restriction',
      text: 'Seules les cartes dont le co\u00fbt effectif est de 3 ou plus peuvent \u00eatre jou\u00e9es ici.',
      params: { minCost: 3 },
    },
  },
  {
    id: 'andromeda-island',
    name: "Île d'Andromède",
    effect: {
      id: 'loc-andromeda-island-relocate',
      kind: 'on-reveal',
      text: "Au révélé : la carte est déplacée vers un autre lieu aléatoire s'il reste de la place.",
    },
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    effect: {
      id: 'loc-tokyo-spawn-black-phoenix',
      kind: 'setup',
      text: 'Au début de la partie : un Phénix Noir apparaît sur chaque lieu (chaque camp).',
    },
  },
];
