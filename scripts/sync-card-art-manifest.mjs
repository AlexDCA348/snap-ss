/**
 * Regénère cardArtManifest.json à partir des fichiers dans public/cards/
 * Usage: node scripts/sync-card-art-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'cards');
const manifestPath = path.join(root, 'src', 'game', 'cardArtManifest.json');

const ART_FILE = /^([a-z0-9-]+)\.(png|jpe?g|webp)$/i;

export function buildManifestFromDisk() {
  const ids = new Set();
  for (const file of fs.readdirSync(outDir)) {
    const m = file.match(ART_FILE);
    if (m) ids.add(m[1]);
  }
  const manifest = {};
  for (const id of [...ids].sort()) {
    manifest[id] = `cards/${id}`;
  }
  return manifest;
}

function main() {
  if (!fs.existsSync(outDir)) {
    console.error(`Dossier introuvable: ${outDir}`);
    process.exit(1);
  }
  const manifest = buildManifestFromDisk();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Manifest: ${manifestPath} (${Object.keys(manifest).length} cartes)`);
}

main();
