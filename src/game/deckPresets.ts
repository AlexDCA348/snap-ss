import { getCardDef } from './cards';
import {
  DECK_SIZE,
  getBuildableCardIds,
  validateDeck,
} from './deckPool';

export interface DeckPreset {
  id: string;
  name: string;
  description: string;
  /** Cartes cœur de la synergie (priorité absolue). */
  core: string[];
  /** Pools complémentaires avec poids relatif. */
  pools: { ids: string[]; weight: number }[];
  /** Courbe cible [coût1…coût6] pour équilibrer le complément. */
  curve: [number, number, number, number, number, number];
}

export const DECK_PRESETS: DeckPreset[] = [
  {
    id: 'bronze-saints',
    name: 'Bronzes du Sanctuaire',
    description: 'Scaling Bronze : Seiya, Shun, Shiryu et buffs de lane.',
    core: ['seiya', 'shun', 'shiryu', 'ban', 'nachi'],
    pools: [
      {
        ids: ['hyoga', 'ikki', 'jabu', 'ichi', 'june', 'geki'],
        weight: 10,
      },
      { ids: ['kiki', 'athena', 'roshi'], weight: 3 },
    ],
    curve: [3, 3, 3, 2, 1, 0],
  },
  {
    id: 'black-saints',
    name: 'Chevaliers Noirs',
    description: 'Andromède Noir scale avec les Noirs ; doubles et dégâts.',
    core: ['black-andromeda', 'black-dragon', 'black-pegasus'],
    pools: [
      {
        ids: ['black-phoenix', 'black-cygnus', 'ichi', 'black-pegasus'],
        weight: 10,
      },
      { ids: ['aldebaran', 'babel', 'milo'], weight: 4 },
      { ids: ['kiki', 'dio'], weight: 2 },
    ],
    curve: [3, 4, 3, 1, 1, 0],
  },
  {
    id: 'gold-saints',
    name: 'Chevaliers d’Or',
    description: 'Mur (Mu, Aldébaran), Dohko x2 et illusion de Saga.',
    core: ['aldebaran', 'mu', 'saga', 'dokko'],
    pools: [
      {
        ids: [
          'shaka',
          'camus',
          'aphrodite',
          'aiolia',
          'aiolos',
          'deathmask',
          'shura',
          'milo',
        ],
        weight: 10,
      },
      { ids: ['grand-pope', 'athena'], weight: 4 },
      { ids: ['kiki'], weight: 2 },
    ],
    curve: [1, 2, 4, 2, 2, 1],
  },
  {
    id: 'silver-saints',
    name: 'Chevaliers d’Argent',
    description: 'Shaina buff Argent, Astérion flood, contrôle ciblé.',
    core: ['shaina', 'asterion', 'babel', 'ptolemy'],
    pools: [
      {
        ids: [
          'misty',
          'algol',
          'moses',
          'daidalos',
          'jamian',
          'marine',
          'orphee',
          'sirius',
          'algethi',
          'capella',
          'dante',
        ],
        weight: 10,
      },
      { ids: ['dio', 'kiki'], weight: 3 },
    ],
    curve: [2, 4, 4, 1, 1, 0],
  },
  {
    id: 'no-ability',
    name: 'Sans effet (Graad)',
    description: 'Daidalos +2 ; cartes sans capacité et corps solides.',
    core: ['daidalos', 'dio', 'algethi', 'black-phoenix'],
    pools: [
      {
        ids: ['dio', 'algethi', 'black-phoenix', 'sirius'],
        weight: 12,
      },
      {
        ids: ['aldebaran', 'jabu', 'geki', 'asterion'],
        weight: 5,
      },
      { ids: ['kiki'], weight: 2 },
    ],
    curve: [2, 4, 4, 1, 1, 0],
  },
  {
    id: 'on-reveal-burst',
    name: 'Tempête au révélé',
    description: 'Effets au révélé empilés : destruction et debuffs.',
    core: ['aiolia', 'babel', 'ptolemy', 'deathmask', 'hyoga'],
    pools: [
      {
        ids: [
          'aiolos',
          'shura',
          'milo',
          'ikki',
          'ban',
          'moses',
          'orphee',
          'marine',
        ],
        weight: 10,
      },
      { ids: ['kiki', 'aldebaran'], weight: 4 },
    ],
    curve: [2, 3, 4, 2, 1, 0],
  },
  {
    id: 'ongoing-control',
    name: 'Contrôle continu',
    description: 'Silences, −1 lane, protection et immunités.',
    core: ['camus', 'aphrodite', 'algol', 'misty', 'mu'],
    pools: [
      {
        ids: ['aldebaran', 'geki', 'hyoga', 'shun', 'saga'],
        weight: 9,
      },
      { ids: ['shaka', 'dokko', 'daidalos'], weight: 6 },
      { ids: ['kiki'], weight: 2 },
    ],
    curve: [1, 2, 5, 3, 1, 0],
  },
  {
    id: 'cosmos-tempo',
    name: 'Cosmos & tempo',
    description: 'Kiki, Shaka −1 coût, June stack et rebonds.',
    core: ['kiki', 'shaka', 'june', 'jamian'],
    pools: [
      {
        ids: ['black-cygnus', 'ikki', 'shiryu', 'seiya', 'ban'],
        weight: 9,
      },
      { ids: ['asterion', 'deathmask', 'marine'], weight: 5 },
      { ids: ['athena', 'dio'], weight: 3 },
    ],
    curve: [3, 4, 3, 1, 1, 0],
  },
  {
    id: 'location-tech',
    name: 'Tech de lieux',
    description: 'Grand Pope Shion, Marine : neutraliser les effets de terrain.',
    core: ['grand-pope', 'marine'],
    pools: [
      {
        ids: [
          'aldebaran',
          'mu',
          'saga',
          'shaka',
          'athena',
          'aiolos',
          'camus',
        ],
        weight: 10,
      },
      { ids: ['kiki', 'babel', 'deathmask'], weight: 5 },
    ],
    curve: [2, 3, 4, 2, 1, 0],
  },
  {
    id: 'tokens-flood',
    name: 'Invasion & jetons',
    description: 'Astérion, DeathMask, Dragon Noir : remplir le plateau.',
    core: ['asterion', 'deathmask', 'black-dragon'],
    pools: [
      {
        ids: ['ikki', 'jamian', 'shaina', 'daidalos', 'saga'],
        weight: 9,
      },
      { ids: ['aldebaran', 'mu', 'jabu'], weight: 6 },
      { ids: ['kiki', 'ban'], weight: 3 },
    ],
    curve: [2, 4, 4, 1, 1, 0],
  },
];

const buildableSet = () => new Set(getBuildableCardIds());

function filterBuildable(ids: string[]): string[] {
  const pool = buildableSet();
  return ids.filter((id) => pool.has(id));
}

function curveCounts(deck: string[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const id of deck) {
    const cost = getCardDef(id).cost;
    if (cost >= 1 && cost <= 6) counts[cost - 1] += 1;
  }
  return counts;
}

function scoreCandidate(
  defId: string,
  deck: string[],
  preset: DeckPreset,
  dominantFaction: string | null,
): number {
  const def = getCardDef(defId);
  let score = 0;

  for (const pool of preset.pools) {
    if (pool.ids.includes(defId)) score += pool.weight;
  }

  if (dominantFaction && def.faction === dominantFaction) {
    score += 4;
  }

  const counts = curveCounts(deck);
  const costIdx = def.cost - 1;
  if (costIdx >= 0 && costIdx < 6) {
    const need = preset.curve[costIdx] - counts[costIdx];
    if (need > 0) score += need * 3;
    if (need < 0) score -= Math.abs(need) * 2;
  }

  if (!def.ability && preset.id === 'no-ability') score += 8;
  if (def.ability?.kind === 'on-reveal' && preset.id === 'on-reveal-burst') {
    score += 3;
  }
  if (def.ability?.kind === 'ongoing' && preset.id === 'ongoing-control') {
    score += 3;
  }

  score += Math.random() * 2.5;
  return score;
}

function dominantFactionFrom(deck: string[]): string | null {
  const tally = new Map<string, number>();
  for (const id of deck) {
    const f = getCardDef(id).faction;
    tally.set(f, (tally.get(f) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [f, n] of tally) {
    if (n > max) {
      max = n;
      best = f;
    }
  }
  return best;
}

/** Construit un deck de 12 cartes selon un preset de synergie. */
export function buildPresetDeck(presetId: string): string[] {
  const preset = DECK_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];

  const pool = buildableSet();
  const deck: string[] = [];

  for (const id of filterBuildable(preset.core)) {
    if (deck.length >= DECK_SIZE) break;
    if (!deck.includes(id)) deck.push(id);
  }

  while (deck.length < DECK_SIZE) {
    const dominant = dominantFactionFrom(deck);
    const candidates = [...pool].filter((id) => !deck.includes(id));
    if (candidates.length === 0) break;

    candidates.sort(
      (a, b) =>
        scoreCandidate(b, deck, preset, dominant) -
        scoreCandidate(a, deck, preset, dominant),
    );

    const top = candidates.slice(0, 3);
    const pick = top[Math.floor(Math.random() * top.length)];
    deck.push(pick);
  }

  return deck.slice(0, DECK_SIZE);
}

export function getDeckPreset(presetId: string): DeckPreset | undefined {
  return DECK_PRESETS.find((p) => p.id === presetId);
}

/** Vérifie que le preset produit toujours un deck valide (tests / debug). */
export function assertPresetDecksValid(): void {
  for (const preset of DECK_PRESETS) {
    for (let i = 0; i < 20; i += 1) {
      const ids = buildPresetDeck(preset.id);
      const result = validateDeck(ids);
      if (!result.ok) {
        throw new Error(`${preset.id}: ${result.reason}`);
      }
    }
  }
}

export function listBuildablePresets(): DeckPreset[] {
  return DECK_PRESETS.filter((p) =>
    filterBuildable(p.core).length > 0,
  );
}
