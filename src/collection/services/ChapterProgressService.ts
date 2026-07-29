import { ARMORY_HIDDEN_CHAPTER_IDS, CHAPTERS } from '../config/chapters';
import type { ArmorCatalog, ChapterId, PlayerCollection } from '../types';
import { isCardUnlocked } from './CardCollectionService';

/** Chapitres pouvant apparaître dans le pool de récompenses. */
export const REWARD_CHAPTERS = CHAPTERS.filter(
  (c) => !ARMORY_HIDDEN_CHAPTER_IDS.includes(c.id),
);

export function getArmorsForChapter(
  catalog: ArmorCatalog,
  chapterId: ChapterId,
) {
  return catalog.armors.filter((a) => a.chapterId === chapterId);
}

export function isChapterComplete(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
  chapterId: ChapterId,
): boolean {
  const armors = getArmorsForChapter(catalog, chapterId);
  if (armors.length === 0) return false;
  return armors.every((armor) => isCardUnlocked(armor.unlockedCardId, collection));
}

export function getNextRewardChapter(chapterId: ChapterId): ChapterId | null {
  const current = REWARD_CHAPTERS.find((c) => c.id === chapterId);
  if (!current) return null;
  return REWARD_CHAPTERS.find((c) => c.order === current.order + 1)?.id ?? null;
}

export function syncUnlockedChapters(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
): { collection: PlayerCollection; newlyUnlocked: ChapterId[] } {
  const unlocked = new Set(collection.unlockedChapterIds);
  const newlyUnlocked: ChapterId[] = [];

  for (const chapter of REWARD_CHAPTERS) {
    if (!unlocked.has(chapter.id)) continue;
    if (!isChapterComplete(collection, catalog, chapter.id)) continue;

    const next = getNextRewardChapter(chapter.id);
    if (next && !unlocked.has(next)) {
      unlocked.add(next);
      newlyUnlocked.push(next);
    }
  }

  return {
    collection: {
      ...collection,
      unlockedChapterIds: [...unlocked],
    },
    newlyUnlocked,
  };
}
