import type { ChapterId } from '../types';

/** Fonds du menu principal par chapitre (chemins sous public/). */
export const CHAPTER_MENU_BACKGROUNDS: Partial<Record<ChapterId, string>> = {
  'galaxian-wars': 'menu/bg-galaxian-wars.jpg',
  'black-saints': 'menu/bg-black-saints.jpg',
  'silver-saints': 'menu/bg-silver-saints.jpg',
  sanctuary: 'menu/bg-sanctuary.jpg',
};

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${normalizedBase}${path}`;
}

export function getChapterMenuBackgroundUrl(chapterId: ChapterId): string | null {
  const relative = CHAPTER_MENU_BACKGROUNDS[chapterId];
  return relative ? assetUrl(relative) : null;
}
