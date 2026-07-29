import type { ChapterId } from '../types';

export interface ChapterDefinition {
  id: ChapterId;
  label: string;
  order: number;
}

export const CHAPTERS: ChapterDefinition[] = [
  { id: 'galaxian-wars', label: 'Galaxian Wars', order: 1 },
  { id: 'black-saints', label: 'Black Saints', order: 2 },
  { id: 'silver-saints', label: 'Silver Saints', order: 3 },
  { id: 'sanctuary', label: 'Sanctuary', order: 4 },
  { id: 'poseidon', label: 'Poseidon', order: 5 },
  { id: 'hades', label: 'Hades', order: 6 },
];

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));

/** Chapitres masqués dans l'UI Armurerie (contenu pas encore disponible). */
export const ARMORY_HIDDEN_CHAPTER_IDS: ChapterId[] = ['poseidon', 'hades'];

export const ARMORY_VISIBLE_CHAPTERS = CHAPTERS.filter(
  (c) => !ARMORY_HIDDEN_CHAPTER_IDS.includes(c.id),
);

export const DEFAULT_UNLOCKED_CHAPTERS: ChapterId[] = ['galaxian-wars'];
