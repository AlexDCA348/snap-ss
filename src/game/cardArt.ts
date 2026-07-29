import manifest from './cardArtManifest.json';

/** Chemins relatifs à la racine du site (public/), sans slash initial. */
const ART_BY_ID: Record<string, string> = manifest as Record<string, string>;

/** Priorité si plusieurs fichiers existent pour le même id (ex. seiya.png + seiya.jpg). */
const ART_EXT_PRIORITY = ['.png', '.jpg', '.jpeg', '.webp'] as const;

/** Jetons / doubles sans portrait dédié → réutilise l’art d’une autre carte. */
const ART_SOURCE_ID: Record<string, string> = {
  'asterion-double': 'asterion',
  'black-dragon-double': 'black-dragon',
  'saga-illusion': 'saga',
  'saga-double': 'saga',
};

function resolveArtRel(defId: string): string | null {
  const sourceId = ART_SOURCE_ID[defId] ?? defId;
  return ART_BY_ID[sourceId] ?? null;
}

/** `cards/seiya.jpg` → `cards/seiya` */
function artBasePath(rel: string): string {
  return rel.replace(/\.(png|jpe?g|webp)$/i, '');
}

function resolveArtBase(defId: string): string | null {
  const rel = resolveArtRel(defId);
  if (!rel) return null;
  return artBasePath(rel);
}

/**
 * URLs à essayer dans l'ordre (PNG d'abord). L'image charge la première qui existe ;
 * les autres déclenchent onError puis passage au format suivant.
 */
export function getCardArtCandidates(defId: string): string[] {
  const basePath = resolveArtBase(defId);
  if (!basePath) return [];
  const base = import.meta.env.BASE_URL;
  return ART_EXT_PRIORITY.map((ext) => `${base}${basePath}${ext}`);
}

/** Première URL candidate (PNG si présent dans le manifeste / sur le disque). */
export function getCardArtPath(defId: string): string | null {
  return getCardArtCandidates(defId)[0] ?? null;
}

export function hasCardArt(defId: string): boolean {
  return Boolean(resolveArtRel(defId));
}

/** Cadrage portrait par carte (défaut : visage en haut). */
const ART_OBJECT_POSITION: Partial<Record<string, string>> = {
  capella: 'center 38%',
  dante: 'center 35%',
  'grand-pope-ares': 'center 30%',
  roshi: 'center 42%',
};

export function getCardArtObjectPosition(defId: string): string {
  return ART_OBJECT_POSITION[defId] ?? 'center 20%';
}

export type CardArtFormat = 'png' | 'photo';

/** Format prioritaire (PNG testé en premier par getCardArtCandidates). */
export function getPreferredCardArtFormat(defId: string): CardArtFormat {
  const first = getCardArtCandidates(defId)[0];
  return first?.toLowerCase().endsWith('.png') ? 'png' : 'photo';
}
