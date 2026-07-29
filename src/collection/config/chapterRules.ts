import type { CardDefinition } from '../../game/types';
import type { ChapterId, FragmentRarity } from '../types';

export const CARD_CHAPTER_OVERRIDES: Partial<Record<string, ChapterId>> = {
  'grand-pope': 'sanctuary',
  'grand-pope-ares': 'sanctuary',
  dokko: 'sanctuary',
  roshi: 'galaxian-wars',
};

export const CARD_RARITY_OVERRIDES: Partial<Record<string, FragmentRarity>> = {
  saga: 'legendary',
  shaka: 'legendary',
  aiolos: 'legendary',
  'grand-pope-ares': 'legendary',
};

const FACTION_CHAPTER: Partial<Record<CardDefinition['faction'], ChapterId>> = {
  black: 'black-saints',
  bronze: 'galaxian-wars',
  silver: 'silver-saints',
  gold: 'sanctuary',
  god: 'sanctuary',
  neutral: 'galaxian-wars',
};

export function resolveChapterForCard(card: CardDefinition): ChapterId {
  const override = CARD_CHAPTER_OVERRIDES[card.id];
  if (override) return override;
  return FACTION_CHAPTER[card.faction] ?? 'galaxian-wars';
}

export function resolveRarityForCard(card: CardDefinition): FragmentRarity {
  const override = CARD_RARITY_OVERRIDES[card.id];
  if (override) return override;
  if (card.cost >= 6) return 'legendary';
  if (card.cost >= 5) return 'epic';
  if (card.cost >= 3) return 'rare';
  return 'common';
}

export function buildArmorName(cardName: string): string {
  return `Armure de ${cardName}`;
}

export function buildArmorId(cardId: string): string {
  return `armor-${cardId}`;
}
