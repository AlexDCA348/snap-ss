import { getCardDef } from '../game/cards';
import { CHAPTER_BY_ID } from './config/chapters';
import { getFragmentLabel } from './config/fragmentTypes';
import { ARMOR_CATALOG } from './data/armorCatalog';
import { getArmorProgress, getFragmentQuantity } from './services/ArmorCollectionService';
import { isCardUnlocked } from './services/CardCollectionService';
import type {
  ArmorDefinition,
  FragmentRarity,
  FragmentType,
  PlayerCollection,
} from './types';

export type ArmorUnlockStatus = 'locked' | 'unlocked';

export interface FragmentSlotViewModel {
  type: FragmentType;
  label: string;
  owned: boolean;
  quantity: number;
}

export interface ArmorViewModel {
  armorId: string;
  name: string;
  rarity: FragmentRarity;
  chapterId: string;
  chapterLabel: string;
  unlockedCardId: string;
  unlockedCardName: string;
  status: ArmorUnlockStatus;
  progressOwned: number;
  progressTotal: number;
  fragments: FragmentSlotViewModel[];
}

export interface ArmorDetailViewModel extends ArmorViewModel {
  missingFragments: FragmentSlotViewModel[];
}

const RARITY_LABELS: Record<FragmentRarity, string> = {
  common: 'Commune',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export function getRarityLabel(rarity: FragmentRarity): string {
  return RARITY_LABELS[rarity];
}

function buildFragmentSlots(
  armor: ArmorDefinition,
  collection: PlayerCollection,
): FragmentSlotViewModel[] {
  return armor.requiredFragments.map((type) => {
    const quantity = getFragmentQuantity(collection.ownedFragments, armor.id, type);
    return {
      type,
      label: getFragmentLabel(type),
      owned: quantity >= 1,
      quantity,
    };
  });
}

function buildArmorViewModel(
  armor: ArmorDefinition,
  collection: PlayerCollection,
): ArmorViewModel {
  const progress = getArmorProgress(armor, collection.ownedFragments);
  const card = getCardDef(armor.unlockedCardId);
  const chapter = CHAPTER_BY_ID.get(armor.chapterId);

  return {
    armorId: armor.id,
    name: armor.name,
    rarity: armor.rarity,
    chapterId: armor.chapterId,
    chapterLabel: chapter?.label ?? armor.chapterId,
    unlockedCardId: armor.unlockedCardId,
    unlockedCardName: card.name,
    status: isCardUnlocked(armor.unlockedCardId, collection) ? 'unlocked' : 'locked',
    progressOwned: progress.owned,
    progressTotal: progress.total,
    fragments: buildFragmentSlots(armor, collection),
  };
}

export function buildArmorViewModels(collection: PlayerCollection): ArmorViewModel[] {
  return ARMOR_CATALOG.armors.map((armor) => buildArmorViewModel(armor, collection));
}

export function buildArmorDetailViewModel(
  armorId: string,
  collection: PlayerCollection,
): ArmorDetailViewModel | null {
  const armor = ARMOR_CATALOG.byArmorId.get(armorId);
  if (!armor) return null;

  const base = buildArmorViewModel(armor, collection);
  return {
    ...base,
    missingFragments: base.fragments.filter((f) => !f.owned),
  };
}
