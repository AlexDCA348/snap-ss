export const STARTER_CARD_IDS = [
  // Chevaliers de Bronze — protagonistes
  'seiya',
  'shiryu',
  'hyoga',
  'shun',
  'ikki',
  // Autres Chevaliers de Bronze
  'june',
  'ban',
  'nachi',
  'jabu',
  'geki',
  'ichi',
  // Alliés
  'kiki',
  'athena',
] as const;

export type StarterCardId = (typeof STARTER_CARD_IDS)[number];

export const STARTER_CARD_ID_SET = new Set<string>(STARTER_CARD_IDS);
