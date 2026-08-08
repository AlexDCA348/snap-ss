export type FragmentType =
  | 'helmet'
  | 'chest'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg';

export type FragmentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ChapterId =
  | 'galaxian-wars'
  | 'black-saints'
  | 'silver-saints'
  | 'sanctuary'
  | 'poseidon'
  | 'hades';

export interface ArmorDefinition {
  id: string;
  name: string;
  rarity: FragmentRarity;
  unlockedCardId: string;
  chapterId: ChapterId;
  requiredFragments: FragmentType[];
}

export interface ArmorFragmentDefinition {
  id: string;
  armorId: string;
  fragmentType: FragmentType;
  rarity: FragmentRarity;
  chapterId: ChapterId;
}

export interface PlayerCollection {
  /**
   * Possession des fragments (0 ou 1 après normalisation).
   * Les anciens stacks > 1 sont convertis en `starDust` à l'hydratation.
   */
  ownedFragments: Record<string, number>;
  /** Poussière d'Étoiles — monnaie craft universelle (ex-doublons). */
  starDust: number;
  unlockedCards: string[];
  unlockedChapterIds: ChapterId[];
}

export interface Reward {
  fragment: ArmorFragmentDefinition;
  isNew: boolean;
  /** > 0 si le drop était un doublon converti en Poussière d'Étoiles. */
  starDustGained: number;
  completedArmor: ArmorDefinition | null;
  unlockedCardId: string | null;
  newlyUnlockedChapters: ChapterId[];
}

export interface ArmorProgress {
  owned: number;
  total: number;
  missing: FragmentType[];
  complete: boolean;
}

export interface FragmentGrantResult {
  collection: PlayerCollection;
  isNew: boolean;
  starDustGained: number;
  justCompletedArmor: ArmorDefinition | null;
}

export type CraftFragmentResult =
  | {
      ok: true;
      collection: PlayerCollection;
      justCompletedArmor: ArmorDefinition | null;
    }
  | {
      ok: false;
      reason: string;
    };

export interface ArmorCatalog {
  armors: ArmorDefinition[];
  fragments: ArmorFragmentDefinition[];
  byArmorId: Map<string, ArmorDefinition>;
  byFragmentId: Map<string, ArmorFragmentDefinition>;
  byCardId: Map<string, ArmorDefinition>;
}

export interface PersistedCollectionState {
  version: number;
  collection: PlayerCollection;
  lastRewardedMatchSerial: number;
}

export interface DropRateEntry {
  rarity: FragmentRarity;
  weight: number;
}

export interface DropRatesConfig {
  entries: DropRateEntry[];
}
