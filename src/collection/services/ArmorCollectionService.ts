import { STARTER_CARD_IDS } from '../config/starterCards';
import {
  getStarDustCraftCost,
  STAR_DUST_FROM_DUPLICATE,
} from '../config/starDust';
import type {
  ArmorCatalog,
  ArmorDefinition,
  ArmorProgress,
  CraftFragmentResult,
  FragmentGrantResult,
  FragmentType,
  PlayerCollection,
} from '../types';
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

/**
 * Convertit les anciens stacks de doublons (qty > 1) en Poussière d'Étoiles
 * et borne chaque fragment à 0/1.
 */
export function normalizeStarDustCollection(
  collection: PlayerCollection,
): PlayerCollection {
  const ownedFragments: Record<string, number> = {};
  let converted = 0;

  for (const [fragmentId, rawQty] of Object.entries(collection.ownedFragments)) {
    const qty = Math.max(0, Math.floor(Number(rawQty) || 0));
    if (qty <= 0) continue;
    ownedFragments[fragmentId] = 1;
    if (qty > 1) converted += qty - 1;
  }

  const previousDust = Math.max(0, Math.floor(Number(collection.starDust) || 0));

  return {
    ...collection,
    ownedFragments,
    starDust: previousDust + converted,
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

  // Doublon → Poussière d'Étoiles (pas de stack).
  if (previousQty >= 1) {
    const nextCollection: PlayerCollection = {
      ...collection,
      starDust: (collection.starDust ?? 0) + STAR_DUST_FROM_DUPLICATE,
    };
    return {
      collection: nextCollection,
      isNew: false,
      starDustGained: STAR_DUST_FROM_DUPLICATE,
      justCompletedArmor: null,
    };
  }

  const nextOwnedFragments = {
    ...collection.ownedFragments,
    [fragmentId]: 1,
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
    isNew: true,
    starDustGained: 0,
    justCompletedArmor,
  };
}

/** Forge une pièce manquante contre de la Poussière d'Étoiles. */
export function craftFragment(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
  fragmentId: string,
  costOverride?: number,
): CraftFragmentResult {
  const fragment = catalog.byFragmentId.get(fragmentId);
  if (!fragment) {
    return { ok: false, reason: 'Fragment inconnu.' };
  }

  const armor = catalog.byArmorId.get(fragment.armorId);
  if (!armor) {
    return { ok: false, reason: 'Armure inconnue.' };
  }

  if ((collection.ownedFragments[fragmentId] ?? 0) >= 1) {
    return { ok: false, reason: 'Cette pièce est déjà possédée.' };
  }

  const cost = costOverride ?? getStarDustCraftCost(armor.chapterId);
  const dust = collection.starDust ?? 0;
  if (dust < cost) {
    return {
      ok: false,
      reason: `Il faut ${cost} Poussière d'Étoiles (vous en avez ${dust}).`,
    };
  }

  const wasComplete = isArmorComplete(armor, collection.ownedFragments);
  const nextOwnedFragments = {
    ...collection.ownedFragments,
    [fragmentId]: 1,
  };

  const nextCollection: PlayerCollection = {
    ...collection,
    starDust: dust - cost,
    ownedFragments: nextOwnedFragments,
    unlockedCards: recomputeUnlockedCards(
      { ...collection, ownedFragments: nextOwnedFragments },
      catalog,
    ),
  };

  const isCompleteNow = isArmorComplete(armor, nextOwnedFragments);
  const justCompletedArmor = !wasComplete && isCompleteNow ? armor : null;

  return {
    ok: true,
    collection: nextCollection,
    justCompletedArmor,
  };
}
