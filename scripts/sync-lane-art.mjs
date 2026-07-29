/**
 * Copie les fonds de lieux depuis Card sample/lanes vers public/lanes/
 * Usage: node scripts/sync-lane-art.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'Card sample', 'lanes');
const destDir = path.join(root, 'public', 'lanes');

const MAP = [
  ['sancturay.webp', 'sanctuary.webp'],
  ['cinq pic.jpg', 'five-peaks.jpg'],
  ['galactique.jpg', 'galactic-tournament.jpg'],
  ['deathqueen.webp', 'death-queen-island.webp'],
  ['Jamir.webp', 'jamir.webp'],
  ['autre-dimension.webp', 'other-dimension.webp'],
  ['plage.png', 'beach.png'],
  ['vallee.jpg', 'death-valley.jpg'],
];

fs.mkdirSync(destDir, { recursive: true });
for (const [from, to] of MAP) {
  const src = path.join(srcDir, from);
  const dest = path.join(destDir, to);
  if (!fs.existsSync(src)) {
    console.warn(`Manquant: ${src}`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`${from} → public/lanes/${to}`);
}
console.log('Terminé.');
