import { Client } from 'basic-ftp';
import { createReadStream, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const REMOTE_DIR = '/public_html/snap-ssa';

function loadFtpConfig(configPath) {
  const raw = readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);
  if (!cfg.host || !cfg.username || !cfg.password) {
    throw new Error(`Config FTP invalide : ${configPath}`);
  }
  return cfg;
}

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      entries.push(...walk(full));
    } else {
      entries.push(full);
    }
  }
  return entries;
}

async function ensureDir(client, remotePath) {
  const parts = remotePath.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    try {
      await client.send(`MKD ${current}`);
    } catch {
      // Le dossier existe déjà.
    }
  }
}

async function uploadTree(client, localRoot, remoteRoot) {
  const files = walk(localRoot);
  for (const file of files) {
    const rel = relative(localRoot, file).split('\\').join('/');
    const remoteFile = `${remoteRoot}/${rel}`;
    const remoteParent = remoteFile.slice(0, remoteFile.lastIndexOf('/'));
    await ensureDir(client, remoteParent);
    await client.uploadFrom(file, remoteFile);
    console.log(`↑ ${rel}`);
  }
}

async function main() {
  const configPath =
    process.argv[2] ||
    join(process.env.HOME, 'Desktop/portfolio 2023/site/.vscode/sftp.json');

  const cfg = loadFtpConfig(configPath);
  const client = new Client(120_000);
  client.ftp.verbose = false;

  console.log(`Connexion FTP → ${cfg.host}…`);
  await client.access({
    host: cfg.host,
    port: cfg.port ?? 21,
    user: cfg.username,
    password: cfg.password,
    secure: false,
  });

  console.log(`Déploiement dist → ${REMOTE_DIR}`);
  await ensureDir(client, REMOTE_DIR);
  await uploadTree(client, DIST, REMOTE_DIR);

  client.close();
  console.log('Déploiement terminé : https://alexandre-dechosal.fr/snap-ssa/');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
