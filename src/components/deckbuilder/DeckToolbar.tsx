import { useState } from 'react';
import { DECK_PRESETS, type DeckPreset } from '../../game/deckPresets';

interface Props {
  deckName: string;
  onRename: (name: string) => void;
  onFillRandom: () => void;
  onClear: () => void;
  onApplyPreset: (preset: DeckPreset) => void;
}

/** Nom du deck + actions rapides sur une seule ligne. */
export function DeckToolbar({
  deckName,
  onRename,
  onFillRandom,
  onClear,
  onApplyPreset,
}: Props) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handlePreset = (preset: DeckPreset) => {
    if (confirmId !== preset.id) {
      setConfirmId(preset.id);
      return;
    }
    onApplyPreset(preset);
    setConfirmId(null);
    setPresetsOpen(false);
  };

  const btnBase =
    'deck-toolbar__btn inline-flex items-center gap-1 px-2 py-1 rounded-lg ring-1 text-[9px] uppercase tracking-wide transition shrink-0';

  return (
    <div className="deck-toolbar relative shrink-0 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="text"
          value={deckName}
          onChange={(e) => onRename(e.target.value)}
          className="deck-toolbar__name flex-1 min-w-0 rounded-lg bg-black/35 border border-white/10 px-2.5 py-1.5 text-xs text-white"
          aria-label="Nom du deck"
        />

        <div className="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setPresetsOpen((v) => !v)}
            className={[
              btnBase,
              presetsOpen
                ? 'bg-gold-500/25 ring-gold-400/50 text-gold-100'
                : 'bg-white/5 ring-white/12 text-cosmos-200 hover:bg-white/10',
            ].join(' ')}
            aria-label="Synergies"
            title="Presets de synergie"
          >
            <span className="text-[11px] leading-none" aria-hidden>
              ▲
            </span>
            <span>Syn.</span>
          </button>

          <button
            type="button"
            onClick={onFillRandom}
            className={`${btnBase} bg-white/5 ring-white/12 text-cosmos-200 hover:bg-white/10`}
            aria-label="Remplir au hasard"
            title="Remplir au hasard"
          >
            <span className="text-[11px] leading-none font-bold" aria-hidden>
              ■
            </span>
            <span>Aléa.</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className={`${btnBase} bg-rose-500/10 ring-rose-400/25 text-rose-200/90 hover:bg-rose-500/15`}
            aria-label="Vider le deck"
            title="Vider le deck"
          >
            <span className="text-[11px] leading-none" aria-hidden>
              ×
            </span>
            <span>Vider</span>
          </button>
        </div>
      </div>

      {presetsOpen ? (
        <>
          <button
            type="button"
            aria-label="Fermer synergies"
            className="fixed inset-0 z-40 cursor-default bg-black/80"
            onClick={() => {
              setPresetsOpen(false);
              setConfirmId(null);
            }}
          />
          <div className="deck-toolbar__presets deck-modal-panel absolute left-4 right-4 top-full mt-1 z-50 max-h-[min(50vh,360px)] overflow-y-auto rounded-xl border border-white/15 shadow-2xl p-2.5 space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-ui-muted px-1">
              Presets de synergie
            </p>
            <p className="text-[9px] text-ui-muted px-1 pb-0.5">
              Touchez deux fois pour confirmer.
            </p>
            {DECK_PRESETS.map((preset) => {
              const pending = confirmId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={[
                    'w-full text-left rounded-lg px-2.5 py-2 transition ring-1',
                    pending
                      ? 'bg-gold-500/20 ring-gold-400/50'
                      : 'bg-white/[0.03] ring-white/5 hover:bg-white/[0.07]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-cosmos-100">
                      {preset.name}
                    </span>
                    {pending ? (
                      <span className="text-[9px] text-gold-200 shrink-0">
                        Confirmer →
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-ui-muted mt-0.5 leading-snug">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
