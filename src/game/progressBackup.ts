import { ARMOR_CATALOG } from '../collection/data/armorCatalog';
import {
  COLLECTION_SCHEMA_VERSION,
  hydrateCollectionState,
  serializeCollectionState,
} from '../collection/services/SaveService';
import type { PersistedCollectionState } from '../collection/types';
import {
  DECK_SLOT_COUNT,
  type SavedDeck,
  useDeckStore,
} from '../store/deckStore';
import { useCollectionStore } from '../store/collectionStore';

export const PROGRESS_BACKUP_KIND = 'saint-seiya-snap-progress';
export const PROGRESS_BACKUP_VERSION = 1;

export interface ProgressDecksSnapshot {
  slots: SavedDeck[];
  activeSlotIndex: number;
  editingSlotIndex: number;
}

export interface ProgressBackupFile {
  kind: typeof PROGRESS_BACKUP_KIND;
  version: number;
  exportedAt: string;
  appVersion: string;
  collection: PersistedCollectionState;
  decks: ProgressDecksSnapshot;
}

export type ProgressBackupParseResult =
  | { ok: true; backup: ProgressBackupFile }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeDeck(raw: unknown, index: number): SavedDeck {
  if (!isRecord(raw)) {
    return {
      name: `Deck ${index + 1}`,
      cardIds: [],
      updatedAt: Date.now(),
    };
  }
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : `Deck ${index + 1}`;
  const cardIds = Array.isArray(raw.cardIds)
    ? raw.cardIds.filter((id): id is string => typeof id === 'string')
    : [];
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : Date.now();
  return { name, cardIds, updatedAt };
}

function sanitizeDecks(raw: unknown): ProgressDecksSnapshot {
  const data = isRecord(raw) ? raw : {};
  const rawSlots = Array.isArray(data.slots) ? data.slots : [];
  const slots = Array.from({ length: DECK_SLOT_COUNT }, (_, i) =>
    sanitizeDeck(rawSlots[i], i),
  );
  const clampIndex = (value: unknown) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(DECK_SLOT_COUNT - 1, Math.floor(value)));
  };
  return {
    slots,
    activeSlotIndex: clampIndex(data.activeSlotIndex),
    editingSlotIndex: clampIndex(data.editingSlotIndex),
  };
}

/** Instantané courant collection + decks. */
export function buildProgressBackup(appVersion = __APP_VERSION__): ProgressBackupFile {
  const collectionState = useCollectionStore.getState();
  const deckState = useDeckStore.getState();

  return {
    kind: PROGRESS_BACKUP_KIND,
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    collection: serializeCollectionState({
      version: COLLECTION_SCHEMA_VERSION,
      collection: collectionState.collection,
      lastRewardedMatchSerial: collectionState.lastRewardedMatchSerial,
    }),
    decks: {
      slots: deckState.slots,
      activeSlotIndex: deckState.activeSlotIndex,
      editingSlotIndex: deckState.editingSlotIndex,
    },
  };
}

export function parseProgressBackup(raw: unknown): ProgressBackupParseResult {
  if (!isRecord(raw)) {
    return { ok: false, error: 'Fichier invalide (JSON attendu).' };
  }
  if (raw.kind !== PROGRESS_BACKUP_KIND) {
    return {
      ok: false,
      error: 'Ce fichier n’est pas une sauvegarde Saint Seiya Snap.',
    };
  }
  if (typeof raw.version !== 'number' || raw.version < 1) {
    return { ok: false, error: 'Version de sauvegarde inconnue.' };
  }
  if (raw.version > PROGRESS_BACKUP_VERSION) {
    return {
      ok: false,
      error: 'Sauvegarde trop récente — mets le jeu à jour puis réessaie.',
    };
  }

  const collection = hydrateCollectionState(raw.collection, ARMOR_CATALOG);
  const decks = sanitizeDecks(raw.decks);

  return {
    ok: true,
    backup: {
      kind: PROGRESS_BACKUP_KIND,
      version: PROGRESS_BACKUP_VERSION,
      exportedAt:
        typeof raw.exportedAt === 'string'
          ? raw.exportedAt
          : new Date().toISOString(),
      appVersion:
        typeof raw.appVersion === 'string' ? raw.appVersion : 'unknown',
      collection,
      decks,
    },
  };
}

export function applyProgressBackup(backup: ProgressBackupFile): void {
  useCollectionStore.setState({
    collection: backup.collection.collection,
    lastRewardedMatchSerial: backup.collection.lastRewardedMatchSerial,
    pendingReward: null,
  });
  useDeckStore.setState({
    slots: backup.decks.slots,
    activeSlotIndex: backup.decks.activeSlotIndex,
    editingSlotIndex: backup.decks.editingSlotIndex,
  });
}

export function progressBackupFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `saint-seiya-snap-save-${y}${m}${d}.json`;
}

/** Télécharge ou partage le fichier (mobile). */
export async function exportProgressBackupFile(): Promise<'shared' | 'downloaded'> {
  const backup = buildProgressBackup();
  const filename = progressBackupFilename();
  const json = JSON.stringify(backup, null, 2);
  const file = new File([json], filename, { type: 'application/json' });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: 'Sauvegarde Saint Seiya Snap',
        text: 'Progression collection + decks',
      });
      return 'shared';
    } catch (err) {
      // Annulation utilisateur → ne pas forcer un téléchargement.
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return 'downloaded';
}

export async function readProgressBackupFromFile(
  file: File,
): Promise<ProgressBackupParseResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: 'Impossible de lire le fichier.' };
  }
  try {
    return parseProgressBackup(JSON.parse(text) as unknown);
  } catch {
    return { ok: false, error: 'JSON illisible.' };
  }
}
