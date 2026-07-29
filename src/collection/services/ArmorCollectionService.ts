import { STARTER_CARD_IDS } from '../config/starterCards';
import type { ArmorCatalog, ArmorDefinition, ArmorProgress, FragmentGrantResult, FragmentType, PlayerCollection } from '../types';
import { buildFragmentId } from '../config/fragmentTypes';

export function getFragmentQuantity(
  ownedFragments: Record<string, number>,
  armorId: string,
  fragmentType: FragmentType,
): number {
  return ownedFragments[buildFragmentId(armorId, fragmentType)] ?? 0;
}

export function isArmorComplete(
  armor: ArmorDefinition,
  ownedFragments: Record<string, number>,
): boolean {
  return armor.requiredFragments.every(
    (type) => getFragmentQuantity(ownedFragments, armor.id, type) >= 1,
  );
}

export function getArmorProgress(
  armor: ArmorDefinition,
  ownedFragments: Record<string, number>,
): ArmorProgress {
  const missing = armor.requiredFragments.filter(
    (type) => getFragmentQuantity(ownedFragments, armor.id, type) < 1,
  );
  const owned = armor.requiredFragments.length - missing.length;
  return {
    owned,
    total: armor.requiredFragments.length,
    missing,
    complete: missing.length === 0,
  };
}

export function recomputeUnlockedCards(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
): string[] {
  const unlocked = new Set<string>(STARTER_CARD_IDS);
  for (const armor of catalog.armors) {
    if (isArmorComplete(armor, collection.ownedFragments)) {
      unlocked.add(armor.unlockedCardId);
    }
  }
  return [...unlocked];
}

export function syncCollection(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
): PlayerCollection {
  return {
    ...collection,
    unlockedCards: recomputeUnlockedCards(collection, catalog),
  };
}

export function addFragment(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
  fragmentId: string,
): FragmentGrantResult {
  const fragment = catalog.byFragmentId.get(fragmentId);
  if (!fragment) {
    throw new Error(`Unknown fragment: ${fragmentId}`);
  }

  const armor = catalog.byArmorId.get(fragment.armorId);
  if (!armor) {
    throw new Error(`Unknown armor for fragment: ${fragmentId}`);
  }

  const previousQty = collection.ownedFragments[fragmentId] ?? 0;
  const wasComplete = isArmorComplete(armor, collection.ownedFragments);

  const nextOwnedFragments = {
    ...collection.ownedFragments,
    [fragmentId]: previousQty + 1,
  };

  const nextCollection: PlayerCollection = {
    ...collection,
    ownedFragments: nextOwnedFragments,
    unlockedCards: recomputeUnlockedCards(
      { ...collection, ownedFragments: nextOwnedFragments },
      catalog,
    ),
  };

  const isCompleteNow = isArmorComplete(armor, nextOwnedFragments);
  const justCompletedArmor = !wasComplete && isCompleteNow ? armor : null;

  return {
    collection: nextCollection,
    isNew: previousQty === 0,
    justCompletedArmor,
  };
}
