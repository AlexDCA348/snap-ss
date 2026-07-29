/**
 * Télécharge les portraits depuis AniList (CDN public) vers public/cards/{id}.jpg
 * Usage: node scripts/fetch-card-art.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildManifestFromDisk } from './sync-card-art-manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'cards');

/** Carte id -> noms de recherche AniList (ordre de priorité). */
const CARD_SEARCH_NAMES = {
  seiya: ['Seiya', 'Pegasus Seiya'],
  hyoga: ['Hyoga', 'Cygnus Hyoga'],
  shiryu: ['Shiryu', 'Dragon Shiryu'],
  ikki: ['Ikki', 'Phoenix Ikki'],
  shun: ['Shun', 'Andromeda Shun'],
  athena: ['Saori Kido', 'Athena'],
  camus: ['Camus', 'Aquarius Camus'],
  capella: ['Capella', 'Auriga Capella'],
  dante: ['Dante', 'Cerberus Dante'],
  saga: ['Saga', 'Gemini Saga'],
  milo: ['Milo', 'Scorpio Milo'],
  mu: ['Mu', 'Aries Mu'],
  shaka: ['Shaka', 'Virgo Shaka'],
  deathmask: ['Death Mask', 'Cancer Death Mask'],
  aiolia: ['Aiolia', 'Leo Aiolia'],
  kanon: ['Kanon', 'Gemini Kanon'],
  dokko: ['Dohko', 'Libra Dohko'],
  roshi: ['Old Master', 'Roshi', 'Dohko Old Master'],
  aiolos: ['Aioros', 'Sagittarius Aiolos'],
  aphrodite: ['Aphrodite', 'Pisces Aphrodite'],
  kiki: ['Kiki'],
  shura: ['Shura', 'Capricorn Shura'],
  thanatos: ['Thanatos'],
  aldebaran: ['Aldebaran', 'Taurus Aldebaran'],
  shaina: ['Shaina'],
  marine: ['Marin', 'Eagle Marin'],
  shion: ['Shion'],
  jabu: ['Jabu', 'Unicorn Jabu'],
  geki: ['Geki', 'Bear Geki'],
  ban: ['Ban', 'Lionet Ban'],
  ichi: ['Ichi', 'Hydra Ichi'],
  nachi: ['Nachi', 'Wolf Nachi'],
  june: ['June', 'Chameleon June'],
  babel: ['Babel'],
  misty: ['Misty'],
  moses: ['Moses'],
  algol: ['Algol'],
  asterion: ['Asterion'],
  dio: ['Dio', 'Fly Dio', 'Mosquito Dio'],
  sirius: ['Sirius', 'Great Dog Sirius', 'Canis Major Sirius'],
  algethi: ['Algethi', 'Algethi of Heracles', 'Heracles Algethi'],
  ptolemy: ['Ptolemy'],
  orphee: ['Orpheus', 'Orphée'],
  jamian: ['Jamian', 'Crow Jamian', 'Jamian Crow'],
  'grand-pope': ['Shion', 'Grand Pope Shion'],
  'grand-pope-ares': ['Ares', 'Mars Ares', 'Grand Pope Ares'],
  'black-pegasus': ['Black Pegasus', 'Pegasus Black', 'Black Pegasus Jabu'],
  'black-cygnus': ['Hei Tiane', 'Black Swan', 'Black Cygnus'],
  'black-andromeda': [
    'Black Andromeda',
    'Andromeda Black',
    'Black Andromeda Saint',
    'Shun',
  ],
  'black-dragon': ['Black Dragon', 'Dragon Black', 'Black Dragon Shiryu'],
  'black-phoenix': ['Black Phoenix', 'Black Phoenix Ikki', 'Phoenix Black'],
};

async function anilist(query, variables = {}) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function fetchMediaCharacters(mediaId) {
  const data = await anilist(
    `query ($id: Int) {
      Media(id: $id) {
        characters(perPage: 100) {
          nodes { name { full } image { large } }
        }
      }
    }`,
    { id: mediaId },
  );
  const map = new Map();
  for (const n of data.Media?.characters?.nodes ?? []) {
    if (!n.image?.large) continue;
    map.set(n.name.full.toLowerCase(), n.image.large);
  }
  return map;
}

async function searchCharacter(name) {
  try {
    const data = await anilist(
      `query ($search: String) {
        Character(search: $search) {
          name { full }
          image { large }
        }
      }`,
      { search: name },
    );
    return data.Character?.image?.large ?? null;
  } catch {
    return null;
  }
}

function pickUrl(map, names) {
  for (const name of names) {
    const u = map.get(name.toLowerCase());
    if (u) return u;
    for (const [k, v] of map) {
      if (k.includes(name.toLowerCase()) || name.toLowerCase().includes(k)) {
        return v;
      }
    }
  }
  return null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const classic = await fetchMediaCharacters(1254);
  const omega = await fetchMediaCharacters(12929);

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const allIds = Object.keys(CARD_SEARCH_NAMES);
  const ids = only.length ? only.filter((id) => CARD_SEARCH_NAMES[id]) : allIds;
  if (only.length && ids.length !== only.length) {
    const missing = only.filter((id) => !CARD_SEARCH_NAMES[id]);
    console.warn('Ids inconnus (ignorés):', missing.join(', '));
  }

  const manifest = {};

  for (const id of ids) {
    const names = CARD_SEARCH_NAMES[id];
    let url =
      pickUrl(classic, names) ??
      pickUrl(omega, names) ??
      null;

    if (!url) {
      for (const name of names) {
        url = await searchCharacter(name);
        if (url) break;
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    if (!url) {
      console.warn(`[skip] ${id} — aucune image trouvée`);
      continue;
    }

    const ext = url.includes('.png') ? 'png' : 'jpg';
    const dest = path.join(outDir, `${id}.${ext}`);
    try {
      await download(url, dest);
      /* Chemin sans extension : le jeu tente .png puis .jpg (PNG prioritaire). */
      manifest[id] = `cards/${id}`;
      console.log(`[ok] ${id} <- ${names[0]}`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn(`[fail] ${id}`, e.message);
    }

  }

  writeManifest(buildManifestFromDisk());
}

function writeManifest(manifest) {
  const manifestPath = path.join(root, 'src', 'game', 'cardArtManifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nManifest: ${manifestPath} (${Object.keys(manifest).length} images)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
