import { useRef, useState, type ChangeEvent } from 'react';
import {
  applyProgressBackup,
  exportProgressBackupFile,
  readProgressBackupFromFile,
} from '../../game/progressBackup';
import { useAppStore } from '../../store/appStore';

/**
 * Export / import de la progression (collection + decks) via fichier JSON.
 * Utile après une mise à jour ou un changement de navigateur sur mobile.
 */
export function ProgressBackupControls() {
  const showToast = useAppStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const mode = await exportProgressBackupFile();
      showToast(
        mode === 'shared'
          ? 'Sauvegarde partagée — range-la bien.'
          : 'Fichier de sauvegarde téléchargé.',
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // partage annulé
      } else {
        showToast('Export impossible. Réessaie.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleImportPick = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      'Importer cette sauvegarde ?\n\nLa progression actuelle (collection, chapitres, decks) sera remplacée.',
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const parsed = await readProgressBackupFromFile(file);
      if (!parsed.ok) {
        showToast(parsed.error);
        return;
      }
      applyProgressBackup(parsed.backup);
      const cards = parsed.backup.collection.collection.unlockedCards.length;
      const chapters =
        parsed.backup.collection.collection.unlockedChapterIds.length;
      showToast(`Progression restaurée · ${cards} cartes · ${chapters} chapitres`);
    } catch {
      showToast('Import impossible. Réessaie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="progress-backup mt-3 flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={busy}
          className="progress-backup__btn"
        >
          Exporter
        </button>
        <button
          type="button"
          onClick={handleImportPick}
          disabled={busy}
          className="progress-backup__btn"
        >
          Importer
        </button>
      </div>
      <p className="text-[9px] text-white/40 max-w-[16rem] leading-snug text-center">
        Sauvegarde ta progression (fichier JSON) avant une mise à jour.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
}
