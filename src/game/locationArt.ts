/** Chemins exacts sous public/ (copiés tels quels au build). */
const LANE_ART: Record<string, string> = {
  sanctuary: 'lanes/sanctuary.webp',
  'five-peaks': 'lanes/five-peaks.jpg',
  'galactic-tournament': 'lanes/galactic-tournament.jpg',
  'death-queen-island': 'lanes/death-queen-island.webp',
  jamir: 'lanes/jamir.webp',
  beach: 'lanes/beach.png',
  'death-valley': 'lanes/death-valley.jpg',
  'training-ground': 'lanes/training-ground.jpg',
  'seventh-sense': 'lanes/seventh-sense.jpg',
  'siberia': 'lanes/siberia.jpg',
  'jamir-bridge': 'lanes/jamir-bridge.jpg',
  'graad-foundation': 'lanes/graad-foundation.png',
  'pope-palace': 'lanes/pope-palace.png',
  'andromeda-island': 'lanes/andromeda-island.png',
  tokyo: 'lanes/tokyo.png',
  'no-effect-zone': 'lanes/no-effect-zone.png',
  'other-dimension': 'lanes/other-dimension.webp',
};

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const path = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath;
  return `${normalizedBase}${path}`;
}

export function getLocationArtUrl(locationId: string): string | null {
  const rel = LANE_ART[locationId];
  if (!rel) return null;
  return assetUrl(rel);
}

export function hasLocationArt(locationId: string): boolean {
  return Boolean(LANE_ART[locationId]);
}

/** Thème CSS de repli quand aucune image (ex. La Plage). */
export type LocationFallbackTheme =
  | 'beach'
  | 'dimension'
  | 'stone'
  | 'frozen'
  | 'chasm'
  | 'night'
  | 'default';

export function getLocationFallbackTheme(
  locationId: string,
): LocationFallbackTheme {
  if (locationId === 'beach') return 'beach';
  if (locationId === 'other-dimension') return 'dimension';
  if (locationId === 'no-effect-zone') return 'night';
  if (locationId === 'training-ground') return 'stone';
  if (locationId === 'siberia') return 'frozen';
  if (locationId === 'jamir-bridge') return 'chasm';
  if (locationId === 'pope-palace') return 'night';
  if (locationId === 'andromeda-island') return 'beach';
  if (locationId === 'tokyo') return 'night';
  return 'default';
}
