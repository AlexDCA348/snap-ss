import { ARMORY_VISIBLE_CHAPTERS } from './config/chapters';
import { ARMOR_CATALOG } from './data/armorCatalog';
import { isCardUnlocked } from './services/CardCollectionService';
import {
  getArmorsForChapter,
  isChapterComplete,
} from './services/ChapterProgressService';
import type { ChapterId, PlayerCollection } from './types';

export type ChapterStatus = 'locked' | 'current' | 'complete';

export interface CampaignChapterStep {
  chapterId: ChapterId;
  label: string;
  order: number;
  status: ChapterStatus;
  progress: { owned: number; total: number };
}

export function getChapterStatus(
  chapterId: ChapterId,
  collection: PlayerCollection,
): ChapterStatus {
  const unlocked = new Set(collection.unlockedChapterIds);
  if (!unlocked.has(chapterId)) return 'locked';
  if (isChapterComplete(collection, ARMOR_CATALOG, chapterId)) return 'complete';
  return 'current';
}

export function getChapterArmorProgress(
  chapterId: ChapterId,
  collection: PlayerCollection,
): { owned: number; total: number } {
  const armors = getArmorsForChapter(ARMOR_CATALOG, chapterId);
  const owned = armors.filter((a) =>
    isCardUnlocked(a.unlockedCardId, collection),
  ).length;
  return { owned, total: armors.length };
}

export function getCampaignChapterSteps(
  collection: PlayerCollection,
): CampaignChapterStep[] {
  return ARMORY_VISIBLE_CHAPTERS.map((chapter) => ({
    chapterId: chapter.id,
    label: chapter.label,
    order: chapter.order,
    status: getChapterStatus(chapter.id, collection),
    progress: getChapterArmorProgress(chapter.id, collection),
  }));
}

/** Chapitre mis en avant (fond menu, étape active). */
export function getFeaturedCampaignChapterId(
  collection: PlayerCollection,
): ChapterId {
  const steps = getCampaignChapterSteps(collection);
  const current = steps.find((s) => s.status === 'current');
  if (current) return current.chapterId;

  const lastComplete = [...steps].reverse().find((s) => s.status === 'complete');
  if (lastComplete) return lastComplete.chapterId;

  return 'galaxian-wars';
}
