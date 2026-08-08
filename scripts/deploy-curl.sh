#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env"
  set +a
fi

HOST="${FTP_HOST:-}"
USER="${FTP_USER:-}"
PASS="${FTP_PASSWORD:-}"
REMOTE="${FTP_REMOTE_PATH:-snap-ssa}"
MAX_RETRIES="${FTP_MAX_RETRIES:-12}"
DEPLOY_MODE="${FTP_DEPLOY_MODE:-quick}"

if [[ -z "$HOST" || -z "$USER" || -z "$PASS" ]]; then
  echo "FTP_HOST / FTP_USER / FTP_PASSWORD requis (via .env)"
  exit 1
fi

if [[ ! -d "$DIST" ]]; then
  echo "dist/ manquant — lance npm run build d'abord"
  exit 1
fi

upload_one() {
  local local_file="$1"
  local remote_rel="$2"
  local url="ftp://${HOST}/${REMOTE}/${remote_rel}"
  local attempt=1
  while (( attempt <= MAX_RETRIES )); do
    if curl -sS --connect-timeout 20 --max-time 90 \
      --ftp-create-dirs \
      --user "${USER}:${PASS}" \
      -T "$local_file" \
      "$url"; then
      echo "↑ ${remote_rel} (ok try ${attempt})"
      return 0
    fi
    echo "… retry ${attempt}/${MAX_RETRIES} pour ${remote_rel}"
    sleep $(( 3 + attempt ))
    attempt=$(( attempt + 1 ))
  done
  echo "ÉCHEC: ${remote_rel}"
  return 1
}

collect_files() {
  if [[ "$DEPLOY_MODE" == "full" ]]; then
    find "$DIST" -type f | sort
    return
  fi

  {
    if [[ -f "$DIST/index.html" ]]; then
      printf '%s\n' "$DIST/index.html"
    fi
    if [[ -d "$DIST/assets" ]]; then
      find "$DIST/assets" -type f | sort
    fi
  } | awk '!seen[$0]++'
}

mapfile -t FILES < <(collect_files)

# index.html en dernier
ORDERED=()
INDEX=""
for f in "${FILES[@]}"; do
  rel="${f#"$DIST"/}"
  if [[ "$rel" == "index.html" ]]; then
    INDEX="$f"
  else
    ORDERED+=("$f")
  fi
done
if [[ -n "$INDEX" ]]; then
  ORDERED+=("$INDEX")
fi

echo "Déploiement ${#ORDERED[@]} fichiers (${DEPLOY_MODE}) → ftp://${HOST}/${REMOTE}/"
for f in "${ORDERED[@]}"; do
  rel="${f#"$DIST"/}"
  upload_one "$f" "$rel"
done

echo "Déploiement terminé : https://alexandre-dechosal.fr/snap-ssa/"
